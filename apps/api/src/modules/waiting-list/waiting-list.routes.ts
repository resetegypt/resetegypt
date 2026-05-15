import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';
import { sendEmail } from '../../lib/email.js';
import { env } from '../../env.js';

const createSchema = z.object({
  patientId: z.string().uuid(),
  service: z.enum(['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS']),
  preferredFrom: z.string().optional(),
  preferredTo: z.string().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredHours: z.string().optional(),
  practitionerId: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  preferredFrom: z.string().nullable().optional(),
  preferredTo: z.string().nullable().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredHours: z.string().nullable().optional(),
  practitionerId: z.string().uuid().nullable().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  status: z.enum(['WAITING', 'NOTIFIED', 'BOOKED', 'EXPIRED', 'CANCELLED']).optional(),
  notes: z.string().nullable().optional(),
});

export async function waitingListRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  // GET /waiting-list — liste filtrable par statut/service
  app.get('/waiting-list', async (req) => {
    const q = req.query as { status?: string; service?: string };
    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    else where.status = { in: ['WAITING', 'NOTIFIED'] }; // par défaut, on cache les fermés
    if (q.service) where.service = q.service;

    const entries = await app.prisma.waitingList.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            avatarUrl: true,
            tags: true,
          },
        },
      },
      take: 200,
    });
    return { entries };
  });

  // POST /waiting-list — ajoute un patient à la file
  app.post('/waiting-list', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const d = parsed.data;
    const entry = await app.prisma.waitingList.create({
      data: {
        patientId: d.patientId,
        service: d.service,
        preferredFrom: d.preferredFrom ? new Date(d.preferredFrom) : null,
        preferredTo: d.preferredTo ? new Date(d.preferredTo) : null,
        preferredDays: d.preferredDays ?? [],
        preferredHours: d.preferredHours,
        practitionerId: d.practitionerId,
        priority: d.priority ?? 0,
        notes: d.notes,
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'waiting_list_added',
      resource: `waiting:${entry.id}`,
      details: { patientId: d.patientId, service: d.service },
    });
    return reply.status(201).send({ entry });
  });

  // PATCH /waiting-list/:id
  app.patch('/waiting-list/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    const d = parsed.data;
    const data: Record<string, unknown> = { ...d };
    if (d.preferredFrom !== undefined) data.preferredFrom = d.preferredFrom ? new Date(d.preferredFrom) : null;
    if (d.preferredTo !== undefined) data.preferredTo = d.preferredTo ? new Date(d.preferredTo) : null;
    const entry = await app.prisma.waitingList.update({ where: { id }, data });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'waiting_list_updated',
      resource: `waiting:${id}`,
    });
    return { entry };
  });

  // DELETE /waiting-list/:id
  app.delete('/waiting-list/:id', async (req) => {
    const id = (req.params as { id: string }).id;
    await app.prisma.waitingList.update({ where: { id }, data: { status: 'CANCELLED' } });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'waiting_list_cancelled',
      resource: `waiting:${id}`,
    });
    return { ok: true };
  });

  // POST /waiting-list/:id/notify — envoie une proposition de créneau par email
  app.post('/waiting-list/:id/notify', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { slotAt?: string };
    const slotAt = body.slotAt ? new Date(body.slotAt) : null;

    const entry = await app.prisma.waitingList.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!entry) return reply.status(404).send({ error: 'NotFound' });
    if (!entry.patient.email) return reply.status(400).send({ error: 'PatientHasNoEmail' });

    const subject = slotAt
      ? `Créneau disponible — Reset Egypt`
      : `Mise à jour liste d'attente — Reset Egypt`;
    const html = renderWaitingListNotificationEmail({
      patientFirstName: entry.patient.firstName,
      slotAt,
      service: entry.service,
      appUrl: env.APP_URL,
    });

    const result = await sendEmail({
      to: entry.patient.email,
      subject,
      html,
    });

    await app.prisma.waitingList.update({
      where: { id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: new Date(),
        notifiedSlotAt: slotAt,
      },
    });

    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'waiting_list_notified',
      resource: `waiting:${id}`,
      details: { slotAt: slotAt?.toISOString(), emailResult: result },
    });

    return { ok: true, emailResult: result };
  });
}

// === Email template ===
// On garde simple et brandé : couleurs Reset, hero avec logo, message
// clair "un créneau s'est libéré, contactez-nous pour réserver".

const BRAND = {
  primary: '#1E0FBA',
  primaryDark: '#130982',
  primaryLight: '#79C9EE',
  primaryLightest: '#E6F3FB',
  text: '#111827',
  textSecondary: '#4B5563',
  bgSecondary: '#EDF4FB',
  surface: '#FFFFFF',
  borderLight: '#E6EEF7',
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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface WaitingNotifData {
  patientFirstName: string;
  slotAt: Date | null;
  service: string;
  appUrl: string;
}

function renderWaitingListNotificationEmail(d: WaitingNotifData): string {
  const slotStr = d.slotAt
    ? d.slotAt.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  return `<!doctype html>
<html lang="fr"><head><meta charset="UTF-8"><title>Créneau disponible — Reset Egypt</title></head>
<body style="margin:0;padding:0;background:${BRAND.bgSecondary};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;color:${BRAND.text};line-height:1.5;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BRAND.bgSecondary};padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:${BRAND.surface};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,15,186,0.08);">
      <tr><td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);padding:36px 32px 32px;color:white;text-align:center;">
        <img src="${escapeHtml(d.appUrl)}/logo.svg" alt="Reset" width="100" height="100" style="display:inline-block;width:100px;height:100px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.2);" />
        <div style="font-size:10px;color:${BRAND.primaryLight};letter-spacing:0.32em;font-weight:600;margin-top:12px;">BRANCH CAIRO EAST CMC</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <h1 style="font-size:22px;font-weight:700;color:${BRAND.text};margin:0 0 12px;">Bonjour ${escapeHtml(d.patientFirstName)} 👋</h1>
        <p style="color:${BRAND.textSecondary};font-size:14px;margin:0 0 18px;">
          Bonne nouvelle ! Un créneau s'est libéré pour votre séance <strong style="color:${BRAND.primary};">${escapeHtml(SERVICE_LABEL[d.service] ?? d.service)}</strong>.
        </p>
        ${
          slotStr
            ? `<div style="background:linear-gradient(135deg,${BRAND.primaryLightest} 0%,${BRAND.surface} 100%);border:1px solid ${BRAND.primaryLight};border-radius:12px;padding:20px;margin-bottom:18px;text-align:center;">
            <div style="font-size:10px;color:${BRAND.textTertiary};text-transform:uppercase;letter-spacing:0.16em;font-weight:600;">Créneau proposé</div>
            <div style="font-size:18px;font-weight:700;color:${BRAND.primaryDark};margin-top:8px;">${escapeHtml(slotStr)}</div>
          </div>`
            : ''
        }
        <p style="color:${BRAND.textSecondary};font-size:14px;margin:0 0 18px;">
          Contactez-nous rapidement pour confirmer ce créneau — premier arrivé, premier servi.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://wa.me/201234567890" style="display:inline-block;background:${BRAND.primary};color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 2px 8px rgba(30,15,186,0.25);">Réserver par WhatsApp</a>
        </div>
        <p style="color:${BRAND.textSecondary};font-size:13px;margin:0;">À très vite,<br><strong style="color:${BRAND.text};">L'équipe Reset Egypt</strong></p>
      </td></tr>
      <tr><td style="padding:24px 32px 32px;">
        <div style="border-top:1px solid ${BRAND.borderLight};padding-top:18px;text-align:center;color:${BRAND.textTertiary};font-size:11px;line-height:1.6;">
          <strong style="color:${BRAND.primary};">Reset Egypt — Branch Cairo East CMC</strong><br>
          CMC, Teseen, New Cairo · Le Caire, Égypte<br>
          <a href="${escapeHtml(d.appUrl)}" style="color:${BRAND.primary};text-decoration:none;">reset-egypt.com</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
