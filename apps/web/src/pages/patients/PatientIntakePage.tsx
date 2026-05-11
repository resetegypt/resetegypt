import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { ADDICTIONS, type Addiction } from '@reset/shared';
import { apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

const ADDICTION_LABEL: Record<Addiction, string> = {
  TOBACCO: '🚬 Tabac',
  DRUGS: '💊 Drogue',
  ALCOHOL: '🍷 Alcool',
  SUGAR: '🍬 Sucre',
  STRESS: '😰 Stress',
};

const GOVERNORATES = ['Le Caire', 'Gizeh', 'Alexandrie', 'New Cairo', 'Charm el-Cheikh', 'Autre'];
const SOURCES = ['Instagram', 'Facebook', 'Google', 'Bouche-à-oreille', 'Médecin', 'Autre'];

export function PatientIntakePage() {
  const navigate = useNavigate();
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
      setError('Les consentements obligatoires doivent être acceptés.');
      return;
    }
    if (!form.primaryAddiction) {
      setError('Sélectionne un type d\'addiction.');
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
      navigate(`/patients/${res.patient.id}`);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Fiche d'accueil patient"
        subtitle="Étape 1 — Remplie par la secrétaire à l'arrivée"
      />
      <form onSubmit={submit} className="p-7 space-y-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>🆔 Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Prénom *">
                <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="Nom *">
                <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </FieldLabel>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FieldLabel label="Date de naissance">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="Sexe">
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="MALE">Homme</option>
                  <option value="FEMALE">Femme</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Langue préférée">
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
            <CardTitle>📞 Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Téléphone * (format +20...)">
                <Input required placeholder="+201xxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="WhatsApp">
                <Input placeholder="+20..." value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </FieldLabel>
            </div>
            <FieldLabel label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Adresse">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="Gouvernorat">
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
            <FieldLabel label="Profession">
              <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
            </FieldLabel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Motif de consultation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldLabel label="Type d'addiction *">
              <div className="flex gap-2 flex-wrap">
                {ADDICTIONS.map((a) => (
                  <Chip
                    key={a}
                    active={form.primaryAddiction === a}
                    onClick={() => setForm({ ...form, primaryAddiction: a })}
                  >
                    {ADDICTION_LABEL[a]}
                  </Chip>
                ))}
              </div>
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Tentatives précédentes">
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.previousAttempts}
                  onChange={(e) => setForm({ ...form, previousAttempts: e.target.value })}
                >
                  <option value="">—</option>
                  <option>Aucune</option>
                  <option>1 fois</option>
                  <option>2-3 fois</option>
                  <option>+ de 3 fois</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Niveau de motivation">
                <select
                  className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                  value={form.motivationLevel}
                  onChange={(e) => setForm({ ...form, motivationLevel: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="high">Élevé · Très motivé</option>
                  <option value="medium">Moyen · Hésitant</option>
                  <option value="low">Faible</option>
                </select>
              </FieldLabel>
            </div>
            <FieldLabel label="Source d'acquisition (multi)">
              <div className="flex gap-2 flex-wrap">
                {SOURCES.map((s) => (
                  <Chip key={s} active={form.acquisitionSource.includes(s)} onClick={() => toggleSource(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </FieldLabel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🆘 Contact d'urgence</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <FieldLabel label="Nom">
              <Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Téléphone">
              <Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
            </FieldLabel>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛡️ Consentements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <label className="flex gap-2 items-start cursor-pointer">
              <input type="checkbox" className="mt-1" checked={consents.data} onChange={(e) => setConsents({ ...consents, data: e.target.checked })} />
              <span>
                J'accepte que mes données personnelles soient enregistrées par Reset Egypt conformément à la loi 151/2020. <span className="text-danger">*</span>
              </span>
            </label>
            <label className="flex gap-2 items-start cursor-pointer">
              <input type="checkbox" className="mt-1" checked={consents.sms} onChange={(e) => setConsents({ ...consents, sms: e.target.checked })} />
              <span>J'autorise Reset à m'envoyer des SMS et messages WhatsApp pour les rappels.</span>
            </label>
            <label className="flex gap-2 items-start cursor-pointer">
              <input type="checkbox" className="mt-1" checked={consents.nonMedical} onChange={(e) => setConsents({ ...consents, nonMedical: e.target.checked })} />
              <span>
                Je reconnais que Reset est un centre de bien-être non médical. <span className="text-danger">*</span>
              </span>
            </label>
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
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
