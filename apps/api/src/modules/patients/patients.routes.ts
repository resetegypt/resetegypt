import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';

const consentSchema = z.object({
  accepted: z.boolean(),
  timestamp: z.string(),
  ipAddress: z.string().optional(),
});

const consentsSchema = z.object({
  dataProtection: consentSchema,
  smsAuthorization: consentSchema,
  nonMedicalAcknowledgement: consentSchema,
});

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  phone: z.string().min(5),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  governorate: z.string().optional(),
  profession: z.string().optional(),
  maritalStatus: z.string().optional(),
  acquisitionSource: z.array(z.string()).optional(),
  primaryAddiction: z.enum(['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS']),
  previousAttempts: z.string().optional(),
  motivationLevel: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      relationship: z.string().optional(),
      phone: z.string(),
    })
    .optional(),
  consents: consentsSchema,
  preferredLanguage: z.string().default('fr'),
});

function ageFromDob(dob: Date | null): number | null {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export async function patientsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  app.get('/patients', async (req) => {
    const q = (req.query as { search?: string }).search?.trim();
    const patients = await app.prisma.patient.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        age: true,
        primaryAddiction: true,
        status: true,
        createdAt: true,
        preferredLanguage: true,
        governorate: true,
      },
      take: 200,
    });
    return { patients };
  });

  app.get('/patients/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const patient = await app.prisma.patient.findUnique({
      where: { id },
      include: {
        preferredPractitioner: {
          select: { id: true, firstName: true, lastName: true },
        },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 50,
          include: {
            practitioner: { select: { firstName: true, lastName: true } },
            payment: { select: { total: true, paymentMethod: true, invoiceNumber: true } },
            medicalRecord: { select: { id: true } },
          },
        },
      },
    });
    if (!patient) return reply.status(404).send({ error: 'NotFound' });

    const totalPaid = await app.prisma.payment.aggregate({
      where: { patientId: id },
      _sum: { total: true },
    });

    const records = await app.prisma.medicalRecord.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        stressScore: true,
        anxietyScore: true,
        cravingScore: true,
        sleepScore: true,
        motivationScore: true,
      },
    });

    return {
      patient,
      stats: {
        sessionsCount: patient.appointments.length,
        totalPaid: Number(totalPaid._sum.total ?? 0),
      },
      evolution: records,
    };
  });

  app.post('/patients', async (req, reply) => {
    const parsed = createPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    }
    const d = parsed.data;
    const dob = d.dateOfBirth ? new Date(d.dateOfBirth) : null;

    const patient = await app.prisma.patient.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        dateOfBirth: dob,
        age: ageFromDob(dob),
        gender: d.gender,
        phone: d.phone,
        whatsapp: d.whatsapp,
        email: d.email,
        address: d.address,
        governorate: d.governorate,
        profession: d.profession,
        maritalStatus: d.maritalStatus,
        acquisitionSource: d.acquisitionSource ?? [],
        primaryAddiction: d.primaryAddiction,
        previousAttempts: d.previousAttempts,
        motivationLevel: d.motivationLevel,
        emergencyContact: d.emergencyContact
          ? (d.emergencyContact as unknown as object)
          : undefined,
        consents: d.consents as unknown as object,
        preferredLanguage: d.preferredLanguage,
        createdById: req.currentUser!.sub,
      },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'patient_created',
      resource: `patient:${patient.id}`,
    });

    return reply.status(201).send({ patient });
  });

  app.patch('/patients/:id', async (req) => {
    const id = (req.params as { id: string }).id;
    const updateSchema = createPatientSchema.partial().extend({
      status: z.enum(['ACTIVE', 'ARCHIVED', 'LOST']).optional(),
      preferredPractitionerId: z.string().uuid().nullable().optional(),
    });
    const partial = updateSchema.safeParse(req.body);
    if (!partial.success) return { error: 'ValidationError', details: partial.error.flatten() };
    const data = partial.data;
    const updated = await app.prisma.patient.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        emergencyContact: data.emergencyContact
          ? (data.emergencyContact as unknown as object)
          : undefined,
        consents: data.consents ? (data.consents as unknown as object) : undefined,
      },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'patient_updated',
      resource: `patient:${id}`,
    });
    return { patient: updated };
  });
}
