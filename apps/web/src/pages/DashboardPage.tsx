import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardContent } from '@reset/ui';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { PageHeader } from '../components/AppShell';
import {
  Calendar,
  CircleDollarSign,
  Bell,
  TrendingUp,
  Inbox as InboxIcon,
  Play,
  X,
  Check,
  ArrowRight,
  ClipboardPlus,
  ClipboardList,
  CalendarPlus,
  Users,
  Wallet,
  FileText,
  Phone,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

interface DashboardKPIs {
  todayAppointments: number;
  pendingMessages: number;
  remindersToSend: number;
  todayRevenue: number;
}

interface AppointmentRow {
  id: string;
  scheduledAt: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  service: string;
  visitType: string;
  practitionerName: string;
  status: string;
  price: number;
  hasMedicalRecord: boolean;
  payment: { id: string; total: number; invoiceNumber: string } | null;
}

const SERVICE_DOT: Record<string, string> = {
  TOBACCO: 'bg-amber-500',
  DRUGS: 'bg-purple-500',
  ALCOHOL: 'bg-rose-500',
  SUGAR: 'bg-pink-400',
  STRESS: 'bg-sky-500',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => apiGet<DashboardKPIs>('/stats/dashboard'),
  });
  const { data: today } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => apiGet<{ appointments: AppointmentRow[] }>('/appointments/today'),
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch(`/appointments/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'today'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
    },
  });

  const greeting = `${t('dashboard.greeting')}, ${user?.firstName}`;
  const dateLabel = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const appointments = today?.appointments ?? [];
  const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS');
  const upcoming = appointments
    .filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const archived = appointments.filter((a) => a.status === 'NO_SHOW' || a.status === 'CANCELLED');
  const completedUnpaid = completed.filter((a) => !a.payment);

  return (
    <>
      <PageHeader title={greeting} subtitle={dateLabel} />
      <div className="p-7 space-y-6 max-w-7xl">
        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            Icon={Calendar}
            label={t('dashboard.kpi.appointments')}
            value={kpis?.todayAppointments ?? 0}
            tone="info"
          />
          <KPICard
            Icon={CircleDollarSign}
            label={t('dashboard.kpi.toCash')}
            value={completedUnpaid.length}
            tone={completedUnpaid.length > 0 ? 'warning' : 'neutral'}
          />
          <KPICard
            Icon={Bell}
            label={t('dashboard.kpi.reminders')}
            value={kpis?.remindersToSend ?? 0}
            tone="neutral"
          />
          <KPICard
            Icon={TrendingUp}
            label={t('dashboard.kpi.revenue')}
            value={kpis ? `${kpis.todayRevenue.toLocaleString(i18n.language)}` : '0'}
            suffix="EGP"
            tone="success"
          />
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            Icon={InboxIcon}
            title={t('dashboard.noAppointmentsToday')}
            description={t(
              'dashboard.noAppointmentsHint',
              "Aucun rendez-vous prévu aujourd'hui — bonne journée !",
            )}
            cta={
              user?.role !== 'PRACTITIONER' ? (
                <Link to="/appointments/new">
                  <Button>
                    <CalendarPlus className="w-4 h-4 me-2" />
                    {t('dashboard.createAppointment')}
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-5">
            {inProgress.length > 0 && (
              <Section
                title={t('dashboard.sections.inProgress')}
                count={inProgress.length}
                accent="info"
                description={t('dashboard.sections.inProgressDesc')}
              >
                {inProgress.map((a) => (
                  <AppointmentRowItem
                    key={a.id}
                    appointment={a}
                    onUpdateStatus={(status) => updateStatus.mutate({ id: a.id, status })}
                    onEncaisser={() => navigate(`/payment/${a.id}`)}
                    onViewInvoice={(payId) => navigate(`/payments/${payId}`)}
                    role={user?.role}
                  />
                ))}
              </Section>
            )}

            {upcoming.length > 0 && (
              <Section
                title={t('dashboard.sections.upcoming')}
                count={upcoming.length}
                accent="warning"
                description={t('dashboard.sections.upcomingDesc')}
              >
                {upcoming.map((a) => (
                  <AppointmentRowItem
                    key={a.id}
                    appointment={a}
                    onUpdateStatus={(status) => updateStatus.mutate({ id: a.id, status })}
                    onEncaisser={() => navigate(`/payment/${a.id}`)}
                    onViewInvoice={(payId) => navigate(`/payments/${payId}`)}
                    role={user?.role}
                  />
                ))}
              </Section>
            )}

            {completed.length > 0 && (
              <Section
                title={t('dashboard.sections.completed')}
                count={completed.length}
                accent="success"
                description={t('dashboard.sections.completedDesc', {
                  count: completedUnpaid.length,
                })}
              >
                {completed.map((a) => (
                  <AppointmentRowItem
                    key={a.id}
                    appointment={a}
                    onUpdateStatus={(status) => updateStatus.mutate({ id: a.id, status })}
                    onEncaisser={() => navigate(`/payment/${a.id}`)}
                    onViewInvoice={(payId) => navigate(`/payments/${payId}`)}
                    role={user?.role}
                  />
                ))}
              </Section>
            )}

            {archived.length > 0 && (
              <Section
                title={t('dashboard.sections.archived')}
                count={archived.length}
                accent="neutral"
              >
                {archived.map((a) => (
                  <AppointmentRowItem
                    key={a.id}
                    appointment={a}
                    onUpdateStatus={(status) => updateStatus.mutate({ id: a.id, status })}
                    onEncaisser={() => navigate(`/payment/${a.id}`)}
                    onViewInvoice={(payId) => navigate(`/payments/${payId}`)}
                    role={user?.role}
                  />
                ))}
              </Section>
            )}
          </div>
        )}

        {/* Quick actions */}
        {user?.role !== 'PRACTITIONER' && (
          <div>
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-text-tertiary mb-3">
              {t('dashboard.quickActions', 'Actions rapides')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction to="/patients/intake" Icon={ClipboardPlus} label={t('dashboard.action.newPatient')} />
              <QuickAction to="/appointments/new" Icon={CalendarPlus} label={t('dashboard.action.newAppointment')} />
              <QuickAction to="/patients" Icon={Users} label={t('dashboard.action.patients')} />
              <QuickAction to="/accounting" Icon={Wallet} label={t('dashboard.action.accounting')} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================

const KPI_TONES = {
  info: {
    iconBg: 'bg-info-light text-info-dark',
    valueColor: 'text-text',
  },
  success: {
    iconBg: 'bg-primary-lightest text-primary-dark',
    valueColor: 'text-primary-dark',
  },
  warning: {
    iconBg: 'bg-warning-light text-warning-dark',
    valueColor: 'text-warning-dark',
  },
  neutral: {
    iconBg: 'bg-bg-secondary text-text-secondary',
    valueColor: 'text-text',
  },
} as const;

function KPICard({
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
        {suffix && (
          <span className="text-sm font-medium text-text-tertiary">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  description,
  children,
}: {
  title: string;
  count: number;
  accent: 'info' | 'warning' | 'success' | 'neutral';
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-border-light flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <Badge variant={accent}>{count}</Badge>
        </div>
        {description && (
          <span className="text-xs text-text-secondary truncate">{description}</span>
        )}
      </div>
      <CardContent className="p-0">
        <ul className="divide-y divide-border-light">{children}</ul>
      </CardContent>
    </Card>
  );
}

function AppointmentRowItem({
  appointment,
  onUpdateStatus,
  onEncaisser,
  onViewInvoice,
  role,
}: {
  appointment: AppointmentRow;
  onUpdateStatus: (status: string) => void;
  onEncaisser: () => void;
  onViewInvoice: (payId: string) => void;
  role?: 'ADMIN' | 'PRACTITIONER' | 'SECRETARY';
}) {
  const { t, i18n } = useTranslation();
  const a = appointment;
  const time = new Date(a.scheduledAt).toLocaleTimeString(i18n.language, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const canCash = role !== 'PRACTITIONER';
  const initials = a.patientName
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <li className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-secondary/40 transition-colors">
      {/* Time gutter */}
      <div className="flex flex-col items-end w-12 shrink-0">
        <span className="font-mono text-sm font-semibold text-text" data-numeric>
          {time}
        </span>
      </div>

      {/* Service color dot */}
      <span
        className={`w-1 h-10 rounded-full ${SERVICE_DOT[a.service] ?? 'bg-text-tertiary'}`}
        aria-hidden="true"
      />

      {/* Avatar + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-secondary text-primary-dark text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/patients/${a.patientId}`}
              className="text-sm font-semibold hover:text-primary truncate"
            >
              {a.patientName}
            </Link>
            <Link
              to={`/patients/${a.patientId}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-primary hover:bg-primary-lightest px-1.5 py-0.5 rounded-md border border-border hover:border-primary/40 transition-all"
              title={t('dashboard.actions.viewIntake', "Ouvrir la fiche d'accueil (admission, infos perso)")}
            >
              <ClipboardList className="w-3 h-3" />
              {t('dashboard.actions.intake', "Fiche d'accueil")}
            </Link>
            <Link
              to={`/patients/${a.patientId}/clinical?appointmentId=${a.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-primary hover:bg-primary-lightest px-1.5 py-0.5 rounded-md border border-border hover:border-primary/40 transition-all"
              title={t('dashboard.actions.viewPatient', 'Ouvrir la fiche patient (anamnèse, scores, examen)')}
            >
              <Stethoscope className="w-3 h-3" />
              {t('dashboard.actions.patient', 'Fiche patient')}
            </Link>
          </div>
          <p className="text-xs text-text-secondary truncate flex items-center gap-1.5 mt-0.5">
            <span>{t(`addiction.${a.service}`)}</span>
            <span className="text-text-tertiary">·</span>
            <span>{t(`dashboard.visitType.${a.visitType}`)}</span>
            <span className="text-text-tertiary">·</span>
            <span>{a.practitionerName}</span>
          </p>
        </div>
      </div>

      <StatusTag status={a.status} />

      {/* Actions */}
      <div className="flex gap-1.5 items-center min-w-[200px] justify-end flex-wrap">
        {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus('IN_PROGRESS')}
              title={t('dashboard.actions.start')}
            >
              <Play className="w-3.5 h-3.5 me-1" />
              {t('dashboard.actions.start')}
            </Button>
            <button
              type="button"
              onClick={() => onUpdateStatus('NO_SHOW')}
              title={t('dashboard.actions.noShow')}
              className="p-1.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        {a.status === 'IN_PROGRESS' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus('COMPLETED')}
            >
              <Check className="w-3.5 h-3.5 me-1" />
              {t('dashboard.actions.complete')}
            </Button>
            {canCash && (
              <Button size="sm" onClick={onEncaisser}>
                <Wallet className="w-3.5 h-3.5 me-1" />
                {t('dashboard.actions.cash')}
              </Button>
            )}
          </>
        )}
        {a.status === 'COMPLETED' && (
          <>
            {a.payment ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewInvoice(a.payment!.id)}
              >
                <FileText className="w-3.5 h-3.5 me-1" />
                {a.payment.invoiceNumber}
              </Button>
            ) : canCash ? (
              <Button size="sm" onClick={onEncaisser}>
                <Wallet className="w-3.5 h-3.5 me-1" />
                {t('dashboard.actions.cashAmount', {
                  amount: a.price.toLocaleString(i18n.language),
                })}
              </Button>
            ) : (
              <Badge variant="warning">{t('dashboard.actions.toBeCashed')}</Badge>
            )}
          </>
        )}
        {(a.status === 'NO_SHOW' || a.status === 'CANCELLED') && (
          <span className="text-xs text-text-tertiary italic">—</span>
        )}
      </div>
    </li>
  );
}

function StatusTag({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
    SCHEDULED: 'warning',
    CONFIRMED: 'success',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    NO_SHOW: 'danger',
    CANCELLED: 'neutral',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{t(`appointmentStatus.${status}`)}</Badge>;
}

function QuickAction({ to, Icon, label }: { to: string; Icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-primary-lightest text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-text flex-1 truncate">{label}</span>
      <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function EmptyState({
  Icon,
  title,
  description,
  cta,
}: {
  Icon: LucideIcon;
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-bg-secondary text-text-tertiary mx-auto flex items-center justify-center mb-4">
          <Icon className="w-8 h-8" />
        </div>
        <p className="text-base font-semibold text-text">{title}</p>
        {description && (
          <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">{description}</p>
        )}
        {cta && <div className="mt-5">{cta}</div>}
      </CardContent>
    </Card>
  );
}

// Re-export utility used elsewhere
export { Phone };
