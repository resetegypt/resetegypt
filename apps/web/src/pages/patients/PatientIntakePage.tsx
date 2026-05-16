import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { ADDICTIONS, type Addiction } from '@reset/shared';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

const ADDICTION_ICON: Record<Addiction, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

const GOVERNORATES = ['Le Caire', 'Gizeh', 'Alexandrie', 'New Cairo', 'Charm el-Cheikh', 'Autre'];
const SOURCE_KEYS = ['instagram', 'facebook', 'google', 'wordOfMouth', 'doctor', 'other'] as const;

// Prix par défaut selon le service pour une première séance
const PRICE_FIRST: Record<Addiction, number> = {
  TOBACCO: 3500,
  DRUGS: 4000,
  ALCOHOL: 4000,
  SUGAR: 2500,
  STRESS: 2000,
};

// Arrondit l'heure courante au prochain créneau de 40 min, format HH:MM
function nextSlot(): string {
  const now = new Date();
  const min = now.getMinutes();
  const next = Math.ceil(min / 40) * 40;
  const target = new Date(now);
  target.setMinutes(next, 0, 0);
  return `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
}

export function PatientIntakePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Slot pré-rempli si on vient de l'agenda (clic sur un créneau libre)
  const slotIso = searchParams.get('slot');
  const slotDate = slotIso ? new Date(slotIso) : null;
  const slotTime = slotDate
    ? `${String(slotDate.getHours()).padStart(2, '0')}:${String(slotDate.getMinutes()).padStart(2, '0')}`
    : nextSlot();
  const slotDateStr = slotDate ? slotDate.toISOString().slice(0, 10) : null;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    governorate: '',
    profession: '',
    primaryAddiction: '' as Addiction | '',
    previousAttempts: '',
    motivationLevel: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    acquisitionSource: [] as string[],
    preferredLanguage: 'fr',
  });
  const [consents, setConsents] = useState({ data: false, sms: true, nonMedical: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Rendez-vous : praticien + heure (par défaut, prochain créneau libre,
  // ou bien le créneau choisi sur l'agenda si on vient de là)
  const [bookAppointment, setBookAppointment] = useState(true);
  const [practitionerId, setPractitionerId] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState(slotTime);

  const { data: practitionersData } = useQuery({
    queryKey: ['practitioners'],
    queryFn: () =>
      apiGet<{ practitioners: Array<{ id: string; firstName: string; lastName: string }> }>(
        '/practitioners',
      ),
  });
  const practitioners = practitionersData?.practitioners ?? [];
  // Auto-select first practitioner if none set (sans déclencher de re-render boucle)
  useEffect(() => {
    if (practitioners.length > 0 && !practitionerId) {
      setPractitionerId(practitioners[0]!.id);
    }
  }, [practitioners, practitionerId]);

  function toggleSource(s: string) {
    setForm((f) => ({
      ...f,
      acquisitionSource: f.acquisitionSource.includes(s)
        ? f.acquisitionSource.filter((x) => x !== s)
        : [...f.acquisitionSource, s],
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!consents.data || !consents.nonMedical) {
      setError(t('patients.intake.consentsRequired'));
      return;
    }
    if (!form.primaryAddiction) {
      setError(t('patients.intake.addictionRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<{ patient: { id: string } }>('/patients', {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        phone: form.phone,
        whatsapp: form.whatsapp || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        governorate: form.governorate || undefined,
        profession: form.profession || undefined,
        primaryAddiction: form.primaryAddiction,
        previousAttempts: form.previousAttempts || undefined,
        motivationLevel: form.motivationLevel || undefined,
        emergencyContact: form.emergencyContactName
          ? { name: form.emergencyContactName, phone: form.emergencyContactPhone, relationship: '' }
          : undefined,
        acquisitionSource: form.acquisitionSource,
        preferredLanguage: form.preferredLanguage,
        consents: {
          dataProtection: { accepted: consents.data, timestamp: new Date().toISOString() },
          smsAuthorization: { accepted: consents.sms, timestamp: new Date().toISOString() },
          nonMedicalAcknowledgement: {
            accepted: consents.nonMedical,
            timestamp: new Date().toISOString(),
          },
        },
      });

      const patientId = res.patient.id;

      // Si demandé, créer un RDV pour que le docteur voie le patient
      // sur son dashboard. La date utilisée est celle du créneau cliqué
      // depuis l'agenda (slotDate) si fournie, sinon aujourd'hui.
      if (bookAppointment && practitionerId && form.primaryAddiction) {
        const [hh, mm] = appointmentTime.split(':');
        const scheduledAt = slotDate ? new Date(slotDate) : new Date();
        scheduledAt.setHours(parseInt(hh ?? '10', 10), parseInt(mm ?? '0', 10), 0, 0);
        try {
          await apiPost('/appointments', {
            patientId,
            practitionerId,
            scheduledAt: scheduledAt.toISOString(),
            service: form.primaryAddiction,
            visitType: 'FIRST',
            source: 'walkin',
            price: PRICE_FIRST[form.primaryAddiction as Addiction],
            duration: 40,
          });
        } catch (apptErr) {
          // L'intake a réussi, le RDV a échoué — on garde le patient créé.
          // L'utilisateur peut créer le RDV manuellement après.
          console.warn('Auto-appointment failed, patient created OK:', apptErr);
        }
      }

      navigate(`/patients/${patientId}`);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={t('patients.intake.title')} subtitle={t('patients.intake.subtitle')} />
      <form onSubmit={submit} className="p-4 sm:p-7 space-y-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>🆔 {t('patients.intake.identity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label={`${t('patients.intake.firstName')} *`}>
                <Input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel label={`${t('patients.intake.lastName')} *`}>
                <Input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </FieldLabel>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FieldLabel label={t('patients.intake.dateOfBirth')}>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel label={t('patients.intake.gender')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="MALE">{t('patients.intake.male')}</option>
                  <option value="FEMALE">{t('patients.intake.female')}</option>
                </select>
              </FieldLabel>
              <FieldLabel label={t('patients.intake.preferredLanguage')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.preferredLanguage}
                  onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </FieldLabel>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📞 {t('patients.intake.contact')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label={`${t('patients.intake.phoneFormat')} *`}>
                <Input
                  required
                  placeholder="+201xxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel label={t('patients.intake.whatsapp')}>
                <Input
                  placeholder="+20…"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </FieldLabel>
            </div>
            <FieldLabel label={t('patients.intake.email')}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label={t('patients.intake.address')}>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel label={t('patients.intake.governorate')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.governorate}
                  onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                >
                  <option value="">—</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </FieldLabel>
            </div>
            <FieldLabel label={t('patients.intake.profession')}>
              <Input
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              />
            </FieldLabel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 {t('patients.intake.consultationReason')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldLabel label={`${t('patients.intake.addictionType')} *`}>
              <div className="flex gap-2 flex-wrap">
                {ADDICTIONS.map((a) => (
                  <Chip
                    key={a}
                    active={form.primaryAddiction === a}
                    onClick={() => setForm({ ...form, primaryAddiction: a })}
                  >
                    {ADDICTION_ICON[a]} {t(`addiction.${a}`)}
                  </Chip>
                ))}
              </div>
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label={t('patients.intake.previousAttempts')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.previousAttempts}
                  onChange={(e) => setForm({ ...form, previousAttempts: e.target.value })}
                >
                  <option value="">—</option>
                  <option>{t('patients.intake.attempts.none')}</option>
                  <option>{t('patients.intake.attempts.one')}</option>
                  <option>{t('patients.intake.attempts.two_three')}</option>
                  <option>{t('patients.intake.attempts.more')}</option>
                </select>
              </FieldLabel>
              <FieldLabel label={t('patients.intake.motivationLevel')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.motivationLevel}
                  onChange={(e) => setForm({ ...form, motivationLevel: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="high">{t('patients.intake.motivation.high')}</option>
                  <option value="medium">{t('patients.intake.motivation.medium')}</option>
                  <option value="low">{t('patients.intake.motivation.low')}</option>
                </select>
              </FieldLabel>
            </div>
            <FieldLabel label={t('patients.intake.acquisitionSource')}>
              <div className="flex gap-2 flex-wrap">
                {SOURCE_KEYS.map((k) => (
                  <Chip
                    key={k}
                    active={form.acquisitionSource.includes(k)}
                    onClick={() => toggleSource(k)}
                  >
                    {t(`patients.intake.sources.${k}`)}
                  </Chip>
                ))}
              </div>
            </FieldLabel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🆘 {t('patients.intake.emergencyContact')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <FieldLabel label={t('patients.intake.emergencyName')}>
              <Input
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label={t('patients.intake.emergencyPhone')}>
              <Input
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              />
            </FieldLabel>
          </CardContent>
        </Card>

        {/* Section RDV — pour que le patient apparaisse direct sur le dashboard du docteur */}
        <Card>
          <CardHeader>
            <CardTitle>
              📅{' '}
              {t('patients.intake.appointmentSection', 'Rendez-vous')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {slotDate && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary-lightest border border-primary-light/40 text-sm">
                <span className="text-primary-dark font-semibold">📍</span>
                <div className="flex-1">
                  <div className="text-primary-dark font-medium">
                    {t('patients.intake.slotFromAgenda', 'Créneau pré-rempli depuis l\'agenda')}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5" data-numeric>
                    {slotDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    · {slotTime}
                  </div>
                </div>
              </div>
            )}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={bookAppointment}
                onChange={(e) => setBookAppointment(e.target.checked)}
              />
              <span className="text-sm">
                {slotDate
                  ? t(
                      'patients.intake.bookForSlot',
                      "Créer le rendez-vous au créneau choisi (apparaîtra sur le dashboard du praticien)",
                    )
                  : t(
                      'patients.intake.bookSameDay',
                      "Créer un rendez-vous immédiat pour ce patient (apparaîtra sur le dashboard du praticien)",
                    )}
              </span>
            </label>
            {bookAppointment && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-light">
                <FieldLabel label={t('patients.intake.practitioner', 'Praticien *')}>
                  <select
                    className="w-full h-9 rounded-lg border border-border bg-surface px-3 text-sm"
                    value={practitionerId}
                    onChange={(e) => setPractitionerId(e.target.value)}
                  >
                    {practitioners.map((p) => (
                      <option key={p.id} value={p.id}>
                        Dr. {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </FieldLabel>
                <FieldLabel
                  label={`${t('patients.intake.appointmentTime', 'Heure du RDV')} ${
                    form.primaryAddiction
                      ? `(${PRICE_FIRST[form.primaryAddiction as Addiction]} EGP)`
                      : ''
                  }`}
                >
                  <Input
                    type="time"
                    step={2400}
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </FieldLabel>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛡️ {t('patients.intake.consents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <label className="flex gap-2 items-start cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={consents.data}
                onChange={(e) => setConsents({ ...consents, data: e.target.checked })}
              />
              <span>
                {t('patients.intake.consent1')} <span className="text-danger">*</span>
              </span>
            </label>
            <label className="flex gap-2 items-start cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={consents.sms}
                onChange={(e) => setConsents({ ...consents, sms: e.target.checked })}
              />
              <span>{t('patients.intake.consent2')}</span>
            </label>
            <label className="flex gap-2 items-start cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={consents.nonMedical}
                onChange={(e) => setConsents({ ...consents, nonMedical: e.target.checked })}
              />
              <span>
                {t('patients.intake.consent3')} <span className="text-danger">*</span>
              </span>
            </label>
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('patients.intake.submitting') : t('patients.intake.submit')}
          </Button>
        </div>
      </form>
    </>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}
