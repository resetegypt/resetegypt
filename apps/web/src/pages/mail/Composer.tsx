import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@reset/ui';
import { X, Paperclip } from 'lucide-react';
import { apiPost } from '../../lib/api';

type ComposerState =
  | { mode: 'new' }
  | { mode: 'reply'; threadId: string; to: string[]; subject: string };

interface Props {
  state: ComposerState;
  onClose: () => void;
}

interface PendingAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:<mime>;base64,<data>" → on garde la partie après la virgule
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function Composer({ state, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [to, setTo] = useState(state.mode === 'reply' ? state.to.join(', ') : '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(state.mode === 'reply' ? state.subject : '');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sendMut = useMutation({
    mutationFn: () =>
      apiPost('/practitioner-mail/send', {
        threadId: state.mode === 'reply' ? state.threadId : undefined,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        cc: cc.split(',').map((s) => s.trim()).filter(Boolean),
        subject,
        bodyText: body,
        attachments,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mail-threads'] });
      if (state.mode === 'reply') {
        qc.invalidateQueries({ queryKey: ['mail-thread', state.threadId] });
      }
      onClose();
    },
    onError: () => setError(t('mail.sendError')),
  });

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      next.push({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        contentBase64: await fileToBase64(file),
      });
    }
    setAttachments((prev) => [...prev, ...next]);
  };

  const canSend = to.trim().length > 0 && subject.trim().length > 0 && !sendMut.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-text/30 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-2xl bg-surface sm:rounded-2xl shadow-2xl border border-border flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <strong className="text-sm">
            {state.mode === 'reply' ? t('mail.reply') : t('mail.compose')}
          </strong>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-secondary" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto">
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.to')}</span>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@exemple.com" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.cc')}</span>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="email@exemple.com" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.subject')}</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('mail.newSubjectPlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.body')}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary resize-y"
            />
          </label>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-bg-secondary/50 text-xs"
                >
                  <Paperclip className="w-3 h-3 text-text-tertiary" />
                  <span className="truncate max-w-[140px]">{a.filename}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-text-tertiary hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-bg-secondary cursor-pointer transition-colors">
            <Paperclip className="w-3.5 h-3.5" />
            {t('mail.addAttachment')}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </label>
          <div className="flex-1" />
          <Button onClick={() => sendMut.mutate()} disabled={!canSend}>
            {sendMut.isPending ? t('mail.sending') : t('mail.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}
