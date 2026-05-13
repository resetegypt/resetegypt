import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useAuthStore } from '../../lib/auth';
import { ClipboardList, Stethoscope, Plus, FileText, ChevronRight } from 'lucide-react';

interface ConsentEntry {
  accepted: boolean;
  timestamp: string;
}

interface PatientDetail {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: 'MALE' | 'FEMALE' | null;
    phone: string;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    age: number | null;
    governorate: string | null;
    profession: string | null;
    maritalStatus: string | null;
    acquisitionSource: string[];
    primaryAddiction: string;
    previousAttempts: string | null;
    motivationLevel: string | null;
    emergencyContact: { name?: string; phone?: string; relationship?: string } | null;
    consents: {
      dataProtection?: ConsentEntry;
      smsAuthorization?: ConsentEntry;
      nonMedicalAcknowledgement?: ConsentEntry;
    };
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

type TabKey = 'accueil' | 'clinique';

export function PatientDetailPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isPractitioner = user?.role === 'PRACTITIONER';
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'accueil';
  const [tab, setTab] = useState<TabKey>(initialTab);

  function switchTab(t: TabKey): void {
    setTab(t);
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next, { replace: true });
  }

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

        {/* === TAB NAV === */}
        <div className="flex items-center gap-1 border-b border-border">
          <TabButton
            active={tab === 'accueil'}
            onClick={() => switchTab('accueil')}
            Icon={ClipboardList}
            label={t('patients.detail.tab.intake', "Fiche d'accueil")}
          />
          <TabButton
            active={tab === 'clinique'}
            onClick={() => switchTab('clinique')}
            Icon={Stethoscope}
            label={t('patients.detail.tab.clinical', 'Fiche clinique')}
            badge={patient.appointments.filter((a) => a.medicalRecord).length || undefined}
          />
        </div>

        {/* === ONGLET FICHE CLINIQUE === */}
        {tab === 'clinique' && (
          <Card>
            <CardHeader>
              <CardTitle>🩺 {t('patients.detail.clinical.title', 'Fiches cliniques par séance')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {patient.appointments.filter((a) => a.status !== 'CANCELLED').length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Stethoscope className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm font-semibold">
                    {t('patients.detail.clinical.empty', 'Aucune séance pour ce patient')}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {t(
                      'patients.detail.clinical.emptyHint',
                      'Les fiches cliniques sont créées séance par séance.',
                    )}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border-light">
                  {patient.appointments
                    .filter((a) => a.status !== 'CANCELLED')
                    .map((a) => (
                      <ClinicalRow
                        key={a.id}
                        appointment={a}
                        patientId={patient.id}
                        isPractitioner={isPractitioner}
                      />
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* === ONGLET FICHE D'ACCUEIL — toutes les infos saisies à l'admission === */}
        {tab === 'accueil' && (
        <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 w-full">
              <CardTitle>📋 {t('patients.detail.intakeSection', "Fiche d'accueil")}</CardTitle>
              {!isPractitioner && (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/patients/${patient.id}/edit`}>
                    ✏️ {t('common.edit', 'Modifier')}
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border-light">
              <IntakeSection title={t('patients.intake.identity', 'Identité')} icon="🆔">
                <Field
                  label={t('patients.intake.firstName', 'Prénom')}
                  value={patient.firstName}
                />
                <Field
                  label={t('patients.intake.lastName', 'Nom')}
                  value={patient.lastName}
                />
                <Field
                  label={t('patients.intake.dateOfBirth', 'Date de naissance')}
                  value={
                    patient.dateOfBirth
                      ? new Date(patient.dateOfBirth).toLocaleDateString(i18n.language)
                      : '—'
                  }
                />
                <Field
                  label={t('patients.intake.age', 'Âge')}
                  value={patient.age ? `${patient.age} ${t('patients.detail.yearsLabel', 'ans')}` : '—'}
                />
                <Field
                  label={t('patients.intake.gender', 'Genre')}
                  value={
                    patient.gender === 'MALE'
                      ? t('patients.intake.male', 'Homme')
                      : patient.gender === 'FEMALE'
                        ? t('patients.intake.female', 'Femme')
                        : '—'
                  }
                />
                <Field
                  label={t('patients.intake.preferredLanguage', 'Langue préférée')}
                  value={
                    patient.preferredLanguage === 'fr'
                      ? 'Français'
                      : patient.preferredLanguage === 'ar'
                        ? 'العربية'
                        : 'English'
                  }
                />
              </IntakeSection>

              <IntakeSection title={t('patients.intake.contact', 'Contact')} icon="📞">
                <Field
                  label={t('patients.intake.phone', 'Téléphone')}
                  value={patient.phone}
                  mono
                />
                <Field
                  label={t('patients.intake.whatsapp', 'WhatsApp')}
                  value={patient.whatsapp ?? '—'}
                  mono
                />
                <Field
                  label={t('patients.intake.email', 'Email')}
                  value={patient.email ?? '—'}
                />
                <Field
                  label={t('patients.intake.profession', 'Profession')}
                  value={patient.profession ?? '—'}
                />
                <Field
                  label={t('patients.intake.address', 'Adresse')}
                  value={patient.address ?? '—'}
                  wide
                />
                <Field
                  label={t('patients.intake.governorate', 'Gouvernorat')}
                  value={patient.governorate ?? '—'}
                />
              </IntakeSection>

              <IntakeSection title={t('patients.intake.consultationReason', 'Motif de consultation')} icon="🎯">
                <Field
                  label={t('patients.intake.addictionType', 'Type d\'addiction')}
                  value={`${ADDICTION_ICON[patient.primaryAddiction]} ${t(`addiction.${patient.primaryAddiction}`)}`}
                />
                <Field
                  label={t('patients.intake.previousAttempts', 'Tentatives précédentes')}
                  value={patient.previousAttempts ?? '—'}
                />
                <Field
                  label={t('patients.intake.motivationLevel', 'Niveau de motivation')}
                  value={
                    patient.motivationLevel === 'high'
                      ? t('patients.intake.motivation.high', 'Élevé')
                      : patient.motivationLevel === 'medium'
                        ? t('patients.intake.motivation.medium', 'Moyen')
                        : patient.motivationLevel === 'low'
                          ? t('patients.intake.motivation.low', 'Faible')
                          : '—'
                  }
                />
                <Field
                  label={t('patients.intake.acquisitionSource', "Source d'acquisition")}
                  value={
                    patient.acquisitionSource.length > 0
                      ? patient.acquisitionSource
                          .map((s) => t(`patients.intake.sources.${s}`, s))
                          .join(', ')
                      : '—'
                  }
                  wide
                />
              </IntakeSection>

              <IntakeSection title={t('patients.intake.emergencyContact', 'Contact d\'urgence')} icon="🆘">
                <Field
                  label={t('patients.intake.emergencyName', 'Nom')}
                  value={patient.emergencyContact?.name ?? '—'}
                />
                <Field
                  label={t('patients.intake.emergencyPhone', 'Téléphone')}
                  value={patient.emergencyContact?.phone ?? '—'}
                  mono
                />
              </IntakeSection>

              <IntakeSection title={t('patients.intake.consents', 'Consentements')} icon="🛡️">
                <ConsentRow
                  label={t('patients.intake.consent1', 'Protection des données (loi 151/2020)')}
                  consent={patient.consents.dataProtection}
                  required
                />
                <ConsentRow
                  label={t('patients.intake.consent2', 'Autorisation SMS / WhatsApp')}
                  consent={patient.consents.smsAuthorization}
                />
                <ConsentRow
                  label={t('patients.intake.consent3', 'Reconnaissance centre non-médical')}
                  consent={patient.consents.nonMedicalAcknowledgement}
                  required
                />
              </IntakeSection>
            </div>
          </CardContent>
        </Card>

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
        </>
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof ClipboardList;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
        active
          ? 'text-primary'
          : 'text-text-secondary hover:text-text'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-text-tertiary'}`} />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold ${
            active
              ? 'bg-primary text-white'
              : 'bg-bg-secondary text-text-secondary'
          }`}
        >
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary rounded-full" />
      )}
    </button>
  );
}

function ClinicalRow({
  appointment,
  patientId,
  isPractitioner,
}: {
  appointment: PatientDetail['patient']['appointments'][number];
  patientId: string;
  isPractitioner: boolean;
}) {
  const { t, i18n } = useTranslation();
  const a = appointment;
  const date = new Date(a.scheduledAt);
  const hasRecord = !!a.medicalRecord;
  return (
    <li className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-secondary/30 transition-colors">
      <div className="flex flex-col items-end w-24 shrink-0 text-text-secondary">
        <span className="text-xs font-semibold text-text" data-numeric>
          {date.toLocaleDateString(i18n.language, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="text-[11px] text-text-tertiary" data-numeric>
          {date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold flex items-center gap-2">
          <span>{ADDICTION_ICON[a.service]} {t(`addiction.${a.service}`)}</span>
          <span className="text-text-tertiary">·</span>
          <span className="text-text-secondary font-medium">
            {t(`dashboard.visitType.${a.visitType}`)}
          </span>
        </div>
        <div className="text-xs text-text-secondary mt-0.5">Dr. {a.practitioner.firstName}</div>
      </div>
      <Badge variant={statusVariant(a.status)}>{t(`appointmentStatus.${a.status}`)}</Badge>
      <div className="min-w-[140px] flex justify-end">
        {hasRecord ? (
          <Link to={`/patients/${patientId}/clinical?appointmentId=${a.id}`}>
            <Button size="sm" variant="outline">
              <FileText className="w-3.5 h-3.5 me-1.5" />
              {t('patients.detail.clinical.view', 'Voir')}
              <ChevronRight className="w-3.5 h-3.5 ms-0.5" />
            </Button>
          </Link>
        ) : isPractitioner ? (
          <Link to={`/patients/${patientId}/clinical?appointmentId=${a.id}`}>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 me-1.5" />
              {t('patients.detail.clinical.create', 'Créer')}
            </Button>
          </Link>
        ) : (
          <span className="text-xs text-text-tertiary italic">
            {t('patients.detail.clinical.notYet', 'Pas encore créée')}
          </span>
        )}
      </div>
    </li>
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

function IntakeSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <h4 className="text-xs font-bold tracking-[0.12em] uppercase text-text-tertiary mb-3 flex items-center gap-1.5">
        <span>{icon}</span>
        <span>{title}</span>
      </h4>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
        {children}
      </dl>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  wide?: boolean;
}) {
  const isEmpty = !value || value === '—';
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <dt className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </dt>
      <dd
        className={`text-sm mt-0.5 ${isEmpty ? 'text-text-tertiary italic' : 'text-text font-medium'} ${
          mono ? 'font-mono' : ''
        }`}
        data-numeric={mono ? 'true' : undefined}
      >
        {value || '—'}
      </dd>
    </div>
  );
}

function ConsentRow({
  label,
  consent,
  required = false,
}: {
  label: string;
  consent: { accepted: boolean; timestamp: string } | undefined;
  required?: boolean;
}) {
  const accepted = consent?.accepted ?? false;
  const dateStr = consent?.timestamp
    ? new Date(consent.timestamp).toLocaleDateString()
    : null;
  return (
    <div className="sm:col-span-2 lg:col-span-3 flex items-start gap-3 py-1">
      <span
        className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
          accepted
            ? 'bg-primary-lightest text-primary-dark ring-1 ring-primary-light'
            : required
              ? 'bg-danger-light text-danger-dark ring-1 ring-danger-light'
              : 'bg-bg-secondary text-text-tertiary'
        }`}
      >
        {accepted ? '✓' : required ? '!' : '—'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </div>
        {dateStr && (
          <div className="text-[11px] text-text-tertiary mt-0.5">
            Signé le {dateStr}
          </div>
        )}
      </div>
    </div>
  );
}
