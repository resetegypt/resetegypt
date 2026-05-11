import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';

const sendSchema = z.object({
  patientId: z.string().uuid().optional(),
  channel: z.enum(['WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'EMAIL', 'SMS']),
  toAddress: z.string().min(1),
  content: z.string().min(1),
  templateName: z.string().optional(),
});

export async function messagesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  app.get('/messages', async (req) => {
    const q = req.query as { channel?: string; unread?: string; patientId?: string };
    const where: Record<string, unknown> = {};
    if (q.channel) where.channel = q.channel;
    if (q.unread === 'true') where.readAt = null;
    if (q.patientId) where.patientId = q.patientId;

    const messages = await app.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 200,
    });
    return { messages };
  });

  app.get('/messages/conversations', async () => {
    // Group messages by patient or by fromAddress (for unknown contacts)
    const rows = await app.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const conversations = new Map<
      string,
      {
        key: string;
        patientId?: string;
        patientName?: string;
        externalAddress: string;
        channel: string;
        lastMessage: string;
        lastAt: string;
        unread: number;
      }
    >();

    for (const m of rows) {
      const key = m.patient ? `patient:${m.patient.id}` : `addr:${m.channel}:${m.fromAddress || m.toAddress}`;
      if (!conversations.has(key)) {
        conversations.set(key, {
          key,
          patientId: m.patient?.id,
          patientName: m.patient ? `${m.patient.firstName} ${m.patient.lastName}` : undefined,
          externalAddress: m.fromAddress || m.toAddress,
          channel: m.channel,
          lastMessage: m.content.slice(0, 120),
          lastAt: m.createdAt.toISOString(),
          unread: m.direction === 'INBOUND' && !m.readAt ? 1 : 0,
        });
      } else {
        const conv = conversations.get(key)!;
        if (m.direction === 'INBOUND' && !m.readAt) conv.unread++;
      }
    }

    return { conversations: Array.from(conversations.values()) };
  });

  app.post('/messages', async (req, reply) => {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });
    const d = parsed.data;

    // Mock send: in production, call WhatsApp Business / Twilio / Brevo
    app.log.info({ to: d.toAddress, channel: d.channel }, 'message send (mock)');

    const message = await app.prisma.message.create({
      data: {
        patientId: d.patientId,
        channel: d.channel,
        direction: 'OUTBOUND',
        fromAddress: 'reset-egypt',
        toAddress: d.toAddress,
        content: d.content,
        templateName: d.templateName,
        status: 'SENT',
        isAuto: false,
      },
    });
    await recordAudit(app.prisma, req, {
      userId: req.currentUser!.sub,
      action: 'message_sent',
      resource: `message:${message.id}`,
    });
    return reply.status(201).send({ message });
  });

  app.post('/messages/:id/read', async (req) => {
    const id = (req.params as { id: string }).id;
    await app.prisma.message.update({ where: { id }, data: { readAt: new Date() } });
    return { ok: true };
  });
}
