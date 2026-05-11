import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const DEFAULT_WORKFLOWS = [
  {
    name: 'before_appointment',
    trigger: 'before_appointment',
    steps: [
      { offsetHours: -48, channel: 'WHATSAPP', template: 'reminder_j2' },
      { offsetHours: -24, channel: 'WHATSAPP', template: 'confirmation_j1' },
      { offsetHours: -2, channel: 'WHATSAPP', template: 'welcome_j0' },
    ],
  },
  {
    name: 'after_appointment',
    trigger: 'after_appointment',
    steps: [
      { offsetHours: 24, channel: 'WHATSAPP', template: 'thanks_j1' },
      { offsetHours: 72, channel: 'WHATSAPP', template: 'review_request' },
    ],
  },
  {
    name: 'long_term_followup',
    trigger: 'long_term_followup',
    steps: [
      { offsetDays: 7, channel: 'WHATSAPP', template: 'self_eval_j7' },
      { offsetDays: 30, channel: 'WHATSAPP', template: 'self_eval_j30' },
      { offsetDays: 90, channel: 'WHATSAPP', template: 'self_eval_j90' },
    ],
  },
  {
    name: 'no_show_recovery',
    trigger: 'no_show',
    steps: [
      { offsetHours: 1, channel: 'WHATSAPP', template: 'noshow_same_day' },
      { offsetDays: 2, channel: 'WHATSAPP', template: 'reschedule_offer' },
    ],
  },
  {
    name: 'reactivation',
    trigger: 'inactive_60_days',
    steps: [{ offsetDays: 0, channel: 'WHATSAPP', template: 'reactivation' }],
  },
  {
    name: 'birthday',
    trigger: 'patient_birthday',
    steps: [{ offsetHours: 9, channel: 'WHATSAPP', template: 'birthday' }],
  },
];

export async function automationsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  app.get('/automation-workflows', async () => {
    let workflows = await app.prisma.automationWorkflow.findMany({ orderBy: { name: 'asc' } });
    if (workflows.length === 0) {
      // Seed defaults on first call
      for (const w of DEFAULT_WORKFLOWS) {
        await app.prisma.automationWorkflow.create({
          data: { name: w.name, trigger: w.trigger, steps: w.steps as never },
        });
      }
      workflows = await app.prisma.automationWorkflow.findMany({ orderBy: { name: 'asc' } });
    }

    // Stats for last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const totalSent = await app.prisma.message.count({
      where: { isAuto: true, createdAt: { gte: since } },
    });
    const totalRead = await app.prisma.message.count({
      where: { isAuto: true, createdAt: { gte: since }, readAt: { not: null } },
    });

    return {
      workflows,
      stats: {
        monthlySent: totalSent,
        readRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0,
      },
    };
  });

  app.patch('/automation-workflows/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const schema = z.object({
      isActive: z.boolean().optional(),
      steps: z.array(z.any()).optional(),
      name: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });
    const updated = await app.prisma.automationWorkflow.update({
      where: { id },
      data: parsed.data as never,
    });
    return { workflow: updated };
  });
}
