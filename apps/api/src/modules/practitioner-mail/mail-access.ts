import type { JWTPayload } from '../../plugins/auth.js';

export interface MailboxOwnerRef {
  userId: string;
}

/**
 * Un utilisateur peut accéder à une mailbox s'il en est le propriétaire OU s'il
 * est ADMIN. La secrétaire et les autres praticiens n'ont jamais accès — la
 * confidentialité de la correspondance médicale en dépend.
 */
export function canAccessMailbox(user: JWTPayload, mailbox: MailboxOwnerRef): boolean {
  if (user.role === 'ADMIN') return true;
  return user.sub === mailbox.userId;
}
