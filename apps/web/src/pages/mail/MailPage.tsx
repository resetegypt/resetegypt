import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import type { ThreadsResponse } from './types';
import { ThreadList } from './ThreadList';
import { ThreadView } from './ThreadView';
import { Composer } from './Composer';
import { MailContextPanel } from './MailContextPanel';

type ComposerState =
  | { mode: 'closed' }
  | { mode: 'new' }
  | { mode: 'reply'; threadId: string; to: string[]; subject: string };

export function MailPage() {
  const { t } = useTranslation();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'inbox' | 'archived' | 'starred'>('inbox');
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState<ComposerState>({ mode: 'closed' });

  const params = new URLSearchParams();
  if (filter === 'archived') params.set('archived', 'true');
  if (filter === 'starred') params.set('starred', 'true');
  if (search.trim()) params.set('q', search.trim());

  const { data } = useQuery({
    queryKey: ['mail-threads', filter, search],
    queryFn: () => apiGet<ThreadsResponse>(`/practitioner-mail/threads?${params.toString()}`),
    refetchInterval: 30_000,
  });

  const threads = data?.threads ?? [];

  return (
    <>
      <PageHeader
        title={t('mail.title')}
        subtitle={data?.mailbox.address ?? t('mail.subtitle')}
        actions={
          <Button onClick={() => setComposer({ mode: 'new' })}>{t('mail.compose')}</Button>
        }
      />
      {/* Desktop : 3 colonnes ; mobile : une colonne à la fois */}
      <div className="lg:grid lg:grid-cols-[320px_1fr_280px] h-[calc(100vh-89px)]">
        {/* Colonne 1 — liste : masquée sur mobile quand un thread est ouvert */}
        <div className={`${selectedThreadId ? 'hidden lg:block' : 'block'} border-e border-border overflow-y-auto`}>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Colonne 2 — thread ouvert */}
        <div className={`${selectedThreadId ? 'block' : 'hidden lg:block'} overflow-y-auto bg-bg-secondary/40`}>
          {selectedThreadId ? (
            <ThreadView
              threadId={selectedThreadId}
              onBack={() => setSelectedThreadId(null)}
              onReply={(to, subject) =>
                setComposer({ mode: 'reply', threadId: selectedThreadId, to, subject })
              }
            />
          ) : (
            <div className="hidden lg:flex h-full items-center justify-center text-text-secondary text-sm">
              {t('mail.selectThread')}
            </div>
          )}
        </div>

        {/* Colonne 3 — contexte patient (desktop uniquement) */}
        <div className="hidden lg:block border-s border-border overflow-y-auto bg-surface">
          {selectedThreadId && <MailContextPanel threadId={selectedThreadId} />}
        </div>
      </div>

      {composer.mode !== 'closed' && (
        <Composer
          state={composer}
          onClose={() => setComposer({ mode: 'closed' })}
        />
      )}
    </>
  );
}
