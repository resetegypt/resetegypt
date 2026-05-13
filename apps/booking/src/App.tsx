import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, Input, ResetLogo } from '@reset/ui';
import { LANGUAGES, type Lang } from './i18n';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

type Step = 1 | 2 | 3 | 4 | 'success';

const SERVICE_IDS = ['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS'] as const;
type ServiceId = (typeof SERVICE_IDS)[number];

// === Méta de chaque service : icône emoji, prix de base, palette colorée ===
// Les palettes sont construites pour être discernables même daltonien et
// rester dans l'univers de marque Reset (bleu/cyan/corail) avec un accent
// secondaire par service.
const SERVICE_META: Record<
  ServiceId,
  {
    icon: string;
    priceFrom: number;
    accent: string;
    bgGradient: string;
    iconBg: string;
    ring: string;
    selectedRing: string;
  }
> = {
  TOBACCO: {
    icon: '🚬',
    priceFrom: 1500,
    accent: 'text-amber-700',
    bgGradient: 'from-amber-50 via-white to-amber-50/40',
    iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200',
    ring: 'ring-amber-200/60',
    selectedRing: 'ring-2 ring-amber-500',
  },
  DRUGS: {
    icon: '💊',
    priceFrom: 1800,
    accent: 'text-purple-700',
    bgGradient: 'from-purple-50 via-white to-purple-50/40',
    iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
    ring: 'ring-purple-200/60',
    selectedRing: 'ring-2 ring-purple-500',
  },
  ALCOHOL: {
    icon: '🍷',
    priceFrom: 1800,
    accent: 'text-rose-700',
    bgGradient: 'from-rose-50 via-white to-rose-50/40',
    iconBg: 'bg-gradient-to-br from-rose-100 to-rose-200',
    ring: 'ring-rose-200/60',
    selectedRing: 'ring-2 ring-rose-500',
  },
  SUGAR: {
    icon: '🍬',
    priceFrom: 1100,
    accent: 'text-pink-700',
    bgGradient: 'from-pink-50 via-white to-pink-50/40',
    iconBg: 'bg-gradient-to-br from-pink-100 to-pink-200',
    ring: 'ring-pink-200/60',
    selectedRing: 'ring-2 ring-pink-500',
  },
  STRESS: {
    icon: '😰',
    priceFrom: 900,
    accent: 'text-sky-700',
    bgGradient: 'from-sky-50 via-white to-sky-50/40',
    iconBg: 'bg-gradient-to-br from-sky-100 to-sky-200',
    ring: 'ring-sky-200/60',
    selectedRing: 'ring-2 ring-sky-500',
  },
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

  // Scroll vers le haut à chaque changement d'étape pour éviter
  // que l'utilisateur reste perdu en bas du formulaire précédent.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      {/* === HEADER fin & élégant (sticky) ============================== */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-3 group"
            aria-label="Accueil"
          >
            <div className="rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(30,15,186,0.25)] transition-transform group-hover:scale-105">
              <ResetLogo variant="full" className="block w-10 h-10 sm:w-11 sm:h-11" />
            </div>
            <div className="leading-tight text-start">
              <div className="text-sm sm:text-base font-bold text-primary tracking-tight">
                Reset Yourself
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.28em] font-semibold text-text-tertiary">
                BRANCH CAIRO EAST CMC
              </div>
            </div>
          </button>

          <LanguageSwitch />
        </div>
      </header>

      {/* === HERO (step 1 uniquement) =================================== */}
      {step === 1 && <Hero />}

      {/* === STEPPER (étapes 2-4) ======================================= */}
      {step !== 'success' && step !== 1 && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 mt-6">
          <Stepper step={step as 1 | 2 | 3 | 4} />
        </div>
      )}

      {/* === BODY ======================================================= */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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

      <Footer />
    </div>
  );
}

// ============================================================================
// HEADER bits
// ============================================================================

function LanguageSwitch() {
  const { i18n } = useTranslation();
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-0.5">
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng as Lang)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
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
// HERO (step 1) — gros logo lisible sur fond clair, tagline brandée,
// indicateurs de confiance, CTA visuel.
// ============================================================================

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden">
      {/* Halos d'arrière-plan pour la profondeur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -top-20 right-0 w-[24rem] h-[24rem] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] rounded-full bg-danger/10 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 text-center">
        {/* Logo officiel — grand et bien visible sur fond clair */}
        <div className="inline-flex mb-6">
          <div className="rounded-3xl overflow-hidden shadow-[0_12px_40px_-12px_rgba(30,15,186,0.35)] ring-4 ring-white/60">
            <ResetLogo variant="full" className="block w-32 h-32 sm:w-40 sm:h-40" />
          </div>
        </div>

        <div className="text-[10px] sm:text-[11px] tracking-[0.4em] font-bold text-primary/70 mb-3">
          BRANCH CAIRO EAST CMC
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-primary tracking-tight leading-[1.05]">
          {t('hero.title', 'Reprenez le contrôle.')}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
          {t(
            'hero.subtitle',
            "Auriculothérapie & laser non-invasif — accompagnement sur-mesure pour le sevrage tabagique, alimentaire et la gestion du stress.",
          )}
        </p>

        {/* Bandeau de confiance */}
        <div className="mt-7 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-[11px] sm:text-xs text-text-secondary">
          <TrustChip icon="✓" label={t('hero.trust.nonMedical', 'Centre non-médical agréé')} />
          <TrustChip icon="🇪🇬" label={t('hero.trust.eta', 'Facturation conforme ETA')} />
          <TrustChip icon="🔒" label={t('hero.trust.gdpr', 'Données protégées (loi 151/2020)')} />
        </div>

        {/* Indicateur "scrollez pour réserver" */}
        <div className="mt-10 inline-flex flex-col items-center gap-1 text-text-tertiary text-xs">
          <span>{t('hero.scrollHint', 'Choisissez votre service ci-dessous')}</span>
          <svg
            className="w-4 h-4 animate-bounce"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function TrustChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-border-light shadow-sm">
      <span aria-hidden>{icon}</span>
      <span className="font-medium text-text">{label}</span>
    </span>
  );
}

// ============================================================================
// STEPPER — barre de progression avec libellés.
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
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((s, idx) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <li key={s.n} className="flex items-center gap-2 sm:gap-3 flex-1">
            <div
              className={`flex items-center gap-2 flex-1 ${
                idx === steps.length - 1 ? '' : ''
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all shrink-0 ${
                  done
                    ? 'bg-primary text-white shadow-sm'
                    : active
                      ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md'
                      : 'bg-surface text-text-tertiary border border-border'
                }`}
              >
                {done ? '✓' : s.n}
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold transition-colors hidden sm:inline ${
                  done
                    ? 'text-primary-dark'
                    : active
                      ? 'text-primary'
                      : 'text-text-tertiary'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <span
                className={`flex-1 h-0.5 rounded-full transition-colors ${
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
// STEP 1 — Sélection du service. Grille de cartes avec palette par service.
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
      <div className="text-center mb-7">
        <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
          {t('serviceSelection.title', 'Quel accompagnement souhaitez-vous ?')}
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          {t(
            'serviceSelection.subtitle',
            'Sélectionnez le programme qui correspond à votre objectif.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {SERVICE_IDS.map((id) => {
          const meta = SERVICE_META[id];
          const selected = booking.service === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ ...booking, service: id })}
              className={`group relative rounded-2xl bg-gradient-to-br ${meta.bgGradient} border border-white/60 shadow-sm transition-all duration-200 text-start p-5 sm:p-6 overflow-hidden ${
                selected
                  ? `${meta.selectedRing} ring-offset-2 ring-offset-bg-secondary shadow-xl -translate-y-0.5`
                  : `ring-1 ${meta.ring} hover:shadow-xl hover:-translate-y-0.5`
              }`}
              aria-pressed={selected}
            >
              {/* Coche en haut à droite si sélectionné */}
              {selected && (
                <span className="absolute top-3 end-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shadow-md">
                  ✓
                </span>
              )}

              <div
                className={`w-14 h-14 ${meta.iconBg} rounded-2xl flex items-center justify-center text-3xl shadow-inner mb-4`}
                aria-hidden
              >
                {meta.icon}
              </div>

              <h3 className="text-lg font-bold text-text leading-tight">
                {t(`services.${id}`)}
              </h3>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-2">
                {t(`services.${id}_DESC`)}
              </p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
                  {t('priceFrom')}
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${meta.accent}`}>
                  {meta.priceFrom.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-text-secondary">EGP</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          disabled={!booking.service}
          onClick={onNext}
          className="px-8 shadow-lg shadow-primary/20"
        >
          {t('continueButton', 'Continuer')}
          <span className="ms-2" aria-hidden>→</span>
        </Button>
      </div>
    </section>
  );
}

// ============================================================================
// STEP 2 — Date & créneaux. Carrousel de jours horizontalement scrollable
// pour bien fonctionner en mobile.
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

  // Charge les slots dès qu'on change de date (et au mount via useEffect).
  useEffect(() => {
    let cancelled = false;
    async function loadSlots() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/booking/slots?date=${date}`));
        const data = await res.json();
        if (!cancelled) setSlots(data.slots ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadSlots();
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
        <CardContent className="space-y-6">
          <div>
            <Label>{t('sessionType')}</Label>
            <div className="flex gap-2">
              {(['FIRST', 'FOLLOWUP'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ ...booking, visitType: v })}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all ${
                    booking.visitType === v
                      ? 'border-primary bg-primary text-white shadow-sm'
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
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x" dir="ltr">
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
                        ? 'border-primary bg-primary text-white shadow-md scale-105'
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
                    <div className="text-xl font-bold tabular-nums leading-none mt-1">
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
                  <div
                    key={i}
                    className="h-10 rounded-lg bg-bg-secondary animate-pulse"
                  />
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
            {slots.length > 0 && !loading && (
              <div className="flex items-center gap-4 mt-3 text-[10px] text-text-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded border-2 border-border bg-surface" />
                  {t('step2.legend.free', 'Libre')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-primary" />
                  {t('step2.legend.selected', 'Sélectionné')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-bg-secondary border border-border-light" />
                  {t('step2.legend.taken', 'Pris')}
                </span>
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
// STEP 3 — Coordonnées patient
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
            <Field label={`${t('firstName')} *`} value={booking.firstName} onChange={(v) => onChange({ ...booking, firstName: v })} />
            <Field label={`${t('lastName')} *`} value={booking.lastName} onChange={(v) => onChange({ ...booking, lastName: v })} />
          </div>
          <Field
            label={`${t('phone')} *`}
            type="tel"
            placeholder="+20 1xx xxx xxxx"
            value={booking.phone}
            onChange={(v) => onChange({ ...booking, phone: v })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('emailOptional')} type="email" value={booking.email} onChange={(v) => onChange({ ...booking, email: v })} />
            <Field label={t('age')} type="number" value={booking.age} onChange={(v) => onChange({ ...booking, age: v })} />
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
        subtitle={t('step4.subtitle', "Vérifiez les informations avant de confirmer.")}
      />

      <Card className="mt-5">
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-primary-light bg-gradient-to-br from-primary-lightest to-white p-5 space-y-3">
            <SummaryRow label={t('service')} value={booking.service ? t(`services.${booking.service}`) : ''} />
            <SummaryRow label={t('type')} value={booking.visitType === 'FIRST' ? t('firstSession') : t('followup')} />
            <SummaryRow label={t('dateSummary')} value={dateStr} mono />
            <SummaryRow label={t('patientSummary')} value={`${booking.firstName} ${booking.lastName}`} />
            <SummaryRow label={t('phoneSummary')} value={booking.phone} mono />
            {booking.email && <SummaryRow label="Email" value={booking.email} mono />}
          </div>

          <div className="space-y-3">
            <ConsentCheckbox
              checked={booking.consents.dataProtection}
              onChange={(v) =>
                onChange({ ...booking, consents: { ...booking.consents, dataProtection: v } })
              }
              label={t('consent1')}
              required
            />
            <ConsentCheckbox
              checked={booking.consents.nonMedical}
              onChange={(v) =>
                onChange({ ...booking, consents: { ...booking.consents, nonMedical: v } })
              }
              label={t('consent2')}
              required
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
                submitting ||
                !booking.consents.dataProtection ||
                !booking.consents.nonMedical
              }
              className="px-6 shadow-lg shadow-primary/20"
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
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
}) {
  const { t } = useTranslation();
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
      <span className="text-sm text-text">
        {label}
        {required && <span className="text-danger ms-1">{t('required')}</span>}
      </span>
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
    <section className="text-center">
      <Card className="max-w-xl mx-auto overflow-hidden">
        <CardContent className="text-center py-12 space-y-5 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-secondary/15 blur-3xl" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-4xl shadow-xl shadow-primary/30">
              ✓
            </div>
          </div>
          <h2 className="relative text-3xl font-extrabold text-primary tracking-tight">
            {t('success')}
          </h2>
          <p className="relative text-text-secondary max-w-md mx-auto">
            {t('whatsappNotice')}
          </p>
          <div className="relative bg-bg-secondary rounded-2xl p-5 inline-block">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">
              {t('confirmationNumber')}
            </p>
            <p className="text-2xl font-mono font-extrabold text-primary-dark mt-1" data-numeric>
              {confirmation.confirmationNumber}
            </p>
          </div>
          <div className="relative bg-primary-lightest border border-primary-light rounded-xl p-4 max-w-md mx-auto">
            <div className="text-[10px] text-primary-dark uppercase tracking-wider font-semibold">
              {t('appointmentLabel').replace(':', '')}
            </div>
            <div className="text-lg font-bold text-text mt-1">
              {new Date(booking.slotIso).toLocaleString(i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <p className="relative text-sm text-text-secondary pt-2" data-numeric>
            📍 {t('centerAddress')}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================================
// Helpers UI
// ============================================================================

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center sm:text-start">
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
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
      <Button variant="outline" size="lg" onClick={onBack}>
        ← {t('back')}
      </Button>
      <Button size="lg" disabled={nextDisabled} onClick={onNext} className="shadow-md shadow-primary/10">
        {nextLabel} →
      </Button>
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-10 border-t border-border-light bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-[10px] tracking-[0.28em] font-bold text-text-tertiary uppercase mb-1.5">
            Reset Yourself
          </div>
          <div className="text-text font-medium">Branch Cairo East CMC</div>
          <div className="text-text-secondary text-xs mt-1">N Teseen, New Cairo 1, 11835</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.28em] font-bold text-text-tertiary uppercase mb-1.5">
            {t('footer.contact', 'Contact')}
          </div>
          <a
            href="https://wa.me/201234567890"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1"
          >
            💬 WhatsApp
          </a>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.28em] font-bold text-text-tertiary uppercase mb-1.5">
            {t('footer.legal', 'Mentions')}
          </div>
          <div className="text-text-secondary text-xs">
            {t(
              'footer.legalText',
              'Centre non-médical · Conforme décret 188/2020 (ETA) · Loi 151/2020 (données)',
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border-light text-center text-xs text-text-tertiary py-3">
        © {new Date().getFullYear()} Reset Yourself — Branch Cairo East CMC
      </div>
    </footer>
  );
}
