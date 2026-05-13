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

interface Appointment {
  id: string;
  patientId: string;
  scheduledAt: string;
  patientName: string;
  practitioner: string;
  service: string;
  visitType: string;
  status: string;
  price: number;
}

type ViewMode = 'day' | 'week' | 'month';

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

// IMPORTANT : indexation par date LOCALE pour matcher correctement les
// cellules de la grille (qui sont en heure locale) avec les RDV (stockés
// en UTC mais convertis en local pour l'affichage). toISOString() utilise
// UTC, donc pour Paris (UTC+1/+2), minuit local devient 22:00/23:00 UTC
// du jour précédent → décalage d'un jour.
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function localTimeKey(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function AgendaPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isPractitioner = user?.role === 'PRACTITIONER';
  const [view, setView] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Calcule la plage [from, to[ selon la vue
  const range = useMemo(() => {
    if (view === 'day') {
      const from = new Date(anchorDate);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return { from, to };
    }
    if (view === 'week') {
      const from = startOfWeek(anchorDate);
      const to = new Date(from);
      to.setDate(to.getDate() + 7);
      return { from, to };
    }
    // month — on prend 6 semaines pour remplir la grille calendaire
    const monthStart = startOfMonth(anchorDate);
    const from = startOfWeek(monthStart);
    const to = new Date(from);
    to.setDate(to.getDate() + 42);
    return { from, to };
  }, [view, anchorDate]);

  const { data } = useQuery({
    queryKey: ['agenda', view, range.from.toISOString(), range.to.toISOString()],
    queryFn: () =>
      apiGet<{ appointments: Appointment[] }>(
        `/appointments/range?from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
      ),
  });

  const appointments = data?.appointments ?? [];

  // Indexation par jour/heure
  const byKey = useMemo(() => {
    const m = new Map<string, Appointment>();
    appointments.forEach((a) => {
      const d = new Date(a.scheduledAt);
      const key = `${localDateKey(d)}_${localTimeKey(d)}`;
      m.set(key, a);
    });
    return m;
  }, [appointments]);

  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    appointments.forEach((a) => {
      const key = localDateKey(new Date(a.scheduledAt));
      const arr = m.get(key) ?? [];
      arr.push(a);
      m.set(key, arr);
    });
    return m;
  }, [appointments]);

  const todayKey = localDateKey(new Date());
  const totalCount = appointments.length;
  const slotsInRange =
    view === 'day' ? SLOTS_PER_DAY : view === 'week' ? 7 * SLOTS_PER_DAY : 30 * SLOTS_PER_DAY;
  const occupation = slotsInRange > 0 ? Math.round((totalCount / slotsInRange) * 100) : 0;
  const expectedRevenue = appointments.reduce((sum, a) => sum + a.price, 0);
  const toConfirm = appointments.filter((a) => a.status === 'SCHEDULED').length;

  // Indicateur "maintenant"
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

  function navigate(direction: -1 | 1 | 0): void {
    if (direction === 0) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setAnchorDate(d);
      return;
    }
    setAnchorDate((d) => {
      const next = new Date(d);
      if (view === 'day') next.setDate(next.getDate() + direction);
      else if (view === 'week') next.setDate(next.getDate() + direction * 7);
      else next.setMonth(next.getMonth() + direction);
      return next;
    });
  }

  // Subtitle adapté à la vue
  const subtitle =
    view === 'day'
      ? anchorDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${range.from.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })} → ${new Date(range.to.getTime() - 1).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : anchorDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  return (
    <>
      <PageHeader
        title={t('agenda.title', 'Agenda')}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View switcher */}
            <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-1">
              {(['day', 'week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    view === v
                      ? 'bg-surface shadow-sm text-text'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {t(`agenda.view.${v}`, v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois')}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(0)}
                className="px-3 py-1 text-xs font-semibold rounded-md text-text-secondary hover:text-text hover:bg-surface transition-all"
              >
                {t('agenda.today', "Aujourd'hui")}
              </button>
              <button
                type="button"
                onClick={() => navigate(1)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      <div className="p-7 space-y-5 max-w-[1600px]">
        {/* KPI */}
        <div className={`grid grid-cols-2 ${isPractitioner ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
          <AgendaKPI
            Icon={CalendarDays}
            label={t('agenda.stats.bookings', 'Rendez-vous')}
            value={totalCount}
            tone="info"
          />
          <AgendaKPI
            Icon={Activity}
            label={t('agenda.stats.occupation', 'Occupation')}
            value={occupation}
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

        {/* Légende services */}
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

        {/* Body selon la vue */}
        {view === 'day' && (
          <DayView
            day={anchorDate}
            byKey={byKey}
            currentTimeIndex={currentTimeIndex}
            isToday={localDateKey(anchorDate) === todayKey}
          />
        )}
        {view === 'week' && (
          <WeekView
            weekStart={range.from}
            byKey={byKey}
            todayKey={todayKey}
            currentTimeIndex={currentTimeIndex}
            lang={i18n.language}
          />
        )}
        {view === 'month' && (
          <MonthView
            anchor={anchorDate}
            from={range.from}
            byDay={byDay}
            todayKey={todayKey}
            lang={i18n.language}
            onPickDay={(d) => {
              setAnchorDate(d);
              setView('day');
            }}
          />
        )}
      </div>
    </>
  );
}

// =====================================================================
// JOUR
// =====================================================================

function DayView({
  day,
  byKey,
  currentTimeIndex,
  isToday,
}: {
  day: Date;
  byKey: Map<string, Appointment>;
  currentTimeIndex: number | null;
  isToday: boolean;
}) {
  const { t } = useTranslation();
  const dayKey = localDateKey(day);
  const rdvCount = Array.from(byKey.values()).filter((a) =>
    localDateKey(new Date(a.scheduledAt)) === dayKey,
  ).length;

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light bg-bg-secondary/40 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold tracking-tight">
          {day.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h3>
        <span className="text-xs text-text-secondary">
          {rdvCount} {t('agenda.appointments', 'rendez-vous')}
        </span>
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
          const time = slotTime(i);
          const key = `${dayKey}_${time}`;
          const a = byKey.get(key);
          const isCurrentSlot = isToday && currentTimeIndex !== null && Math.floor(currentTimeIndex) === i;
          const showLine = isCurrentSlot;
          const lineOffsetPct = showLine ? (currentTimeIndex! - i) * 100 : 0;

          const slotIso = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            Math.floor((START_HOUR * 60 + i * SLOT_DURATION_MIN) / 60),
            (START_HOUR * 60 + i * SLOT_DURATION_MIN) % 60,
          ).toISOString();

          return (
            <div
              key={i}
              className={`relative flex items-stretch min-h-[60px] ${
                isCurrentSlot ? 'bg-primary/[0.02]' : ''
              }`}
            >
              {showLine && (
                <div
                  className="absolute left-0 right-0 h-[2px] bg-danger z-10 pointer-events-none"
                  style={{ top: `${lineOffsetPct}%` }}
                >
                  <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-danger" />
                </div>
              )}
              <div className="w-20 px-3 py-3 flex items-start justify-end shrink-0 bg-bg-secondary/20">
                <span
                  className={`text-sm font-mono tabular-nums ${
                    isCurrentSlot ? 'text-primary font-bold' : 'text-text-tertiary'
                  }`}
                >
                  {time}
                </span>
              </div>
              <div className="flex-1 p-2">
                {a ? (
                  <DayAppointmentCard appointment={a} />
                ) : (
                  <Link
                    to={`/appointments/new?slot=${encodeURIComponent(slotIso)}`}
                    className="group flex items-center justify-center h-full w-full rounded-md border border-dashed border-transparent hover:border-primary/30 hover:bg-primary/[0.04] transition-all min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 text-transparent group-hover:text-primary/60 transition-colors" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DayAppointmentCard({ appointment }: { appointment: Appointment }) {
  const { t } = useTranslation();
  const a = appointment;
  const sc = SERVICE_COLOR[a.service] ?? SERVICE_COLOR.STRESS!;
  const isConfirmed = a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED';
  const isCancelled = a.status === 'NO_SHOW' || a.status === 'CANCELLED';
  const initials = a.patientName
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Link to={`/patients/${a.patientId}`} className="block h-full">
      <div
        className={`h-full rounded-lg border ${sc.bar} border-l-4 px-3 py-2 cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px ${
          isCancelled
            ? 'bg-bg-secondary/60 border-border opacity-60 line-through'
            : isConfirmed
              ? 'bg-primary-lightest/60 border-border'
              : 'bg-warning-light/40 border-border'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-secondary text-primary-dark text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(a.status)}`} />
              <span className="text-sm font-semibold text-text truncate">{a.patientName}</span>
            </div>
            <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
              <span>{SERVICE_ICON[a.service]} {t(`addiction.${a.service}`)}</span>
              <span className="text-text-tertiary">·</span>
              <span>{t(`dashboard.visitType.${a.visitType}`)}</span>
              <span className="text-text-tertiary">·</span>
              <span>Dr. {a.practitioner}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// =====================================================================
// SEMAINE (existant simplifié)
// =====================================================================

function WeekView({
  weekStart,
  byKey,
  todayKey,
  currentTimeIndex,
  lang,
}: {
  weekStart: Date;
  byKey: Map<string, Appointment>;
  todayKey: string;
  currentTimeIndex: number | null;
  lang: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const todayColIdx = days.findIndex((d) => localDateKey(d) === todayKey);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))', minWidth: '900px' }}
        >
          <div className="bg-bg-secondary/40 border-b border-border-light px-2 py-3" />
          {days.map((d) => {
            const isToday = localDateKey(d) === todayKey;
            return (
              <div
                key={d.toISOString()}
                className={`border-b border-border-light px-3 py-3 ${
                  isToday ? 'bg-primary/10' : 'bg-bg-secondary/40'
                }`}
              >
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${isToday ? 'text-primary' : 'text-text-tertiary'}`}>
                  {d.toLocaleDateString(lang, { weekday: 'short' })}
                </div>
                <div className={`mt-0.5 flex items-baseline gap-1 ${isToday ? 'text-primary' : 'text-text'}`}>
                  <span className="text-2xl font-bold leading-none tabular-nums">{d.getDate()}</span>
                  <span className="text-xs text-text-tertiary">{d.toLocaleDateString(lang, { month: 'short' })}</span>
                  {isToday && <span className="ms-auto self-center inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
              </div>
            );
          })}

          {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
            const time = slotTime(i);
            const isCurrentRow = currentTimeIndex !== null && Math.floor(currentTimeIndex) === i;
            return (
              <WeekRow
                key={i}
                rowIdx={i}
                time={time}
                days={days}
                byKey={byKey}
                todayKey={todayKey}
                todayColIdx={todayColIdx}
                isCurrentRow={isCurrentRow}
                currentTimeIndex={currentTimeIndex}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function WeekRow({
  rowIdx,
  time,
  days,
  byKey,
  todayKey,
  todayColIdx,
  isCurrentRow,
  currentTimeIndex,
}: {
  rowIdx: number;
  time: string;
  days: Date[];
  byKey: Map<string, Appointment>;
  todayKey: string;
  todayColIdx: number;
  isCurrentRow: boolean;
  currentTimeIndex: number | null;
}) {
  return (
    <>
      <div className="border-b border-border-light bg-surface px-2 py-2 flex items-start justify-end">
        <span className={`text-[11px] font-mono tabular-nums ${isCurrentRow ? 'text-primary font-bold' : 'text-text-tertiary'}`}>
          {time}
        </span>
      </div>
      {days.map((d, dayIdx) => {
        const key = `${localDateKey(d)}_${time}`;
        const a = byKey.get(key);
        const isToday = localDateKey(d) === todayKey;
        const slotIso = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          Math.floor((START_HOUR * 60 + rowIdx * SLOT_DURATION_MIN) / 60),
          (START_HOUR * 60 + rowIdx * SLOT_DURATION_MIN) % 60,
        ).toISOString();
        const showNowLine = isToday && isCurrentRow && dayIdx === todayColIdx && currentTimeIndex !== null;
        const lineOffsetPct = showNowLine ? (currentTimeIndex - rowIdx) * 100 : 0;
        return (
          <div
            key={`${rowIdx}-${d.toISOString()}`}
            className={`relative border-b border-border-light p-1 min-h-[52px] ${isToday ? 'bg-primary/[0.02]' : ''}`}
          >
            {showNowLine && (
              <div className="absolute left-0 right-0 h-[2px] bg-danger z-10 pointer-events-none" style={{ top: `${lineOffsetPct}%` }}>
                <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-danger" />
              </div>
            )}
            {a ? <WeekAppointmentCard appointment={a} /> : (
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
}

function WeekAppointmentCard({ appointment }: { appointment: Appointment }) {
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
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(a.status)}`} />
          <span className="text-[11px] font-semibold text-text truncate">{a.patientName}</span>
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

// =====================================================================
// MOIS — grille calendaire 6×7
// =====================================================================

function MonthView({
  anchor,
  from,
  byDay,
  todayKey,
  lang,
  onPickDay,
}: {
  anchor: Date;
  from: Date;
  byDay: Map<string, Appointment[]>;
  todayKey: string;
  lang: string;
  onPickDay: (d: Date) => void;
}) {
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString(lang, { weekday: 'short' });
  });
  const monthIdx = anchor.getMonth();
  const lastDayOfMonth = endOfMonth(anchor).getDate();

  return (
    <Card className="overflow-hidden">
      <div
        className="grid border-b border-border-light bg-bg-secondary/40"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {weekdays.map((wd, i) => (
          <div
            key={i}
            className="px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-text-tertiary text-center"
          >
            {wd}
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {cells.map((d) => {
          const dayKey = localDateKey(d);
          const isOutsideMonth = d.getMonth() !== monthIdx;
          const isToday = dayKey === todayKey;
          const apps = byDay.get(dayKey) ?? [];
          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onPickDay(d)}
              className={`group relative text-start border-e border-b border-border-light p-2 min-h-[110px] cursor-pointer transition-all hover:bg-primary/[0.03] ${
                isOutsideMonth ? 'bg-bg-secondary/30 opacity-60' : ''
              } ${isToday ? 'bg-primary/[0.05]' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isToday
                      ? 'inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white'
                      : isOutsideMonth
                        ? 'text-text-tertiary'
                        : 'text-text'
                  }`}
                >
                  {d.getDate()}
                  {d.getDate() === 1 && (
                    <span className="ms-1 text-[10px] font-medium text-text-tertiary">
                      {d.toLocaleDateString(lang, { month: 'short' })}
                    </span>
                  )}
                </span>
                {apps.length > 0 && (
                  <span className="text-[10px] font-semibold text-primary-dark bg-primary-lightest px-1.5 py-0.5 rounded">
                    {apps.length}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {apps.slice(0, 3).map((a) => {
                  const sc = SERVICE_COLOR[a.service] ?? SERVICE_COLOR.STRESS!;
                  const time = new Date(a.scheduledAt);
                  return (
                    <div
                      key={a.id}
                      className={`text-[10px] truncate border-l-[3px] ${sc.bar} bg-surface rounded-sm ps-1.5 pe-1 py-0.5 shadow-[0_1px_1px_rgba(0,0,0,0.02)]`}
                      title={`${a.patientName} — ${time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <span className="font-mono tabular-nums text-text-tertiary me-1">
                        {time.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-text font-medium">{a.patientName}</span>
                    </div>
                  );
                })}
                {apps.length > 3 && (
                  <div className="text-[10px] text-text-tertiary font-medium">
                    +{apps.length - 3} de plus
                  </div>
                )}
              </div>
              {/* coin indicateur si dernier jour du mois pour separation visuelle */}
              {d.getDate() === lastDayOfMonth && !isOutsideMonth && (
                <span className="sr-only">fin de mois</span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// =====================================================================
// Helpers
// =====================================================================

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
