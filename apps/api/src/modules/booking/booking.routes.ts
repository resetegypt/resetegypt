import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const bookingSchema = z.object({
  service: z.enum(['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS']),
  visitType: z.enum(['FIRST', 'FOLLOWUP']),
  scheduledAt: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal('')),
  age: z.number().int().optional(),
  acquisitionSource: z.string().optional(),
  preferredLanguage: z.string().default('fr'),
  consents: z.object({
    dataProtection: z.boolean(),
    nonMedical: z.boolean(),
  }),
});

const PRICE_BY_SERVICE: Record<string, { first: number; followup: number }> = {
  TOBACCO: { first: 3500, followup: 1500 },
  DRUGS: { first: 4000, followup: 1800 },
  ALCOHOL: { first: 4000, followup: 1800 },
  SUGAR: { first: 2500, followup: 1100 },
  STRESS: { first: 2000, followup: 900 },
};

export async function bookingRoutes(app: FastifyInstance): Promise<void> {
  // Public endpoints — no auth required
  app.get('/booking/slots', async (req) => {
    const q = req.query as { date?: string };
    const date = q.date ? new Date(q.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const existing = await app.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: date, lt: next },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: { scheduledAt: true },
    });
    const takenIso = new Set(existing.map((a) => a.scheduledAt.toISOString()));

    const slots: Array<{ time: string; iso: string; taken: boolean }> = [];
    for (let i = 0; i < 18; i++) {
      const slot = new Date(date);
      const minutesFromMidnight = 10 * 60 + i * 40;
      slot.setMinutes(minutesFromMidnight);
      const iso = slot.toISOString();
      slots.push({
        time: `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`,
        iso,
        taken: takenIso.has(iso),
      });
    }
    return { date: date.toISOString().slice(0, 10), slots };
  });

  app.post('/booking', async (req, reply) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const d = parsed.data;
    if (!d.consents.dataProtection || !d.consents.nonMedical) {
      return reply.status(400).send({ error: 'ConsentsRequired' });
    }

    // Find or create patient
    let patient = await app.prisma.patient.findUnique({ where: { phone: d.phone } });
    const systemSecretary = await app.prisma.user.findFirst({
      where: { role: 'SECRETARY' },
      select: { id: true },
    });
    if (!systemSecretary) return reply.status(500).send({ error: 'NoSystemUser' });

    if (!patient) {
      patient = await app.prisma.patient.create({
        data: {
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone,
          email: d.email || undefined,
          age: d.age ?? null,
          primaryAddiction: d.service,
          preferredLanguage: d.preferredLanguage,
          acquisitionSource: d.acquisitionSource ? [d.acquisitionSource] : ['booking_online'],
          consents: {
            dataProtection: { accepted: true, timestamp: new Date().toISOString() },
            smsAuthorization: { accepted: true, timestamp: new Date().toISOString() },
            nonMedicalAcknowledgement: { accepted: true, timestamp: new Date().toISOString() },
          } as never,
          createdById: systemSecretary.id,
        },
      });
    }

    // Pick first available practitioner
    const practitioner = await app.prisma.user.findFirst({
      where: { role: 'PRACTITIONER', isActive: true },
      select: { id: true },
    });
    if (!practitioner) return reply.status(500).send({ error: 'NoPractitioners' });

    const scheduledAt = new Date(d.scheduledAt);
    const conflict = await app.prisma.appointment.findFirst({
      where: {
        scheduledAt,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    });
    if (conflict) return reply.status(409).send({ error: 'SlotTaken' });

    const price = PRICE_BY_SERVICE[d.service]![d.visitType === 'FIRST' ? 'first' : 'followup'];

    const appointment = await app.prisma.appointment.create({
      data: {
        patientId: patient.id,
        practitionerId: practitioner.id,
        scheduledAt,
        service: d.service,
        visitType: d.visitType,
        source: 'online',
        price,
      },
    });

    const confirmationNumber = `RES-${new Date().getFullYear()}-${appointment.id.slice(0, 4).toUpperCase()}`;
    return reply.status(201).send({
      confirmationNumber,
      appointmentId: appointment.id,
      patientId: patient.id,
    });
  });
}
