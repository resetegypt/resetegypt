import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';

type Step = 1 | 2 | 3 | 4 | 'success';

const SERVICES = [
  { id: 'TOBACCO', label: 'Sevrage tabagique', icon: '🚬', priceFrom: 1500, desc: 'Auriculothérapie + laser pour arrêter de fumer' },
  { id: 'DRUGS', label: 'Sevrage drogues', icon: '💊', priceFrom: 1800, desc: 'Accompagnement complet, non-médical' },
  { id: 'ALCOHOL', label: 'Sevrage alcool', icon: '🍷', priceFrom: 1800, desc: 'Réduction des envies et des consommations' },
  { id: 'SUGAR', label: 'Sucre', icon: '🍬', priceFrom: 1100, desc: 'Contrôle des fringales et perte de poids' },
  { id: 'STRESS', label: 'Stress / anxiété', icon: '😰', priceFrom: 900, desc: 'Relaxation profonde et gestion émotionnelle' },
] as const;

interface BookingPayload {
  service: typeof SERVICES[number]['id'] | '';
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
      const res = await fetch('/api/booking', {
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
          preferredLanguage: 'fr',
          consents: booking.consents,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erreur');
      }
      const data = await res.json();
      setConfirmation(data);
      setStep('success');
    } catch (e) {
      setError((e as Error).message ?? 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <strong className="text-xl text-primary">Reset Egypt</strong>
            <p className="text-xs text-text-secondary">Réservation en ligne</p>
          </div>
          <a href="https://www.reset-egypt.com" className="text-xs text-info hover:underline">
            ← Retour au site
          </a>
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
              <CardTitle>Étape 1 — Choisissez votre service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setBooking({ ...booking, service: s.id })}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    booking.service === s.id
                      ? 'border-primary bg-primary-light'
                      : 'border-border hover:border-info bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{s.icon}</span>
                    <div className="flex-1">
                      <strong className="text-base">{s.label}</strong>
                      <p className="text-xs text-text-secondary mt-0.5">{s.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-tertiary">à partir de</p>
                      <p className="font-bold">{s.priceFrom} EGP</p>
                    </div>
                  </div>
                </button>
              ))}
              <div className="flex justify-end pt-4">
                <Button disabled={!booking.service} onClick={() => setStep(2)}>
                  Continuer →
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
              <CardTitle>Étape 3 — Vos coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Prénom *</label>
                  <Input required value={booking.firstName} onChange={(e) => setBooking({ ...booking, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nom *</label>
                  <Input required value={booking.lastName} onChange={(e) => setBooking({ ...booking, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Téléphone WhatsApp * (+20…)</label>
                <Input required placeholder="+201xxxxxxxxx" value={booking.phone} onChange={(e) => setBooking({ ...booking, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Email (optionnel)</label>
                  <Input type="email" value={booking.email} onChange={(e) => setBooking({ ...booking, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Âge</label>
                  <Input type="number" value={booking.age} onChange={(e) => setBooking({ ...booking, age: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Comment nous avez-vous connu ?</label>
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={booking.acquisitionSource}
                  onChange={(e) => setBooking({ ...booking, acquisitionSource: e.target.value })}
                >
                  <option value="">—</option>
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option>Google</option>
                  <option>Recommandation</option>
                  <option>Médecin</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="flex gap-2 justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>← Retour</Button>
                <Button
                  disabled={!booking.firstName || !booking.lastName || !booking.phone}
                  onClick={() => setStep(4)}
                >
                  Continuer →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 4 — Récapitulatif & confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-bg-secondary rounded p-4 space-y-1 text-sm">
                <p>
                  <strong>Service :</strong> {SERVICES.find((s) => s.id === booking.service)?.label}
                </p>
                <p>
                  <strong>Type :</strong> {booking.visitType === 'FIRST' ? '1ère séance' : 'Séance de suivi'}
                </p>
                <p>
                  <strong>Date :</strong> {new Date(booking.slotIso).toLocaleString()}
                </p>
                <p>
                  <strong>Patient :</strong> {booking.firstName} {booking.lastName}
                </p>
                <p>
                  <strong>Téléphone :</strong> {booking.phone}
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
                    J'accepte que mes données soient traitées conformément à la loi 151/2020 sur la
                    protection des données. <span className="text-danger">*</span>
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
                    Je reconnais que Reset Egypt est un centre de bien-être non médical.{' '}
                    <span className="text-danger">*</span>
                  </span>
                </label>
              </div>
              {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}
              <div className="flex gap-2 justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>← Retour</Button>
                <Button
                  onClick={submit}
                  disabled={
                    submitting ||
                    !booking.consents.dataProtection ||
                    !booking.consents.nonMedical
                  }
                >
                  {submitting ? 'Réservation…' : '✓ Confirmer la réservation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'success' && confirmation && (
          <Card>
            <CardContent className="text-center py-12 space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-primary-dark">Réservation confirmée !</h2>
              <p className="text-text-secondary">
                Vous recevrez une confirmation WhatsApp sous peu.
              </p>
              <div className="bg-bg-secondary rounded p-4 inline-block">
                <p className="text-xs text-text-tertiary uppercase">Numéro de confirmation</p>
                <p className="text-lg font-mono font-bold">{confirmation.confirmationNumber}</p>
              </div>
              <div className="text-sm text-text-secondary pt-4">
                <p>
                  📍 <strong>Reset Egypt</strong> · N Teseen, New Cairo, Le Caire
                </p>
                <p>📞 +20 1xxx xxx xxx</p>
              </div>
              <Badge variant="info">RDV : {new Date(booking.slotIso).toLocaleString()}</Badge>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="text-center text-xs text-text-tertiary py-6">
        © 2026 Reset Egypt · Auriculothérapie laser · New Cairo
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
  const today = new Date();
  const [date, setDate] = useState<string>(booking.date || today.toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Array<{ time: string; iso: string; taken: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  async function loadSlots(d: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/booking/slots?date=${d}`);
      const data = await res.json();
      setSlots(data.slots);
    } finally {
      setLoading(false);
    }
  }

  // Auto-load slots when date changes
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
        <CardTitle>Étape 2 — Date et créneau</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-2">Type de séance</label>
          <div className="flex gap-2">
            <Chip
              active={booking.visitType === 'FIRST'}
              onClick={() => onChange({ ...booking, visitType: 'FIRST' })}
            >
              1ère séance
            </Chip>
            <Chip
              active={booking.visitType === 'FOLLOWUP'}
              onClick={() => onChange({ ...booking, visitType: 'FOLLOWUP' })}
            >
              Suivi
            </Chip>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2">Date</label>
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
              >
                {new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2">Créneau (40 min)</label>
          {loading ? (
            <p className="text-sm text-text-secondary">Chargement…</p>
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
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            ← Retour
          </Button>
          <Button disabled={!booking.slotIso} onClick={onNext}>
            Continuer →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
