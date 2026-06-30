// ============================================================================
// totp.routes.ts — 2FA TOTP setup/verify pour les comptes ADMIN et PRACTITIONER.
//
// Flow setup :
//   1. POST /auth/2fa/setup   → génère secret + QR code (data URL), renvoie au client
//   2. Utilisateur scanne avec Google Authenticator
//   3. POST /auth/2fa/enable { code } → vérifie le code, persiste totpEnabled=true
//      + retourne 10 backup codes one-shot
//
// Flow login (si totpEnabled) :
//   1. POST /auth/login → renvoie { totpRequired: true, challenge }
//      (le mot de passe est validé, mais aucun JWT n'est émis tant que le code 2FA n'est
//      pas fourni). Le challenge est un JWT court (5 min) signé avec un purpose=totp.
//   2. POST /auth/2fa/verify { challenge, code } → renvoie le vrai JWT session
//
// Backup codes : 10 codes 8 chars (hex). Marqués utilisés en supprimant de l'array
// (DB update). Régénérables via POST /auth/2fa/regenerate-codes.
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticator } from 'otplib';

// Tolérance ±30s (window=1 step de 30s)
authenticator.options = { window: 1 };
import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { recordAudit } from '../../lib/audit.js';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '../../plugins/auth.js';
import { env } from '../../env.js';
import {
  encryptSecret,
  decryptSecret,
  hashBackupCode,
  findMatchingBackupCode,
} from '../../lib/crypto-helpers.js';

const TOTP_ISSUER = 'Reset Egypt';
const BACKUP_CODE_COUNT = 10;

/** Génère 10 codes de 8 chars hex. Renvoie {plain, hashes} — plain affiché à
 *  l'utilisateur UNE fois, hashes stockés en DB.
 */
async function generateBackupCodes(): Promise<{ plain: string[]; hashes: string[] }> {
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, () =>
    randomBytes(4).toString('hex').toUpperCase(),
  );
  const hashes = await Promise.all(plain.map((c) => hashBackupCode(c)));
  return { plain, hashes };
}

/** Tente de consommer un backup code parmi la liste de hashes stockée.
 *  Renvoie la nouvelle liste sans le code consommé, ou null si aucun match. */
async function consumeBackupCode(hashes: string[], submitted: string): Promise<string[] | null> {
  const idx = await findMatchingBackupCode(submitted, hashes);
  if (idx < 0) return null;
  return [...hashes.slice(0, idx), ...hashes.slice(idx + 1)];
}

export async function totpRoutes(app: FastifyInstance): Promise<void> {
  // GET /auth/2fa/status — état pour l'utilisateur courant
  app.get('/auth/2fa/status', { onRequest: [app.authenticate] }, async (req) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.sub },
      select: { totpEnabled: true, backupCodes: true },
    });
    return {
      enabled: user?.totpEnabled ?? false,
      backupCodesRemaining: user?.backupCodes.length ?? 0,
    };
  });

  // POST /auth/2fa/setup — génère secret + QR code (ne persist PAS encore)
  app.post('/auth/2fa/setup', { onRequest: [app.authenticate] }, async (req) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.sub },
      select: { email: true, totpEnabled: true },
    });
    if (!user) throw new Error('user_not_found');
    if (user.totpEnabled) {
      return { alreadyEnabled: true };
    }
    const secret = authenticator.generateSecret(); // base32, 20 bytes
    const otpauth = authenticator.keyuri(user.email, TOTP_ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth, { width: 240, margin: 1 });
    // SECURITE : secret stocké CHIFFRE (AES-256-GCM) en BDD. Fuite BDD ne
    // donne plus accès à totp codes — il faut aussi ENCRYPTION_KEY.
    await app.prisma.user.update({
      where: { id: req.currentUser!.sub },
      data: { totpSecret: encryptSecret(secret), totpEnabled: false },
    });
    return { secret, otpauth, qrDataUrl };
  });

  // POST /auth/2fa/enable { code } — vérifie + active + génère backup codes
  app.post('/auth/2fa/enable', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_code_format' });
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.sub },
      select: { totpSecret: true, totpEnabled: true },
    });
    if (!user?.totpSecret) {
      return reply.status(400).send({ error: 'no_pending_setup' });
    }
    if (user.totpEnabled) {
      return reply.status(400).send({ error: 'already_enabled' });
    }
    const decryptedSecret = decryptSecret(user.totpSecret);
    if (!decryptedSecret) {
      return reply.status(500).send({ error: 'decrypt_failed' });
    }
    if (!authenticator.check(parsed.data.code, decryptedSecret)) {
      return reply.status(400).send({ error: 'invalid_code' });
    }
    const { plain: backupCodes, hashes } = await generateBackupCodes();
    await app.prisma.user.update({
      where: { id: req.currentUser!.sub },
      data: { totpEnabled: true, backupCodes: hashes },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: '2fa_enabled',
      resource: `user:${req.currentUser!.sub}`,
    });
    return { ok: true, backupCodes };
  });

  // POST /auth/2fa/disable { code } — désactive (besoin du code TOTP courant)
  app.post('/auth/2fa/disable', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({ code: z.string().min(6) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_code_format' });
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.sub },
      select: { totpSecret: true, totpEnabled: true, backupCodes: true },
    });
    if (!user?.totpEnabled || !user.totpSecret) {
      return reply.status(400).send({ error: 'not_enabled' });
    }
    const decryptedSecret = decryptSecret(user.totpSecret);
    const codeOk = !!decryptedSecret && authenticator.check(parsed.data.code, decryptedSecret);
    const backupOk = !codeOk && !!(await consumeBackupCode(user.backupCodes, parsed.data.code));
    if (!codeOk && !backupOk) {
      return reply.status(400).send({ error: 'invalid_code' });
    }
    await app.prisma.user.update({
      where: { id: req.currentUser!.sub },
      data: { totpEnabled: false, totpSecret: null, backupCodes: [] },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: '2fa_disabled',
      resource: `user:${req.currentUser!.sub}`,
    });
    return { ok: true };
  });

  // POST /auth/2fa/regenerate-codes { code } — nouveaux backup codes
  app.post('/auth/2fa/regenerate-codes', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_code_format' });
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.sub },
      select: { totpSecret: true, totpEnabled: true },
    });
    if (!user?.totpEnabled || !user.totpSecret) {
      return reply.status(400).send({ error: 'not_enabled' });
    }
    const decryptedSecret = decryptSecret(user.totpSecret);
    if (!decryptedSecret || !authenticator.check(parsed.data.code, decryptedSecret)) {
      return reply.status(400).send({ error: 'invalid_code' });
    }
    const { plain: backupCodes, hashes } = await generateBackupCodes();
    await app.prisma.user.update({ where: { id: req.currentUser!.sub }, data: { backupCodes: hashes } });
    return { ok: true, backupCodes };
  });

  // POST /auth/2fa/verify { challenge, code } — appelé après /auth/login si totpRequired
  // Retourne le vrai JWT session (cookie httpOnly comme /auth/login).
  // Rate-limité : 10 essais / 15 min / IP — protège du brute-force des codes 6 chiffres.
  app.post('/auth/2fa/verify', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        keyGenerator: (req: { ip: string }) => `2fa-verify|${req.ip}`,
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'TooMany2faAttempts',
          message: 'Trop de tentatives 2FA. Réessaie dans 15 minutes.',
        }),
      },
    },
  }, async (req, reply) => {
    const schema = z.object({
      challenge: z.string().min(1),
      code: z.string().min(6),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_payload' });

    // Vérifie le challenge JWT (purpose=totp, expire 5 min)
    let decoded: { sub: string; purpose: string; rememberMe?: boolean };
    try {
      decoded = app.jwt.verify(parsed.data.challenge) as typeof decoded;
    } catch {
      return reply.status(400).send({ error: 'invalid_or_expired_challenge' });
    }
    if (decoded.purpose !== 'totp') {
      return reply.status(400).send({ error: 'wrong_token_purpose' });
    }

    const user = await app.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true, email: true, role: true, firstName: true, lastName: true,
        preferredLanguage: true, totpSecret: true, totpEnabled: true, backupCodes: true,
        isActive: true, isLocked: true,
      },
    });
    if (!user || !user.isActive || user.isLocked) {
      return reply.status(401).send({ error: 'account_unavailable' });
    }
    if (!user.totpEnabled || !user.totpSecret) {
      return reply.status(400).send({ error: '2fa_not_configured' });
    }

    const decryptedSecret = decryptSecret(user.totpSecret);
    const codeOk = !!decryptedSecret && authenticator.check(parsed.data.code, decryptedSecret);
    let backupCodeConsumed = false;
    let remainingBackupCodes = user.backupCodes;
    if (!codeOk) {
      const consumed = await consumeBackupCode(user.backupCodes, parsed.data.code);
      if (consumed === null) {
        return reply.status(401).send({ error: 'invalid_code' });
      }
      remainingBackupCodes = consumed;
      backupCodeConsumed = true;
    }

    if (backupCodeConsumed) {
      await app.prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: remainingBackupCodes, lastLoginAt: new Date() },
      });
    } else {
      await app.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    await recordAudit(app.prisma, req, {
      userId: user.id,
      action: backupCodeConsumed ? 'login_2fa_backup' : 'login_2fa',
      resource: `user:${user.id}`,
    });

    // Émettre le vrai JWT session — DOIT être strictement identique à /auth/login
    // (même nom de cookie, même domain, même secure, même payload, même TTL).
    // Sinon `app.authenticate()` ne reconnaît pas le cookie → boucle de login.
    const ttl = decoded.rememberMe ? '7d' : '8h';
    const token = app.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      { expiresIn: ttl },
    );
    const cookieDomain =
      env.NODE_ENV === 'production' && env.APP_URL.includes('reset-egypt.com')
        ? '.reset-egypt.com'
        : undefined;
    reply.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: cookieDomain,
      maxAge: decoded.rememberMe ? SESSION_MAX_AGE_SEC * 7 : SESSION_MAX_AGE_SEC,
    });

    return {
      user: {
        id: user.id, email: user.email, role: user.role,
        firstName: user.firstName, lastName: user.lastName,
        preferredLanguage: user.preferredLanguage,
      },
      backupCodesRemaining: remainingBackupCodes.length,
    };
  });
}
