import type { FastifyInstance } from 'fastify';
import { env } from '../../env.js';
import { secretMatches } from './webhook-auth.js';
import { inboundEmailSchema, type InboundEmailPayload } from './inbound-schema.js';
import { extractThreadingRefs } from './threading.js';
import { buildSnippet } from './mail-snippet.js';
import { uploadAttachment, attachmentKey } from '../../lib/mail-storage.js';

const THIRTY_MB = 30 * 1024 * 1024;

export async function inboundRoutes(app: FastifyInstance): Promise<void> {
  // Route NON authentifiée par JWT : machine-à-machine, protégée par secret partagé.
  app.post('/inbound/email', { bodyLimit: THIRTY_MB }, async (req, reply) => {
    // 1. Fail-closed : si le secret n'est pas configuré, on rejette tout.
    if (!env.INBOUND_EMAIL_SECRET) {
      return reply.status(503).send({ error: 'WebhookNotConfigured' });
    }
    const provided = req.headers['x-webhook-secret'];
    if (typeof provided !== 'string' || !secretMatches(provided, env.INBOUND_EMAIL_SECRET)) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // 2. Valider le payload.
    const parsed = inboundEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    }
    const d: InboundEmailPayload = parsed.data;

    // 3. Trouver la mailbox destinataire.
    const mailbox = await app.prisma.mailbox.findUnique({
      where: { address: d.to.toLowerCase() },
    });
    if (!mailbox || !mailbox.isActive) {
      app.log.warn({ to: d.to }, 'inbound email pour une mailbox inconnue/inactive');
      return reply.status(404).send({ error: 'MailboxNotFound' });
    }

    // 4. Idempotence : si ce messageId existe déjà, no-op.
    const existing = await app.prisma.emailMessage.findUnique({
      where: { messageId: d.messageId },
    });
    if (existing) {
      return reply.status(200).send({ ok: true, deduplicated: true });
    }

    // 5. Threading : rattacher à un thread existant ou en créer un.
    const refs = extractThreadingRefs(d.inReplyTo, d.references);
    let threadId: string | null = null;
    if (refs.length > 0) {
      const refMsg = await app.prisma.emailMessage.findFirst({
        where: { mailboxId: mailbox.id, messageId: { in: refs } },
        select: { threadId: true },
      });
      if (refMsg) threadId = refMsg.threadId;
    }

    // 6. Liaison patient : si l'expéditeur correspond à un patient connu.
    const patient = await app.prisma.patient.findFirst({
      where: { email: { equals: d.from, mode: 'insensitive' } },
      select: { id: true },
    });

    const now = new Date();
    const snippet = buildSnippet(d.bodyText, d.bodyHtml);

    if (!threadId) {
      const thread = await app.prisma.emailThread.create({
        data: {
          mailboxId: mailbox.id,
          subject: d.subject,
          participants: [d.from.toLowerCase()],
          patientId: patient?.id ?? null,
          lastEmailAt: now,
          unreadCount: 1,
        },
      });
      threadId = thread.id;
    } else {
      const thread = await app.prisma.emailThread.findUnique({ where: { id: threadId } });
      const participants = new Set(thread?.participants ?? []);
      participants.add(d.from.toLowerCase());
      await app.prisma.emailThread.update({
        where: { id: threadId },
        data: {
          lastEmailAt: now,
          unreadCount: { increment: 1 },
          participants: [...participants],
          isArchived: false, // un nouvel email "désarchive" le thread
          ...(patient && !thread?.patientId ? { patientId: patient.id } : {}),
        },
      });
    }

    // 7. Persister l'email.
    const message = await app.prisma.emailMessage.create({
      data: {
        mailboxId: mailbox.id,
        threadId,
        direction: 'INBOUND',
        messageId: d.messageId,
        inReplyTo: d.inReplyTo ?? null,
        references: d.references,
        fromAddress: d.from.toLowerCase(),
        fromName: d.fromName ?? null,
        toAddresses: [mailbox.address],
        ccAddresses: [],
        subject: d.subject,
        bodyText: d.bodyText ?? null,
        bodyHtml: d.bodyHtml ?? null,
        snippet,
        status: 'RECEIVED',
        isRead: false,
        sentAt: now,
      },
    });

    // 8. Pièces jointes → Supabase Storage + lignes EmailAttachment.
    for (const att of d.attachments) {
      const key = attachmentKey(mailbox.id, message.id, att.filename);
      try {
        await uploadAttachment(key, Buffer.from(att.contentBase64, 'base64'), att.contentType);
        await app.prisma.emailAttachment.create({
          data: {
            emailId: message.id,
            filename: att.filename,
            contentType: att.contentType,
            sizeBytes: att.sizeBytes,
            storageKey: key,
          },
        });
      } catch (err) {
        // Une PJ qui échoue ne doit pas faire perdre l'email entier.
        app.log.error({ err, filename: att.filename }, 'échec stockage pièce jointe inbound');
      }
    }

    return reply.status(201).send({ ok: true, threadId, messageId: message.id });
  });
}
