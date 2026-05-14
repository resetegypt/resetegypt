import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { canAccessMailbox } from './mail-access.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';
import { sendEmail } from '../../lib/email.js';
import { buildSnippet } from './mail-snippet.js';
import { uploadAttachment, attachmentKey } from '../../lib/mail-storage.js';

const sendAttachmentSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  contentBase64: z.string().min(1),
});

const sendSchema = z.object({
  mailboxId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).default([]),
  subject: z.string().min(1).max(500),
  bodyText: z.string().default(''),
  bodyHtml: z.string().optional(),
  attachments: z.array(sendAttachmentSchema).default([]),
});

const SEND_BODY_LIMIT = 30 * 1024 * 1024;

interface ResolvedMailbox {
  id: string;
  userId: string;
  address: string;
  displayName: string;
}

/**
 * Résout la mailbox sur laquelle le caller agit et vérifie l'accès.
 * - mailboxId fourni (query ou body) : autorisé si propriétaire OU ADMIN.
 * - sinon : la mailbox du caller (propriétaire).
 * Envoie la réponse d'erreur et retourne null si refus / introuvable.
 */
async function loadCallerMailbox(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
  mailboxId?: string,
): Promise<ResolvedMailbox | null> {
  const user = req.currentUser!;
  const mailbox = mailboxId
    ? await app.prisma.mailbox.findUnique({ where: { id: mailboxId } })
    : await app.prisma.mailbox.findUnique({ where: { userId: user.sub } });

  if (!mailbox || !mailbox.isActive) {
    reply.status(404).send({ error: 'MailboxNotFound' });
    return null;
  }
  if (!canAccessMailbox(user, mailbox)) {
    reply.status(403).send({ error: 'Forbidden' });
    return null;
  }
  return {
    id: mailbox.id,
    userId: mailbox.userId,
    address: mailbox.address,
    displayName: mailbox.displayName,
  };
}

export async function practitionerMailRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  // GET /practitioner-mail/threads — liste des threads de la mailbox du caller.
  app.get('/practitioner-mail/threads', async (req, reply) => {
    const q = req.query as { mailboxId?: string; archived?: string; starred?: string; q?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, q.mailboxId);
    if (!mailbox) return;

    const where: Record<string, unknown> = {
      mailboxId: mailbox.id,
      isArchived: q.archived === 'true',
    };
    if (q.starred === 'true') where.isStarred = true;
    if (q.q && q.q.trim()) {
      const term = q.q.trim();
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { participants: { has: term.toLowerCase() } },
      ];
    }

    const threads = await app.prisma.emailThread.findMany({
      where,
      orderBy: { lastEmailAt: 'desc' },
      take: 100,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        emails: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { snippet: true, fromAddress: true },
        },
      },
    });

    return {
      mailbox: { id: mailbox.id, address: mailbox.address, displayName: mailbox.displayName },
      threads: threads.map((t) => ({
        id: t.id,
        subject: t.subject,
        participants: t.participants,
        patientId: t.patientId,
        patientName: t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : null,
        lastEmailAt: t.lastEmailAt.toISOString(),
        unreadCount: t.unreadCount,
        isArchived: t.isArchived,
        isStarred: t.isStarred,
        snippet: t.emails[0]?.snippet ?? '',
        lastFrom: t.emails[0]?.fromAddress ?? '',
      })),
    };
  });

  // GET /practitioner-mail/threads/:id — un thread + tous ses emails.
  app.get('/practitioner-mail/threads/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const q = req.query as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, q.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        emails: {
          orderBy: { sentAt: 'asc' },
          include: {
            attachments: {
              select: { id: true, filename: true, contentType: true, sizeBytes: true },
            },
          },
        },
      },
    });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }

    return {
      thread: {
        id: thread.id,
        subject: thread.subject,
        participants: thread.participants,
        patientId: thread.patientId,
        patientName: thread.patient
          ? `${thread.patient.firstName} ${thread.patient.lastName}`
          : null,
        lastEmailAt: thread.lastEmailAt.toISOString(),
        unreadCount: thread.unreadCount,
        isArchived: thread.isArchived,
        isStarred: thread.isStarred,
        snippet: thread.emails[thread.emails.length - 1]?.snippet ?? '',
        lastFrom: thread.emails[thread.emails.length - 1]?.fromAddress ?? '',
      },
      messages: thread.emails.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        direction: m.direction,
        fromAddress: m.fromAddress,
        fromName: m.fromName,
        toAddresses: m.toAddresses,
        ccAddresses: m.ccAddresses,
        subject: m.subject,
        bodyText: m.bodyText,
        bodyHtml: m.bodyHtml,
        isRead: m.isRead,
        sentAt: m.sentAt.toISOString(),
        attachments: m.attachments,
      })),
    };
  });

  // POST /practitioner-mail/threads/:id/read — marque tout le thread comme lu.
  app.post('/practitioner-mail/threads/:id/read', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, body.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({ where: { id } });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }
    await app.prisma.emailMessage.updateMany({
      where: { threadId: id, isRead: false },
      data: { isRead: true },
    });
    await app.prisma.emailThread.update({ where: { id }, data: { unreadCount: 0 } });
    return { ok: true };
  });

  // POST /practitioner-mail/threads/:id/archive — toggle isArchived.
  app.post('/practitioner-mail/threads/:id/archive', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, body.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({ where: { id } });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }
    const updated = await app.prisma.emailThread.update({
      where: { id },
      data: { isArchived: !thread.isArchived },
    });
    return { ok: true, isArchived: updated.isArchived };
  });

  // POST /practitioner-mail/threads/:id/star — toggle isStarred.
  app.post('/practitioner-mail/threads/:id/star', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, body.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({ where: { id } });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }
    const updated = await app.prisma.emailThread.update({
      where: { id },
      data: { isStarred: !thread.isStarred },
    });
    return { ok: true, isStarred: updated.isStarred };
  });

  // POST /practitioner-mail/send — composer un nouvel email OU répondre.
  app.post(
    '/practitioner-mail/send',
    { bodyLimit: SEND_BODY_LIMIT },
    async (req, reply) => {
      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
      }
      const d = parsed.data;
      const mailbox = await loadCallerMailbox(app, req, reply, d.mailboxId);
      if (!mailbox) return;

      // Threading : si réponse, charger le thread et son dernier message.
      let inReplyTo: string | null = null;
      let references: string[] = [];
      if (d.threadId) {
        const replyThread = await app.prisma.emailThread.findUnique({
          where: { id: d.threadId },
          include: { emails: { orderBy: { sentAt: 'desc' }, take: 1 } },
        });
        if (!replyThread || replyThread.mailboxId !== mailbox.id) {
          return reply.status(404).send({ error: 'ThreadNotFound' });
        }
        const last = replyThread.emails[0];
        if (last) {
          inReplyTo = last.messageId;
          references = [...last.references, last.messageId];
        }
      }

      const now = new Date();
      const messageId = `<${randomUUID()}@reset-egypt.com>`;
      const html = d.bodyHtml ?? `<pre style="font-family:inherit;white-space:pre-wrap">${
        d.bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      }</pre>`;

      // Envoi via Resend.
      const headers: Record<string, string> = { 'Message-ID': messageId };
      if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
      if (references.length) headers['References'] = references.join(' ');

      const result = await sendEmail({
        from: `${mailbox.displayName} <${mailbox.address}>`,
        to: d.to.join(', '),
        cc: d.cc.length ? d.cc : undefined,
        replyTo: mailbox.address,
        subject: d.subject,
        html,
        text: d.bodyText || undefined,
        headers,
        attachments: d.attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.contentBase64, 'base64'),
          contentType: a.contentType,
        })),
      });

      // Créer le thread si nouveau.
      let threadId = d.threadId ?? null;
      if (!threadId) {
        const created = await app.prisma.emailThread.create({
          data: {
            mailboxId: mailbox.id,
            subject: d.subject,
            participants: [...d.to, ...d.cc].map((e) => e.toLowerCase()),
            lastEmailAt: now,
            unreadCount: 0,
          },
        });
        threadId = created.id;
      } else {
        await app.prisma.emailThread.update({
          where: { id: threadId },
          data: { lastEmailAt: now, isArchived: false },
        });
      }

      // Persister l'email sortant.
      const message = await app.prisma.emailMessage.create({
        data: {
          mailboxId: mailbox.id,
          threadId,
          direction: 'OUTBOUND',
          messageId,
          inReplyTo,
          references,
          fromAddress: mailbox.address,
          fromName: mailbox.displayName,
          toAddresses: d.to.map((e) => e.toLowerCase()),
          ccAddresses: d.cc.map((e) => e.toLowerCase()),
          subject: d.subject,
          bodyText: d.bodyText || null,
          bodyHtml: d.bodyHtml ?? null,
          snippet: buildSnippet(d.bodyText, d.bodyHtml),
          status: result.sent ? 'SENT' : 'FAILED',
          isRead: true,
          sentByUserId: req.currentUser!.sub,
          sentAt: now,
        },
      });

      // Pièces jointes → Supabase Storage.
      for (const att of d.attachments) {
        const key = attachmentKey(mailbox.id, message.id, att.filename);
        try {
          await uploadAttachment(key, Buffer.from(att.contentBase64, 'base64'), att.contentType);
          await app.prisma.emailAttachment.create({
            data: {
              emailId: message.id,
              filename: att.filename,
              contentType: att.contentType,
              sizeBytes: Buffer.from(att.contentBase64, 'base64').byteLength,
              storageKey: key,
            },
          });
        } catch (err) {
          app.log.error({ err, filename: att.filename }, 'échec stockage pièce jointe sortante');
        }
      }

      await recordAudit(app.prisma, req, {
        userId: req.currentUser!.sub,
        action: 'practitioner_mail_sent',
        resource: `email:${message.id}`,
        details: { mailboxId: mailbox.id, to: d.to, sent: result.sent, provider: result.provider },
      });

      if (!result.sent) {
        return reply.status(502).send({ error: 'SendFailed', message: result.error, messageId: message.id });
      }
      return reply.status(201).send({ ok: true, threadId, messageId: message.id });
    },
  );
}
