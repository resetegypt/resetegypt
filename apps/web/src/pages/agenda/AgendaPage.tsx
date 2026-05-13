import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card } from '@reset/ui';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useAuthStore } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { SkelKpiGrid, SkelAgendaWeek } from '../../components/skeletons';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Activity,
  Clock,
  Plus,
  Wallet,
  Users,
  X,
  CheckCircle2,
  CircleAlert,
  PlayCircle,
  Phone,
  MessageCircle,
  ExternalLink,
  GripVertical,
  type LucideIcon,
} from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  scheduledAt: string;
  duration: number;
  patientName: string;
  patientPhone: string;
  patientAvatarUrl: string | null;
  patientTags: string[];
  practitionerId: string;
  practitioner: string;
  service: string;
  visitType: string;
  status: string;
  price: number;
  notes: string | null;
  paidTotal: number | null;
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
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

function slotIsoFromCell(day: Date, slotIdx: number): string {
  const totalMin = START_HOUR * 60 + slotIdx * SLOT_DURATION_MIN;
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Math.floor(totalMin / 60),
    totalMin % 60,
  ).toISOString();
}

// === Drag & drop helpers (HTML5 natif) ===========================
// On stocke l'id du RDV dans le dataTransfer. Au drop on PATCH
// /appointments/:id { scheduledAt: newSlot } et on invalide la query.
function dragData(id: string): string {
  return JSON.stringify({ type: 'appointment', id });
}
function parseDrag(e: React.DragEvent): { id: string } | null {
  try {
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj?.type === 'appointment' && typeof obj.id === 'string') return { id: obj.id };
  } catch {
    /* ignore */
  }
  return null;
}

export function AgendaPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const showRevenue = user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const [view, setView] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [practitionerFilter, setPractitionerFilter] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

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
    const monthStart = startOfMonth(anchorDate);
    const from = startOfWeek(monthStart);
    const to = new Date(from);
    to.setDate(to.getDate() + 42);
    return { from, to };
  }, [view, anchorDate]);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['agenda', view, range.from.toISOString(), range.to.toISOString()],
    queryFn: () =>
      apiGet<{ appointments: Appointment[] }>(
        `/appointments/range?from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
      ),
  });

  // Liste des praticiens pour le filtre (admin only)
  const { data: practitionersData } = useQuery({
    queryKey: ['practitioners'],
    queryFn: () => apiGet<{ practitioners: Practitioner[] }>('/practitioners'),
    enabled: isAdmin,
  });
  const practitioners = practitionersData?.practitioners ?? [];

  const allAppointments = data?.appointments ?? [];
  // Filtre côté client (les RDV sont déjà chargés)
  const appointments = practitionerFilter
    ? allAppointments.filter((a) => a.practitionerId === practitionerFilter)
    : allAppointments;

  // === Drag & drop mutation ===
  const moveMutation = useMutation({
    mutationFn: async ({ id, newScheduledAt }: { id: string; newScheduledAt: string }) =>
      apiPatch(`/appointments/${id}`, { scheduledAt: newScheduledAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      toast.success(t('agenda.dnd.moved', 'RDV déplacé'));
    },
    onError: (err: Error) => {
      const msg = err.message?.includes('TimeSlotConflict')
        ? t('agenda.dnd.conflict', 'Conflit : un autre RDV existe déjà sur ce créneau.')
        : t('agenda.dnd.failed', 'Impossible de déplacer le RDV.');
      toast.error(msg);
    },
  });

  const handleDropOnSlot = useCallback(
    (day: Date, slotIdx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const data = parseDrag(e);
      if (!data) return;
      const newScheduledAt = slotIsoFromCell(day, slotIdx);
      moveMutation.mutate({ id: data.id, newScheduledAt });
    },
    [moveMutation],
  );

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
  const daysInRange =
    view === 'day' ? 1 : view === 'week' ? 7 : endOfMonth(anchorDate).getDate();
  const slotsInRange = daysInRange * SLOTS_PER_DAY;
  const occupation = slotsInRange > 0 ? Math.round((totalCount / slotsInRange) * 100) : 0;
  const expectedRevenue = appointments
    .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
    .reduce((sum, a) => sum + a.price, 0);
  const realizedRevenue = appointments.reduce((sum, a) => sum + (a.paidTotal ?? 0), 0);
  const toConfirm = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const arrivedCount = appointments.filter((a) => a.status === 'ARRIVED').length;

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

  function nav(direction: -1 | 1 | 0): void {
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

  const subtitle =
    view === 'day'
      ? anchorDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${range.from.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })} → ${new Date(range.to.getTime() - 1).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : anchorDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  const selectedAppointment = selectedAppointmentId
    ? appointments.find((a) => a.id === selectedAppointmentId) ?? null
    : null;

  // Skeleton initial — avant le premier fetch.
  if (isLoading && allAppointments.length === 0) {
    return (
      <>
        <PageHeader title={t('agenda.title', 'Agenda')} subtitle={subtitle} />
        <div className="p-7 space-y-5 max-w-[1600px]">
          <SkelKpiGrid count={showRevenue ? 5 : 3} />
          <SkelAgendaWeek />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('agenda.title', 'Agenda')}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
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

            <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => nav(-1)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => nav(0)}
                className="px-3 py-1 text-xs font-semibold rounded-md text-text-secondary hover:text-text hover:bg-surface transition-all"
              >
                {t('agenda.today', "Aujourd'hui")}
              </button>
              <button
                type="button"
                onClick={() => nav(1)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Button asChild size="sm" variant="outline">
              <Link to="/waiting-list">
                <Users className="w-3.5 h-3.5 me-1.5" />
                {t('agenda.waitingList.button', "Liste d'attente")}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-7 space-y-5 max-w-[1600px]">
        {/* === Filtre praticien (admin only) === */}
        {isAdmin && practitioners.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {t('agenda.filter.practitioner', 'Praticien')}
            </span>
            <button
              type="button"
              onClick={() => setPractitionerFilter(null)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                !practitionerFilter
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/70 border border-border'
              }`}
            >
              {t('agenda.filter.all', 'Tous')} ({allAppointments.length})
            </button>
            {practitioners.map((p) => {
              const count = allAppointments.filter((a) => a.practitionerId === p.id).length;
              const active = practitionerFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPractitionerFilter(p.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/70 border border-border'
                  }`}
                >
                  <span>Dr. {p.firstName} {p.lastName.charAt(0)}.</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-surface text-text-secondary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* === KPI === */}
        <div
          className={`grid grid-cols-2 gap-4 ${
            showRevenue ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3'
          }`}
        >
          <AgendaKPI
            Icon={CalendarDays}
            label={t('agenda.stats.bookings', 'Rendez-vous')}
            value={totalCount}
            suffix={`/ ${slotsInRange}`}
            tone="info"
          />
          <AgendaKPI
            Icon={Activity}
            label={t('agenda.stats.occupation', 'Occupation')}
            value={occupation}
            suffix="%"
            tone={occupation > 70 ? 'warning' : 'neutral'}
          />
          {showRevenue && (
            <AgendaKPI
              Icon={TrendingUp}
              label={t('agenda.stats.expectedRevenue', 'CA prévu')}
              value={expectedRevenue.toLocaleString(i18n.language)}
              suffix="EGP"
              tone="neutral"
            />
          )}
          {showRevenue && (
            <AgendaKPI
              Icon={Wallet}
              label={t('agenda.stats.realizedRevenue', 'CA réalisé')}
              value={realizedRevenue.toLocaleString(i18n.language)}
              suffix="EGP"
              tone="success"
              ratio={
                expectedRevenue > 0
                  ? Math.round((realizedRevenue / expectedRevenue) * 100)
                  : null
              }
            />
          )}
          <AgendaKPI
            Icon={arrivedCount > 0 ? CheckCircle2 : Clock}
            label={
              arrivedCount > 0
                ? t('agenda.stats.arrived', 'À traiter (arrivés)')
                : t('agenda.stats.toConfirm', 'À confirmer')
            }
            value={arrivedCount > 0 ? arrivedCount : toConfirm}
            tone={arrivedCount > 0 ? 'success' : toConfirm > 0 ? 'warning' : 'neutral'}
          />
        </div>

        {/* === Légende === */}
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

        {/* === Body === */}
        {view === 'day' && (
          <DayView
            day={anchorDate}
            byKey={byKey}
            currentTimeIndex={currentTimeIndex}
            isToday={localDateKey(anchorDate) === todayKey}
            onSelectAppointment={setSelectedAppointmentId}
            onDropAt={handleDropOnSlot}
            isDragging={moveMutation.isPending}
          />
        )}
        {view === 'week' && (
          <WeekView
            weekStart={range.from}
            byKey={byKey}
            todayKey={todayKey}
            currentTimeIndex={currentTimeIndex}
            lang={i18n.language}
            onSelectAppointment={setSelectedAppointmentId}
            onDropAt={handleDropOnSlot}
            isDragging={moveMutation.isPending}
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

      {/* === Modal détail RDV === */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointmentId(null)}
          onChanged={() => {
            refetch();
          }}
          onNavigatePatient={(id) => {
            setSelectedAppointmentId(null);
            navigate(`/patients/${id}`);
          }}
          showAddToWaitingList={isAdmin || user?.role === 'SECRETARY'}
        />
      )}
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
  onSelectAppointment,
  onDropAt,
  isDragging,
}: {
  day: Date;
  byKey: Map<string, Appointment>;
  currentTimeIndex: number | null;
  isToday: boolean;
  onSelectAppointment: (id: string) => void;
  onDropAt: (day: Date, slotIdx: number) => (e: React.DragEvent) => void;
  isDragging: boolean;
}) {
  const { t } = useTranslation();
  const dayKey = localDateKey(day);
  const rdvCount = Array.from(byKey.values()).filter(
    (a) => localDateKey(new Date(a.scheduledAt)) === dayKey,
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
          const slotIso = slotIsoFromCell(day, i);

          return (
            <SlotRow
              key={i}
              day={day}
              slotIdx={i}
              hasAppointment={!!a}
              onDropAt={onDropAt}
              className={`min-h-[60px] ${isCurrentSlot ? 'bg-primary/[0.02]' : ''}`}
              isDragging={isDragging}
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
                  <DayAppointmentCard
                    appointment={a}
                    onClick={() => onSelectAppointment(a.id)}
                  />
                ) : (
                  <Link
                    to={`/appointments/new?slot=${encodeURIComponent(slotIso)}`}
                    className="group flex items-center justify-center h-full w-full rounded-md border border-dashed border-transparent hover:border-primary/30 hover:bg-primary/[0.04] transition-all min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 text-transparent group-hover:text-primary/60 transition-colors" />
                  </Link>
                )}
              </div>
            </SlotRow>
          );
        })}
      </div>
    </Card>
  );
}

function DayAppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const a = appointment;
  const sc = SERVICE_COLOR[a.service] ?? SERVICE_COLOR.STRESS!;
  const isConfirmed = a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED';
  const isArrived = a.status === 'ARRIVED';
  const isCancelled = a.status === 'NO_SHOW' || a.status === 'CANCELLED';
  const initials = a.patientName
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={!isCancelled && a.status !== 'COMPLETED'}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', dragData(a.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group h-full w-full text-start rounded-lg border ${sc.bar} border-l-4 px-3 py-2 cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px ${
        isCancelled
          ? 'bg-bg-secondary/60 border-border opacity-60 line-through'
          : isArrived
            ? 'bg-primary/15 border-primary/40 ring-1 ring-primary/30'
            : isConfirmed
              ? 'bg-primary-lightest/60 border-border'
              : 'bg-warning-light/40 border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        <PatientAvatar name={a.patientName} url={a.patientAvatarUrl} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(a.status)}`} />
            <span className="text-sm font-semibold text-text truncate">{a.patientName}</span>
            {a.patientTags.includes('vip') && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                VIP
              </span>
            )}
          </div>
          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
            <span>{SERVICE_ICON[a.service]} {t(`addiction.${a.service}`)}</span>
            <span className="text-text-tertiary">·</span>
            <span>{t(`dashboard.visitType.${a.visitType}`)}</span>
            <span className="text-text-tertiary">·</span>
            <span>Dr. {a.practitioner}</span>
          </div>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-text-tertiary/0 group-hover:text-text-tertiary/60 transition-colors shrink-0" />
      </div>
    </button>
  );
}

// =====================================================================
// SEMAINE
// =====================================================================

function WeekView({
  weekStart,
  byKey,
  todayKey,
  currentTimeIndex,
  lang,
  onSelectAppointment,
  onDropAt,
  isDragging,
}: {
  weekStart: Date;
  byKey: Map<string, Appointment>;
  todayKey: string;
  currentTimeIndex: number | null;
  lang: string;
  onSelectAppointment: (id: string) => void;
  onDropAt: (day: Date, slotIdx: number) => (e: React.DragEvent) => void;
  isDragging: boolean;
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
                onSelectAppointment={onSelectAppointment}
                onDropAt={onDropAt}
                isDragging={isDragging}
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
  onSelectAppointment,
  onDropAt,
  isDragging,
}: {
  rowIdx: number;
  time: string;
  days: Date[];
  byKey: Map<string, Appointment>;
  todayKey: string;
  todayColIdx: number;
  isCurrentRow: boolean;
  currentTimeIndex: number | null;
  onSelectAppointment: (id: string) => void;
  onDropAt: (day: Date, slotIdx: number) => (e: React.DragEvent) => void;
  isDragging: boolean;
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
        const slotIso = slotIsoFromCell(d, rowIdx);
        const showNowLine = isToday && isCurrentRow && dayIdx === todayColIdx && currentTimeIndex !== null;
        const lineOffsetPct = showNowLine ? (currentTimeIndex - rowIdx) * 100 : 0;
        return (
          <SlotCell
            key={`${rowIdx}-${d.toISOString()}`}
            day={d}
            slotIdx={rowIdx}
            hasAppointment={!!a}
            onDropAt={onDropAt}
            className={`relative border-b border-border-light p-1 min-h-[52px] ${isToday ? 'bg-primary/[0.02]' : ''}`}
            isDragging={isDragging}
          >
            {showNowLine && (
              <div className="absolute left-0 right-0 h-[2px] bg-danger z-10 pointer-events-none" style={{ top: `${lineOffsetPct}%` }}>
                <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-danger" />
              </div>
            )}
            {a ? (
              <WeekAppointmentCard
                appointment={a}
                onClick={() => onSelectAppointment(a.id)}
              />
            ) : (
              <Link
                to={`/appointments/new?slot=${encodeURIComponent(slotIso)}`}
                className="group block h-full rounded-md border border-dashed border-transparent hover:border-primary/30 hover:bg-primary/[0.04] transition-all flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5 text-transparent group-hover:text-primary/60 transition-colors" />
              </Link>
            )}
          </SlotCell>
        );
      })}
    </>
  );
}

function WeekAppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const a = appointment;
  const sc = SERVICE_COLOR[a.service] ?? SERVICE_COLOR.STRESS!;
  const isConfirmed = a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'COMPLETED';
  const isArrived = a.status === 'ARRIVED';
  const isCancelled = a.status === 'NO_SHOW' || a.status === 'CANCELLED';
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={!isCancelled && a.status !== 'COMPLETED'}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', dragData(a.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`relative h-full w-full text-start rounded-md border ${sc.bar} border-l-4 px-2 py-1.5 cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px ${
        isCancelled
          ? 'bg-bg-secondary/60 border-border opacity-60 line-through'
          : isArrived
            ? 'bg-primary/15 border-primary/40 ring-1 ring-primary/30'
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
    </button>
  );
}

// =====================================================================
// MOIS
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
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// =====================================================================
// Drop wrapper
// =====================================================================

function SlotRow({
  day,
  slotIdx,
  hasAppointment,
  onDropAt,
  className = '',
  isDragging,
  children,
}: {
  day: Date;
  slotIdx: number;
  hasAppointment: boolean;
  onDropAt: (day: Date, slotIdx: number) => (e: React.DragEvent) => void;
  className?: string;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      className={`relative flex items-stretch ${className} ${
        isOver && !hasAppointment ? 'bg-primary/10 ring-2 ring-primary/40 ring-inset' : ''
      } ${isDragging ? 'transition-colors' : ''}`}
      onDragOver={(e) => {
        if (hasAppointment) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        setIsOver(false);
        if (hasAppointment) return;
        onDropAt(day, slotIdx)(e);
      }}
    >
      {children}
    </div>
  );
}

function SlotCell({
  day,
  slotIdx,
  hasAppointment,
  onDropAt,
  className = '',
  isDragging,
  children,
}: {
  day: Date;
  slotIdx: number;
  hasAppointment: boolean;
  onDropAt: (day: Date, slotIdx: number) => (e: React.DragEvent) => void;
  className?: string;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      className={`${className} ${
        isOver && !hasAppointment ? 'bg-primary/10 ring-2 ring-primary/40 ring-inset' : ''
      } ${isDragging ? 'transition-colors' : ''}`}
      onDragOver={(e) => {
        if (hasAppointment) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        setIsOver(false);
        if (hasAppointment) return;
        onDropAt(day, slotIdx)(e);
      }}
    >
      {children}
    </div>
  );
}

// =====================================================================
// Modal détail RDV
// =====================================================================

function AppointmentDetailModal({
  appointment,
  onClose,
  onChanged,
  onNavigatePatient,
  showAddToWaitingList,
}: {
  appointment: Appointment;
  onClose: () => void;
  onChanged: () => void;
  onNavigatePatient: (id: string) => void;
  showAddToWaitingList: boolean;
}) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const a = appointment;
  const date = new Date(a.scheduledAt);
  const sc = SERVICE_COLOR[a.service] ?? SERVICE_COLOR.STRESS!;
  const phoneClean = a.patientPhone?.replace(/[^0-9]/g, '') ?? '';

  const setStatus = useMutation({
    mutationFn: (status: string) => apiPatch(`/appointments/${a.id}`, { status }),
    onSuccess: (_, status) => {
      const msg: Record<string, string> = {
        CONFIRMED: t('toasts.confirmed', 'RDV confirmé'),
        ARRIVED: t('toasts.arrived', 'Patient marqué arrivé'),
        IN_PROGRESS: t('toasts.started', 'Séance démarrée'),
        COMPLETED: t('toasts.completed', 'Séance terminée'),
        NO_SHOW: t('toasts.noShow', 'No-show enregistré'),
        CANCELLED: t('toasts.cancelled', 'RDV annulé'),
      };
      toast.success(msg[status] ?? t('toasts.updated', 'Mis à jour'));
      onChanged();
      onClose();
    },
    onError: () => toast.error(t('toasts.updateFailed', 'Échec de la mise à jour')),
  });

  const addToWaitingList = useMutation({
    mutationFn: () =>
      apiPost('/waiting-list', {
        patientId: a.patientId,
        service: a.service,
        priority: 5,
        notes: `Ajouté depuis RDV ${a.id} (${date.toLocaleString(i18n.language)})`,
      }),
    onSuccess: () => {
      toast.success(t('agenda.modal.addedToWaitingList', "Patient ajouté à la liste d'attente"));
    },
    onError: () => toast.error(t('toasts.actionFailed', 'Action impossible')),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-center justify-center px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className={`px-6 py-5 border-b ${sc.bar} border-l-4`}>
          <div className="flex items-start gap-4">
            <PatientAvatar name={a.patientName} url={a.patientAvatarUrl} size={56} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-text truncate">{a.patientName}</h2>
                <Badge variant={statusVariantOf(a.status)}>
                  {t(`appointmentStatus.${a.status}`, a.status)}
                </Badge>
                {a.patientTags.includes('vip') && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5 font-mono">{a.patientPhone}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Détails */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider mb-1">
                {t('agenda.modal.dateTime', 'Date / heure')}
              </div>
              <div className="font-semibold text-text">
                {date.toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
              <div className="text-text-secondary font-mono text-xs mt-0.5">
                {date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                {' '}· {a.duration} min
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider mb-1">
                {t('agenda.modal.service', 'Service')}
              </div>
              <div className="font-semibold text-text">
                {SERVICE_ICON[a.service]} {t(`addiction.${a.service}`)}
              </div>
              <div className="text-text-secondary text-xs mt-0.5">
                {t(`dashboard.visitType.${a.visitType}`)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider mb-1">
                {t('agenda.modal.practitioner', 'Praticien')}
              </div>
              <div className="font-semibold text-text">Dr. {a.practitioner}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider mb-1">
                {t('agenda.modal.price', 'Prix')}
              </div>
              <div className="font-semibold text-text font-mono">
                {a.price.toLocaleString(i18n.language)} EGP
              </div>
              {a.paidTotal !== null && (
                <div className="text-primary text-xs mt-0.5 font-mono">
                  ✓ {a.paidTotal.toLocaleString(i18n.language)} EGP encaissé
                </div>
              )}
            </div>
          </div>

          {a.notes && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider mb-1">
                {t('agenda.modal.notes', 'Notes')}
              </div>
              <p className="text-sm text-text bg-bg-secondary/40 border border-border-light rounded-lg p-3">
                {a.notes}
              </p>
            </div>
          )}

          {/* Actions rapides : appel, WhatsApp */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${a.patientPhone}`}>
                <Phone className="w-3.5 h-3.5 me-1.5" />
                {t('agenda.modal.call', 'Appeler')}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://wa.me/${phoneClean}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="w-3.5 h-3.5 me-1.5" />
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigatePatient(a.patientId)}>
              <ExternalLink className="w-3.5 h-3.5 me-1.5" />
              {t('agenda.modal.openPatient', 'Fiche patient')}
            </Button>
          </div>
        </div>

        {/* Changements de statut */}
        <div className="px-6 py-4 border-t border-border-light bg-bg-secondary/30 space-y-3">
          <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
            {t('agenda.modal.changeStatus', 'Changer le statut')}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {a.status === 'SCHEDULED' && (
              <StatusButton
                Icon={CheckCircle2}
                label={t('appointmentStatus.CONFIRMED', 'Confirmer')}
                onClick={() => setStatus.mutate('CONFIRMED')}
                color="info"
                disabled={setStatus.isPending}
              />
            )}
            {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
              <StatusButton
                Icon={CheckCircle2}
                label={t('appointmentStatus.ARRIVED', "Patient arrivé")}
                onClick={() => setStatus.mutate('ARRIVED')}
                color="primary"
                disabled={setStatus.isPending}
              />
            )}
            {(a.status === 'CONFIRMED' || a.status === 'ARRIVED' || a.status === 'SCHEDULED') && (
              <StatusButton
                Icon={PlayCircle}
                label={t('appointmentStatus.IN_PROGRESS', 'Démarrer séance')}
                onClick={() => setStatus.mutate('IN_PROGRESS')}
                color="info"
                disabled={setStatus.isPending}
              />
            )}
            {a.status === 'IN_PROGRESS' && (
              <StatusButton
                Icon={CheckCircle2}
                label={t('appointmentStatus.COMPLETED', 'Terminer')}
                onClick={() => setStatus.mutate('COMPLETED')}
                color="success"
                disabled={setStatus.isPending}
              />
            )}
            {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
              <>
                <StatusButton
                  Icon={CircleAlert}
                  label={t('appointmentStatus.NO_SHOW', 'No show')}
                  onClick={() => setStatus.mutate('NO_SHOW')}
                  color="warning"
                  disabled={setStatus.isPending}
                />
                <StatusButton
                  Icon={X}
                  label={t('appointmentStatus.CANCELLED', 'Annuler')}
                  onClick={() => {
                    if (confirm(t('agenda.modal.confirmCancel', 'Annuler ce RDV ? Si un patient est en liste d\'attente, il recevra un email automatiquement.'))) {
                      setStatus.mutate('CANCELLED');
                    }
                  }}
                  color="danger"
                  disabled={setStatus.isPending}
                />
              </>
            )}
          </div>
          {showAddToWaitingList && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addToWaitingList.mutate()}
              disabled={addToWaitingList.isPending}
              className="text-xs text-text-secondary"
            >
              <Users className="w-3.5 h-3.5 me-1.5" />
              {addToWaitingList.isPending
                ? t('common.loading')
                : t('agenda.modal.addToWaitingList', 'Ajouter à la liste d\'attente')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusButton({
  Icon,
  label,
  onClick,
  color,
  disabled,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
  color: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  disabled?: boolean;
}) {
  const colorMap = {
    primary: 'bg-primary text-white hover:bg-primary-dark border-primary',
    success: 'bg-primary-dark text-white hover:bg-primary border-primary-dark',
    info: 'bg-info text-white hover:bg-info border-info',
    warning: 'bg-warning text-warning-dark hover:bg-warning-dark hover:text-white border-warning',
    danger: 'bg-danger-light text-danger-dark hover:bg-danger hover:text-white border-danger',
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${colorMap[color]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// =====================================================================
// Composants utilitaires partagés
// =====================================================================

export function PatientAvatar({
  name,
  url,
  size = 32,
}: {
  name: string;
  url: string | null | undefined;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Avatar style={{ width: size, height: size }}>
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback className="bg-gradient-to-br from-primary-light to-secondary text-primary-dark text-xs font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function statusDot(status: string): string {
  if (status === 'CONFIRMED') return 'bg-primary';
  if (status === 'SCHEDULED') return 'bg-warning';
  if (status === 'ARRIVED') return 'bg-primary animate-pulse';
  if (status === 'IN_PROGRESS') return 'bg-info animate-pulse';
  if (status === 'COMPLETED') return 'bg-primary-dark';
  if (status === 'NO_SHOW') return 'bg-danger';
  if (status === 'CANCELLED') return 'bg-text-tertiary';
  return 'bg-text-tertiary';
}

function statusVariantOf(status: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CONFIRMED') return 'success';
  if (status === 'ARRIVED') return 'info';
  if (status === 'IN_PROGRESS') return 'info';
  if (status === 'NO_SHOW') return 'danger';
  if (status === 'CANCELLED') return 'neutral';
  return 'warning';
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
  ratio,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  tone?: keyof typeof KPI_TONES;
  ratio?: number | null;
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
      {ratio !== undefined && ratio !== null && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1">
            <span>{ratio}% du prévu</span>
          </div>
          <div className="h-1 w-full bg-bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                ratio >= 80 ? 'bg-primary' : ratio >= 50 ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(100, ratio)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
