import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { TrendingUp, TrendingDown, Calendar, Users, FileText, type LucideIcon } from 'lucide-react';

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
      <div className="p-7 space-y-5 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsKPI
            Icon={TrendingUp}
            label={t('stats.kpi.revenue')}
            value={data.revenue.toLocaleString(i18n.language)}
            suffix="EGP"
            tone="success"
            trend={
              data.revenueChange !== 0
                ? {
                    value: Math.abs(data.revenueChange),
                    up: data.revenueChange >= 0,
                    label: t('stats.vsPrevious'),
                  }
                : undefined
            }
          />
          <StatsKPI
            Icon={Calendar}
            label={t('stats.kpi.appointments')}
            value={data.appointments}
            tone="info"
          />
          <StatsKPI
            Icon={Users}
            label={t('stats.kpi.activePatients')}
            value={data.patientsActive}
            tone="neutral"
          />
          <StatsKPI
            Icon={FileText}
            label={t('stats.kpi.invoices')}
            value={data.paymentsCount}
            tone="neutral"
          />
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

const KPI_TONES = {
  info: { iconBg: 'bg-info-light text-info-dark', valueColor: 'text-text' },
  success: { iconBg: 'bg-primary-lightest text-primary-dark', valueColor: 'text-primary-dark' },
  warning: { iconBg: 'bg-warning-light text-warning-dark', valueColor: 'text-warning-dark' },
  neutral: { iconBg: 'bg-bg-secondary text-text-secondary', valueColor: 'text-text' },
} as const;

function StatsKPI({
  Icon,
  label,
  value,
  suffix,
  tone = 'neutral',
  trend,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  tone?: keyof typeof KPI_TONES;
  trend?: { value: number; up: boolean; label: string };
}) {
  const c = KPI_TONES[tone];
  const TrendIcon = trend?.up ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-text-secondary tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold tracking-tight ${c.valueColor}`} data-numeric>
          {value}
        </span>
        {suffix && <span className="text-sm font-medium text-text-tertiary">{suffix}</span>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <TrendIcon
            className={`w-3.5 h-3.5 ${trend.up ? 'text-primary-dark' : 'text-danger-dark'}`}
          />
          <span
            className={`font-semibold ${trend.up ? 'text-primary-dark' : 'text-danger-dark'}`}
            data-numeric
          >
            {trend.value}%
          </span>
          <span className="text-text-tertiary">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
