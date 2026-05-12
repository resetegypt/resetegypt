import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';

const PRICE_BY_SERVICE: Record<string, { first: number; followup: number }> = {
  TOBACCO: { first: 3500, followup: 1500 },
  DRUGS: { first: 4000, followup: 1800 },
  ALCOHOL: { first: 4000, followup: 1800 },
  SUGAR: { first: 2500, followup: 1100 },
  STRESS: { first: 2000, followup: 900 },
};

const createSchema = z.object({
  patientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  scheduledAt: z.string(),
  service: z.enum(['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS']),
  visitType: z.enum(['FIRST', 'FOLLOWUP', 'CONSOLIDATION']),
  source: z.string().default('phone'),
  notes: z.string().optional(),
  price: z.number().optional(),
});

export async function appointmentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  app.get('/appointments', async (req) => {
    const q = req.query as { from?: string; to?: string; practitionerId?: string; status?: string };
    const where: Record<string, unknown> = {};
    if (q.from || q.to) {
      where.scheduledAt = {
        ...(q.from && { gte: new Date(q.from) }),
        ...(q.to && { lte: new Date(q.to) }),
      };
    }
    if (q.practitionerId) where.practitionerId = q.practitionerId;
    if (q.status) where.status = q.status;

    if (req.currentUser!.role === 'PRACTITIONER') {
      where.practitionerId = req.currentUser!.sub;
    }

    const appointments = await app.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        practitioner: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 500,
    });
    return { appointments };
  });

  app.get('/appointments/today', async (req) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {
      scheduledAt: { gte: today, lt: tomorrow },
    };
    if (req.currentUser!.role === 'PRACTITIONER') {
      where.practitionerId = req.currentUser!.sub;
    }

    const rows = await app.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        practitioner: { select: { firstName: true, lastName: true } },
        payment: { select: { id: true, total: true, invoiceNumber: true } },
        medicalRecord: { select: { id: true } },
      },
    });

    return {
      appointments: rows.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        patientId: a.patient.id,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientPhone: a.patient.phone,
        service: a.service,
        visitType: a.visitType,
        practitionerName: `Dr. ${a.practitioner.firstName}`,
        status: a.status,
        price: Number(a.price),
        hasMedicalRecord: !!a.medicalRecord,
        payment: a.payment
          ? {
              id: a.payment.id,
              total: Number(a.payment.total),
              invoiceNumber: a.payment.invoiceNumber,
            }
          : null,
      })),
    };
  });

  app.get('/appointments/week', async (req) => {
    const q = req.query as { start?: string };
    const start = q.start ? new Date(q.start) : new Date();
    start.setHours(0, 0, 0, 0);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const where: Record<string, unknown> = {
      scheduledAt: { gte: start, lt: end },
    };
    if (req.currentUser!.role === 'PRACTITIONER') {
      where.practitionerId = req.currentUser!.sub;
    }

    const rows = await app.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      weekStart: start.toISOString(),
      appointments: rows.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        scheduledAt: a.scheduledAt.toISOString(),
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        practitioner: a.practitioner.firstName,
        service: a.service,
        visitType: a.visitType,
        status: a.status,
        price: Number(a.price),
      })),
    };
  });

  app.get('/appointments/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const a = await app.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        practitioner: { select: { firstName: true, lastName: true } },
        medicalRecord: true,
        payment: true,
      },
    });
    if (!a) return reply.status(404).send({ error: 'NotFound' });
    return { appointment: a };
  });

  app.post('/appointments', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const d = parsed.data;
    const scheduledAt = new Date(d.scheduledAt);

    const conflict = await app.prisma.appointment.findFirst({
      where: {
        practitionerId: d.practitionerId,
        scheduledAt,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    });
    if (conflict) {
      return reply.status(409).send({ error: 'TimeSlotConflict', conflictId: conflict.id });
    }

    const price = d.price ?? PRICE_BY_SERVICE[d.service]![d.visitType === 'FIRST' ? 'first' : 'followup'];
    const created = await app.prisma.appointment.create({
      data: {
        patientId: d.patientId,
        practitionerId: d.practitionerId,
        scheduledAt,
        service: d.service,
        visitType: d.visitType,
        source: d.source,
        notes: d.notes,
        price,
      },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'appointment_created',
      resource: `appointment:${created.id}`,
    });

    return reply.status(201).send({ appointment: created });
  });

  app.patch('/appointments/:id', async (req) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (typeof body.status === 'string') update.status = body.status;
    if (typeof body.notes === 'string') update.notes = body.notes;
    if (typeof body.scheduledAt === 'string') update.scheduledAt = new Date(body.scheduledAt);
    if (typeof body.practitionerId === 'string') update.practitionerId = body.practitionerId;

    const updated = await app.prisma.appointment.update({ where: { id }, data: update });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'appointment_updated',
      resource: `appointment:${id}`,
      details: update as Record<string, unknown>,
    });
    return { appointment: updated };
  });

  app.delete('/appointments/:id', async (req) => {
    const id = (req.params as { id: string }).id;
    await app.prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'appointment_cancelled',
      resource: `appointment:${id}`,
    });
    return { ok: true };
  });

  app.get('/practitioners', async () => {
    const list = await app.prisma.user.findMany({
      where: { role: 'PRACTITIONER', isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: 'asc' },
    });
    return { practitioners: list };
  });
}
