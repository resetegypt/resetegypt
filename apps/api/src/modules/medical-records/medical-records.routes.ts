import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';

// Fiche clinique : UNE par patient.
// Schéma souple — tous les champs sauf patientId sont optionnels pour
// permettre l'auto-save progressif pendant que le médecin remplit.
const upsertSchema = z.object({
  // Addiction en détail
  yearsOfAddiction: z.number().int().min(0).max(80).optional().nullable(),
  startedAt: z.string().optional().nullable(),
  dailyQuantity: z.string().optional().nullable(),
  estimatedCostPerMonth: z.number().nonnegative().optional().nullable(),

  // Déclencheurs et contexte
  triggers: z.array(z.string()).optional(),
  consumptionMoments: z.string().optional().nullable(),
  socialContext: z.string().optional().nullable(),
  workContext: z.string().optional().nullable(),

  // Historique des tentatives
  previousAttempts: z.number().int().min(0).optional().nullable(),
  longestQuit: z.string().optional().nullable(),
  relapseReasons: z.string().optional().nullable(),
  methodsTried: z.array(z.string()).optional(),

  // Évaluations psycho-comportementales 0-10
  stressScore: z.number().int().min(0).max(10).optional().nullable(),
  anxietyScore: z.number().int().min(0).max(10).optional().nullable(),
  cravingScore: z.number().int().min(0).max(10).optional().nullable(),
  sleepScore: z.number().int().min(0).max(10).optional().nullable(),
  motivationScore: z.number().int().min(0).max(10).optional().nullable(),
  selfEsteemScore: z.number().int().min(0).max(10).optional().nullable(),

  // Examen clinique
  weight: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.number().int().min(20).max(220).optional().nullable(),
  spo2: z.number().int().min(0).max(100).optional().nullable(),

  // Antécédents
  medicalHistory: z.string().optional().nullable(),
  surgicalHistory: z.string().optional().nullable(),
  familyHistory: z.string().optional().nullable(),
  currentMedications: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),

  // Contre-indications laser
  contraindications: z.array(z.string()).optional(),
  contraindicationNotes: z.string().optional().nullable(),

  // Scores standardisés
  fagerstromScore: z.number().int().min(0).max(10).optional().nullable(),
  auditScore: z.number().int().min(0).max(40).optional().nullable(),
  duditScore: z.number().int().min(0).max(44).optional().nullable(),
  yfasScore: z.number().int().min(0).max(11).optional().nullable(),
  hadAnxietyScore: z.number().int().min(0).max(21).optional().nullable(),
  hadDepressionScore: z.number().int().min(0).max(21).optional().nullable(),

  // Protocole thérapeutique
  auricularPoints: z.string().optional().nullable(),
  laserDuration: z.number().int().min(0).max(120).optional().nullable(),
  sessionFrequency: z.string().optional().nullable(),
  estimatedSessions: z.number().int().min(0).max(50).optional().nullable(),

  // Objectifs & plan
  patientGoals: z.string().optional().nullable(),
  treatmentPlan: z.string().optional().nullable(),

  // Notes privées
  privateNotes: z.string().optional().nullable(),
});

export async function medicalRecordsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  // Tous les rôles peuvent LIRE la fiche clinique (mais notes privées masquées
  // pour non-praticiens — TODO si besoin).
  app.get('/patients/:patientId/medical-record', async (req, reply) => {
    const { patientId } = req.params as { patientId: string };
    const record = await app.prisma.medicalRecord.findUnique({
      where: { patientId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        finalizedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return reply.send({ medicalRecord: record });
  });

  // Seul PRACTITIONER + ADMIN peuvent ÉCRIRE.
  // Upsert : crée si pas existante, met à jour sinon.
  // Endpoint utilisé en auto-save (PATCH-like).
  app.put('/patients/:patientId/medical-record', async (req, reply) => {
    if (req.currentUser!.role !== 'PRACTITIONER' && req.currentUser!.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { patientId } = req.params as { patientId: string };
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    }
    const data = parsed.data;

    // Vérifier que le patient existe
    const patient = await app.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) return reply.status(404).send({ error: 'PatientNotFound' });

    // BMI auto-calculé
    const bmi =
      data.weight && data.height
        ? Number((data.weight / Math.pow(data.height / 100, 2)).toFixed(2))
        : undefined;

    // Conversion date startedAt si fournie
    const startedAt = data.startedAt ? new Date(data.startedAt) : undefined;

    const existing = await app.prisma.medicalRecord.findUnique({
      where: { patientId },
      select: { id: true, finalizedAt: true },
    });

    const baseData = {
      ...data,
      startedAt: startedAt === undefined ? undefined : startedAt,
      bmi,
    };
    // Champs en undefined sont ignorés par Prisma — on garde null comme "effacer"
    // mais startedAt undefined = ne pas toucher.

    let record;
    if (existing) {
      record = await app.prisma.medicalRecord.update({
        where: { patientId },
        data: baseData,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          finalizedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    } else {
      record = await app.prisma.medicalRecord.create({
        data: {
          ...baseData,
          patientId,
          createdById: req.currentUser!.sub,
        },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          finalizedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: existing ? 'medical_record_updated' : 'medical_record_created',
      resource: `medicalRecord:${record.id}`,
    });

    return reply.send({ medicalRecord: record });
  });

  // Finaliser la fiche : "Terminer" cliqué par le médecin.
  // La fiche reste éditable après (mode suivi), mais finalizedAt + finalizedBy
  // marquent la version "officielle".
  app.post('/patients/:patientId/medical-record/finalize', async (req, reply) => {
    if (req.currentUser!.role !== 'PRACTITIONER' && req.currentUser!.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { patientId } = req.params as { patientId: string };
    const existing = await app.prisma.medicalRecord.findUnique({
      where: { patientId },
      select: { id: true },
    });
    if (!existing) return reply.status(404).send({ error: 'NotFound' });

    const record = await app.prisma.medicalRecord.update({
      where: { patientId },
      data: {
        finalizedAt: new Date(),
        finalizedById: req.currentUser!.sub,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        finalizedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'medical_record_finalized',
      resource: `medicalRecord:${record.id}`,
    });

    return reply.send({ medicalRecord: record });
  });
}
