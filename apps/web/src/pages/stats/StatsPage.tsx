import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface GlobalStats {
  period: string;
  revenue: number;
  revenueChange: number;
  appointments: number;
  patientsActive: number;
  practitioners: Array<{ id: string; name: string; appointments: number }>;
  sources: Array<{ source: string; percentage: number; count: number }>;
  addictions: Array<{ service: string; count: number }>;
  revenueByDay: Array<{ day: string; total: number }>;
  paymentsCount: number;
}

const ADDICTION_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const { data } = useQuery({
    queryKey: ['stats', 'global', period],
    queryFn: () => apiGet<GlobalStats>(`/stats/global?period=${period}`),
  });

  if (!data) return <div className="p-7">{t('common.loading')}</div>;

  const maxDayRevenue = Math.max(1, ...data.revenueByDay.map((d) => d.total));
  const maxAddictionCount = Math.max(1, ...data.addictions.map((a) => a.count));
  const maxPractitionerCount = Math.max(1, ...data.practitioners.map((p) => p.appointments));

  return (
    <>
      <PageHeader
        title={t('stats.title')}
        subtitle={t('stats.subtitle', { period: t(`stats.periods.${period}`) })}
        actions={
          <>
            {(['day', 'week', 'month', 'year'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'primary' : 'outline'}
                onClick={() => setPeriod(p)}
              >
                {t(`stats.periods.${p}`)}
              </Button>
            ))}
          </>
        }
      />
      <div className="p-7 space-y-4 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">💰 {t('stats.kpi.revenue')}</p>
              <p className="text-3xl font-bold" data-numeric>
                {data.revenue.toLocaleString(i18n.language)}
              </p>
              <p
                className={`text-xs mt-1 ${data.revenueChange >= 0 ? 'text-primary-dark' : 'text-danger-dark'}`}
                data-numeric
              >
                {data.revenueChange >= 0 ? '↗' : '↘'} {Math.abs(data.revenueChange)}%{' '}
                {t('stats.vsPrevious')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">📅 {t('stats.kpi.appointments')}</p>
              <p className="text-3xl font-bold" data-numeric>{data.appointments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">👥 {t('stats.kpi.activePatients')}</p>
              <p className="text-3xl font-bold" data-numeric>{data.patientsActive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">🧾 {t('stats.kpi.invoices')}</p>
              <p className="text-3xl font-bold" data-numeric>{data.paymentsCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📈 {t('stats.revenueChart')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32" dir="ltr">
              {data.revenueByDay.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 bg-primary rounded-t hover:bg-primary-dark transition-colors relative group"
                  style={{ height: `${(d.total / maxDayRevenue) * 100}%` }}
                  title={`${d.day} — ${d.total.toLocaleString(i18n.language)} EGP`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-text-tertiary mt-2" dir="ltr">
              {data.revenueByDay[0] && <span>{data.revenueByDay[0].day}</span>}
              {data.revenueByDay[data.revenueByDay.length - 1] && (
                <span>{data.revenueByDay[data.revenueByDay.length - 1]!.day}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>🍰 {t('stats.byService')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.addictions.map((a) => (
                <div key={a.service} className="flex items-center gap-2 text-sm">
                  <span className="w-28">
                    {ADDICTION_ICON[a.service]} {t(`addiction.${a.service}`)}
                  </span>
                  <div className="flex-1 bg-bg-secondary rounded h-3 relative">
                    <div
                      className="bg-primary h-3 rounded"
                      style={{ width: `${(a.count / maxAddictionCount) * 100}%` }}
                    />
                  </div>
                  <span className="font-bold w-8 text-end" data-numeric>
                    {a.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📣 {t('stats.sources')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.sources.length === 0 ? (
                <p className="text-sm text-text-secondary">{t('stats.noDataPeriod')}</p>
              ) : (
                data.sources.map((s) => (
                  <div key={s.source} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate">{s.source}</span>
                    <div className="flex-1 bg-bg-secondary rounded h-3 relative">
                      <div
                        className="bg-info h-3 rounded"
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                    <span className="font-bold w-12 text-end" data-numeric>
                      {s.percentage}%
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>👨‍⚕️ {t('stats.practitionerPerf')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.practitioners.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 font-medium">{p.name}</span>
                <div className="flex-1 bg-bg-secondary rounded h-3">
                  <div
                    className="bg-secondary h-3 rounded"
                    style={{ width: `${(p.appointments / maxPractitionerCount) * 100}%` }}
                  />
                </div>
                <Badge variant="info">
                  {p.appointments} {t('stats.sessions')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
