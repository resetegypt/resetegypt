import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@reset/ui';
import { apiGet } from '../../lib/api';
import type { ThreadDetailResponse } from './types';

interface Props {
  threadId: string;
}

export function MailContextPanel({ threadId }: Props) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['mail-thread', threadId],
    queryFn: () => apiGet<ThreadDetailResponse>(`/practitioner-mail/threads/${threadId}`),
  });

  if (!data) return null;
  const { thread } = data;

  return (
    <div className="p-4 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('mail.subject')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="font-semibold text-text">{thread.subject || '(sans objet)'}</p>
          <div className="space-y-1">
            {thread.participants.map((p) => (
              <p key={p} className="text-text-secondary" data-numeric>
                {p}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {thread.patientId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('mail.patientLinked')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold">{thread.patientName}</p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`/patients/${thread.patientId}`}>{t('mail.viewPatientFile')}</a>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`/appointments/new?patientId=${thread.patientId}`}>
                {t('mail.createAppointment')}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
