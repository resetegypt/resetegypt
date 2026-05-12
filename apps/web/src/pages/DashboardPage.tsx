import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet, apiPatch } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { PageHeader } from '../components/AppShell';

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

const ADDICTION_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
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
      <div className="p-7 space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon="📅" label={t('dashboard.kpi.appointments')} value={kpis?.todayAppointments ?? '–'} />
          <KPICard
            icon="💰"
            label={t('dashboard.kpi.toCash')}
            value={completedUnpaid.length}
            accent={completedUnpaid.length > 0 ? 'warning' : undefined}
          />
          <KPICard icon="🔁" label={t('dashboard.kpi.reminders')} value={kpis?.remindersToSend ?? '–'} />
          <KPICard
            icon="💵"
            label={t('dashboard.kpi.revenue')}
            value={kpis ? `${kpis.todayRevenue.toLocaleString(i18n.language)} EGP` : '–'}
            accent="success"
          />
        </div>

        {appointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-text-secondary">
              <div className="text-5xl mb-3">📭</div>
              <p>{t('dashboard.noAppointmentsToday')}</p>
              {user?.role !== 'PRACTITIONER' && (
                <Link to="/appointments/new" className="inline-block mt-4">
                  <Button>➕ {t('dashboard.createAppointment')}</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inProgress.length > 0 && (
              <Section
                title={`🔵 ${t('dashboard.sections.inProgress')}`}
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
                title={`🟠 ${t('dashboard.sections.upcoming')}`}
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
                title={`✅ ${t('dashboard.sections.completed')}`}
                count={completed.length}
                accent="success"
                description={t('dashboard.sections.completedDesc', { count: completedUnpaid.length })}
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
                title={`⛔ ${t('dashboard.sections.archived')}`}
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

        {user?.role !== 'PRACTITIONER' && (
          <Card>
            <CardHeader>
              <CardTitle>⚡ {t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Link to="/patients/intake">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📝 {t('dashboard.action.newPatient')}
                </Button>
              </Link>
              <Link to="/appointments/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  ➕ {t('dashboard.action.newAppointment')}
                </Button>
              </Link>
              <Link to="/patients">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  👥 {t('dashboard.action.patients')}
                </Button>
              </Link>
              <Link to="/accounting">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  💰 {t('dashboard.action.accounting')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
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
      <CardHeader>
        <CardTitle>
          {title} <Badge variant={accent}>{count}</Badge>
        </CardTitle>
        {description && <span className="text-xs text-text-secondary">{description}</span>}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">{children}</ul>
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

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/30">
      <div
        className="font-mono text-sm font-semibold w-14 text-right text-text-secondary"
        data-numeric
      >
        {time}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          to={`/patients/${a.patientId}`}
          className="text-sm font-medium hover:text-info truncate block"
        >
          {a.patientName}
        </Link>
        <p className="text-xs text-text-secondary truncate">
          {ADDICTION_ICON[a.service]} {t(`addiction.${a.service}`)} ·{' '}
          {t(`dashboard.visitType.${a.visitType}`)} · {a.practitionerName}
        </p>
      </div>
      <StatusTag status={a.status} />
      <div className="flex gap-1.5 items-center min-w-[220px] justify-end flex-wrap">
        {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus('IN_PROGRESS')}
              title={t('dashboard.actions.start')}
            >
              ▶️ {t('dashboard.actions.start')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdateStatus('NO_SHOW')}
              title={t('dashboard.actions.noShow')}
            >
              ❌
            </Button>
          </>
        )}
        {a.status === 'IN_PROGRESS' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus('COMPLETED')}
              title={t('dashboard.actions.complete')}
            >
              ✓ {t('dashboard.actions.complete')}
            </Button>
            {canCash && (
              <Button size="sm" onClick={onEncaisser} title={t('dashboard.actions.cash')}>
                💰 {t('dashboard.actions.cash')}
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
                title={t('dashboard.actions.viewInvoice')}
              >
                📄 {a.payment.invoiceNumber}
              </Button>
            ) : canCash ? (
              <Button size="sm" onClick={onEncaisser}>
                💰 {t('dashboard.actions.cashAmount', { amount: a.price.toLocaleString(i18n.language) })}
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

function KPICard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent?: 'success' | 'warning' | 'danger';
}) {
  const colors = {
    success: 'text-primary-dark',
    warning: 'text-warning-dark',
    danger: 'text-danger-dark',
  };
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-xs text-text-secondary flex items-center gap-1">
          <span>{icon}</span> {label}
        </p>
        <p className={`text-3xl font-bold ${accent ? colors[accent] : ''}`} data-numeric>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
