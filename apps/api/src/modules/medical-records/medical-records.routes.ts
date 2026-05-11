import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';

const recordSchema = z.object({
  appointmentId: z.string().uuid(),
  yearsOfAddiction: z.number().int().optional(),
  dailyQuantity: z.string().optional(),
  previousMethods: z.array(z.string()).optional(),
  longestQuit: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  consumptionMoments: z.string().optional(),
  stressScore: z.number().int().min(0).max(10).optional(),
  anxietyScore: z.number().int().min(0).max(10).optional(),
  cravingScore: z.number().int().min(0).max(10).optional(),
  sleepScore: z.number().int().min(0).max(10).optional(),
  motivationScore: z.number().int().min(0).max(10).optional(),
  contraindications: z.array(z.string()).optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  spo2: z.number().int().min(0).max(100).optional(),
  fagerstromScore: z.number().int().optional(),
  auditScore: z.number().int().optional(),
  duditScore: z.number().int().optional(),
  yfasScore: z.number().int().optional(),
  hadAnxietyScore: z.number().int().optional(),
  hadDepressionScore: z.number().int().optional(),
  auricularPoints: z.string().optional(),
  laserDuration: z.number().int().optional(),
  nextSession: z.string().optional(),
  privateNotes: z.string().optional(),
});

export async function medicalRecordsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);
  app.addHook('preHandler', app.requireRole('PRACTITIONER', 'ADMIN'));

  app.post('/medical-records', async (req, reply) => {
    const parsed = recordSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });
    const data = parsed.data;

    const appointment = await app.prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      select: { patientId: true },
    });
    if (!appointment) return reply.status(404).send({ error: 'AppointmentNotFound' });

    const bmi =
      data.weight && data.height ? data.weight / Math.pow(data.height / 100, 2) : undefined;

    const existing = await app.prisma.medicalRecord.findUnique({
      where: { appointmentId: data.appointmentId },
    });

    let record;
    if (existing) {
      record = await app.prisma.medicalRecord.update({
        where: { appointmentId: data.appointmentId },
        data: { ...data, bmi, patientId: appointment.patientId },
      });
    } else {
      record = await app.prisma.medicalRecord.create({
        data: { ...data, bmi, patientId: appointment.patientId },
      });
    }

    await app.prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'COMPLETED' },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: existing ? 'medical_record_updated' : 'medical_record_created',
      resource: `medicalRecord:${record.id}`,
    });

    return reply.status(existing ? 200 : 201).send({ medicalRecord: record });
  });

  app.get('/medical-records/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const record = await app.prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) return reply.status(404).send({ error: 'NotFound' });
    return { medicalRecord: record };
  });

  app.get('/appointments/:id/medical-record', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const record = await app.prisma.medicalRecord.findUnique({
      where: { appointmentId: id },
    });
    if (!record) return reply.status(404).send({ error: 'NotFound' });
    return { medicalRecord: record };
  });
}
