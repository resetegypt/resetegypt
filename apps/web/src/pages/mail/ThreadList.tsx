import { useTranslation } from 'react-i18next';
import { Badge, Input } from '@reset/ui';
import { Star, Archive, Inbox } from 'lucide-react';
import type { MailThread } from './types';

interface Props {
  threads: MailThread[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
  filter: 'inbox' | 'archived' | 'starred';
  onFilterChange: (f: 'inbox' | 'archived' | 'starred') => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelect,
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: Props) {
  const { t, i18n } = useTranslation();

  const FILTERS: Array<{ key: 'inbox' | 'archived' | 'starred'; label: string; Icon: typeof Inbox }> = [
    { key: 'inbox', label: t('mail.title'), Icon: Inbox },
    { key: 'starred', label: t('mail.showStarred'), Icon: Star },
    { key: 'archived', label: t('mail.showArchived'), Icon: Archive },
  ];

  return (
    <div>
      <div className="p-3 border-b border-border space-y-2 bg-surface sticky top-0 z-10">
        <Input
          placeholder={t('mail.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary/50 text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              <f.Icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {threads.length === 0 && (
        <p className="p-6 text-sm text-text-secondary text-center">{t('mail.empty')}</p>
      )}

      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelect(thread.id)}
          className={`w-full text-start p-3 border-b border-border hover:bg-bg-secondary transition-colors ${
            selectedThreadId === thread.id ? 'bg-info-light' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {thread.isStarred && <Star className="w-3 h-3 text-warning shrink-0" fill="currentColor" />}
            <strong className={`text-sm flex-1 truncate ${thread.unreadCount > 0 ? 'text-text' : 'text-text-secondary'}`}>
              {thread.patientName ?? thread.lastFrom ?? thread.participants[0] ?? '—'}
            </strong>
            {thread.unreadCount > 0 && <Badge variant="danger">{thread.unreadCount}</Badge>}
          </div>
          <div className={`text-xs truncate ${thread.unreadCount > 0 ? 'font-semibold text-text' : 'text-text-secondary'}`}>
            {thread.subject || '(sans objet)'}
          </div>
          <p className="text-xs text-text-tertiary truncate mt-0.5">{thread.snippet}</p>
          <p className="text-[10px] text-text-tertiary mt-1" data-numeric>
            {new Date(thread.lastEmailAt).toLocaleString(i18n.language)}
          </p>
        </button>
      ))}
    </div>
  );
}
