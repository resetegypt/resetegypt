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
    const params = req.query as { search?: string; status?: string };
    const q = params.search?.trim();
    // Par défaut on n'inclut PAS les patients archivés (sinon les listes
    // sont polluées par les ex-patients). status=all OU status=ARCHIVED
    // pour les voir explicitement.
    const statusFilter =
      params.status === 'all'
        ? undefined
        : params.status === 'ARCHIVED' || params.status === 'LOST'
          ? params.status
          : 'ACTIVE';

    const conditions: Record<string, unknown>[] = [];
    if (statusFilter) conditions.push({ status: statusFilter });
    if (q) {
      conditions.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      });
    }
    const where = conditions.length ? { AND: conditions } : undefined;

    const patients = await app.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        age: true,
        primaryAddiction: true,
        status: true,
        avatarUrl: true,
        tags: true,
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
          },
        },
        medicalRecord: {
          select: {
            id: true,
            finalizedAt: true,
            stressScore: true,
            anxietyScore: true,
            cravingScore: true,
            sleepScore: true,
            motivationScore: true,
          },
        },
      },
    });
    if (!patient) return reply.status(404).send({ error: 'NotFound' });

    const totalPaid = await app.prisma.payment.aggregate({
      where: { patientId: id },
      _sum: { total: true },
    });

    // Pour la page patient : on renvoie aussi le medicalRecord (s'il existe)
    // pour l'onglet "Fiche clinique".
    return {
      patient,
      stats: {
        sessionsCount: patient.appointments.length,
        totalPaid: Number(totalPaid._sum.total ?? 0),
      },
      evolution: patient.medicalRecord ? [patient.medicalRecord] : [],
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
      avatarUrl: z.string().nullable().optional(),
      // tags: tableau de chaînes courtes (max 24 chars chaque, max 12 tags)
      tags: z.array(z.string().min(1).max(24)).max(12).optional(),
    });
    const partial = updateSchema.safeParse(req.body);
    if (!partial.success) return { error: 'ValidationError', details: partial.error.flatten() };
    const data = partial.data;
    // Normalise les tags : trim + lowercase + dédoublonne
    const tags = data.tags
      ? Array.from(new Set(data.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)))
      : undefined;
    const updated = await app.prisma.patient.update({
      where: { id },
      data: {
        ...data,
        tags,
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

  // === Upload de l'avatar patient ===
  // Le client envoie une data URL base64 redimensionnée côté navigateur
  // (max 256x256, ~20KB). On stocke directement dans patient.avatarUrl.
  // Si on bascule plus tard sur Supabase Storage / S3 il suffira de remplacer
  // cette route par un upload réel + retour d'URL CDN.
  app.put('/patients/:id/avatar', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const schema = z.object({
      dataUrl: z
        .string()
        .startsWith('data:image/')
        .max(200_000, 'Avatar trop lourd (max 200 KB après compression)')
        .nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const updated = await app.prisma.patient.update({
      where: { id },
      data: { avatarUrl: parsed.data.dataUrl },
      select: { id: true, avatarUrl: true },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: parsed.data.dataUrl ? 'patient_avatar_set' : 'patient_avatar_removed',
      resource: `patient:${id}`,
    });
    return { patient: updated };
  });

  // === Notes de suivi (timeline) ===
  // GET /patients/:id/notes — liste chronologique (récent en premier)
  // POST /patients/:id/notes — ajoute une note
  // DELETE /notes/:noteId — supprime (auteur ou ADMIN uniquement)
  app.get('/patients/:id/notes', async (req) => {
    const id = (req.params as { id: string }).id;
    const notes = await app.prisma.followUpNote.findMany({
      where: { patientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      take: 200,
    });
    return { notes };
  });

  app.post('/patients/:id/notes', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const schema = z.object({
      content: z.string().min(1).max(4000),
      kind: z.enum(['NOTE', 'OBSERVATION', 'ALERT', 'CALL', 'RELAPSE']).default('NOTE'),
      appointmentId: z.string().uuid().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const note = await app.prisma.followUpNote.create({
      data: {
        patientId: id,
        authorId: req.currentUser!.sub,
        content: parsed.data.content,
        kind: parsed.data.kind,
        appointmentId: parsed.data.appointmentId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'patient_note_added',
      resource: `patient:${id}`,
      details: { noteId: note.id, kind: note.kind },
    });
    return reply.status(201).send({ note });
  });

  app.delete('/notes/:noteId', async (req, reply) => {
    const noteId = (req.params as { noteId: string }).noteId;
    const note = await app.prisma.followUpNote.findUnique({ where: { id: noteId } });
    if (!note) return reply.status(404).send({ error: 'NotFound' });
    const isAuthor = note.authorId === req.currentUser!.sub;
    const isAdmin = req.currentUser!.role === 'ADMIN';
    if (!isAuthor && !isAdmin) return reply.status(403).send({ error: 'Forbidden' });
    await app.prisma.followUpNote.delete({ where: { id: noteId } });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'patient_note_deleted',
      resource: `note:${noteId}`,
    });
    return { ok: true };
  });

  // === Snapshots des scores 0-10 (évolution séance après séance) ==========
  // GET liste chronologique. POST crée un snapshot (depuis le body OU les
  // valeurs actuelles de la fiche clinique si non fournies).
  app.get('/patients/:id/score-snapshots', async (req) => {
    const id = (req.params as { id: string }).id;
    const snapshots = await app.prisma.scoreSnapshot.findMany({
      where: { patientId: id },
      orderBy: { takenAt: 'asc' },
      include: { takenBy: { select: { firstName: true, lastName: true } } },
      take: 200,
    });
    return { snapshots };
  });

  app.post('/patients/:id/score-snapshots', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const schema = z.object({
      stressScore: z.number().int().min(0).max(10).nullable().optional(),
      anxietyScore: z.number().int().min(0).max(10).nullable().optional(),
      cravingScore: z.number().int().min(0).max(10).nullable().optional(),
      sleepScore: z.number().int().min(0).max(10).nullable().optional(),
      motivationScore: z.number().int().min(0).max(10).nullable().optional(),
      selfEsteemScore: z.number().int().min(0).max(10).nullable().optional(),
      notes: z.string().max(500).optional(),
      // Si "useCurrent" est true et qu'on ne passe pas de scores explicites,
      // on prend les valeurs actuelles du MedicalRecord.
      useCurrent: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const d = parsed.data;

    let scores = {
      stressScore: d.stressScore,
      anxietyScore: d.anxietyScore,
      cravingScore: d.cravingScore,
      sleepScore: d.sleepScore,
      motivationScore: d.motivationScore,
      selfEsteemScore: d.selfEsteemScore,
    };

    // Si rien n'est passé OU useCurrent=true, on charge depuis le MR
    const hasAnyScore = Object.values(scores).some((v) => v !== undefined && v !== null);
    if (!hasAnyScore || d.useCurrent) {
      const mr = await app.prisma.medicalRecord.findUnique({ where: { patientId: id } });
      if (mr) {
        scores = {
          stressScore: mr.stressScore,
          anxietyScore: mr.anxietyScore,
          cravingScore: mr.cravingScore,
          sleepScore: mr.sleepScore,
          motivationScore: mr.motivationScore,
          selfEsteemScore: mr.selfEsteemScore,
        };
      }
    }

    const snapshot = await app.prisma.scoreSnapshot.create({
      data: {
        patientId: id,
        ...scores,
        notes: d.notes,
        takenById: req.currentUser!.sub,
      },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'score_snapshot_taken',
      resource: `patient:${id}`,
      details: { snapshotId: snapshot.id },
    });

    return reply.status(201).send({ snapshot });
  });

  app.delete('/score-snapshots/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const snap = await app.prisma.scoreSnapshot.findUnique({ where: { id } });
    if (!snap) return reply.status(404).send({ error: 'NotFound' });
    const isAuthor = snap.takenById === req.currentUser!.sub;
    const isAdmin = req.currentUser!.role === 'ADMIN';
    if (!isAuthor && !isAdmin) return reply.status(403).send({ error: 'Forbidden' });
    await app.prisma.scoreSnapshot.delete({ where: { id } });
    return { ok: true };
  });
}
