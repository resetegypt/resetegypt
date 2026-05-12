import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface PatientLite {
  patient: { firstName: string; lastName: string; primaryAddiction: string };
}

const CONTRAINDICATIONS = [
  { key: 'pacemaker', warn: true },
  { key: 'epilepsy', warn: true },
  { key: 'pregnancy', warn: true },
  { key: 'diabetes', warn: false },
  { key: 'hypertension', warn: false },
  { key: 'autoimmune', warn: false },
] as const;

export function ClinicalFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const appointmentId = params.get('appointmentId');
  const navigate = useNavigate();

  const { data: pdata } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiGet<PatientLite>(`/patients/${id}`),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    yearsOfAddiction: '',
    dailyQuantity: '',
    previousMethods: [] as string[],
    longestQuit: '',
    triggers: [] as string[],
    consumptionMoments: '',
    stress: 5,
    anxiety: 5,
    craving: 5,
    sleep: 5,
    motivation: 5,
    contraindications: [] as string[],
    medications: '',
    allergies: '',
    weight: '',
    height: '',
    spo2: '',
    fagerstrom: 0,
    audit: 0,
    privateNotes: '',
    auricularPoints: '',
    laserDuration: 20,
    nextSession: 'week',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggle(field: keyof typeof form, value: string) {
    setForm((f) => {
      const arr = f[field] as string[];
      return {
        ...f,
        [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!appointmentId) {
      setError(t('clinical.noAppointmentSelected'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiPost('/medical-records', {
        appointmentId,
        yearsOfAddiction: form.yearsOfAddiction ? Number(form.yearsOfAddiction) : undefined,
        dailyQuantity: form.dailyQuantity || undefined,
        previousMethods: form.previousMethods,
        longestQuit: form.longestQuit || undefined,
        triggers: form.triggers,
        consumptionMoments: form.consumptionMoments || undefined,
        stressScore: form.stress,
        anxietyScore: form.anxiety,
        cravingScore: form.craving,
        sleepScore: form.sleep,
        motivationScore: form.motivation,
        contraindications: form.contraindications,
        medications: form.medications || undefined,
        allergies: form.allergies || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        fagerstromScore: form.fagerstrom,
        privateNotes: form.privateNotes || undefined,
        auricularPoints: form.auricularPoints || undefined,
        laserDuration: form.laserDuration,
        nextSession: form.nextSession,
      });
      navigate(`/patients/${id}`);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  const addiction = pdata?.patient.primaryAddiction;

  return (
    <>
      <PageHeader
        title={t('clinical.title')}
        subtitle={
          pdata
            ? t('clinical.subtitle', {
                name: `${pdata.patient.firstName} ${pdata.patient.lastName}`,
              })
            : t('common.loading')
        }
      />
      <form onSubmit={submit} className="p-7 space-y-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>📖 {t('clinical.anamnesis')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('clinical.years')}>
                <Input
                  type="number"
                  value={form.yearsOfAddiction}
                  onChange={(e) => setForm({ ...form, yearsOfAddiction: e.target.value })}
                />
              </Field>
              <Field label={t('clinical.dailyQty')}>
                <Input
                  value={form.dailyQuantity}
                  onChange={(e) => setForm({ ...form, dailyQuantity: e.target.value })}
                  placeholder={t('clinical.dailyQtyPlaceholder')}
                />
              </Field>
            </div>
            <Field label={t('clinical.previousAttempts')}>
              <div className="flex gap-2">
                {(['none', 'one', 'two_three', 'more'] as const).map((k) => (
                  <Chip
                    key={k}
                    active={form.previousMethods.includes(k)}
                    onClick={() => toggle('previousMethods', k)}
                  >
                    {t(`patients.intake.attempts.${k}`)}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label={t('clinical.longestQuit')}>
              <Input
                value={form.longestQuit}
                onChange={(e) => setForm({ ...form, longestQuit: e.target.value })}
                placeholder={t('clinical.longestQuitPlaceholder')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 {t('clinical.evaluations')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              ['stress', 'anxiety', 'craving', 'sleep', 'motivation'] as const
            ).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-xs font-medium w-44">{t(`clinical.scales.${key}`)}</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: Number(e.target.value) } as typeof form)
                  }
                  className="flex-1"
                />
                <span className="text-lg font-bold w-8 text-center" data-numeric>
                  {form[key]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚠️ {t('clinical.antecedents')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-text-tertiary">{t('clinical.laserWarning')}</p>
            <div className="flex gap-2 flex-wrap">
              {CONTRAINDICATIONS.map((c) => (
                <Chip
                  key={c.key}
                  active={form.contraindications.includes(c.key)}
                  warn={c.warn}
                  onClick={() => toggle('contraindications', c.key)}
                >
                  {c.warn && '⚠️ '}
                  {t(`clinical.contraindications.${c.key}`)}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('clinical.currentMeds')}>
                <Input
                  value={form.medications}
                  onChange={(e) => setForm({ ...form, medications: e.target.value })}
                />
              </Field>
              <Field label={t('clinical.allergies')}>
                <Input
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {addiction === 'TOBACCO' && (
          <Card>
            <CardHeader>
              <CardTitle>🚬 {t('clinical.fagerstrom')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-text-tertiary">{t('clinical.fagerstromDesc')}</p>
              <Field label={t('clinical.fagerstromScore')}>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={form.fagerstrom}
                  onChange={(e) => setForm({ ...form, fagerstrom: Number(e.target.value) })}
                />
              </Field>
              {form.fagerstrom > 6 && (
                <Badge variant="warning">{t('clinical.strongDependence')}</Badge>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📏 {t('clinical.measurements')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-3">
            <Field label={t('clinical.weight')}>
              <Input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </Field>
            <Field label={t('clinical.height')}>
              <Input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />
            </Field>
            <Field label={t('clinical.bmi')}>
              <Input
                readOnly
                value={
                  form.weight && form.height
                    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
                    : ''
                }
                className="bg-bg-secondary"
              />
            </Field>
            <Field label={t('clinical.spo2')}>
              <Input
                type="number"
                value={form.spo2}
                onChange={(e) => setForm({ ...form, spo2: e.target.value })}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 {t('clinical.treatmentPlan')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label={t('clinical.auricularPoints')}>
              <Input
                value={form.auricularPoints}
                onChange={(e) => setForm({ ...form, auricularPoints: e.target.value })}
                placeholder={t('clinical.auricularPointsPlaceholder')}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('clinical.laserDuration')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.laserDuration}
                  onChange={(e) => setForm({ ...form, laserDuration: Number(e.target.value) })}
                >
                  {[15, 20, 25, 30].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('clinical.nextSession')}>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.nextSession}
                  onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                >
                  <option value="week">{t('clinical.nextSessionOptions.week')}</option>
                  <option value="twoWeeks">{t('clinical.nextSessionOptions.twoWeeks')}</option>
                  <option value="month">{t('clinical.nextSessionOptions.month')}</option>
                  <option value="threeMonths">{t('clinical.nextSessionOptions.threeMonths')}</option>
                </select>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔒 {t('clinical.privateNotes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[120px] rounded border border-border bg-surface p-3 text-sm"
              value={form.privateNotes}
              onChange={(e) => setForm({ ...form, privateNotes: e.target.value })}
              placeholder={t('clinical.privateNotesPlaceholder')}
            />
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('clinical.saving') : `✓ ${t('clinical.finalize')}`}
          </Button>
        </div>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}
