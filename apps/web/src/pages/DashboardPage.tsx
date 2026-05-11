import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { useAuthStore } from '../lib/auth';
import { PageHeader } from '../components/AppShell';

interface DashboardKPIs {
  todayAppointments: number;
  pendingMessages: number;
  remindersToSend: number;
  todayRevenue: number;
}

interface AppointmentItem {
  id: string;
  scheduledAt: string;
  patientName: string;
  service: string;
  visitType: string;
  practitionerName: string;
  status: string;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => apiGet<DashboardKPIs>('/stats/dashboard'),
  });
  const { data: today } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => apiGet<{ appointments: AppointmentItem[] }>('/appointments/today'),
  });

  const greeting = `${t('dashboard.greeting')}, ${user?.firstName}`;
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <PageHeader title={greeting} subtitle={dateLabel} />
      <div className="p-7 space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon="📅" label={t('dashboard.kpi.appointments')} value={kpis?.todayAppointments ?? '–'} />
          <KPICard icon="💬" label={t('dashboard.kpi.messages')} value={kpis?.pendingMessages ?? '–'} accent="warning" />
          <KPICard icon="🔁" label={t('dashboard.kpi.reminders')} value={kpis?.remindersToSend ?? '–'} />
          <KPICard
            icon="💰"
            label={t('dashboard.kpi.revenue')}
            value={kpis ? `${kpis.todayRevenue.toLocaleString()} EGP` : '–'}
            accent="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>📅 {t('dashboard.appointmentsToday')}</CardTitle>
              <Link to="/agenda">
                <Button size="sm" variant="outline">
                  {t('dashboard.openAgenda')} →
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 p-0">
              {!today || today.appointments.length === 0 ? (
                <p className="text-sm text-text-secondary p-6 text-center">
                  {t('dashboard.noAppointmentsToday')}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {today.appointments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="font-mono text-sm font-semibold w-14 text-right">
                        {formatTime(a.scheduledAt)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.patientName}</p>
                        <p className="text-xs text-text-secondary truncate">
                          {a.service} · {a.visitType === 'FIRST' ? '1ère séance' : 'Suivi'} ·{' '}
                          {a.practitionerName}
                        </p>
                      </div>
                      <StatusTag status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ {t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.role !== 'PRACTITIONER' && (
                <>
                  <Link to="/patients/intake" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      📝 {t('dashboard.action.newPatient')}
                    </Button>
                  </Link>
                  <Link to="/appointments/new" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      ➕ {t('dashboard.action.newAppointment')}
                    </Button>
                  </Link>
                </>
              )}
              <Link to="/patients" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  👥 {t('dashboard.action.patients')}
                </Button>
              </Link>
              <Link to="/inbox" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📥 {t('dashboard.action.inbox')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
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
        <p className={`text-3xl font-bold ${accent ? colors[accent] : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }> = {
    SCHEDULED: { variant: 'neutral', label: 'À venir' },
    CONFIRMED: { variant: 'success', label: 'Confirmé' },
    IN_PROGRESS: { variant: 'info', label: 'En cours' },
    COMPLETED: { variant: 'success', label: 'Terminé' },
    NO_SHOW: { variant: 'danger', label: 'No-show' },
    CANCELLED: { variant: 'neutral', label: 'Annulé' },
  };
  const cfg = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
