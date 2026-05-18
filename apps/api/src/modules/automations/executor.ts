// ============================================================================
// executor.ts — moteur d'exécution des workflows automation.
//
// Cron Vercel (toutes les 15 min) appelle /internal/cron/automations qui
// invoque executeAutomations(). Pour chaque workflow actif :
//   1. before_appointment / after_appointment : scanne les RDV dont
//      scheduledAt + offsetHours tombe dans la fenêtre du tick.
//   2. patient_birthday : scanne les patients dont l'anniversaire est
//      aujourd'hui à l'offsetHours configuré.
//   3. inactive_60_days : patients sans RDV depuis 60+ jours, déclenche
//      une seule fois par patient.
//
// Idempotency : table AutomationRun (unique sur workflowId + contextKey +
// stepIndex). Si un run existe déjà pour ce trio, on skip.
//
// Channel routing :
//   - EMAIL : envoi réel via lib/email.ts (Resend si configuré, sinon mock).
//   - WHATSAPP / SMS : actuellement marqué SKIPPED tant que la pile WhatsApp
//     Business / Twilio n'est pas câblée. Le record AutomationRun reste créé
//     pour audit + reprise éventuelle.
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { sendEmail } from '../../lib/email.js';
import { renderTemplate } from './templates.js';

interface WorkflowStep {
  offsetHours?: number;
  offsetDays?: number;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS' | 'INSTAGRAM' | 'MESSENGER';
  template: string;
}

interface ExecuteResult {
  workflowsScanned: number;
  candidatesFound: number;
  runsCreated: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const TICK_WINDOW_MIN = 15; // doit matcher le cron schedule

function stepOffsetMs(step: WorkflowStep): number {
  if (step.offsetHours !== undefined) return step.offsetHours * 60 * 60 * 1000;
  if (step.offsetDays !== undefined) return step.offsetDays * 24 * 60 * 60 * 1000;
  return 0;
}

function inTickWindow(targetTime: Date, now: Date, windowMin = TICK_WINDOW_MIN): boolean {
  const diffMs = targetTime.getTime() - now.getTime();
  // Cible doit être passée mais pas plus loin que la fenêtre de tick
  // (i.e. on est juste après le moment d'envoi prévu)
  return diffMs <= 0 && Math.abs(diffMs) <= windowMin * 60 * 1000;
}

function yyyymmdd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export async function executeAutomations(app: FastifyInstance): Promise<ExecuteResult> {
  const now = new Date();
  const result: ExecuteResult = {
    workflowsScanned: 0,
    candidatesFound: 0,
    runsCreated: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const workflows = await app.prisma.automationWorkflow.findMany({ where: { isActive: true } });
  result.workflowsScanned = workflows.length;

  for (const wf of workflows) {
    const steps = (wf.steps as unknown as WorkflowStep[]) ?? [];

    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      const step = steps[stepIndex]!;
      let candidates: Array<{ contextKey: string; toAddress: string | null; vars: Record<string, string> }> = [];

      try {
        switch (wf.trigger) {
          case 'before_appointment':
          case 'after_appointment': {
            // Fenêtre cible = now - offsetMs (offset négatif = avant RDV)
            const offsetMs = stepOffsetMs(step);
            const targetMin = new Date(now.getTime() - offsetMs - TICK_WINDOW_MIN * 60 * 1000);
            const targetMax = new Date(now.getTime() - offsetMs);
            const appts = await app.prisma.appointment.findMany({
              where: {
                scheduledAt: { gte: targetMin, lte: targetMax },
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
              },
              include: { patient: true, practitioner: true },
            });
            candidates = appts
              .filter((a) => a.patient.email || a.patient.whatsapp || a.patient.phone)
              .map((a) => ({
                contextKey: `appt-${a.id}`,
                toAddress: pickAddress(step.channel, a.patient),
                vars: {
                  patientFirstName: a.patient.firstName,
                  patientLastName: a.patient.lastName,
                  practitionerName: `${a.practitioner.firstName} ${a.practitioner.lastName}`,
                  appointmentDate: a.scheduledAt.toLocaleDateString('fr-FR'),
                  appointmentTime: a.scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                  language: a.patient.preferredLanguage,
                },
              }));
            break;
          }

          case 'patient_birthday': {
            // Birthday workflow tire 1×/an à offsetHours (ex: 9h le matin)
            const targetHour = step.offsetHours ?? 9;
            if (now.getHours() !== targetHour || now.getMinutes() >= TICK_WINDOW_MIN) break;
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            // Patients dont l'anniversaire (mois+jour) = aujourd'hui
            const rows = await app.prisma.$queryRaw<Array<{
              id: string; firstName: string; lastName: string; email: string | null;
              whatsapp: string | null; phone: string; preferredLanguage: string;
            }>>`
              SELECT id, "firstName", "lastName", email, whatsapp, phone, "preferredLanguage"
              FROM "Patient"
              WHERE "dateOfBirth" IS NOT NULL
                AND TO_CHAR("dateOfBirth", 'MM-DD') = ${`${mm}-${dd}`}
                AND status = 'ACTIVE'
            `;
            candidates = rows.map((p) => ({
              contextKey: `patient-${p.id}-${yyyymmdd(now)}`,
              toAddress: pickAddress(step.channel, p),
              vars: { patientFirstName: p.firstName, patientLastName: p.lastName, language: p.preferredLanguage },
            }));
            break;
          }

          case 'inactive_60_days': {
            // Trigger 1×/jour à 10h
            if (now.getHours() !== 10 || now.getMinutes() >= TICK_WINDOW_MIN) break;
            const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            const rows = await app.prisma.$queryRaw<Array<{
              id: string; firstName: string; lastName: string; email: string | null;
              whatsapp: string | null; phone: string; preferredLanguage: string;
            }>>`
              SELECT p.id, p."firstName", p."lastName", p.email, p.whatsapp, p.phone, p."preferredLanguage"
              FROM "Patient" p
              WHERE p.status = 'ACTIVE'
                AND NOT EXISTS (
                  SELECT 1 FROM "Appointment" a
                  WHERE a."patientId" = p.id AND a."scheduledAt" >= ${cutoff}
                )
            `;
            candidates = rows.map((p) => ({
              contextKey: `patient-${p.id}-${yyyymmdd(now)}-reactivation`,
              toAddress: pickAddress(step.channel, p),
              vars: { patientFirstName: p.firstName, patientLastName: p.lastName, language: p.preferredLanguage },
            }));
            break;
          }

          // long_term_followup et no_show seront ajoutés dans une itération suivante
          default:
            continue;
        }
      } catch (err) {
        result.errors.push(`workflow=${wf.name} step=${stepIndex}: ${(err as Error).message}`);
        continue;
      }

      result.candidatesFound += candidates.length;

      // Pour chaque candidat : crée un AutomationRun PENDING (transactionnel,
      // skip si déjà existant), puis dispatch
      for (const candidate of candidates) {
        if (!candidate.toAddress) {
          // Pas d'adresse pour ce channel → record SKIPPED quand même pour audit
          await safeCreateRun(app, wf.id, candidate.contextKey, stepIndex, step, candidate.toAddress, 'SKIPPED', null, 'no_address_for_channel');
          result.skipped++;
          continue;
        }

        const created = await safeCreateRun(app, wf.id, candidate.contextKey, stepIndex, step, candidate.toAddress, 'PENDING', null, null);
        if (!created) continue; // déjà fait
        result.runsCreated++;

        // Dispatch
        if (step.channel === 'EMAIL') {
          const rendered = renderTemplate(step.template, candidate.vars);
          try {
            const sendResult = await sendEmail({
              to: candidate.toAddress,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });
            if (sendResult.sent && !sendResult.mocked) {
              await app.prisma.automationRun.update({
                where: { id: created.id },
                data: { status: 'SENT', messageId: sendResult.messageId ?? null },
              });
              result.sent++;
            } else if (sendResult.mocked) {
              await app.prisma.automationRun.update({
                where: { id: created.id },
                data: { status: 'SKIPPED', error: 'email_mock_mode' },
              });
              result.skipped++;
            } else {
              await app.prisma.automationRun.update({
                where: { id: created.id },
                data: { status: 'FAILED', error: sendResult.error ?? 'unknown_send_error' },
              });
              result.failed++;
            }
          } catch (err) {
            await app.prisma.automationRun.update({
              where: { id: created.id },
              data: { status: 'FAILED', error: (err as Error).message.slice(0, 500) },
            });
            result.failed++;
          }
        } else {
          // WHATSAPP / SMS / autres : pas encore câblés → SKIPPED + audit
          await app.prisma.automationRun.update({
            where: { id: created.id },
            data: { status: 'SKIPPED', error: `channel_${step.channel.toLowerCase()}_not_configured` },
          });
          result.skipped++;
        }
      }
    }
  }

  return result;
}

function pickAddress(
  channel: WorkflowStep['channel'],
  patient: { email: string | null; whatsapp: string | null; phone: string },
): string | null {
  switch (channel) {
    case 'EMAIL':
      return patient.email;
    case 'WHATSAPP':
      return patient.whatsapp ?? patient.phone;
    case 'SMS':
      return patient.phone;
    default:
      return null;
  }
}

async function safeCreateRun(
  app: FastifyInstance,
  workflowId: string,
  contextKey: string,
  stepIndex: number,
  step: WorkflowStep,
  toAddress: string | null,
  status: string,
  messageId: string | null,
  error: string | null,
): Promise<{ id: string } | null> {
  try {
    const created = await app.prisma.automationRun.create({
      data: {
        workflowId,
        contextKey,
        stepIndex,
        channel: step.channel,
        template: step.template,
        toAddress,
        status,
        messageId,
        error,
      },
      select: { id: true },
    });
    return created;
  } catch (err) {
    // P2002 = unique violation → ce step a déjà été déclenché pour ce contexte
    if ((err as { code?: string }).code === 'P2002') return null;
    throw err;
  }
}
