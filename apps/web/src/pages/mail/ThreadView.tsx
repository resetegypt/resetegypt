import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, Button } from '@reset/ui';
import { ArrowLeft, Archive, Star, Reply, Paperclip, Download } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import type { ThreadDetailResponse, MailAttachment } from './types';

interface Props {
  threadId: string;
  onBack: () => void;
  onReply: (to: string[], subject: string) => void;
}

export function ThreadView({ threadId, onBack, onReply }: Props) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['mail-thread', threadId],
    queryFn: () => apiGet<ThreadDetailResponse>(`/practitioner-mail/threads/${threadId}`),
  });

  // Marquer le thread lu à l'ouverture.
  useEffect(() => {
    if (data && data.thread.unreadCount > 0) {
      apiPost(`/practitioner-mail/threads/${threadId}/read`, {}).then(() => {
        qc.invalidateQueries({ queryKey: ['mail-threads'] });
        qc.invalidateQueries({ queryKey: ['mail-unread'] });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.thread.id]);

  const archiveMut = useMutation({
    mutationFn: () => apiPost(`/practitioner-mail/threads/${threadId}/archive`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mail-threads'] });
      qc.invalidateQueries({ queryKey: ['mail-thread', threadId] });
    },
  });

  const starMut = useMutation({
    mutationFn: () => apiPost(`/practitioner-mail/threads/${threadId}/star`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mail-threads'] });
      qc.invalidateQueries({ queryKey: ['mail-thread', threadId] });
    },
  });

  if (!data) {
    return <div className="p-6 text-sm text-text-secondary">…</div>;
  }

  const { thread, messages } = data;
  const lastInbound = [...messages].reverse().find((m) => m.direction === 'INBOUND');
  const replyTo = lastInbound ? [lastInbound.fromAddress] : thread.participants;
  const replySubject = thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`;

  return (
    <div className="flex flex-col h-full">
      {/* Barre d'actions */}
      <div className="bg-surface border-b border-border p-3 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={onBack} className="lg:hidden p-1.5 rounded hover:bg-bg-secondary" aria-label={t('mail.backToList')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <strong className="text-sm flex-1 truncate">{thread.subject || '(sans objet)'}</strong>
        <button
          onClick={() => starMut.mutate()}
          className={`p-1.5 rounded hover:bg-bg-secondary ${thread.isStarred ? 'text-warning' : 'text-text-tertiary'}`}
          aria-label={t('mail.star')}
        >
          <Star className="w-4 h-4" fill={thread.isStarred ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => archiveMut.mutate()}
          className="p-1.5 rounded hover:bg-bg-secondary text-text-tertiary"
          aria-label={t('mail.archive')}
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>

      {/* Messages empilés */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-text-secondary text-center mt-12">{t('mail.noThreadMessages')}</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{(m.fromName ?? m.fromAddress).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {m.fromName ?? m.fromAddress}
                  {m.direction === 'OUTBOUND' && (
                    <span className="ms-2 text-[10px] font-normal text-text-tertiary uppercase">
                      {t('mail.send')}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-tertiary truncate" data-numeric>
                  {m.fromAddress} · {new Date(m.sentAt).toLocaleString(i18n.language)}
                </div>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap text-text leading-relaxed">
              {m.bodyText ?? (m.bodyHtml ? m.bodyHtml.replace(/<[^>]+>/g, ' ') : '')}
            </div>
            {m.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.attachments.map((a) => (
                  <AttachmentChip key={a.id} attachment={a} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton répondre */}
      <div className="border-t border-border bg-surface p-3">
        <Button className="w-full" onClick={() => onReply(replyTo, replySubject)}>
          <Reply className="w-4 h-4 me-2" />
          {t('mail.reply')}
        </Button>
      </div>
    </div>
  );
}

function AttachmentChip({ attachment }: { attachment: MailAttachment }) {
  const { t } = useTranslation();
  const download = async () => {
    const { url } = await apiGet<{ url: string }>(`/practitioner-mail/attachments/${attachment.id}`);
    window.open(url, '_blank', 'noopener');
  };
  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-bg-secondary/50 hover:bg-bg-secondary text-xs transition-colors"
      title={t('mail.download')}
    >
      <Paperclip className="w-3 h-3 text-text-tertiary" />
      <span className="truncate max-w-[160px]">{attachment.filename}</span>
      <Download className="w-3 h-3 text-text-tertiary" />
    </button>
  );
}
