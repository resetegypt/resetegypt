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
            {data.revenueByDay.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                {t('stats.noDataPeriod')}
              </p>
            ) : data.revenueByDay.length < 3 ? (
              /* 1–2 jours : on affiche des stats au lieu d'un graphique vide */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
                {data.revenueByDay.map((d) => (
                  <div
                    key={d.day}
                    className="bg-primary-lightest border border-primary-light rounded-lg p-4"
                  >
                    <div className="text-xs text-text-secondary">
                      {new Date(d.day).toLocaleDateString(i18n.language, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </div>
                    <div className="text-2xl font-bold text-primary-dark mt-1" data-numeric>
                      {d.total.toLocaleString(i18n.language)}{' '}
                      <span className="text-sm font-medium text-text-secondary">EGP</span>
                    </div>
                  </div>
                ))}
                {data.revenueByDay.length === 1 && (
                  <div className="bg-bg-secondary border border-border-light rounded-lg p-4 flex items-center justify-center text-xs text-text-tertiary italic">
                    {t('stats.singleDayHint', 'Une seule journée avec encaissement sur la période — sélectionnez une période plus large pour voir une tendance.')}
                  </div>
                )}
              </div>
            ) : (
              /* 3+ jours : graphique en barres avec largeur capée */
              <>
                <div className="flex items-end justify-center gap-2 h-40 px-2" dir="ltr">
                  {data.revenueByDay.map((d) => {
                    const heightPct = Math.max(2, (d.total / maxDayRevenue) * 100);
                    return (
                      <div
                        key={d.day}
                        className="flex-1 max-w-[48px] flex flex-col items-center group"
                      >
                        <div className="text-[10px] text-text-tertiary mb-1 group-hover:text-primary font-medium tabular-nums">
                          {d.total > 0 ? d.total.toLocaleString(i18n.language) : ''}
                        </div>
                        <div
                          className="w-full bg-primary rounded-t hover:bg-primary-dark transition-colors min-h-[2px]"
                          style={{ height: `${heightPct}%` }}
                          title={`${d.day} — ${d.total.toLocaleString(i18n.language)} EGP`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-text-tertiary mt-2 px-2" dir="ltr">
                  <span>{data.revenueByDay[0]!.day}</span>
                  <span>{data.revenueByDay[data.revenueByDay.length - 1]!.day}</span>
                </div>
              </>
            )}
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
