import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

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

const ADDICTION_LABEL: Record<string, string> = {
  TOBACCO: '🚬 Tabac',
  DRUGS: '💊 Drogue',
  ALCOHOL: '🍷 Alcool',
  SUGAR: '🍬 Sucre',
  STRESS: '😰 Stress',
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiGet<PatientDetail>(`/patients/${id}`),
    enabled: !!id,
  });

  if (!data) return <div className="p-7">Chargement…</div>;
  const { patient, stats, evolution } = data;
  const initials = patient.firstName.charAt(0) + patient.lastName.charAt(0);

  // Evolution score: average of (stress + anxiety + craving) decrease
  const first = evolution[0];
  const last = evolution[evolution.length - 1];
  let evolutionScore: number | null = null;
  if (first && last && evolution.length > 1) {
    const initial = (first.stressScore ?? 0) + (first.anxietyScore ?? 0) + (first.cravingScore ?? 0);
    const current = (last.stressScore ?? 0) + (last.anxietyScore ?? 0) + (last.cravingScore ?? 0);
    if (initial > 0) evolutionScore = Math.round(((initial - current) / initial) * 100);
  }

  return (
    <>
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.age ?? '—'} ans · ${patient.governorate ?? ''} · Patient depuis ${new Date(patient.createdAt).toLocaleDateString()}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${patient.phone}`}>📞 Appeler</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://wa.me/${(patient.whatsapp ?? patient.phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                💬 WhatsApp
              </a>
            </Button>
            <Button asChild>
              <Link to={`/appointments/new?patientId=${patient.id}`}>➕ Nouveau RDV</Link>
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
                  {patient.status === 'ACTIVE' ? 'Suivi en cours' : patient.status}
                </Badge>
                <Badge variant="warning">{ADDICTION_LABEL[patient.primaryAddiction]}</Badge>
                {patient.preferredPractitioner && (
                  <Badge variant="info">
                    Dr. {patient.preferredPractitioner.firstName} {patient.preferredPractitioner.lastName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary mt-1">
                📞 {patient.phone} {patient.email ? ` · ✉️ ${patient.email}` : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">📋 Séances</p>
              <p className="text-3xl font-bold">{stats.sessionsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">💰 Total payé</p>
              <p className="text-3xl font-bold">{stats.totalPaid.toLocaleString()} EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">⏱️ Ancienneté</p>
              <p className="text-3xl font-bold">
                {weeksBetween(patient.createdAt, new Date().toISOString())} sem.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">📈 Évolution</p>
              <p className="text-3xl font-bold text-primary-dark">
                {evolutionScore !== null ? `+${evolutionScore}%` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📜 Historique des séances</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Praticien</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Statut</th>
                  <th className="text-right px-4 py-2">Montant</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patient.appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{new Date(a.scheduledAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-text-secondary">Dr. {a.practitioner.firstName}</td>
                    <td className="px-4 py-2">
                      {ADDICTION_LABEL[a.service]} · {a.visitType === 'FIRST' ? '1ère' : 'Suivi'}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      {a.payment ? `${Number(a.payment.total).toLocaleString()} EGP` : `${Number(a.price).toLocaleString()} (à encaisser)`}
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      {!a.medicalRecord && a.status !== 'CANCELLED' && (
                        <Link to={`/patients/${patient.id}/clinical?appointmentId=${a.id}`}>
                          <Button size="sm" variant="outline">Fiche clinique</Button>
                        </Link>
                      )}
                      {!a.payment && a.status !== 'CANCELLED' && (
                        <Link to={`/payment/${a.id}`}>
                          <Button size="sm" variant="outline">Encaisser</Button>
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
