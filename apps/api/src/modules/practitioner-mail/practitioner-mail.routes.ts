import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { canAccessMailbox } from './mail-access.js';

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
}
