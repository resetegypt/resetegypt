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

const SERVICE_LABEL: Record<string, string> = {
  TOBACCO: '🚬 Tabac',
  DRUGS: '💊 Drogue',
  ALCOHOL: '🍷 Alcool',
  SUGAR: '🍬 Sucre',
  STRESS: '😰 Stress',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
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
  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const appointments = today?.appointments ?? [];

  // Group by status — order: in progress, upcoming, completed, no-show/cancelled
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
            label="À encaisser"
            value={completedUnpaid.length}
            accent={completedUnpaid.length > 0 ? 'warning' : undefined}
          />
          <KPICard icon="🔁" label={t('dashboard.kpi.reminders')} value={kpis?.remindersToSend ?? '–'} />
          <KPICard
            icon="💵"
            label={t('dashboard.kpi.revenue')}
            value={kpis ? `${kpis.todayRevenue.toLocaleString('fr-FR')} EGP` : '–'}
            accent="success"
          />
        </div>

        {appointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-text-secondary">
              <div className="text-5xl mb-3">📭</div>
              <p>Aucun rendez-vous prévu aujourd'hui.</p>
              {user?.role !== 'PRACTITIONER' && (
                <Link to="/appointments/new" className="inline-block mt-4">
                  <Button>➕ Créer un RDV</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inProgress.length > 0 && (
              <Section
                title="🔵 En cours"
                count={inProgress.length}
                accent="info"
                description="Séances actuellement en consultation"
              >
                {inProgress.map((a) => (
                  <AppointmentRow
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
                title="🟠 À venir"
                count={upcoming.length}
                accent="warning"
                description="RDV à confirmer / démarrer"
              >
                {upcoming.map((a) => (
                  <AppointmentRow
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
                title="✅ Terminés"
                count={completed.length}
                accent="success"
                description={`${completedUnpaid.length} à encaisser`}
              >
                {completed.map((a) => (
                  <AppointmentRow
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
              <Section title="⛔ No-show / Annulés" count={archived.length} accent="neutral">
                {archived.map((a) => (
                  <AppointmentRow
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
                  📝 Fiche d'accueil
                </Button>
              </Link>
              <Link to="/appointments/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  ➕ Nouveau RDV
                </Button>
              </Link>
              <Link to="/patients">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  👥 Patients
                </Button>
              </Link>
              <Link to="/accounting">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  💰 Comptabilité
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

function AppointmentRow({
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
  const a = appointment;
  const time = new Date(a.scheduledAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const canCash = role !== 'PRACTITIONER';

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/30">
      <div className="font-mono text-sm font-semibold w-14 text-right text-text-secondary">{time}</div>
      <div className="flex-1 min-w-0">
        <Link
          to={`/patients/${a.patientId}`}
          className="text-sm font-medium hover:text-info truncate block"
        >
          {a.patientName}
        </Link>
        <p className="text-xs text-text-secondary truncate">
          {SERVICE_LABEL[a.service] ?? a.service} ·{' '}
          {a.visitType === 'FIRST' ? '1ère séance' : a.visitType === 'FOLLOWUP' ? 'Suivi' : 'Consolidation'} ·{' '}
          {a.practitionerName}
        </p>
      </div>
      <StatusTag status={a.status} />
      <div className="flex gap-1.5 items-center min-w-[200px] justify-end">
        {/* Action buttons by status */}
        {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
          <>
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus('IN_PROGRESS')} title="Démarrer la séance">
              ▶️ Démarrer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onUpdateStatus('NO_SHOW')} title="Patient absent">
              ❌
            </Button>
          </>
        )}
        {a.status === 'IN_PROGRESS' && (
          <>
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus('COMPLETED')} title="Marquer terminé">
              ✓ Terminer
            </Button>
            {canCash && (
              <Button size="sm" onClick={onEncaisser} title="Encaisser maintenant">
                💰 Encaisser
              </Button>
            )}
          </>
        )}
        {a.status === 'COMPLETED' && (
          <>
            {a.payment ? (
              <Button size="sm" variant="outline" onClick={() => onViewInvoice(a.payment!.id)} title="Voir facture">
                📄 {a.payment.invoiceNumber}
              </Button>
            ) : canCash ? (
              <Button size="sm" onClick={onEncaisser} title="Encaisser">
                💰 Encaisser {a.price.toLocaleString('fr-FR')} EGP
              </Button>
            ) : (
              <Badge variant="warning">À encaisser</Badge>
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
  const map: Record<
    string,
    { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
  > = {
    SCHEDULED: { variant: 'warning', label: 'À confirmer' },
    CONFIRMED: { variant: 'success', label: 'Confirmé' },
    IN_PROGRESS: { variant: 'info', label: 'En cours' },
    COMPLETED: { variant: 'success', label: 'Terminé' },
    NO_SHOW: { variant: 'danger', label: 'No-show' },
    CANCELLED: { variant: 'neutral', label: 'Annulé' },
  };
  const cfg = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
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
