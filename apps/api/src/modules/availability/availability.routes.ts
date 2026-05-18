// ============================================================================
// availability.routes.ts — gestion des disponibilités des praticiens.
//
// 2 entités :
//   - PractitionerAvailability  : horaires hebdomadaires standards (lun 10h-18h…)
//   - PractitionerTimeOff       : exceptions (congés, vacances, créneau spécial)
//
// Accès :
//   - ADMIN : lit/écrit pour tous les praticiens
//   - PRACTITIONER : lit/écrit seulement le sien (id == currentUser.sub)
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';

const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1439),
  endMinutes: z.number().int().min(1).max(1440),
  isActive: z.boolean().optional(),
}).refine((d) => d.endMinutes > d.startMinutes, { message: 'endMinutes must be > startMinutes' });

const timeOffSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: z.enum(['TIME_OFF', 'EXTRA']).default('TIME_OFF'),
  reason: z.string().max(200).optional(),
}).refine((d) => new Date(d.endAt) > new Date(d.startAt), { message: 'endAt must be > startAt' });

/** Vérifie si un praticien est disponible à un instant donné (utilisé par booking). */
export async function isPractitionerAvailable(
  app: FastifyInstance,
  practitionerId: string,
  slotAt: Date,
): Promise<boolean> {
  const exceptions = await app.prisma.practitionerTimeOff.findMany({
    where: { practitionerId, startAt: { lte: slotAt }, endAt: { gte: slotAt } },
  });
  if (exceptions.some((e) => e.type === 'EXTRA')) return true;
  if (exceptions.some((e) => e.type === 'TIME_OFF')) return false;
  const cairoOffsetMs = 2 * 60 * 60 * 1000;
  const localTime = new Date(slotAt.getTime() + cairoOffsetMs);
  const dayOfWeek = localTime.getUTCDay();
  const minutesOfDay = localTime.getUTCHours() * 60 + localTime.getUTCMinutes();
  const slots = await app.prisma.practitionerAvailability.findMany({
    where: { practitionerId, dayOfWeek, isActive: true },
  });
  // Si aucune disponibilité définie pour ce praticien → on suppose qu'il est dispo
  // (rétro-compat : pas casser la prod tant que l'admin n'a rien configuré)
  if (slots.length === 0) {
    const totalSlots = await app.prisma.practitionerAvailability.count({ where: { practitionerId } });
    if (totalSlots === 0) return true;
    return false;
  }
  return slots.some((s) => minutesOfDay >= s.startMinutes && minutesOfDay < s.endMinutes);
}

function canAccess(req: { currentUser?: { role?: string; sub?: string } }, practitionerId: string): boolean {
  if (req.currentUser?.role === 'ADMIN') return true;
  if (req.currentUser?.role === 'PRACTITIONER' && req.currentUser.sub === practitionerId) return true;
  return false;
}

export async function availabilityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  app.get('/practitioners/:id/availability', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    if (!canAccess(req, id)) return reply.status(403).send({ error: 'Forbidden' });
    const [weekly, upcomingTimeOff] = await Promise.all([
      app.prisma.practitionerAvailability.findMany({
        where: { practitionerId: id },
        orderBy: [{ dayOfWeek: 'asc' }, { startMinutes: 'asc' }],
      }),
      app.prisma.practitionerTimeOff.findMany({
        where: { practitionerId: id, endAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' },
        take: 50,
      }),
    ]);
    return { weekly, upcomingTimeOff };
  });

  app.put('/practitioners/:id/availability', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    if (!canAccess(req, id)) return reply.status(403).send({ error: 'Forbidden' });
    const schema = z.object({ slots: z.array(availabilitySchema) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    await app.prisma.$transaction([
      app.prisma.practitionerAvailability.deleteMany({ where: { practitionerId: id } }),
      ...parsed.data.slots.map((s) =>
        app.prisma.practitionerAvailability.create({
          data: {
            practitionerId: id,
            dayOfWeek: s.dayOfWeek,
            startMinutes: s.startMinutes,
            endMinutes: s.endMinutes,
            isActive: s.isActive ?? true,
          },
        }),
      ),
    ]);
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'practitioner_availability_updated',
      resource: `practitioner:${id}`,
      details: { slots: parsed.data.slots.length },
    });
    return { ok: true, count: parsed.data.slots.length };
  });

  app.post('/practitioners/:id/time-off', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    if (!canAccess(req, id)) return reply.status(403).send({ error: 'Forbidden' });
    const parsed = timeOffSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const created = await app.prisma.practitionerTimeOff.create({
      data: {
        practitionerId: id,
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        type: parsed.data.type,
        reason: parsed.data.reason ?? null,
      },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'practitioner_time_off_added',
      resource: `practitioner:${id}`,
      details: { type: parsed.data.type, from: parsed.data.startAt, to: parsed.data.endAt },
    });
    return { ok: true, timeOff: created };
  });

  app.delete('/practitioners/:id/time-off/:timeOffId', async (req, reply) => {
    const { id, timeOffId } = req.params as { id: string; timeOffId: string };
    if (!canAccess(req, id)) return reply.status(403).send({ error: 'Forbidden' });
    await app.prisma.practitionerTimeOff.deleteMany({
      where: { id: timeOffId, practitionerId: id },
    });
    return { ok: true };
  });
}
