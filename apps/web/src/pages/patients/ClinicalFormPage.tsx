import { useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface PatientLite {
  patient: { firstName: string; lastName: string; primaryAddiction: string };
}

export function ClinicalFormPage() {
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
    nextSession: '1 semaine',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggle(field: keyof typeof form, value: string) {
    setForm((f) => {
      const arr = f[field] as string[];
      return { ...f, [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value] };
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!appointmentId) {
      setError('Aucun RDV sélectionné. Reviens depuis le dossier patient.');
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
      setError((err as { message?: string }).message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const addiction = pdata?.patient.primaryAddiction;

  return (
    <>
      <PageHeader
        title="Fiche clinique"
        subtitle={
          pdata
            ? `${pdata.patient.firstName} ${pdata.patient.lastName} · Étape 2 — Praticien`
            : 'Chargement…'
        }
      />
      <form onSubmit={submit} className="p-7 space-y-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>📖 Anamnèse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Depuis combien d'années ?">
                <Input type="number" value={form.yearsOfAddiction} onChange={(e) => setForm({ ...form, yearsOfAddiction: e.target.value })} />
              </Field>
              <Field label="Quantité quotidienne">
                <Input value={form.dailyQuantity} onChange={(e) => setForm({ ...form, dailyQuantity: e.target.value })} placeholder="ex: 1 paquet/jour" />
              </Field>
            </div>
            <Field label="Tentatives précédentes">
              <div className="flex gap-2">
                {['Aucune', '1 fois', '2-3 fois', '+ de 3 fois'].map((v) => (
                  <Chip key={v} active={form.previousMethods.includes(v)} onClick={() => toggle('previousMethods', v)}>
                    {v}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Plus long arrêt">
              <Input value={form.longestQuit} onChange={(e) => setForm({ ...form, longestQuit: e.target.value })} placeholder="ex: 3 mois" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Évaluations 0-10</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                ['stress', 'Niveau de stress'],
                ['anxiety', "Niveau d'anxiété"],
                ['craving', 'Force des envies'],
                ['sleep', 'Qualité du sommeil'],
                ['motivation', 'Motivation à arrêter'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-xs font-medium w-44">{label}</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) } as typeof form)}
                  className="flex-1"
                />
                <span className="text-lg font-bold w-8 text-center">{form[key]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚠️ Antécédents et contre-indications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-text-tertiary">
              ℹ️ Le laser photobiomodulation est contre-indiqué dans certains cas
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 'Pacemaker', warn: true },
                { v: 'Épilepsie', warn: true },
                { v: 'Grossesse', warn: true },
                { v: 'Diabète', warn: false },
                { v: 'Hypertension', warn: false },
                { v: 'Maladie auto-immune', warn: false },
              ].map((c) => (
                <Chip
                  key={c.v}
                  active={form.contraindications.includes(c.v)}
                  warn={c.warn}
                  onClick={() => toggle('contraindications', c.v)}
                >
                  {c.warn && '⚠️ '}
                  {c.v}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Médicaments en cours">
                <Input value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} />
              </Field>
              <Field label="Allergies">
                <Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {addiction === 'TOBACCO' && (
          <Card>
            <CardHeader>
              <CardTitle>🚬 Test Fagerström (tabac)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-text-tertiary">
                Test de dépendance nicotinique. Score sur 10.
              </p>
              <Field label="Score Fagerström (0-10)">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={form.fagerstrom}
                  onChange={(e) => setForm({ ...form, fagerstrom: Number(e.target.value) })}
                />
              </Field>
              {form.fagerstrom > 6 && (
                <Badge variant="warning">Dépendance forte — protocole intensif recommandé</Badge>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📏 Mesures objectives</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-3">
            <Field label="Poids (kg)">
              <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </Field>
            <Field label="Taille (cm)">
              <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </Field>
            <Field label="IMC (auto)">
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
            <Field label="SpO2 (%)">
              <Input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Plan thérapeutique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Points auriculaires ciblés">
              <Input
                value={form.auricularPoints}
                onChange={(e) => setForm({ ...form, auricularPoints: e.target.value })}
                placeholder="ex: Shenmen, Poumon, Bouche..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Durée laser (min)">
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
              <Field label="Prochaine séance">
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.nextSession}
                  onChange={(e) => setForm({ ...form, nextSession: e.target.value })}
                >
                  <option>1 semaine</option>
                  <option>15 jours</option>
                  <option>1 mois</option>
                  <option>3 mois</option>
                </select>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔒 Notes cliniques privées (praticien uniquement)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[120px] rounded border border-border bg-surface p-3 text-sm"
              value={form.privateNotes}
              onChange={(e) => setForm({ ...form, privateNotes: e.target.value })}
              placeholder="Observations, à compléter…"
            />
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement…' : '✓ Finaliser séance'}
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
