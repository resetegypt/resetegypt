import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { Heatmap, LineChart, Sparkline, type LineSeries, type HeatmapCell } from '../../components/charts';
import { SkelKpiGrid, SkelCard, SkelTable, SkelChart } from '../../components/skeletons';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  FileText,
  Flame,
  UserCheck,
  Award,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from 'lucide-react';

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

interface HeatmapResponse {
  cells: Array<{ dayOfWeek: number; hour: number; count: number }>;
  from: string;
  to: string;
}

interface PractitionersResponse {
  practitioners: Array<{
    id: string;
    name: string;
    firstName: string;
    appointments: number;
    completed: number;
    noShow: number;
    cancelled: number;
    upcoming: number;
    completionRate: number;
    noShowRate: number;
    revenue: number;
    paymentsCount: number;
  }>;
}

const ADDICTION_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

// Heures ouvrables visualisées dans le heatmap (10h à 19h = 10 colonnes)
const HEATMAP_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'global', period],
    queryFn: () => apiGet<GlobalStats>(`/stats/global?period=${period}`),
  });
  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['stats', 'heatmap', period],
    queryFn: () => apiGet<HeatmapResponse>(`/stats/heatmap?period=${period}`),
  });
  const { data: practitionersData, isLoading: practitionersLoading } = useQuery({
    queryKey: ['stats', 'practitioners', period],
    queryFn: () => apiGet<PractitionersResponse>(`/stats/practitioners?period=${period}`),
  });

  // === Sparklines KPI : on extrait les 14 dernières journées du revenueByDay
  const revenueSpark = useMemo(() => {
    if (!data) return [];
    return data.revenueByDay.slice(-14).map((d) => d.total);
  }, [data]);

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title={t('stats.title')} subtitle={t('common.loading')} />
        <div className="p-4 sm:p-7 space-y-5 max-w-7xl">
          <SkelKpiGrid count={4} />
          <SkelChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkelCard />
            <SkelCard />
          </div>
          <SkelTable rows={3} cols={5} />
        </div>
      </>
    );
  }

  const maxAddictionCount = Math.max(1, ...data.addictions.map((a) => a.count));

  // Préparation des données heatmap : on remappe DOW (0=dimanche) en index
  // d'affichage Sun-Sat (ou via la locale).
  const heatmapCells: HeatmapCell[] = (heatmap?.cells ?? [])
    .map((c) => {
      const colIdx = HEATMAP_HOURS.indexOf(c.hour);
      if (colIdx === -1) return null;
      return { row: c.dayOfWeek, col: colIdx, value: c.count };
    })
    .filter((c): c is HeatmapCell => c !== null);
  const heatmapTotal = heatmapCells.reduce((s, c) => s + c.value, 0);
  const peakCell = heatmapCells.reduce<HeatmapCell | null>((acc, c) => (acc && acc.value >= c.value ? acc : c), null);

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
        {/* === KPI principaux avec sparkline === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsKPI
            Icon={TrendingUp}
            label={t('stats.kpi.revenue')}
            value={data.revenue.toLocaleString(i18n.language)}
            suffix="EGP"
            tone="success"
            sparkline={revenueSpark}
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

        {/* === Heatmap horaire =================================================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap w-full">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                {t('stats.heatmap.title', 'Heatmap horaire')}
              </CardTitle>
              <div className="text-xs text-text-secondary">
                {t('stats.heatmap.subtitle', '{{n}} RDV répartis · pic à {{peak}}', {
                  n: heatmapTotal,
                  peak: peakCell
                    ? `${dayName(peakCell.row, i18n.language)} ${HEATMAP_HOURS[peakCell.col]}h (${peakCell.value})`
                    : '—',
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? (
              <SkelChart height={220} />
            ) : heatmapCells.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">{t('stats.noDataPeriod')}</p>
            ) : (
              <div dir="ltr">
                <Heatmap
                  cells={heatmapCells}
                  rowLabels={[0, 1, 2, 3, 4, 5, 6].map((d) => dayName(d, i18n.language, 'short'))}
                  colLabels={HEATMAP_HOURS.map((h) => `${h}h`)}
                  cellSize={36}
                  ariaLabel={t('stats.heatmap.title', 'Heatmap horaire')}
                  formatTitle={(cell, rl, cl) => `${rl} ${cl} — ${cell.value} RDV`}
                />
                <div className="text-[10px] text-text-tertiary mt-3 text-center">
                  {t('stats.heatmap.legend', "L'intensité de la couleur reflète le nombre de RDV. Survolez chaque cellule pour le détail.")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* === Comparatif praticiens ================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              {t('stats.practitionerCompare.title', 'Comparatif praticiens')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {practitionersLoading ? (
              <div className="p-5">
                <SkelTable rows={3} cols={6} />
              </div>
            ) : !practitionersData || practitionersData.practitioners.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">
                {t('stats.practitionerCompare.empty', 'Aucun praticien actif sur la période.')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary/40 border-b border-border-light text-[10px] uppercase tracking-wider text-text-tertiary">
                    <tr>
                      <th className="text-start px-5 py-3 font-bold">Praticien</th>
                      <th className="text-end px-3 py-3 font-bold">RDV total</th>
                      <th className="text-end px-3 py-3 font-bold">
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Terminés
                        </span>
                      </th>
                      <th className="text-end px-3 py-3 font-bold">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No-show
                        </span>
                      </th>
                      <th className="text-end px-3 py-3 font-bold">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> À venir
                        </span>
                      </th>
                      <th className="text-end px-3 py-3 font-bold">Taux completion</th>
                      <th className="text-end px-5 py-3 font-bold">CA encaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {practitionersData.practitioners.map((p) => (
                      <tr key={p.id} className="hover:bg-bg-secondary/20">
                        <td className="px-5 py-3 font-semibold text-text">{p.name}</td>
                        <td className="px-3 py-3 text-end font-mono tabular-nums text-text">
                          {p.appointments}
                        </td>
                        <td className="px-3 py-3 text-end font-mono tabular-nums text-primary-dark">
                          {p.completed}
                        </td>
                        <td className="px-3 py-3 text-end font-mono tabular-nums">
                          {p.noShow > 0 ? (
                            <span className="text-warning-dark">{p.noShow}</span>
                          ) : (
                            <span className="text-text-tertiary">{p.noShow}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-end font-mono tabular-nums text-info-dark">
                          {p.upcoming}
                        </td>
                        <td className="px-3 py-3 text-end">
                          <CompletionBar rate={p.completionRate} />
                        </td>
                        <td className="px-5 py-3 text-end font-mono tabular-nums text-text">
                          {p.revenue.toLocaleString(i18n.language)}{' '}
                          <span className="text-text-tertiary">EGP</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* === Revenue chart (inchangé) === */}
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
              </div>
            ) : (
              <RevenueBars data={data.revenueByDay} lang={i18n.language} />
            )}
          </CardContent>
        </Card>

        {/* === Par service / sources === */}
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
      </div>
    </>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'bg-primary' : rate >= 60 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="inline-flex items-center gap-2 w-32 ms-auto">
      <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-9 text-end">{rate}%</span>
    </div>
  );
}

function RevenueBars({ data, lang }: { data: GlobalStats['revenueByDay']; lang: string }) {
  const maxDayRevenue = Math.max(1, ...data.map((d) => d.total));
  return (
    <>
      <div className="flex items-end justify-center gap-2 h-40 px-2" dir="ltr">
        {data.map((d) => {
          const heightPct = Math.max(2, (d.total / maxDayRevenue) * 100);
          return (
            <div
              key={d.day}
              className="flex-1 max-w-[48px] flex flex-col items-center group"
            >
              <div className="text-[10px] text-text-tertiary mb-1 group-hover:text-primary font-medium tabular-nums">
                {d.total > 0 ? d.total.toLocaleString(lang) : ''}
              </div>
              <div
                className="w-full bg-primary rounded-t hover:bg-primary-dark transition-colors min-h-[2px]"
                style={{ height: `${heightPct}%` }}
                title={`${d.day} — ${d.total.toLocaleString(lang)} EGP`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-text-tertiary mt-2 px-2" dir="ltr">
        <span>{data[0]!.day}</span>
        <span>{data[data.length - 1]!.day}</span>
      </div>
    </>
  );
}

function dayName(idx: number, lang: string, format: 'short' | 'long' = 'short'): string {
  // 1970-01-04 = Sunday → idx 0
  const base = new Date(1970, 0, 4 + idx);
  return base.toLocaleDateString(lang, { weekday: format });
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
  sparkline,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  tone?: keyof typeof KPI_TONES;
  trend?: { value: number; up: boolean; label: string };
  sparkline?: number[];
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
      {sparkline && sparkline.length >= 2 && (
        <div className="mt-2 -mx-1">
          <Sparkline values={sparkline} width={200} height={32} ariaLabel={`${label} 14 derniers jours`} />
        </div>
      )}
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
