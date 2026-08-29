import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { isPractitionerAvailable } from '../availability/availability.routes.js';
import { env } from '../../env.js';
import { sendEmail, maskEmail } from '../../lib/email.js';
import { renderTemplate } from '../automations/templates.js';

const SERVICE_LABEL_BY_LANG: Record<string, Record<string, string>> = {
  fr: {
    TOBACCO: 'Sevrage tabagique',
    DRUGS: 'Sevrage drogues',
    ALCOHOL: 'Sevrage alcool',
    SUGAR: 'Gestion du sucre',
    STRESS: 'Stress / anxiété',
  },
  en: {
    TOBACCO: 'Smoking cessation',
    DRUGS: 'Drug detox',
    ALCOHOL: 'Alcohol detox',
    SUGAR: 'Sugar management',
    STRESS: 'Stress / anxiety',
  },
  ar: {
    TOBACCO: 'الإقلاع عن التدخين',
    DRUGS: 'الإقلاع عن المخدرات',
    ALCOHOL: 'الإقلاع عن الكحول',
    SUGAR: 'إدارة السكر',
    STRESS: 'التوتر / القلق',
  },
};

const bookingSchema = z.object({
  service: z.enum(['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS']),
  visitType: z.enum(['FIRST', 'FOLLOWUP']),
  scheduledAt: z.string().datetime(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal('')),
  age: z.number().int().min(0).max(120).optional(),
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

const SLOT_DURATION_MIN = 40;
const DAY_START_MIN = 10 * 60;
const SLOTS_PER_DAY = 18;

export async function bookingRoutes(app: FastifyInstance): Promise<void> {
  // Public endpoints — no auth required.
  // Rate-limit anti-spam : 30 req / minute / IP sur la création de RDV.
  app.get('/booking/slots', async (req) => {
    const q = req.query as { date?: string; practitionerId?: string };
    // Timezone Cairo UTC+2 (pas de DST depuis 2023) : on interprète la date
    // fournie comme la date LOCALE Cairo, on génère les slots à 10h Cairo etc.
    // Toutes les valeurs stockées en UTC (ISO), affichage recomposé Cairo côté client.
    const CAIRO_OFFSET_H = 2;
    const dateStr = q.date ?? new Date().toISOString().slice(0, 10);
    // dateStr = YYYY-MM-DD. On construit minuit LOCAL Cairo = YYYY-MM-DD 00:00 +02:00 UTC.
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    date.setUTCHours(date.getUTCHours() - CAIRO_OFFSET_H); // minuit Cairo = 22h UTC la veille
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + 1);

    // Praticiens éligibles : tous les actifs (ou un seul si filtré)
    const practitioners = await app.prisma.user.findMany({
      where: {
        role: 'PRACTITIONER',
        isActive: true,
        ...(q.practitionerId && { id: q.practitionerId }),
      },
      select: { id: true },
    });
    const practitionerIds = practitioners.map((p) => p.id);

    // RDV pris pour ce jour (toutes les praticiens éligibles confondus)
    const existing = await app.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: date, lt: next },
        practitionerId: { in: practitionerIds },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: { scheduledAt: true, practitionerId: true },
    });
    // Pour chaque slot, comptage des praticiens occupés
    const takenByIso = new Map<string, Set<string>>();
    for (const a of existing) {
      const iso = a.scheduledAt.toISOString();
      const set = takenByIso.get(iso) ?? new Set<string>();
      set.add(a.practitionerId);
      takenByIso.set(iso, set);
    }

    const slots: Array<{ time: string; iso: string; taken: boolean }> = [];
    for (let i = 0; i < SLOTS_PER_DAY; i++) {
      // Slot i = minuit Cairo + DAY_START_MIN + i*SLOT_DURATION_MIN (en minutes local Cairo)
      const slot = new Date(date);
      slot.setUTCMinutes(slot.getUTCMinutes() + DAY_START_MIN + i * SLOT_DURATION_MIN);
      const iso = slot.toISOString();
      // Affichage local Cairo (HH:MM) — indépendant du fuseau du serveur
      const cairoTime = new Date(slot.getTime() + CAIRO_OFFSET_H * 60 * 60 * 1000);

      // Au moins 1 praticien disponible (respectant availability) ET non occupé
      const occupied = takenByIso.get(iso) ?? new Set<string>();
      let anyAvailable = false;
      for (const pid of practitionerIds) {
        if (occupied.has(pid)) continue;
        // eslint-disable-next-line no-await-in-loop -- ordre stable, charge faible
        const available = await isPractitionerAvailable(app, pid, slot);
        if (available) {
          anyAvailable = true;
          break;
        }
      }
      slots.push({
        time: `${String(cairoTime.getUTCHours()).padStart(2, '0')}:${String(cairoTime.getUTCMinutes()).padStart(2, '0')}`,
        iso,
        taken: !anyAvailable,
      });
    }
    return { date: date.toISOString().slice(0, 10), slots };
  });

  app.post(
    '/booking',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
          keyGenerator: (req: { ip: string }) => `booking|${req.ip}`,
        },
      },
    },
    async (req, reply) => {
      const parsed = bookingSchema.safeParse(req.body);
      if (!parsed.success)
        return reply
          .status(400)
          .send({ error: 'ValidationError', details: parsed.error.flatten() });
      const d = parsed.data;
      if (!d.consents.dataProtection || !d.consents.nonMedical) {
        return reply.status(400).send({ error: 'ConsentsRequired' });
      }

      const scheduledAt = new Date(d.scheduledAt);
      if (scheduledAt.getTime() <= Date.now()) {
        return reply.status(400).send({ error: 'SlotInPast' });
      }

      const systemSecretary = await app.prisma.user.findFirst({
        where: { role: 'SECRETARY' },
        select: { id: true },
      });
      if (!systemSecretary) return reply.status(500).send({ error: 'NoSystemUser' });

      // Sélection praticien :
      // 1. Liste de tous les praticiens actifs
      // 2. Filtre ceux qui ont déjà un RDV à scheduledAt
      // 3. Filtre par isPractitionerAvailable (semaine type + congés)
      // 4. Round-robin parmi les éligibles (le moins chargé aujourd'hui)
      const practitioners = await app.prisma.user.findMany({
        where: { role: 'PRACTITIONER', isActive: true },
        select: { id: true },
      });
      if (practitioners.length === 0) return reply.status(500).send({ error: 'NoPractitioners' });

      const busy = await app.prisma.appointment.findMany({
        where: {
          scheduledAt,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { practitionerId: true },
      });
      const busyIds = new Set(busy.map((b) => b.practitionerId));

      let chosenPractitionerId: string | null = null;
      let bestLoad = Infinity;
      const todayStart = new Date(scheduledAt);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      for (const p of practitioners) {
        if (busyIds.has(p.id)) continue;
        // eslint-disable-next-line no-await-in-loop
        const ok = await isPractitionerAvailable(app, p.id, scheduledAt);
        if (!ok) continue;
        // eslint-disable-next-line no-await-in-loop
        const load = await app.prisma.appointment.count({
          where: {
            practitionerId: p.id,
            scheduledAt: { gte: todayStart, lt: todayEnd },
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
          },
        });
        if (load < bestLoad) {
          bestLoad = load;
          chosenPractitionerId = p.id;
        }
      }
      if (!chosenPractitionerId) {
        return reply.status(409).send({ error: 'SlotTaken' });
      }

      const price = PRICE_BY_SERVICE[d.service]![d.visitType === 'FIRST' ? 'first' : 'followup'];

      // Transaction : patient (find-or-create) + appointment + check conflit.
      // Si une autre transaction insère un appointment au même créneau pour ce
      // praticien entre nos 2 queries, on retombe sur l'erreur P2002 si une
      // unique constraint existe, sinon on retombe via le retry global.
      try {
        const result = await app.prisma.$transaction(async (tx) => {
          let patient = await tx.patient.findFirst({ where: { phone: d.phone } });
          if (!patient) {
            patient = await tx.patient.create({
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
                  nonMedicalAcknowledgement: {
                    accepted: true,
                    timestamp: new Date().toISOString(),
                  },
                } as never,
                createdById: systemSecretary.id,
              },
            });
          }

          // Re-check conflit AVANT le insert (last line of defense)
          const conflict = await tx.appointment.findFirst({
            where: {
              practitionerId: chosenPractitionerId!,
              scheduledAt,
              status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
            },
          });
          if (conflict) throw new Error('SLOT_TAKEN_IN_TX');

          const appointment = await tx.appointment.create({
            data: {
              patientId: patient.id,
              practitionerId: chosenPractitionerId!,
              scheduledAt,
              service: d.service,
              visitType: d.visitType,
              source: 'online',
              price,
            },
          });
          return { patient, appointment };
        });

        const confirmationNumber = `RES-${new Date().getFullYear()}-${result.appointment.id.slice(0, 4).toUpperCase()}`;

        // Email de confirmation au patient — non-bloquant. Si le patient n'a
        // pas fourni d'email, ou si l'envoi Resend échoue, la réponse HTTP
        // reste 201 : le RDV est bien pris, l'email est un bonus UX.
        if (result.patient.email) {
          const lang = ['fr', 'en', 'ar'].includes(d.preferredLanguage)
            ? d.preferredLanguage
            : 'fr';
          // Cairo UTC+2 pour l'affichage
          const cairoDate = new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000);
          const locale = lang === 'ar' ? 'ar-EG' : lang === 'en' ? 'en-GB' : 'fr-FR';
          const appointmentDate = cairoDate.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC', // cairoDate a déjà l'offset appliqué
          });
          const appointmentTime = `${String(cairoDate.getUTCHours()).padStart(2, '0')}:${String(cairoDate.getUTCMinutes()).padStart(2, '0')}`;
          const serviceName = SERVICE_LABEL_BY_LANG[lang]?.[d.service] ?? d.service;

          const rendered = renderTemplate('booking_created', {
            language: lang,
            patientFirstName: d.firstName,
            appointmentDate,
            appointmentTime,
            serviceName,
            confirmationNumber,
            centerPhone: env.CENTER_PHONE,
            centerWhatsapp: env.CENTER_WHATSAPP,
          });
          sendEmail({
            to: result.patient.email,
            subject: rendered.subject,
            text: rendered.text,
            html: rendered.html,
          }).catch((err) =>
            app.log.error(
              { err, to: maskEmail(result.patient.email) },
              'booking confirmation email failed',
            ),
          );
        }

        return reply.status(201).send({
          confirmationNumber,
          appointmentId: result.appointment.id,
          patientId: result.patient.id,
        });
      } catch (err) {
        if ((err as Error).message === 'SLOT_TAKEN_IN_TX') {
          return reply.status(409).send({ error: 'SlotTaken' });
        }
        throw err;
      }
    },
  );
}
