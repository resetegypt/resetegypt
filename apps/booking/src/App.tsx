import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, Input, ResetLogo } from '@reset/ui';
import {
  Cigarette,
  Pill,
  Wine,
  Candy,
  Brain,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { LANGUAGES, type Lang } from './i18n';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

type Step = 1 | 2 | 3 | 4 | 'success';

const SERVICE_IDS = ['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS'] as const;
type ServiceId = (typeof SERVICE_IDS)[number];

// Tous les services utilisent la même identité visuelle (palette primary
// de la marque) — uniforme et épurée. L'icône Lucide est le seul élément
// de différentiation entre les services.
const SERVICE_META: Record<ServiceId, { Icon: LucideIcon }> = {
  TOBACCO: { Icon: Cigarette },
  DRUGS: { Icon: Pill },
  ALCOHOL: { Icon: Wine },
  SUGAR: { Icon: Candy },
  STRESS: { Icon: Brain },
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

  // Scroll vers le haut à chaque changement d'étape.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      {/* === HEADER : logo bien visible sur fond clair ================== */}
      <header className="bg-surface border-b border-border-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-2.5 sm:gap-3 group min-w-0"
            aria-label="Accueil"
          >
            <div className="rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(30,15,186,0.25)] shrink-0 transition-transform group-hover:scale-105">
              <ResetLogo
                variant="full"
                className="block w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
            <div className="leading-tight text-start min-w-0">
              <div className="text-sm sm:text-base font-bold text-primary tracking-tight truncate">
                Reset Yourself
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.24em] sm:tracking-[0.28em] font-semibold text-text-tertiary truncate">
                BRANCH CAIRO EAST CMC
              </div>
            </div>
          </button>

          <LanguageSwitch />
        </div>
      </header>

      {/* === STEPPER : toujours présent, plus discret ================== */}
      {step !== 'success' && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-4 sm:pt-6">
          <Stepper step={step as 1 | 2 | 3 | 4} />
        </div>
      )}

      {/* === BODY ======================================================= */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {step === 1 && (
          <ServiceSelection
            booking={booking}
            onChange={setBooking}
            onNext={() => setStep(2)}
          />
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
          <StepContact
            booking={booking}
            onChange={setBooking}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepConfirm
            booking={booking}
            onBack={() => setStep(3)}
            onChange={setBooking}
            onSubmit={submit}
            submitting={submitting}
            error={error}
          />
        )}

        {step === 'success' && confirmation && (
          <SuccessView booking={booking} confirmation={confirmation} />
        )}
      </main>

      <footer className="mt-6 text-center text-[11px] text-text-tertiary py-4 px-4">
        © {new Date().getFullYear()} Reset Yourself — Branch Cairo East CMC
      </footer>
    </div>
  );
}

// ============================================================================
// LANGUAGE SWITCH
// ============================================================================

function LanguageSwitch() {
  const { i18n } = useTranslation();
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-0.5 shrink-0">
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng as Lang)}
          className={`px-2 sm:px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
            i18n.language === lng
              ? 'bg-surface shadow-sm text-text'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// STEPPER — barre de progression compacte, responsive.
// Mobile : pastilles compactes sans label. Desktop : pastilles + labels.
// ============================================================================

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { t } = useTranslation();
  const steps = [
    { n: 1, label: t('stepper.service', 'Service') },
    { n: 2, label: t('stepper.dateTime', 'Date') },
    { n: 3, label: t('stepper.contact', 'Coordonnées') },
    { n: 4, label: t('stepper.confirm', 'Confirmation') },
  ] as const;

  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {steps.map((s, idx) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <li key={s.n} className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                done
                  ? 'bg-primary text-white'
                  : active
                    ? 'bg-primary text-white ring-4 ring-primary/15'
                    : 'bg-surface text-text-tertiary border border-border'
              }`}
            >
              {done ? '✓' : s.n}
            </span>
            <span
              className={`text-xs font-semibold transition-colors hidden sm:inline truncate ${
                done ? 'text-primary-dark' : active ? 'text-primary' : 'text-text-tertiary'
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <span
                className={`flex-1 h-px sm:h-0.5 rounded-full ${
                  done ? 'bg-primary' : 'bg-border-light'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================================
// STEP 1 — Sélection du service. Cartes avec palette par service.
// ============================================================================

function ServiceSelection({
  booking,
  onChange,
  onNext,
}: {
  booking: BookingPayload;
  onChange: (b: BookingPayload) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeading
        title={t('serviceSelection.title', 'Quel accompagnement souhaitez-vous ?')}
        subtitle={t(
          'serviceSelection.subtitle',
          'Sélectionnez le programme qui correspond à votre objectif.',
        )}
      />

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICE_IDS.map((id) => {
          const meta = SERVICE_META[id];
          const selected = booking.service === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ ...booking, service: id })}
              className={`group relative rounded-2xl bg-surface border transition-all duration-200 text-start p-4 sm:p-5 ${
                selected
                  ? 'border-transparent ring-2 ring-primary shadow-lg shadow-primary/15 -translate-y-px'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              }`}
              aria-pressed={selected}
            >
              {selected && (
                <span className="absolute top-2.5 end-2.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white shadow-md">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'bg-primary text-white' : 'bg-primary-lightest text-primary'
                  }`}
                  aria-hidden
                >
                  <meta.Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-text leading-tight">
                    {t(`services.${id}`)}
                  </h3>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          disabled={!booking.service}
          onClick={onNext}
          className="w-full sm:w-auto px-6 shadow-md shadow-primary/15"
        >
          {t('continueButton', 'Continuer')} →
        </Button>
      </div>
    </section>
  );
}

// ============================================================================
// STEP 2 — Date & créneaux
// ============================================================================

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
  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState<string>(booking.date || today.toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Array<{ time: string; iso: string; taken: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/booking/slots?date=${date}`));
        const data = await res.json();
        if (!cancelled) setSlots(data.slots ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const next14Days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [today],
  );

  return (
    <section>
      <SectionHeading
        title={t('step2.heading', 'Choisissez votre créneau')}
        subtitle={t('step2.subtitle', 'Toutes les séances durent 40 minutes.')}
      />

      <Card className="mt-5">
        <CardContent className="space-y-5">
          <div>
            <Label>{t('sessionType')}</Label>
            <div className="flex gap-2">
              {(['FIRST', 'FOLLOWUP'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ ...booking, visitType: v })}
                  className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all ${
                    booking.visitType === v
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {v === 'FIRST' ? t('firstSession') : t('followup')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t('dateLabel')}</Label>
            <div
              className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
              dir="ltr"
            >
              {next14Days.map((d) => {
                const key = d.toISOString().slice(0, 10);
                const selected = date === key;
                const isToday = key === today.toISOString().slice(0, 10);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDate(key);
                      onChange({ ...booking, date: key, slotIso: '' });
                    }}
                    className={`shrink-0 snap-start w-14 sm:w-16 rounded-xl border-2 py-2 transition-all flex flex-col items-center ${
                      selected
                        ? 'border-primary bg-primary text-white shadow-md'
                        : 'border-border bg-surface hover:border-primary/40'
                    }`}
                    data-numeric
                  >
                    <div
                      className={`text-[10px] uppercase tracking-wider font-bold ${
                        selected ? 'text-primary-light' : 'text-text-tertiary'
                      }`}
                    >
                      {d.toLocaleDateString(i18n.language, { weekday: 'short' })}
                    </div>
                    <div className="text-lg sm:text-xl font-bold tabular-nums leading-none mt-1">
                      {d.getDate()}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        selected ? 'text-primary-light' : 'text-text-tertiary'
                      }`}
                    >
                      {d.toLocaleDateString(i18n.language, { month: 'short' })}
                    </div>
                    {isToday && (
                      <span
                        className={`mt-1 w-1 h-1 rounded-full ${
                          selected ? 'bg-white' : 'bg-primary'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>{t('slotLabel')}</Label>
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-bg-secondary animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-sm text-text-secondary py-6 text-center bg-bg-secondary/40 rounded-lg">
                {t('step2.noSlots', 'Aucun créneau pour cette date.')}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((s) => {
                  const selected = booking.slotIso === s.iso;
                  return (
                    <button
                      key={s.iso}
                      type="button"
                      disabled={s.taken}
                      onClick={() => onChange({ ...booking, date, slotIso: s.iso })}
                      className={`h-10 rounded-lg border-2 text-sm font-semibold transition-all ${
                        selected
                          ? 'border-primary bg-primary text-white shadow-md'
                          : s.taken
                            ? 'border-border-light bg-bg-secondary/50 text-text-tertiary line-through cursor-not-allowed'
                            : 'border-border bg-surface text-text hover:border-primary/50 hover:bg-primary/5'
                      }`}
                      data-numeric
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <NavButtons
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!booking.slotIso}
            nextLabel={t('next')}
          />
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================================
// STEP 3 — Coordonnées
// ============================================================================

function StepContact({
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
  const { t } = useTranslation();
  return (
    <section>
      <SectionHeading
        title={t('step3.heading', 'Vos coordonnées')}
        subtitle={t('step3.subtitle', 'Pour vous envoyer la confirmation par WhatsApp.')}
      />
      <Card className="mt-5">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={`${t('firstName')} *`}
              value={booking.firstName}
              onChange={(v) => onChange({ ...booking, firstName: v })}
            />
            <Field
              label={`${t('lastName')} *`}
              value={booking.lastName}
              onChange={(v) => onChange({ ...booking, lastName: v })}
            />
          </div>
          <Field
            label={`${t('phone')} *`}
            type="tel"
            placeholder="+20 1xx xxx xxxx"
            value={booking.phone}
            onChange={(v) => onChange({ ...booking, phone: v })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={t('emailOptional')}
              type="email"
              value={booking.email}
              onChange={(v) => onChange({ ...booking, email: v })}
            />
            <Field
              label={t('age')}
              type="number"
              value={booking.age}
              onChange={(v) => onChange({ ...booking, age: v })}
            />
          </div>
          <div>
            <Label>{t('howDidYouKnow')}</Label>
            <select
              className="w-full h-11 rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={booking.acquisitionSource}
              onChange={(e) => onChange({ ...booking, acquisitionSource: e.target.value })}
            >
              <option value="">{t('sources.none')}</option>
              {['instagram', 'facebook', 'google', 'recommendation', 'doctor', 'other'].map((k) => (
                <option key={k} value={k}>
                  {t(`sources.${k}`)}
                </option>
              ))}
            </select>
          </div>

          <NavButtons
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!booking.firstName || !booking.lastName || !booking.phone}
            nextLabel={t('next')}
          />
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================================
// STEP 4 — Récapitulatif & consentements
// ============================================================================

function StepConfirm({
  booking,
  onBack,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  booking: BookingPayload;
  onBack: () => void;
  onChange: (b: BookingPayload) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
}) {
  const { t, i18n } = useTranslation();
  const dateStr = booking.slotIso
    ? new Date(booking.slotIso).toLocaleString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  return (
    <section>
      <SectionHeading
        title={t('step4.heading', 'Récapitulatif')}
        subtitle={t('step4.subtitle', 'Vérifiez les informations avant de confirmer.')}
      />

      <Card className="mt-5">
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-primary-light bg-gradient-to-br from-primary-lightest to-white p-4 sm:p-5 space-y-2.5">
            <SummaryRow
              label={t('service')}
              value={booking.service ? t(`services.${booking.service}`) : ''}
            />
            <SummaryRow
              label={t('type')}
              value={booking.visitType === 'FIRST' ? t('firstSession') : t('followup')}
            />
            <SummaryRow label={t('dateSummary')} value={dateStr} mono />
            <SummaryRow
              label={t('patientSummary')}
              value={`${booking.firstName} ${booking.lastName}`}
            />
            <SummaryRow label={t('phoneSummary')} value={booking.phone} mono />
            {booking.email && <SummaryRow label="Email" value={booking.email} mono />}
          </div>

          <div className="space-y-2.5">
            <ConsentCheckbox
              checked={booking.consents.dataProtection}
              onChange={(v) =>
                onChange({ ...booking, consents: { ...booking.consents, dataProtection: v } })
              }
              label={t('consent1')}
            />
            <ConsentCheckbox
              checked={booking.consents.nonMedical}
              onChange={(v) =>
                onChange({ ...booking, consents: { ...booking.consents, nonMedical: v } })
              }
              label={t('consent2')}
            />
          </div>

          {error && (
            <div className="bg-danger-light border border-danger/30 text-danger-dark text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
            <Button variant="outline" onClick={onBack} disabled={submitting} size="lg">
              ← {t('back')}
            </Button>
            <Button
              size="lg"
              onClick={onSubmit}
              disabled={
                submitting || !booking.consents.dataProtection || !booking.consents.nonMedical
              }
              className="shadow-md shadow-primary/15"
            >
              {submitting ? t('submitting') : `✓ ${t('confirm')}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={`flex gap-3 items-start cursor-pointer p-3 rounded-lg border transition-colors ${
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border-light bg-surface hover:bg-bg-secondary/40'
      }`}
    >
      <input
        type="checkbox"
        className="mt-0.5 w-4 h-4 accent-primary rounded shrink-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-text leading-snug">{label}</span>
    </label>
  );
}

// ============================================================================
// SUCCESS
// ============================================================================

function SuccessView({
  booking,
  confirmation,
}: {
  booking: BookingPayload;
  confirmation: { confirmationNumber: string };
}) {
  const { t, i18n } = useTranslation();
  return (
    <Card className="max-w-xl mx-auto overflow-hidden">
      <CardContent className="text-center py-10 px-5 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-3xl shadow-lg shadow-primary/30">
          ✓
        </div>
        <h2 className="text-2xl font-extrabold text-primary tracking-tight">{t('success')}</h2>
        <p className="text-text-secondary text-sm">{t('whatsappNotice')}</p>
        <div className="bg-bg-secondary rounded-xl p-4 inline-block">
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
            {t('confirmationNumber')}
          </p>
          <p className="text-2xl font-mono font-extrabold text-primary-dark mt-1" data-numeric>
            {confirmation.confirmationNumber}
          </p>
        </div>
        <div className="bg-primary-lightest border border-primary-light rounded-lg p-3 max-w-xs mx-auto">
          <div className="text-[10px] text-primary-dark uppercase tracking-wider font-semibold">
            {t('appointmentLabel').replace(':', '')}
          </div>
          <div className="text-sm font-bold text-text mt-1">
            {new Date(booking.slotIso).toLocaleString(i18n.language, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
        <p className="text-xs text-text-secondary pt-1" data-numeric>
          📍 {t('centerAddress')}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers UI
// ============================================================================

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] uppercase tracking-[0.12em] font-bold text-text-tertiary mb-2">
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-text-secondary font-medium">{label}</span>
      <span
        className={`font-semibold text-text text-end ${mono ? 'font-mono text-xs' : ''}`}
        data-numeric={mono ? 'true' : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-1">
      <Button variant="outline" size="lg" onClick={onBack}>
        ← {t('back')}
      </Button>
      <Button
        size="lg"
        disabled={nextDisabled}
        onClick={onNext}
        className="shadow-md shadow-primary/15"
      >
        {nextLabel} →
      </Button>
    </div>
  );
}
