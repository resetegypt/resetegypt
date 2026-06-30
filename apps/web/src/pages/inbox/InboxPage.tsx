import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface Conversation {
  key: string;
  patientId?: string;
  patientName?: string;
  externalAddress: string;
  channel: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface Message {
  id: string;
  patientId: string | null;
  channel: string;
  direction: 'INBOUND' | 'OUTBOUND';
  fromAddress: string;
  toAddress: string;
  content: string;
  status: string;
  isAuto: boolean;
  createdAt: string;
  readAt: string | null;
}

const CHANNEL_ICON: Record<string, string> = {
  WHATSAPP: '💬',
  INSTAGRAM: '📷',
  MESSENGER: '💌',
  EMAIL: '✉️',
  SMS: '📱',
};

const CHANNEL_COLOR: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'neutral'> = {
  WHATSAPP: 'success',
  INSTAGRAM: 'danger',
  MESSENGER: 'info',
  EMAIL: 'warning',
  SMS: 'neutral',
};

export function InboxPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiGet<{ conversations: Conversation[] }>('/messages/conversations'),
  });

  const selected = conversationsData?.conversations.find((c) => c.key === selectedKey);
  const { data: msgsData } = useQuery({
    queryKey: ['messages', selectedKey],
    queryFn: () =>
      apiGet<{ messages: Message[] }>(
        selected?.patientId
          ? `/messages?patientId=${selected.patientId}`
          : `/messages?channel=${selected?.channel}`,
      ),
    enabled: !!selected,
  });

  const sendMut = useMutation({
    mutationFn: () =>
      apiPost('/messages', {
        patientId: selected?.patientId,
        channel: selected?.channel ?? 'WHATSAPP',
        toAddress: selected?.externalAddress ?? '',
        content: reply,
      }),
    onSuccess: () => {
      setReply('');
      qc.invalidateQueries({ queryKey: ['messages', selectedKey] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const QUICK_TEMPLATES = [
    t('inbox.templatesContent.address'),
    t('inbox.templatesContent.prices'),
    t('inbox.templatesContent.hours'),
  ];

  return (
    <>
      <PageHeader title={t('inbox.title')} subtitle={t('inbox.subtitle')} />
      <div className="lg:grid lg:grid-cols-[320px_1fr_280px] h-[calc(100vh-100px)]">
        <aside className={`${selectedKey ? 'hidden lg:block' : 'block'} border-e border-border bg-surface overflow-y-auto`}>
          <div className="p-3 border-b border-border">
            <Input placeholder={t('inbox.searchPlaceholder')} />
          </div>
          {conversationsData?.conversations.length === 0 && (
            <p className="p-6 text-sm text-text-secondary text-center">{t('inbox.empty')}</p>
          )}
          {conversationsData?.conversations.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedKey(c.key)}
              className={`w-full text-start p-3 border-b border-border hover:bg-bg-secondary ${
                selectedKey === c.key ? 'bg-info-light' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{CHANNEL_ICON[c.channel] ?? '📩'}</span>
                <strong className="text-sm flex-1 truncate">
                  {c.patientName ?? c.externalAddress}
                </strong>
                {c.unread > 0 && <Badge variant="danger">{c.unread}</Badge>}
              </div>
              <p className="text-xs text-text-secondary truncate">{c.lastMessage}</p>
              <p className="text-[10px] text-text-tertiary mt-1" data-numeric>
                {new Date(c.lastAt).toLocaleString(i18n.language)}
              </p>
            </button>
          ))}
        </aside>

        <section className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col bg-bg-secondary/40 overflow-hidden`}>
          {selected ? (
            <>
              <div className="bg-surface border-b border-border p-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedKey(null)}
                  className="lg:hidden p-1.5 -ml-1 rounded hover:bg-bg-secondary"
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <Avatar>
                  <AvatarFallback>
                    {(selected.patientName ?? selected.externalAddress).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <strong className="text-sm">{selected.patientName ?? selected.externalAddress}</strong>
                  <p className="text-xs text-text-secondary">
                    {CHANNEL_ICON[selected.channel]} {selected.channel} · {selected.externalAddress}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {msgsData?.messages
                  .slice()
                  .reverse()
                  .map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-lg px-3 py-2 text-sm ${
                          m.direction === 'OUTBOUND'
                            ? 'bg-info text-white'
                            : 'bg-surface border border-border'
                        }`}
                      >
                        {m.isAuto && (
                          <p className="text-[9px] opacity-70 uppercase mb-1">{t('inbox.auto')}</p>
                        )}
                        <p>{m.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${m.direction === 'OUTBOUND' ? 'text-white/70' : 'text-text-tertiary'}`}
                          data-numeric
                        >
                          {new Date(m.createdAt).toLocaleTimeString(i18n.language)}
                        </p>
                      </div>
                    </div>
                  ))}
                {!msgsData?.messages.length && (
                  <p className="text-sm text-text-secondary text-center mt-12">
                    {t('inbox.noMessages')}
                  </p>
                )}
              </div>
              <div className="border-t border-border bg-surface p-3 space-y-2">
                <div className="flex gap-1 flex-wrap">
                  {QUICK_TEMPLATES.map((tpl, i) => (
                    <Chip key={i} onClick={() => setReply(tpl)}>
                      {t('inbox.templates')} {i + 1}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('inbox.replyPlaceholder')}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && reply.trim()) sendMut.mutate();
                    }}
                  />
                  <Button onClick={() => sendMut.mutate()} disabled={!reply.trim() || sendMut.isPending}>
                    {t('inbox.send')}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              {t('inbox.selectConversation')}
            </div>
          )}
        </section>

        <aside className="hidden lg:block border-s border-border bg-surface overflow-y-auto p-4">
          {selected ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>👤 {t('inbox.contact')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p>
                    <strong>{selected.patientName ?? t('inbox.unknown')}</strong>
                  </p>
                  <p className="text-text-secondary" data-numeric>{selected.externalAddress}</p>
                  <Badge variant={CHANNEL_COLOR[selected.channel] ?? 'neutral'}>
                    {CHANNEL_ICON[selected.channel]} {selected.channel}
                  </Badge>
                </CardContent>
              </Card>
              {selected.patientId && (
                <div className="mt-3 space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/patients/${selected.patientId}`}>📋 {t('inbox.viewPatientFile')}</a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/appointments/new?patientId=${selected.patientId}`}>
                      ➕ {t('inbox.createAppointment')}
                    </a>
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}
