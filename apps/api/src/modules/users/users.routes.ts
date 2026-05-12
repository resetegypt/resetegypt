import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { recordAudit } from '../../lib/audit.js';

const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'PRACTITIONER', 'SECRETARY']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  preferredLanguage: z.string().default('fr'),
  password: z.string().min(8),
});

const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true })
  .extend({ isActive: z.boolean().optional() });

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);
  app.addHook('preHandler', app.requireRole('ADMIN'));

  app.get('/users', async (req) => {
    const q = (req.query as { search?: string; role?: string }).search?.trim();
    const role = (req.query as { search?: string; role?: string }).role;
    const users = await app.prisma.user.findMany({
      where: {
        ...(role && { role: role as never }),
        ...(q && {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferredLanguage: true,
        isActive: true,
        isLocked: true,
        failedAttempts: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { users };
  });

  app.post('/users', async (req, reply) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    }
    const { password, ...rest } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await app.prisma.user.create({
      data: { ...rest, passwordHash },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'user_created',
      resource: `user:${user.id}`,
      details: { email: user.email, role: user.role },
    });
    return reply.status(201).send({ user });
  });

  app.patch('/users/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationError' });
    }
    const user = await app.prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'user_updated',
      resource: `user:${id}`,
      details: parsed.data,
    });
    return { user };
  });

  app.post('/users/:id/unlock', async (req) => {
    const id = (req.params as { id: string }).id;
    await app.prisma.user.update({
      where: { id },
      data: { isLocked: false, failedAttempts: 0 },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'user_unlocked',
      resource: `user:${id}`,
    });
    return { ok: true };
  });

  app.post('/users/:id/reset-password', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const schema = z.object({ newPassword: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await app.prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date(), failedAttempts: 0, isLocked: false },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'user_password_reset',
      resource: `user:${id}`,
    });
    return { ok: true };
  });

  app.get('/audit-logs', async (req) => {
    const limit = Math.min(Number((req.query as { limit?: string }).limit) || 100, 500);
    const logs = await app.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { email: true, role: true } },
      },
    });
    return { logs };
  });

  app.get('/admin/kpis', async () => {
    const [total, active, locked, recentFailed] = await Promise.all([
      app.prisma.user.count(),
      app.prisma.user.count({ where: { isActive: true } }),
      app.prisma.user.count({ where: { isLocked: true } }),
      app.prisma.auditLog.count({
        where: {
          action: 'login_failed',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    return { total, active, locked, recentFailed };
  });
}
