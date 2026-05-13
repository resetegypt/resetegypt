import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useAuthStore } from '../../lib/auth';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Activity,
  Clock,
  Plus,
  type LucideIcon,
} from 'lucide-react';

interface WeekData {
  weekStart: string;
  appointments: Array<{
    id: string;
    patientId: string;
    scheduledAt: string;
    patientName: string;
    practitioner: string;
    service: string;
    visitType: string;
    status: string;
    price: number;
  }>;
}

const SLOTS_PER_DAY = 18;
const SLOT_DURATION_MIN = 40;
const START_HOUR = 10;

const SERVICE_COLOR: Record<string, { bar: string; dot: string }> = {
  TOBACCO: { bar: 'border-l-amber-500', dot: 'bg-amber-500' },
  DRUGS: { bar: 'border-l-purple-500', dot: 'bg-purple-500' },
  ALCOHOL: { bar: 'border-l-rose-500', dot: 'bg-rose-500' },
  SUGAR: { bar: 'border-l-pink-400', dot: 'bg-pink-400' },
  STRESS: { bar: 'border-l-sky-500', dot: 'bg-sky-500' },
};
const SERVICE_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

function slotTime(idx: number): string {
  const totalMinutes = START_HOUR * 60 + idx * SLOT_DURATION_MIN;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function AgendaPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isPractitioner = user?.role === 'PRACTITIONER';
  const [weekOffset, setWeekOffset] = useState(0);
  const start = new Date();
  start.setDate(start.getDate() + weekOffset * 7);
  const { data } = useQuery({
    queryKey: ['agenda-week', start.toISOString().slice(0, 10)],
    queryFn: () => apiGet<WeekData>(`/appointments/week?start=${start.toISOString()}`),
  });

  const weekStart = data ? new Date(data.weekStart) : start;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const byKey = new Map<string, WeekData['appointments'][0]>();
  data?.appointments.forEach((a) => {
    const d = new Date(a.scheduledAt);
    const key = `${d.toISOString().slice(0, 10)}_${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    byKey.set(key, a);
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const totalCount = data?.appointments.length ?? 0;
  const capacity = 7 * SLOTS_PER_DAY;
  const occupation = capacity > 0 ? Math.round((totalCount / capacity) * 100) : 0;
  const expectedRevenue = (data?.appointments ?? []).reduce((sum, a) => sum + a.price, 0);
  const toConfirm = (data?.appointments ?? []).filter((a) => a.status === 'SCHEDULED').length;

  // Indicateur "maintenant" — re-render chaque minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const currentTimeIndex = useMemo(() => {
    const totalMin = now.getHours() * 60 + now.getMinutes();
    const startMin = START_HOUR * 60;
    const diff = totalMin - startMin;
    if (diff < 0) return null;
    const idx = diff / SLOT_DURATION_MIN;
    if (idx >= SLOTS_PER_DAY) return null;
    return idx;
  }, [now]);
  const todayColIdx = days.findIndex((d) => d.toISOString().slice(0, 10) === todayKey);

  const weekEnd = days[6]!;
  const subtitleRange = `${weekStart.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })} → ${weekEnd.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <>
      <PageHeader
        title={t('agenda.title', 'Agenda')}
        subtitle={subtitleRange}
        actions={
          <>
            {/* Navigation semaine — segmented control */}
            <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => setWeekOffset((o) => o - 1)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
                title={t('agenda.prevWeek', 'Semaine précédente')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  weekOffset === 0
                    ? 'bg-surface shadow-sm text-text'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {t('agenda.today', "Aujourd'hui")}
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((o) => o + 1)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
                title={t('agenda.nextWeek', 'Semaine suivante')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        }
      />

      <div className="p-7 space-y-5 max-w-[1600px]">
        {/* === KPI cards style dashboard === */}
        <div className={`grid grid-cols-2 ${isPractitioner ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
          <AgendaKPI
            Icon={CalendarDays}
            label={t('agenda.stats.capacity', 'RDV / capacité')}
            value={`${totalCount} / ${capacity}`}
            tone="info"
          />
          <AgendaKPI
            Icon={Activity}
            label={t('agenda.stats.occupation', 'Occupation')}
            value={`${occupation}`}
            suffix="%"
            tone={occupation > 70 ? 'warning' : 'neutral'}
          />
          {!isPractitioner && (
            <AgendaKPI
              Icon={TrendingUp}
              label={t('agenda.stats.expectedRevenue', 'CA prévu')}
              value={expectedRevenue.toLocaleString(i18n.language)}
              suffix="EGP"
              tone="success"
            />
          )}
          <AgendaKPI
            Icon={Clock}
            label={t('agenda.stats.toConfirm', 'À confirmer')}
            value={toConfirm}
            tone={toConfirm > 0 ? 'warning' : 'neutral'}
          />
        </div>

        {/* === Légende compacte === */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-text-secondary">
          <span className="font-semibold text-text-tertiary uppercase tracking-wide text-[10px]">
            {t('agenda.legend.title', 'Services')} ·
          </span>
          {Object.entries(SERVICE_COLOR).map(([service, c]) => (
            <span key={service} className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              {t(`addiction.${service}`)}
            </span>
          ))}
        </div>

        {/* === Grille agenda === */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div
              className="grid"
              style={{
                gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))',
                minWidth: '900px',
              }}
            >
              {/* Header row */}
              <div className="bg-bg-secondary/40 border-b border-border-light px-2 py-3" />
              {days.map((d) => {
                const isToday = d.toISOString().slice(0, 10) === todayKey;
                return (
                  <div
                    key={d.toISOString()}
                    className={`border-b border-border-light px-3 py-3 ${
                      isToday ? 'bg-primary/10' : 'bg-bg-secondary/40'
                    }`}
                  >
                    <div
                      className={`text-[10px] uppercase tracking-wider font-semibold ${
                        isToday ? 'text-primary' : 'text-text-tertiary'
                      }`}
                    >
                      {d.toLocaleDateString(i18n.language, { weekday: 'short' })}
                    </div>
                    <div
                      className={`mt-0.5 flex items-baseline gap-1 ${isToday ? 'text-primary' : 'text-text'}`}
                    >
                      <span className="text-2xl font-bold leading-none tabular-nums">
                        {d.getDate()}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {d.toLocaleDateString(i18n.language, { month: 'short' })}
                      </span>
                      {isToday && (
                        <span className="ms-auto self-center inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Rows */}
              {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
                const time = slotTime(i);
                const isCurrentRow = currentTimeIndex !== null && Math.floor(currentTimeIndex) === i;
                return (
                  <>
                    {/* Time gutter */}
                    <div
                      key={`gutter-${i}`}
                      className="border-b border-border-light bg-surface px-2 py-2 flex items-start justify-end"
                    >
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          isCurrentRow ? 'text-primary font-bold' : 'text-text-tertiary'
                        }`}
                      >
                        {time}
                      </span>
                    </div>

                    {/* Day cells */}
                    {days.map((d, dayIdx) => {
                      const key = `${d.toISOString().slice(0, 10)}_${time}`;
                      const a = byKey.get(key);
                      const isToday = d.toISOString().slice(0, 10) === todayKey;
                      const slotIso = new Date(
                        d.getFullYear(),
                        d.getMonth(),
                        d.getDate(),
                        Math.floor((START_HOUR * 60 + i * SLOT_DURATION_MIN) / 60),
                        (START_HOUR * 60 + i * SLOT_DURATION_MIN) % 60,
                      ).toISOString();
                      // Current time line offset within row
                      const showNowLine =
                        isToday && currentTimeIndex !== null && Math.floor(currentTimeIndex) === i && dayIdx === todayColIdx;
                      const lineOffsetPct = showNowLine ? (currentTimeIndex! - i) * 100 : 0;

                      return (
                        <div
                          key={`${i}-${d.toISOString()}`}
                          className={`relative border-b border-border-light p-1 min-h-[52px] ${
                            isToday ? 'bg-primary/[0.02]' : ''
                          }`}
                        >
                          {showNowLine && (
                            <div
                              className="absolute left-0 right-0 h-[2px] bg-danger z-10 pointer-events-none"
                              style={{ top: `${lineOffsetPct}%` }}
                            >
                              <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-danger" />
                            </div>
                          )}
                          {a ? (
                            <AppointmentCard appointment={a} />
                          ) : (
                            <Link
                              to={`/appointments/new?slot=${encodeURIComponent(slotIso)}`}
                              className="group block h-full rounded-md border border-dashed border-transparent hover:border-primary/30 hover:bg-primary/[0.04] transition-all flex items-center justify-center"
                            >
                              <Plus className="w-3.5 h-3.5 text-transparent group-hover:text-primary/60 transition-colors" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// =====================================================================

function AppointmentCard({
  appointment,
}: {
  appointment: WeekData['appointments'][0];
}) {
  const { t } = useTranslation();
  const a = appointment;
  const sc = SERVICE_COLOR[a.service] ?? SERVICE_COLOR.STRESS!;
  const isConfirmed = a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED';
  const isCancelled = a.status === 'NO_SHOW' || a.status === 'CANCELLED';
  return (
    <Link to={`/patients/${a.patientId}`} className="block h-full">
      <div
        className={`relative h-full rounded-md border ${sc.bar} border-l-4 px-2 py-1.5 cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px ${
          isCancelled
            ? 'bg-bg-secondary/60 border-border opacity-60 line-through'
            : isConfirmed
              ? 'bg-primary-lightest/60 border-border'
              : 'bg-warning-light/40 border-border'
        }`}
        title={`${a.patientName} — Dr. ${a.practitioner} — ${t(`addiction.${a.service}`)}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(a.status)}`} />
          <span className="text-[11px] font-semibold text-text truncate">
            {a.patientName}
          </span>
        </div>
        <div className="text-[9px] text-text-secondary mt-0.5 truncate flex items-center gap-1">
          <span>{SERVICE_ICON[a.service]}</span>
          <span className="text-text-tertiary">·</span>
          <span>Dr. {a.practitioner}</span>
        </div>
      </div>
    </Link>
  );
}

function statusDot(status: string): string {
  if (status === 'CONFIRMED') return 'bg-primary';
  if (status === 'SCHEDULED') return 'bg-warning';
  if (status === 'IN_PROGRESS') return 'bg-info animate-pulse';
  if (status === 'COMPLETED') return 'bg-primary-dark';
  if (status === 'NO_SHOW') return 'bg-danger';
  if (status === 'CANCELLED') return 'bg-text-tertiary';
  return 'bg-text-tertiary';
}

const KPI_TONES = {
  info: { iconBg: 'bg-info-light text-info-dark', valueColor: 'text-text' },
  success: { iconBg: 'bg-primary-lightest text-primary-dark', valueColor: 'text-primary-dark' },
  warning: { iconBg: 'bg-warning-light text-warning-dark', valueColor: 'text-warning-dark' },
  neutral: { iconBg: 'bg-bg-secondary text-text-secondary', valueColor: 'text-text' },
} as const;

function AgendaKPI({
  Icon,
  label,
  value,
  suffix,
  tone = 'neutral',
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  tone?: keyof typeof KPI_TONES;
}) {
  const c = KPI_TONES[tone];
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
    </div>
  );
}
