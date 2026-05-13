import { useRef, useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@reset/ui';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useAuthStore } from '../../lib/auth';
import {
  ClipboardList,
  Stethoscope,
  Plus,
  FileText,
  ChevronRight,
  Camera,
  X,
  Tag,
  Activity as ActivityIcon,
  AlertTriangle,
  Phone as PhoneIcon,
  StickyNote,
  Trash2,
  MessageSquareText,
  TrendingUp,
  Camera as CameraIcon,
} from 'lucide-react';
import { LineChart, type LineSeries } from '../../components/charts';
import { useToast } from '../../lib/toast';

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
    avatarUrl: string | null;
    tags: string[];
    preferredLanguage: string;
    createdAt: string;
    preferredPractitioner: { firstName: string; lastName: string } | null;
    medicalRecord: {
      id: string;
      finalizedAt: string | null;
      stressScore: number | null;
      anxietyScore: number | null;
      cravingScore: number | null;
      sleepScore: number | null;
      motivationScore: number | null;
    } | null;
    appointments: Array<{
      id: string;
      scheduledAt: string;
      service: string;
      visitType: string;
      status: string;
      price: string | number;
      practitioner: { firstName: string };
      payment: { invoiceNumber: string; total: string | number } | null;
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

type TabKey = 'accueil' | 'clinique' | 'suivi';

// Tags suggérés (templates rapides). Le user peut ajouter des libres aussi.
const SUGGESTED_TAGS = [
  { value: 'vip', label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  {
    value: 'paie en retard',
    label: 'Paie en retard',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  {
    value: 'allergie laser',
    label: 'Allergie laser',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    value: 'fragile',
    label: 'Fragile / anxieux',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  {
    value: 'rdv repeat',
    label: 'Annule souvent',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    value: 'famille',
    label: 'Famille du staff',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
];

function tagPalette(t: string): string {
  const found = SUGGESTED_TAGS.find((s) => s.value === t);
  if (found) return found.color;
  return 'bg-bg-secondary text-text-secondary border-border';
}

function tagLabel(t: string): string {
  const found = SUGGESTED_TAGS.find((s) => s.value === t);
  return found ? found.label : t;
}

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
          <CardContent className="flex items-start gap-4">
            <PatientAvatarUpload
              patient={patient}
              editable={!isPractitioner /* tout le monde sauf praticien peut éditer */ || user?.role === 'PRACTITIONER'}
            />
            <div className="flex-1 min-w-0">
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
              <PatientTagsEditor patient={patient} />
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
            badge={patient.medicalRecord ? 1 : undefined}
          />
          <TabButton
            active={tab === 'suivi'}
            onClick={() => switchTab('suivi')}
            Icon={MessageSquareText}
            label={t('patients.detail.tab.followUp', 'Suivi')}
          />
        </div>

        {/* === ONGLET SUIVI === */}
        {tab === 'suivi' && (
          <div className="space-y-6">
            <ScoreEvolutionChart patientId={patient.id} hasMedicalRecord={!!patient.medicalRecord} />
            <FollowUpTimeline patientId={patient.id} />
          </div>
        )}

        {/* === ONGLET FICHE CLINIQUE === */}
        {tab === 'clinique' && (
          <ClinicalTabContent
            patient={patient}
            isPractitioner={isPractitioner}
          />
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

function ClinicalTabContent({
  patient,
  isPractitioner,
}: {
  patient: PatientDetail['patient'];
  isPractitioner: boolean;
}) {
  const { t, i18n } = useTranslation();
  const mr = patient.medicalRecord;

  if (!mr) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary-lightest text-primary-dark mx-auto flex items-center justify-center mb-4">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {t('patients.detail.clinical.noneTitle', "Aucune fiche clinique pour ce patient")}
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            {isPractitioner
              ? t(
                  'patients.detail.clinical.noneHintDoctor',
                  "Créez la fiche clinique en posant les questions nécessaires au patient pour comprendre son addiction en détail.",
                )
              : t(
                  'patients.detail.clinical.noneHintOther',
                  "La fiche clinique sera créée par le médecin lors de la première consultation.",
                )}
          </p>
          {isPractitioner && (
            <Link to={`/patients/${patient.id}/clinical`}>
              <Button>
                <Plus className="w-4 h-4 me-1.5" />
                {t('patients.detail.clinical.createFull', "Créer la fiche clinique")}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const isFinalized = !!mr.finalizedAt;
  const scoresFilled = [
    mr.stressScore,
    mr.anxietyScore,
    mr.cravingScore,
    mr.sleepScore,
    mr.motivationScore,
  ].filter((s) => s !== null && s !== undefined).length;

  return (
    <Card>
      <div className="px-5 py-4 border-b border-border-light flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">
              {t('patients.detail.clinical.recordTitle', 'Fiche clinique du patient')}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {isFinalized
                ? `${t('clinical.finalizedOn', 'Terminée le')} ${new Date(mr.finalizedAt!).toLocaleDateString(i18n.language)}`
                : t('patients.detail.clinical.draftStatus', 'Brouillon en cours')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isFinalized ? 'success' : 'warning'}>
            {isFinalized
              ? t('clinical.finalized', 'Terminée')
              : t('patients.detail.clinical.inProgress', 'En cours')}
          </Badge>
          <Link to={`/patients/${patient.id}/clinical`}>
            <Button size="sm">
              <FileText className="w-3.5 h-3.5 me-1.5" />
              {isPractitioner
                ? t('patients.detail.clinical.openEdit', 'Ouvrir / Modifier')
                : t('patients.detail.clinical.view', 'Voir')}
              <ChevronRight className="w-3.5 h-3.5 ms-0.5" />
            </Button>
          </Link>
        </div>
      </div>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <SummaryStat label="Stress" value={mr.stressScore} max={10} tone={mr.stressScore && mr.stressScore >= 7 ? 'danger' : 'default'} />
          <SummaryStat label="Anxiété" value={mr.anxietyScore} max={10} tone={mr.anxietyScore && mr.anxietyScore >= 7 ? 'danger' : 'default'} />
          <SummaryStat label="Envies" value={mr.cravingScore} max={10} tone={mr.cravingScore && mr.cravingScore >= 7 ? 'warning' : 'default'} />
          <SummaryStat label="Sommeil" value={mr.sleepScore} max={10} tone={mr.sleepScore && mr.sleepScore <= 3 ? 'warning' : 'default'} />
          <SummaryStat label="Motivation" value={mr.motivationScore} max={10} tone={mr.motivationScore && mr.motivationScore >= 7 ? 'success' : 'default'} />
        </div>
        {scoresFilled === 0 && (
          <p className="text-xs text-text-tertiary italic mt-3 text-center">
            {t(
              'patients.detail.clinical.noScoresYet',
              "Les évaluations 0-10 n'ont pas encore été renseignées.",
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  max,
  tone = 'default',
}: {
  label: string;
  value: number | null | undefined;
  max: number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colors = {
    default: 'text-text',
    success: 'text-primary-dark',
    warning: 'text-warning-dark',
    danger: 'text-danger-dark',
  };
  const isSet = value !== null && value !== undefined;
  return (
    <div className="rounded-lg bg-bg-secondary/40 border border-border-light px-3 py-2.5">
      <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">{label}</div>
      <div className={`mt-0.5 font-bold tabular-nums ${isSet ? `text-xl ${colors[tone]}` : 'text-base text-text-tertiary italic'}`}>
        {isSet ? `${value}/${max}` : '—'}
      </div>
    </div>
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

// ======================================================================
// Avatar upload — redimensionne + compresse côté client en data URL JPEG
// avant de l'envoyer à l'API. Cible : 256×256 max, qualité 0.82, ~20 KB.
// ======================================================================

async function resizeImage(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas-context'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('img-load'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('file-read'));
    reader.readAsDataURL(file);
  });
}

function PatientAvatarUpload({
  patient,
  editable,
}: {
  patient: PatientDetail['patient'];
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const setAvatar = useMutation({
    mutationFn: (dataUrl: string | null) =>
      apiPatch(`/patients/${patient.id}/avatar`, { dataUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
    },
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      await setAvatar.mutateAsync(dataUrl);
    } catch (err) {
      alert('Impossible de traiter cette image. Réessayez avec un format JPEG ou PNG.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const initials = patient.firstName.charAt(0) + patient.lastName.charAt(0);

  return (
    <div className="relative shrink-0">
      <Avatar className="h-20 w-20 ring-2 ring-border shadow-sm">
        {patient.avatarUrl ? (
          <AvatarImage src={patient.avatarUrl} alt={`${patient.firstName} ${patient.lastName}`} />
        ) : null}
        <AvatarFallback className="bg-gradient-to-br from-primary-light to-secondary text-primary-dark text-2xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || setAvatar.isPending}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white border-2 border-surface shadow-md flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-60"
            aria-label="Changer la photo"
            title="Changer la photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          {patient.avatarUrl && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Retirer la photo et revenir aux initiales ?')) {
                  setAvatar.mutate(null);
                }
              }}
              disabled={setAvatar.isPending}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white border-2 border-surface shadow flex items-center justify-center hover:bg-danger-dark transition-colors"
              aria-label="Retirer la photo"
              title="Retirer la photo"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
        </>
      )}
    </div>
  );
}

// ======================================================================
// Tags patient — affichage + édition inline
// ======================================================================

function PatientTagsEditor({ patient }: { patient: PatientDetail['patient'] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const currentTags = patient.tags ?? [];

  const save = useMutation({
    mutationFn: (tags: string[]) => apiPatch(`/patients/${patient.id}`, { tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
      setEditing(false);
    },
  });

  function toggleTag(tag: string) {
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    save.mutate(next);
  }

  function addCustom() {
    const v = draftValue.trim().toLowerCase();
    if (!v) return;
    if (currentTags.includes(v)) {
      setDraftValue('');
      return;
    }
    save.mutate([...currentTags, v]);
    setDraftValue('');
  }

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {currentTags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${tagPalette(tag)}`}
          >
            <Tag className="w-2.5 h-2.5" />
            {tagLabel(tag)}
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              className="hover:opacity-70"
              aria-label={`Retirer ${tagLabel(tag)}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-dashed border-border text-text-tertiary hover:text-primary hover:border-primary transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
            Ajouter un tag
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border bg-bg-secondary text-text-secondary hover:bg-bg-secondary/70"
          >
            <X className="w-2.5 h-2.5" />
            Fermer
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-bg-secondary/30 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map((s) => {
              const active = currentTags.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleTag(s.value)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                    active
                      ? `${s.color} ring-2 ring-offset-1 ring-primary/40`
                      : `${s.color} opacity-60 hover:opacity-100`
                  }`}
                >
                  {active ? '✓' : '+'} {s.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="Tag personnalisé (ex: vegan, fume occasionnellement…)"
              maxLength={24}
              className="flex-1 px-2 py-1 text-xs rounded-md border border-border bg-surface focus:border-primary focus:outline-none"
            />
            <Button size="sm" variant="outline" onClick={addCustom} disabled={!draftValue.trim()}>
              Ajouter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================================
// Évolution des scores patient — LineChart avec snapshots datés
// ======================================================================

interface ScoreSnapshot {
  id: string;
  takenAt: string;
  stressScore: number | null;
  anxietyScore: number | null;
  cravingScore: number | null;
  sleepScore: number | null;
  motivationScore: number | null;
  selfEsteemScore: number | null;
  notes: string | null;
  takenBy: { firstName: string; lastName: string } | null;
}

function ScoreEvolutionChart({
  patientId,
  hasMedicalRecord,
}: {
  patientId: string;
  hasMedicalRecord: boolean;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const isPractitioner = user?.role === 'PRACTITIONER';

  const { data, isLoading } = useQuery({
    queryKey: ['patient-score-snapshots', patientId],
    queryFn: () =>
      apiGet<{ snapshots: ScoreSnapshot[] }>(`/patients/${patientId}/score-snapshots`),
  });

  const takeSnapshot = useMutation({
    mutationFn: () =>
      apiPost(`/patients/${patientId}/score-snapshots`, { useCurrent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-score-snapshots', patientId] });
      toast.success(
        t('patients.detail.scoresEvolution.snapshotTaken', 'Snapshot des scores enregistré'),
      );
    },
    onError: () => {
      toast.error(
        t('patients.detail.scoresEvolution.snapshotFailed', 'Impossible de prendre le snapshot'),
      );
    },
  });

  const snapshots = data?.snapshots ?? [];
  const xLabels = snapshots.map((s) =>
    new Date(s.takenAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
  );
  const series: LineSeries[] = [
    { label: 'Stress', color: '#FF5440', values: snapshots.map((s) => s.stressScore) },
    { label: 'Anxiété', color: '#A855F7', values: snapshots.map((s) => s.anxietyScore) },
    { label: 'Envies', color: '#F59E0B', values: snapshots.map((s) => s.cravingScore) },
    { label: 'Sommeil', color: '#0EA5E9', values: snapshots.map((s) => s.sleepScore) },
    { label: 'Motivation', color: '#1E0FBA', values: snapshots.map((s) => s.motivationScore) },
    { label: 'Estime', color: '#10B981', values: snapshots.map((s) => s.selfEsteemScore) },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap w-full">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t('patients.detail.scoresEvolution.title', 'Évolution des scores')}
          </CardTitle>
          {isPractitioner && hasMedicalRecord && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => takeSnapshot.mutate()}
              disabled={takeSnapshot.isPending}
            >
              <CameraIcon className="w-3.5 h-3.5 me-1.5" />
              {takeSnapshot.isPending
                ? t('common.loading')
                : t(
                    'patients.detail.scoresEvolution.snapshotButton',
                    'Snapshot des scores actuels',
                  )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 bg-bg-secondary/30 rounded animate-pulse" />
        ) : snapshots.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <TrendingUp className="w-10 h-10 mx-auto text-text-tertiary mb-2" />
            <p className="text-sm">
              {t(
                'patients.detail.scoresEvolution.empty',
                "Aucun snapshot pour le moment. Le médecin peut figer un instantané des scores après chaque séance pour suivre l'évolution.",
              )}
            </p>
            {!hasMedicalRecord && (
              <p className="text-xs text-text-tertiary mt-2 italic">
                {t(
                  'patients.detail.scoresEvolution.needsRecord',
                  "La fiche clinique doit être créée d'abord.",
                )}
              </p>
            )}
          </div>
        ) : snapshots.length === 1 ? (
          <SingleSnapshotView snapshot={snapshots[0]!} lang={i18n.language} />
        ) : (
          <div>
            <div dir="ltr" className="overflow-x-auto">
              <LineChart
                series={series}
                xLabels={xLabels}
                min={0}
                max={10}
                height={260}
                ariaLabel={t('patients.detail.scoresEvolution.title', 'Évolution des scores')}
              />
            </div>
            {/* Légende */}
            <div className="flex items-center gap-4 flex-wrap mt-4 text-xs">
              {series.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-text-secondary">{s.label}</span>
                </span>
              ))}
            </div>
            {/* Comparatif premier vs dernier */}
            <ScoreEvolutionSummary snapshots={snapshots} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SingleSnapshotView({ snapshot, lang }: { snapshot: ScoreSnapshot; lang: string }) {
  const { t } = useTranslation();
  const scores: Array<{ label: string; value: number | null; tone: 'good' | 'bad' | 'neutral' }> = [
    { label: 'Stress', value: snapshot.stressScore, tone: 'bad' },
    { label: 'Anxiété', value: snapshot.anxietyScore, tone: 'bad' },
    { label: 'Envies', value: snapshot.cravingScore, tone: 'bad' },
    { label: 'Sommeil', value: snapshot.sleepScore, tone: 'good' },
    { label: 'Motivation', value: snapshot.motivationScore, tone: 'good' },
    { label: 'Estime', value: snapshot.selfEsteemScore, tone: 'good' },
  ];
  return (
    <div>
      <div className="text-xs text-text-secondary mb-3">
        {t(
          'patients.detail.scoresEvolution.firstSnapshot',
          'Premier snapshot enregistré le {{date}}. Prenez-en un nouveau après la prochaine séance pour voir la courbe d\'évolution.',
          {
            date: new Date(snapshot.takenAt).toLocaleDateString(lang, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          },
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {scores.map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-bg-secondary/40 border border-border-light p-3 text-center"
          >
            <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wide">
              {s.label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {s.value !== null ? `${s.value}/10` : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreEvolutionSummary({ snapshots }: { snapshots: ScoreSnapshot[] }) {
  const { t } = useTranslation();
  if (snapshots.length < 2) return null;
  const first = snapshots[0]!;
  const last = snapshots[snapshots.length - 1]!;
  const fields: Array<{ key: keyof ScoreSnapshot; label: string; better: 'lower' | 'higher' }> = [
    { key: 'stressScore', label: 'Stress', better: 'lower' },
    { key: 'anxietyScore', label: 'Anxiété', better: 'lower' },
    { key: 'cravingScore', label: 'Envies', better: 'lower' },
    { key: 'sleepScore', label: 'Sommeil', better: 'higher' },
    { key: 'motivationScore', label: 'Motivation', better: 'higher' },
    { key: 'selfEsteemScore', label: 'Estime', better: 'higher' },
  ];
  return (
    <div className="mt-4 pt-4 border-t border-border-light">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">
        {t('patients.detail.scoresEvolution.summary', 'Évolution depuis le 1er snapshot')}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {fields.map((f) => {
          const a = first[f.key] as number | null;
          const b = last[f.key] as number | null;
          if (a === null || b === null) {
            return (
              <div
                key={f.key as string}
                className="rounded-lg bg-bg-secondary/30 border border-border-light p-2 text-center"
              >
                <div className="text-[10px] text-text-tertiary">{f.label}</div>
                <div className="text-base text-text-tertiary italic">—</div>
              </div>
            );
          }
          const delta = b - a;
          const improved = f.better === 'lower' ? delta < 0 : delta > 0;
          const stable = delta === 0;
          const color = stable
            ? 'text-text-secondary'
            : improved
              ? 'text-primary-dark'
              : 'text-danger-dark';
          const sign = delta > 0 ? '+' : '';
          return (
            <div
              key={f.key as string}
              className="rounded-lg bg-bg-secondary/30 border border-border-light p-2 text-center"
            >
              <div className="text-[10px] text-text-tertiary">{f.label}</div>
              <div className={`text-base font-bold tabular-nums ${color}`}>
                {sign}
                {delta}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================================
// Timeline notes de suivi — chronologique avec types et auteur
// ======================================================================

interface FollowUpNote {
  id: string;
  content: string;
  kind: 'NOTE' | 'OBSERVATION' | 'ALERT' | 'CALL' | 'RELAPSE';
  createdAt: string;
  appointmentId: string | null;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

const NOTE_KIND_META: Record<string, { Icon: typeof StickyNote; color: string; label: string }> = {
  NOTE: {
    Icon: StickyNote,
    color: 'bg-bg-secondary text-text-secondary border-border',
    label: 'Note',
  },
  OBSERVATION: {
    Icon: Stethoscope,
    color: 'bg-info-light text-info-dark border-info',
    label: 'Observation',
  },
  ALERT: {
    Icon: AlertTriangle,
    color: 'bg-danger-light text-danger-dark border-danger',
    label: 'Alerte',
  },
  CALL: {
    Icon: PhoneIcon,
    color: 'bg-primary-lightest text-primary-dark border-primary-light',
    label: 'Appel',
  },
  RELAPSE: {
    Icon: ActivityIcon,
    color: 'bg-warning-light text-warning-dark border-warning',
    label: 'Rechute',
  },
};

function FollowUpTimeline({ patientId }: { patientId: string }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState<FollowUpNote['kind']>('NOTE');

  const { data } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: () => apiGet<{ notes: FollowUpNote[] }>(`/patients/${patientId}/notes`),
  });

  const addNote = useMutation({
    mutationFn: (payload: { content: string; kind: FollowUpNote['kind'] }) =>
      apiPost(`/patients/${patientId}/notes`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
      setDraft('');
      setKind('NOTE');
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => apiDelete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
    },
  });

  const notes = data?.notes ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-primary" />
          {t('patients.detail.followUp.title', 'Notes de suivi')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Composer */}
        <div className="rounded-xl border border-border bg-bg-secondary/30 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(NOTE_KIND_META).map(([k, meta]) => {
              const active = kind === (k as FollowUpNote['kind']);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k as FollowUpNote['kind'])}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    active
                      ? `${meta.color} ring-2 ring-primary/30 shadow-sm`
                      : `${meta.color} opacity-50 hover:opacity-100`
                  }`}
                >
                  <meta.Icon className="w-3 h-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t(
              'patients.detail.followUp.placeholder',
              'Notez une observation, un appel passé, une rechute, une alerte…',
            )}
            rows={3}
            maxLength={4000}
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:border-primary focus:outline-none resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary">
              {draft.length}/4000 — En tant que {user?.firstName} ({user?.role})
            </span>
            <Button
              size="sm"
              disabled={!draft.trim() || addNote.isPending}
              onClick={() => addNote.mutate({ content: draft.trim(), kind })}
            >
              <Plus className="w-3.5 h-3.5 me-1" />
              {addNote.isPending
                ? t('common.loading')
                : t('patients.detail.followUp.add', 'Ajouter')}
            </Button>
          </div>
        </div>

        {/* Timeline */}
        {notes.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <MessageSquareText className="w-10 h-10 mx-auto text-text-tertiary mb-2" />
            <p className="text-sm">
              {t(
                'patients.detail.followUp.empty',
                'Aucune note pour le moment. Ajoutez la première ci-dessus.',
              )}
            </p>
          </div>
        ) : (
          <ol className="relative border-s-2 border-border-light ms-3 space-y-5">
            {notes.map((n) => {
              const meta = NOTE_KIND_META[n.kind] ?? NOTE_KIND_META.NOTE!;
              const canDelete =
                user?.role === 'ADMIN' || (user && n.author.id === user.id);
              return (
                <li key={n.id} className="ms-6 relative">
                  <span
                    className={`absolute -start-[34px] top-1 inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-surface shadow-sm ${meta.color}`}
                  >
                    <meta.Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="rounded-lg border border-border bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-text-tertiary tabular-nums">
                            {new Date(n.createdAt).toLocaleString(i18n.language, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-text whitespace-pre-line break-words">
                          {n.content}
                        </p>
                        <p className="mt-2 text-[11px] text-text-tertiary">
                          {n.author.firstName} {n.author.lastName.charAt(0)}. ·{' '}
                          {n.author.role.toLowerCase()}
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Supprimer cette note ?')) deleteNote.mutate(n.id);
                          }}
                          className="text-text-tertiary hover:text-danger transition-colors p-1"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
