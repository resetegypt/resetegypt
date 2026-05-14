import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface UnreadResponse {
  unread: number;
}

/**
 * Détermine si l'utilisateur courant a accès au Courrier (a une mailbox, ou est
 * ADMIN), en sondant /practitioner-mail/unread-count. Renvoie aussi le compteur
 * non-lus pour le badge sidebar. 404 = pas de mailbox → pas d'accès.
 */
export function useMailboxAccess(): { hasAccess: boolean; unread: number } {
  const user = useAuthStore((s) => s.user);
  const { data, isError } = useQuery({
    queryKey: ['mail-unread'],
    queryFn: () => apiGet<UnreadResponse>('/practitioner-mail/unread-count'),
    refetchInterval: 30_000,
    enabled: !!user,
    retry: false,
  });
  return {
    hasAccess: !isError && data !== undefined,
    unread: data?.unread ?? 0,
  };
}
