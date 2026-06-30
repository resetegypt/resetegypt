import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '../../plugins/auth.js';
import { recordAudit } from '../../lib/audit.js';
import { env } from '../../env.js';

const MAX_FAILED_ATTEMPTS = 5;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Rate-limit anti-brute-force : 10 tentatives / 15 min / IP sur /auth/login
  const loginRateLimit = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        keyGenerator: (req: { ip: string }) => `auth-login|${req.ip}`,
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'TooManyAuthAttempts',
          message: 'Trop de tentatives. Réessaie dans 15 minutes.',
        }),
      },
    },
  };

  app.post('/auth/login', loginRateLimit, async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      await recordAudit(app.prisma, req, {
        action: 'login_failed',
        details: { reason: 'invalid_payload' },
      });
      return reply.status(400).send({ error: 'ValidationError' });
    }
    const { email, password, rememberMe } = parsed.data;

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await recordAudit(app.prisma, req, {
        action: 'login_failed',
        details: { email, reason: 'unknown_email' },
      });
      return reply.status(401).send({ error: 'InvalidCredentials' });
    }

    if (user.isLocked) {
      await recordAudit(app.prisma, req, {
        userId: user.id,
        action: 'login_failed',
        details: { reason: 'account_locked' },
      });
      return reply.status(423).send({ error: 'AccountLocked' });
    }

    if (!user.isActive) {
      await recordAudit(app.prisma, req, {
        userId: user.id,
        action: 'login_failed',
        details: { reason: 'account_inactive' },
      });
      return reply.status(403).send({ error: 'AccountInactive' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const nextAttempts = user.failedAttempts + 1;
      const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;
      await app.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: nextAttempts, isLocked: shouldLock || user.isLocked },
      });
      await recordAudit(app.prisma, req, {
        userId: user.id,
        action: 'login_failed',
        details: { attempts: nextAttempts, locked: shouldLock, reason: 'invalid_password' },
      });
      return reply.status(401).send({ error: 'InvalidCredentials' });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0 },
    });

    // 2FA TOTP : si activé, on n'émet PAS le JWT session — on renvoie un
    // "challenge" JWT court-vie (5 min) que le client doit échanger contre
    // un vrai JWT via POST /auth/2fa/verify { challenge, code }.
    if (user.totpEnabled && user.totpSecret) {
      const challenge = await reply.jwtSign(
        { sub: user.id, purpose: 'totp', rememberMe: !!rememberMe } as never,
        { expiresIn: '5m' },
      );
      await recordAudit(app.prisma, req, {
        userId: user.id,
        action: 'login_password_ok_awaiting_2fa',
      });
      return reply.status(200).send({ totpRequired: true, challenge });
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await reply.jwtSign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      { expiresIn: rememberMe ? '7d' : '8h' },
    );

    // Cookie partagé entre sous-domaines en prod (api.reset-egypt.com ↔ app.reset-egypt.com)
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
      maxAge: rememberMe ? SESSION_MAX_AGE_SEC * 7 : SESSION_MAX_AGE_SEC,
    });

    await recordAudit(app.prisma, req, { userId: user.id, action: 'login_success' });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredLanguage: user.preferredLanguage,
      },
    };
  });

  app.post('/auth/logout', { onRequest: [app.authenticate] }, async (req, reply) => {
    const cookieDomain =
      env.NODE_ENV === 'production' && env.APP_URL.includes('reset-egypt.com')
        ? '.reset-egypt.com'
        : undefined;
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/', domain: cookieDomain });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser?.sub,
      action: 'logout',
    });
    return { ok: true };
  });

  app.get('/auth/me', { onRequest: [app.authenticate] }, async (req) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.sub },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
        lastLoginAt: true,
      },
    });
    return { user };
  });

  // Forgot password flow réel — JWT signé court (1h), purpose=password_reset.
  // Envoyé par email via Resend (lib/email.ts). Pour ne pas leak l'existence
  // des emails, on renvoie toujours 200 OK même si email inconnu.
  // Rate-limit 5/heure/IP pour empêcher l'enumeration + spam.
  app.post('/auth/password/forgot', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
        keyGenerator: (req: { ip: string }) => `pwd-forgot|${req.ip}`,
      },
    },
  }, async (req, reply) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });

    const user = await app.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user && user.isActive) {
      const token = app.jwt.sign(
        { sub: user.id, purpose: 'password_reset' } as never,
        { expiresIn: '1h' },
      );
      const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
      const { sendEmail } = await import('../../lib/email.js');
      await sendEmail({
        to: user.email,
        subject: 'Reset Egypt — Réinitialisation de votre mot de passe',
        text: `Bonjour ${user.firstName},\n\nVoici le lien pour réinitialiser ton mot de passe (valide 1h) :\n${resetUrl}\n\nSi tu n'as pas demandé ce reset, ignore cet email.\n\nReset Egypt`,
        html: `<p>Bonjour ${user.firstName},</p><p>Voici le lien pour réinitialiser ton mot de passe (valide 1h) :</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#1E0FBA;color:#fff;text-decoration:none;border-radius:6px">Réinitialiser mon mot de passe</a></p><p>Si tu n'as pas demandé ce reset, ignore cet email.</p><p>Reset Egypt</p>`,
      }).catch((err) => app.log.error({ err }, 'forgot password email send failed'));
      await recordAudit(app.prisma, req, {
        userId: user.id,
        action: 'password_reset_requested',
      });
    }
    return { ok: true, message: 'If the email exists, a reset link has been sent.' };
  });

  // POST /auth/password/reset { token, newPassword } — finalise le reset.
  app.post('/auth/password/reset', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
        keyGenerator: (req: { ip: string }) => `pwd-reset|${req.ip}`,
      },
    },
  }, async (req, reply) => {
    const schema = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8).max(200),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });

    let decoded: { sub: string; purpose: string };
    try {
      decoded = app.jwt.verify(parsed.data.token) as typeof decoded;
    } catch {
      return reply.status(400).send({ error: 'InvalidOrExpiredToken' });
    }
    if (decoded.purpose !== 'password_reset') {
      return reply.status(400).send({ error: 'WrongTokenPurpose' });
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await app.prisma.user.update({
      where: { id: decoded.sub },
      data: { passwordHash, passwordChangedAt: new Date(), failedAttempts: 0, isLocked: false },
    });
    await recordAudit(app.prisma, req, {
      userId: decoded.sub,
      action: 'password_reset_completed',
    });
    return { ok: true };
  });
}
