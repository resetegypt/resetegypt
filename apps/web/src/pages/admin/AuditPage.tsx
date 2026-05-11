import { useQuery } from '@tanstack/react-query';
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
  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: () => apiGet<{ logs: AuditLog[] }>('/audit-logs?limit=200'),
  });

  return (
    <>
      <PageHeader title="Journal d'audit" subtitle="200 derniers événements" />
      <div className="p-7 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>📜 Événements récents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Utilisateur</th>
                  <th className="text-left px-4 py-2">Action</th>
                  <th className="text-left px-4 py-2">IP</th>
                  <th className="text-left px-4 py-2">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-xs text-text-tertiary font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {log.user?.email ?? <span className="italic">anonyme</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={badgeVariant(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-text-tertiary">
                      {log.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary max-w-md truncate">
                      {Object.keys(log.details ?? {}).length > 0
                        ? JSON.stringify(log.details)
                        : log.resource ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
