import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input, ResetLogo } from '@reset/ui';
import { LANGUAGES, type Lang } from './i18n';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

type Step = 1 | 2 | 3 | 4 | 'success';

const SERVICE_IDS = ['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS'] as const;
type ServiceId = (typeof SERVICE_IDS)[number];

const SERVICE_META: Record<ServiceId, { icon: string; priceFrom: number }> = {
  TOBACCO: { icon: '🚬', priceFrom: 1500 },
  DRUGS: { icon: '💊', priceFrom: 1800 },
  ALCOHOL: { icon: '🍷', priceFrom: 1800 },
  SUGAR: { icon: '🍬', priceFrom: 1100 },
  STRESS: { icon: '😰', priceFrom: 900 },
};

interface BookingPayload {
  service: ServiceId | '';
  visitType: 'FIRST' | 'FOLLOWUP';
  date: string;
  slotIso: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  age: string;
  acquisitionSource: string;
  consents: { dataProtection: boolean; nonMedical: boolean };
}

export function App() {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [booking, setBooking] = useState<BookingPayload>({
    service: '',
    visitType: 'FIRST',
    date: '',
    slotIso: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    age: '',
    acquisitionSource: '',
    consents: { dataProtection: false, nonMedical: false },
  });
  const [confirmation, setConfirmation] = useState<{ confirmationNumber: string } | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/booking'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: booking.service,
          visitType: booking.visitType,
          scheduledAt: booking.slotIso,
          firstName: booking.firstName,
          lastName: booking.lastName,
          phone: booking.phone,
          email: booking.email || undefined,
          age: booking.age ? Number(booking.age) : undefined,
          acquisitionSource: booking.acquisitionSource || undefined,
          preferredLanguage: i18n.language,
          consents: booking.consents,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Error');
      }
      const data = await res.json();
      setConfirmation(data);
      setStep('success');
    } catch (e) {
      setError((e as Error).message ?? 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-primary text-primary-light border-b border-primary-dark">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-primary-light">
            <ResetLogo variant="full" className="w-12 h-12 rounded-lg" />
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight">Reset Yourself</div>
              <div className="text-[10px] tracking-[0.32em] font-semibold opacity-80">
                BRANCH CAIRO EAST CMC
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {LANGUAGES.map((lng) => (
              <button
                key={lng}
                onClick={() => i18n.changeLanguage(lng as Lang)}
                className={`px-2 py-1 text-xs rounded ${
                  i18n.language === lng
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {step !== 'success' && (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`flex-1 h-1.5 rounded ${
                  n <= (step as number) ? 'bg-primary' : 'bg-border-light'
                }`}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('step1')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SERVICE_IDS.map((id) => {
                const meta = SERVICE_META[id];
                return (
                  <button
                    key={id}
                    onClick={() => setBooking({ ...booking, service: id })}
                    className={`w-full text-start p-4 rounded-lg border-2 transition-colors ${
                      booking.service === id
                        ? 'border-primary bg-primary-light'
                        : 'border-border hover:border-info bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meta.icon}</span>
                      <div className="flex-1">
                        <strong className="text-base">{t(`services.${id}`)}</strong>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {t(`services.${id}_DESC`)}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-xs text-text-tertiary">{t('priceFrom')}</p>
                        <p className="font-bold" data-numeric>
                          {meta.priceFrom} EGP
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="flex justify-end pt-4">
                <Button disabled={!booking.service} onClick={() => setStep(2)}>
                  {t('next')} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <StepDateTime
            booking={booking}
            onChange={setBooking}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('step3')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">{t('firstName')} *</label>
                  <Input
                    required
                    value={booking.firstName}
                    onChange={(e) => setBooking({ ...booking, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t('lastName')} *</label>
                  <Input
                    required
                    value={booking.lastName}
                    onChange={(e) => setBooking({ ...booking, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('phone')} *</label>
                <Input
                  required
                  placeholder="+201xxxxxxxxx"
                  value={booking.phone}
                  onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">{t('emailOptional')}</label>
                  <Input
                    type="email"
                    value={booking.email}
                    onChange={(e) => setBooking({ ...booking, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t('age')}</label>
                  <Input
                    type="number"
                    value={booking.age}
                    onChange={(e) => setBooking({ ...booking, age: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('howDidYouKnow')}</label>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={booking.acquisitionSource}
                  onChange={(e) => setBooking({ ...booking, acquisitionSource: e.target.value })}
                >
                  <option value="">{t('sources.none')}</option>
                  {['instagram', 'facebook', 'google', 'recommendation', 'doctor', 'other'].map(
                    (k) => (
                      <option key={k} value={k}>
                        {t(`sources.${k}`)}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="flex gap-2 justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  ← {t('back')}
                </Button>
                <Button
                  disabled={!booking.firstName || !booking.lastName || !booking.phone}
                  onClick={() => setStep(4)}
                >
                  {t('next')} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('step4')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-bg-secondary rounded p-4 space-y-1 text-sm">
                <p>
                  <strong>{t('service')}</strong>{' '}
                  {booking.service ? t(`services.${booking.service}`) : ''}
                </p>
                <p>
                  <strong>{t('type')}</strong>{' '}
                  {booking.visitType === 'FIRST' ? t('firstSession') : t('followup')}
                </p>
                <p>
                  <strong>{t('dateSummary')}</strong>{' '}
                  <span data-numeric>{new Date(booking.slotIso).toLocaleString(i18n.language)}</span>
                </p>
                <p>
                  <strong>{t('patientSummary')}</strong> {booking.firstName} {booking.lastName}
                </p>
                <p>
                  <strong>{t('phoneSummary')}</strong>{' '}
                  <span data-numeric>{booking.phone}</span>
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <label className="flex gap-2 items-start cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={booking.consents.dataProtection}
                    onChange={(e) =>
                      setBooking({
                        ...booking,
                        consents: { ...booking.consents, dataProtection: e.target.checked },
                      })
                    }
                  />
                  <span>
                    {t('consent1')} <span className="text-danger">{t('required')}</span>
                  </span>
                </label>
                <label className="flex gap-2 items-start cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={booking.consents.nonMedical}
                    onChange={(e) =>
                      setBooking({
                        ...booking,
                        consents: { ...booking.consents, nonMedical: e.target.checked },
                      })
                    }
                  />
                  <span>
                    {t('consent2')} <span className="text-danger">{t('required')}</span>
                  </span>
                </label>
              </div>
              {error && (
                <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>
              )}
              <div className="flex gap-2 justify-between flex-wrap">
                <Button variant="outline" onClick={() => setStep(3)}>
                  ← {t('back')}
                </Button>
                <Button
                  onClick={submit}
                  disabled={
                    submitting ||
                    !booking.consents.dataProtection ||
                    !booking.consents.nonMedical
                  }
                >
                  {submitting ? t('submitting') : `✓ ${t('confirm')}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'success' && confirmation && (
          <Card>
            <CardContent className="text-center py-12 space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-primary-dark">{t('success')}</h2>
              <p className="text-text-secondary">{t('whatsappNotice')}</p>
              <div className="bg-bg-secondary rounded p-4 inline-block">
                <p className="text-xs text-text-tertiary uppercase">{t('confirmationNumber')}</p>
                <p className="text-lg font-mono font-bold" data-numeric>
                  {confirmation.confirmationNumber}
                </p>
              </div>
              <p className="text-sm text-text-secondary pt-4" data-numeric>
                📍 {t('centerAddress')}
              </p>
              <Badge variant="info" data-numeric>
                {t('appointmentLabel')} {new Date(booking.slotIso).toLocaleString(i18n.language)}
              </Badge>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="text-center text-xs text-text-tertiary py-6">
        © 2026 Reset Egypt
      </footer>
    </div>
  );
}

function StepDateTime({
  booking,
  onChange,
  onBack,
  onNext,
}: {
  booking: BookingPayload;
  onChange: (b: BookingPayload) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const [date, setDate] = useState<string>(booking.date || today.toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Array<{ time: string; iso: string; taken: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  async function loadSlots(d: string) {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/booking/slots?date=${d}`));
      const data = await res.json();
      setSlots(data.slots);
    } finally {
      setLoading(false);
    }
  }

  if (date && slots.length === 0 && !loading) {
    void loadSlots(date);
  }

  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('step2')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-2">{t('sessionType')}</label>
          <div className="flex gap-2">
            <Chip
              active={booking.visitType === 'FIRST'}
              onClick={() => onChange({ ...booking, visitType: 'FIRST' })}
            >
              {t('firstSession')}
            </Chip>
            <Chip
              active={booking.visitType === 'FOLLOWUP'}
              onClick={() => onChange({ ...booking, visitType: 'FOLLOWUP' })}
            >
              {t('followup')}
            </Chip>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2">{t('dateLabel')}</label>
          <div className="grid grid-cols-7 gap-1">
            {next14Days.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDate(d);
                  setSlots([]);
                  void loadSlots(d);
                }}
                className={`text-xs p-2 rounded border ${
                  date === d
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-border hover:border-info'
                }`}
                data-numeric
              >
                {new Date(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2">{t('slotLabel')}</label>
          {loading ? (
            <p className="text-sm text-text-secondary">{t('loadingSlots')}</p>
          ) : (
            <div className="grid grid-cols-6 gap-1">
              {slots.map((s) => (
                <button
                  key={s.iso}
                  disabled={s.taken}
                  onClick={() => onChange({ ...booking, date, slotIso: s.iso })}
                  className={`text-xs p-2 rounded border ${
                    booking.slotIso === s.iso
                      ? 'bg-primary text-white border-primary'
                      : s.taken
                        ? 'bg-bg-secondary text-text-tertiary line-through cursor-not-allowed'
                        : 'bg-surface border-border hover:border-info'
                  }`}
                  data-numeric
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            ← {t('back')}
          </Button>
          <Button disabled={!booking.slotIso} onClick={onNext}>
            {t('next')} →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
