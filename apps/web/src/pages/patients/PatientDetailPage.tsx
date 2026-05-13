import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useAuthStore } from '../../lib/auth';

interface PatientDetail {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    whatsapp: string | null;
    email: string | null;
    age: number | null;
    governorate: string | null;
    profession: string | null;
    primaryAddiction: string;
    status: string;
    preferredLanguage: string;
    createdAt: string;
    preferredPractitioner: { firstName: string; lastName: string } | null;
    appointments: Array<{
      id: string;
      scheduledAt: string;
      service: string;
      visitType: string;
      status: string;
      price: string | number;
      practitioner: { firstName: string };
      payment: { invoiceNumber: string; total: string | number } | null;
      medicalRecord: { id: string } | null;
    }>;
  };
  stats: { sessionsCount: number; totalPaid: number };
  evolution: Array<{
    createdAt: string;
    stressScore: number | null;
    anxietyScore: number | null;
    cravingScore: number | null;
    sleepScore: number | null;
    motivationScore: number | null;
  }>;
}

const ADDICTION_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

export function PatientDetailPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isPractitioner = user?.role === 'PRACTITIONER';
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiGet<PatientDetail>(`/patients/${id}`),
    enabled: !!id,
  });

  if (!data) return <div className="p-7">{t('common.loading')}</div>;
  const { patient, stats, evolution } = data;
  const initials = patient.firstName.charAt(0) + patient.lastName.charAt(0);

  const first = evolution[0];
  const last = evolution[evolution.length - 1];
  let evolutionScore: number | null = null;
  if (first && last && evolution.length > 1) {
    const initial =
      (first.stressScore ?? 0) + (first.anxietyScore ?? 0) + (first.cravingScore ?? 0);
    const current =
      (last.stressScore ?? 0) + (last.anxietyScore ?? 0) + (last.cravingScore ?? 0);
    if (initial > 0) evolutionScore = Math.round(((initial - current) / initial) * 100);
  }

  return (
    <>
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.age ? t('patients.detail.yearsOld', { age: patient.age }) : '—'} · ${patient.governorate ?? ''} · ${t('patients.detail.patientSince', { date: new Date(patient.createdAt).toLocaleDateString(i18n.language) })}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${patient.phone}`}>📞 {t('patients.detail.call')}</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://wa.me/${(patient.whatsapp ?? patient.phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                💬 {t('patients.detail.whatsapp')}
              </a>
            </Button>
            <Button asChild>
              <Link to={`/appointments/new?patientId=${patient.id}`}>
                ➕ {t('patients.detail.newAppointment')}
              </Link>
            </Button>
          </>
        }
      />
      <div className="p-7 space-y-6 max-w-6xl">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex gap-2 flex-wrap items-center">
                <Badge variant={patient.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {patient.status === 'ACTIVE'
                    ? t('patients.detail.followingIn')
                    : patient.status}
                </Badge>
                <Badge variant="warning">
                  {ADDICTION_ICON[patient.primaryAddiction]} {t(`addiction.${patient.primaryAddiction}`)}
                </Badge>
                {patient.preferredPractitioner && (
                  <Badge variant="info">
                    Dr. {patient.preferredPractitioner.firstName}{' '}
                    {patient.preferredPractitioner.lastName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-1" data-numeric>
                📞 {patient.phone}
                {patient.email ? ` · ✉️ ${patient.email}` : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className={`grid grid-cols-2 ${isPractitioner ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">📋 {t('patients.detail.kpi.sessions')}</p>
              <p className="text-3xl font-bold" data-numeric>
                {stats.sessionsCount}
              </p>
            </CardContent>
          </Card>
          {!isPractitioner && (
            <Card>
              <CardContent>
                <p className="text-xs text-text-secondary">💰 {t('patients.detail.kpi.totalPaid')}</p>
                <p className="text-3xl font-bold" data-numeric>
                  {stats.totalPaid.toLocaleString(i18n.language)} EGP
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">⏱️ {t('patients.detail.kpi.duration')}</p>
              <p className="text-3xl font-bold" data-numeric>
                {weeksBetween(patient.createdAt, new Date().toISOString())} {t('patients.detail.weeks')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">📈 {t('patients.detail.kpi.evolution')}</p>
              <p className="text-3xl font-bold text-primary-dark" data-numeric>
                {evolutionScore !== null ? `+${evolutionScore}%` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📜 {t('patients.detail.history')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-start px-4 py-2">{t('patients.detail.columns.date')}</th>
                  <th className="text-start px-4 py-2">{t('patients.detail.columns.practitioner')}</th>
                  <th className="text-start px-4 py-2">{t('patients.detail.columns.type')}</th>
                  <th className="text-start px-4 py-2">{t('patients.detail.columns.status')}</th>
                  {!isPractitioner && (
                    <th className="text-end px-4 py-2">{t('patients.detail.columns.amount')}</th>
                  )}
                  <th className="text-end px-4 py-2">{t('patients.detail.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patient.appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2" data-numeric>
                      {new Date(a.scheduledAt).toLocaleString(i18n.language)}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">Dr. {a.practitioner.firstName}</td>
                    <td className="px-4 py-2">
                      {ADDICTION_ICON[a.service]} {t(`addiction.${a.service}`)} ·{' '}
                      {t(`dashboard.visitType.${a.visitType}`)}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={statusVariant(a.status)}>{t(`appointmentStatus.${a.status}`)}</Badge>
                    </td>
                    {!isPractitioner && (
                      <td className="px-4 py-2 text-end font-mono text-xs" data-numeric>
                        {a.payment
                          ? `${Number(a.payment.total).toLocaleString(i18n.language)} EGP`
                          : `${Number(a.price).toLocaleString(i18n.language)} (${t('patients.detail.toCash')})`}
                      </td>
                    )}
                    <td className="px-4 py-2 text-end space-x-1">
                      {!a.medicalRecord && a.status !== 'CANCELLED' && (
                        <Link
                          to={`/patients/${patient.id}/clinical?appointmentId=${a.id}`}
                        >
                          <Button size="sm" variant="outline">
                            {t('patients.detail.clinicalForm')}
                          </Button>
                        </Link>
                      )}
                      {!isPractitioner && !a.payment && a.status !== 'CANCELLED' && (
                        <Link to={`/payment/${a.id}`}>
                          <Button size="sm" variant="outline">
                            {t('patients.detail.cash')}
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function statusVariant(s: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  if (s === 'COMPLETED') return 'success';
  if (s === 'CONFIRMED') return 'success';
  if (s === 'IN_PROGRESS') return 'info';
  if (s === 'NO_SHOW') return 'danger';
  if (s === 'CANCELLED') return 'neutral';
  return 'neutral';
}

function weeksBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}
