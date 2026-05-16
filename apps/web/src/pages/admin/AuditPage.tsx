import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user: { email: string; role: string } | null;
}

export function AuditPage() {
  const { t, i18n } = useTranslation();
  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: () => apiGet<{ logs: AuditLog[] }>('/audit-logs?limit=200'),
  });

  return (
    <>
      <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />
      <div className="p-4 sm:p-7 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>📜 {t('audit.recentEvents')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-start px-4 py-2">{t('audit.columns.date')}</th>
                  <th className="text-start px-4 py-2">{t('audit.columns.user')}</th>
                  <th className="text-start px-4 py-2">{t('audit.columns.action')}</th>
                  <th className="text-start px-4 py-2">{t('audit.columns.ip')}</th>
                  <th className="text-start px-4 py-2">{t('audit.columns.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-xs text-text-tertiary font-mono" data-numeric>
                      {new Date(log.createdAt).toLocaleString(i18n.language)}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {log.user?.email ?? <span className="italic">{t('common.anonymous')}</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={badgeVariant(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-text-tertiary" data-numeric>
                      {log.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary max-w-md truncate">
                      {Object.keys(log.details ?? {}).length > 0
                        ? JSON.stringify(log.details)
                        : (log.resource ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function badgeVariant(action: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  if (action.endsWith('_failed')) return 'danger';
  if (action.includes('logout')) return 'neutral';
  if (action.includes('login_success')) return 'success';
  if (action.includes('reset') || action.includes('unlock')) return 'warning';
  return 'info';
}
