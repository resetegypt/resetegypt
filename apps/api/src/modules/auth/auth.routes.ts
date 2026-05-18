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
  app.post('/auth/login', async (req, reply) => {
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
        { sub: user.id, purpose: 'totp', rememberMe: !!rememberMe },
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

  app.post('/auth/password/forgot', async (req, reply) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });

    // For security, always return 200 (don't leak which emails exist)
    const user = await app.prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user) {
      // TODO: generate reset token and send email via Brevo/SMTP
      app.log.info({ email: parsed.data.email }, 'password reset requested (mock)');
      await recordAudit(app.prisma, req, {
        userId: user.id,
        action: 'password_reset_requested',
      });
    }
    return { ok: true, message: 'If the email exists, a reset link has been sent.' };
  });
}
