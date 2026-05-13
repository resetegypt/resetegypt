import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';
import { sendEmail } from '../../lib/email.js';
import { env } from '../../env.js';

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
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            medicalRecord: { select: { id: true } },
          },
        },
        practitioner: { select: { firstName: true, lastName: true } },
        payment: { select: { id: true, total: true, invoiceNumber: true } },
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
        hasMedicalRecord: !!a.patient.medicalRecord,
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

  // Endpoint générique pour les vues jour/mois de l'agenda :
  // accepte from + to (ISO) et retourne tous les RDV dans cette plage.
  app.get('/appointments/range', async (req, reply) => {
    const q = req.query as { from?: string; to?: string };
    if (!q.from || !q.to) {
      return reply.status(400).send({ error: 'MissingFromOrTo' });
    }
    const from = new Date(q.from);
    const to = new Date(q.to);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return reply.status(400).send({ error: 'InvalidDate' });
    }

    const where: Record<string, unknown> = {
      scheduledAt: { gte: from, lt: to },
    };
    if (req.currentUser!.role === 'PRACTITIONER') {
      where.practitionerId = req.currentUser!.sub;
    }

    const rows = await app.prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            tags: true,
          },
        },
        practitioner: { select: { id: true, firstName: true, lastName: true } },
        payment: { select: { id: true, total: true } },
      },
    });

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      appointments: rows.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        scheduledAt: a.scheduledAt.toISOString(),
        duration: a.duration,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientPhone: a.patient.phone,
        patientAvatarUrl: a.patient.avatarUrl,
        patientTags: a.patient.tags,
        practitionerId: a.practitionerId,
        practitioner: a.practitioner.firstName,
        service: a.service,
        visitType: a.visitType,
        status: a.status,
        price: Number(a.price),
        notes: a.notes,
        paidTotal: a.payment ? Number(a.payment.total) : null,
      })),
    };
  });

  app.get('/appointments/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const a = await app.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { medicalRecord: true } },
        practitioner: { select: { firstName: true, lastName: true } },
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

  app.patch('/appointments/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const patchSchema = z.object({
      status: z
        .enum(['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'])
        .optional(),
      notes: z.string().nullable().optional(),
      scheduledAt: z.string().optional(),
      practitionerId: z.string().uuid().optional(),
    });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const body = parsed.data;
    const update: Record<string, unknown> = {};
    if (body.status) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.scheduledAt) update.scheduledAt = new Date(body.scheduledAt);
    if (body.practitionerId) update.practitionerId = body.practitionerId;

    // Si on tente de déplacer le RDV : conflit ?
    if (body.scheduledAt) {
      const newDate = new Date(body.scheduledAt);
      const target = await app.prisma.appointment.findUnique({ where: { id }, select: { practitionerId: true } });
      const practitionerId = body.practitionerId ?? target?.practitionerId;
      if (practitionerId) {
        const conflict = await app.prisma.appointment.findFirst({
          where: {
            practitionerId,
            scheduledAt: newDate,
            status: { in: ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'] },
            id: { not: id },
          },
        });
        if (conflict) return reply.status(409).send({ error: 'TimeSlotConflict', conflictId: conflict.id });
      }
    }

    const previous = await app.prisma.appointment.findUnique({ where: { id } });
    const updated = await app.prisma.appointment.update({ where: { id }, data: update });

    // Si le RDV passe à un statut "libérant le créneau" (CANCELLED / NO_SHOW),
    // on cherche les patients dans la file d'attente matching service +
    // créneau, et on envoie une notification au premier (priorité + ancienneté).
    const freeingStatuses = new Set(['CANCELLED', 'NO_SHOW']);
    if (
      body.status &&
      freeingStatuses.has(body.status) &&
      previous &&
      !freeingStatuses.has(previous.status)
    ) {
      await notifyNextWaitingListEntry(app, {
        service: previous.service,
        slotAt: previous.scheduledAt,
        practitionerId: previous.practitionerId,
      });
    }

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
    const previous = await app.prisma.appointment.findUnique({ where: { id } });
    await app.prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    if (previous && previous.status !== 'CANCELLED' && previous.status !== 'NO_SHOW') {
      await notifyNextWaitingListEntry(app, {
        service: previous.service,
        slotAt: previous.scheduledAt,
        practitionerId: previous.practitionerId,
      });
    }
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

// === Notification auto de la liste d'attente ===
// Quand un créneau se libère (CANCELLED ou NO_SHOW), on cherche le premier
// patient de la file d'attente matching service + (optionnel) praticien
// préféré, et on lui envoie un email. Pas bloquant — on log les erreurs mais
// on ne fait jamais échouer la requête principale.
async function notifyNextWaitingListEntry(
  app: FastifyInstance,
  args: { service: string; slotAt: Date; practitionerId: string },
): Promise<void> {
  try {
    const where: Record<string, unknown> = {
      service: args.service,
      status: 'WAITING',
    };
    // Match strict sur le praticien si l'entrée a une préférence ;
    // sinon (preference = null) on accepte le créneau quel que soit le médecin.
    const entries = await app.prisma.waitingList.findMany({
      where: {
        ...where,
        OR: [{ practitionerId: null }, { practitionerId: args.practitionerId }],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: { patient: true },
    });

    // On prend le premier qui matche la fenêtre [preferredFrom, preferredTo]
    // si présente.
    const slot = args.slotAt.getTime();
    const match = entries.find((e) => {
      if (e.preferredFrom && slot < e.preferredFrom.getTime()) return false;
      if (e.preferredTo && slot > e.preferredTo.getTime()) return false;
      return true;
    });
    if (!match || !match.patient.email) return;

    const html = renderWaitingNotifEmail(
      match.patient.firstName,
      match.service,
      args.slotAt,
      env.APP_URL,
    );
    await sendEmail({
      to: match.patient.email,
      subject: 'Un créneau s\'est libéré — Reset Egypt',
      html,
    });

    await app.prisma.waitingList.update({
      where: { id: match.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: new Date(),
        notifiedSlotAt: args.slotAt,
      },
    });
  } catch (err) {
    // best-effort : on log mais on ne casse pas la requête.
    app.log.error({ err }, 'waiting list auto-notification failed');
  }
}

const NOTIF_BRAND = {
  primary: '#1E0FBA',
  primaryDark: '#130982',
  primaryLight: '#79C9EE',
  primaryLightest: '#E6F3FB',
  text: '#111827',
  textSecondary: '#4B5563',
  bgSecondary: '#EDF4FB',
  surface: '#FFFFFF',
  textTertiary: '#9CA3AF',
};

const SERVICE_LABEL: Record<string, string> = {
  TOBACCO: 'Sevrage tabagique',
  DRUGS: 'Sevrage drogues',
  ALCOHOL: 'Sevrage alcool',
  SUGAR: 'Gestion du sucre',
  STRESS: 'Stress / anxiété',
};

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderWaitingNotifEmail(firstName: string, service: string, slotAt: Date, appUrl: string): string {
  const slotStr = slotAt.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:${NOTIF_BRAND.bgSecondary};font-family:-apple-system,'Segoe UI','Inter',Arial,sans-serif;color:${NOTIF_BRAND.text};">
<table width="100%" style="background:${NOTIF_BRAND.bgSecondary};padding:40px 16px;"><tr><td align="center">
<table width="600" style="max-width:600px;background:${NOTIF_BRAND.surface};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,15,186,0.08);">
<tr><td style="background:linear-gradient(135deg,${NOTIF_BRAND.primary} 0%,${NOTIF_BRAND.primaryDark} 100%);padding:32px;text-align:center;color:white;">
  <img src="${escapeHtml(appUrl)}/logo.svg" alt="Reset" width="100" height="100" style="width:100px;height:100px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.2);" />
  <div style="font-size:10px;color:${NOTIF_BRAND.primaryLight};letter-spacing:0.32em;font-weight:600;margin-top:12px;">BRANCH CAIRO EAST CMC</div>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 12px;font-size:22px;color:${NOTIF_BRAND.text};">Bonjour ${escapeHtml(firstName)} 🎉</h1>
<p style="margin:0 0 18px;color:${NOTIF_BRAND.textSecondary};">Un créneau s'est libéré pour votre séance <strong style="color:${NOTIF_BRAND.primary};">${escapeHtml(SERVICE_LABEL[service] ?? service)}</strong>.</p>
<div style="background:linear-gradient(135deg,${NOTIF_BRAND.primaryLightest} 0%,${NOTIF_BRAND.surface} 100%);border:1px solid ${NOTIF_BRAND.primaryLight};border-radius:12px;padding:20px;margin-bottom:18px;text-align:center;">
  <div style="font-size:10px;color:${NOTIF_BRAND.textTertiary};text-transform:uppercase;letter-spacing:0.16em;font-weight:600;">Créneau proposé</div>
  <div style="font-size:18px;font-weight:700;color:${NOTIF_BRAND.primaryDark};margin-top:8px;">${escapeHtml(slotStr)}</div>
</div>
<p style="color:${NOTIF_BRAND.textSecondary};font-size:14px;">Contactez-nous rapidement pour confirmer — premier arrivé, premier servi.</p>
<div style="text-align:center;margin:24px 0;"><a href="https://wa.me/201234567890" style="display:inline-block;background:${NOTIF_BRAND.primary};color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">Réserver par WhatsApp</a></div>
</td></tr>
</table></td></tr></table></body></html>`;
}
