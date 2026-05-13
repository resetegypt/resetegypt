import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, Chip, Input } from '@reset/ui';
import { apiGet, api } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useAuthStore } from '../../lib/auth';
import { Save, CheckCircle2, Lock, ChevronLeft } from 'lucide-react';

type Addiction = 'TOBACCO' | 'DRUGS' | 'ALCOHOL' | 'SUGAR' | 'STRESS';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  primaryAddiction: Addiction;
  dateOfBirth: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  phone: string;
}

interface MedicalRecord {
  id: string;
  patientId: string;
  yearsOfAddiction: number | null;
  startedAt: string | null;
  dailyQuantity: string | null;
  estimatedCostPerMonth: string | number | null;
  triggers: string[];
  consumptionMoments: string | null;
  socialContext: string | null;
  workContext: string | null;
  previousAttempts: number | null;
  longestQuit: string | null;
  relapseReasons: string | null;
  methodsTried: string[];
  stressScore: number | null;
  anxietyScore: number | null;
  cravingScore: number | null;
  sleepScore: number | null;
  motivationScore: number | null;
  selfEsteemScore: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string | null;
  heartRate: number | null;
  spo2: number | null;
  medicalHistory: string | null;
  surgicalHistory: string | null;
  familyHistory: string | null;
  currentMedications: string | null;
  allergies: string | null;
  contraindications: string[];
  contraindicationNotes: string | null;
  fagerstromScore: number | null;
  auditScore: number | null;
  duditScore: number | null;
  yfasScore: number | null;
  hadAnxietyScore: number | null;
  hadDepressionScore: number | null;
  auricularPoints: string | null;
  laserDuration: number | null;
  sessionFrequency: string | null;
  estimatedSessions: number | null;
  patientGoals: string | null;
  treatmentPlan: string | null;
  privateNotes: string | null;
  finalizedAt: string | null;
  createdBy: { firstName: string; lastName: string } | null;
  finalizedBy: { firstName: string; lastName: string } | null;
  updatedAt: string;
  createdAt: string;
}

const TRIGGERS = ['stress', 'social', 'ennui', 'anxiete', 'convivialite', 'habitude', 'colere', 'tristesse'] as const;
const METHODS = ['patchs', 'gommes', 'sevrage_brutal', 'hypnose', 'acupuncture', 'medicaments', 'therapie', 'autres'] as const;
const CONTRAINDICATIONS = ['pacemaker', 'epilepsie', 'grossesse', 'diabete', 'hypertension', 'auto_immune', 'cancer', 'photosensibilite'] as const;

const SECTIONS = [
  { id: 'addiction', icon: '🚬', label: "L'addiction en détail" },
  { id: 'context', icon: '🎯', label: 'Déclencheurs & contexte' },
  { id: 'history', icon: '⏪', label: 'Tentatives précédentes' },
  { id: 'scores', icon: '📊', label: 'Évaluations 0-10' },
  { id: 'exam', icon: '🩺', label: 'Examen clinique' },
  { id: 'antecedents', icon: '💊', label: 'Antécédents médicaux' },
  { id: 'contraindications', icon: '⚠️', label: 'Contre-indications laser' },
  { id: 'standardized', icon: '📋', label: 'Scores standardisés' },
  { id: 'protocol', icon: '💎', label: 'Protocole thérapeutique' },
  { id: 'goals', icon: '🎯', label: 'Objectifs & plan' },
  { id: 'notes', icon: '🔒', label: 'Notes privées' },
] as const;

export function ClinicalFormPage() {
  const { t, i18n } = useTranslation();
  const { id: patientId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isPractitioner = user?.role === 'PRACTITIONER';
  const canEdit = user?.role === 'PRACTITIONER' || user?.role === 'ADMIN';

  const { data: patientData } = useQuery({
    queryKey: ['patient-light', patientId],
    queryFn: () => apiGet<{ patient: Patient }>(`/patients/${patientId}`),
    enabled: !!patientId,
  });

  const { data: recordData, isLoading } = useQuery({
    queryKey: ['medical-record', patientId],
    queryFn: () =>
      apiGet<{ medicalRecord: MedicalRecord | null }>(
        `/patients/${patientId}/medical-record`,
      ),
    enabled: !!patientId,
  });

  const patient = patientData?.patient;
  const record = recordData?.medicalRecord;
  const isFinalized = !!record?.finalizedAt;

  const [form, setForm] = useState<Partial<MedicalRecord>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setForm({
        ...record,
        estimatedCostPerMonth: record.estimatedCostPerMonth
          ? Number(record.estimatedCostPerMonth)
          : null,
      });
    }
  }, [record]);

  const upsertMut = useMutation({
    mutationFn: (payload: Partial<MedicalRecord>) =>
      api<{ medicalRecord: MedicalRecord }>(`/patients/${patientId}/medical-record`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setSavedAt(new Date());
      setSaveError(null);
      qc.setQueryData(['medical-record', patientId], { medicalRecord: data.medicalRecord });
    },
    onError: (err) => {
      setSaveError((err as { message?: string }).message ?? 'Erreur de sauvegarde');
    },
  });

  const finalizeMut = useMutation({
    mutationFn: () =>
      api<{ medicalRecord: MedicalRecord }>(
        `/patients/${patientId}/medical-record/finalize`,
        { method: 'POST' },
      ),
    onSuccess: (data) => {
      qc.setQueryData(['medical-record', patientId], { medicalRecord: data.medicalRecord });
      qc.invalidateQueries({ queryKey: ['patient', patientId] });
    },
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<Partial<MedicalRecord>>(form);
  formRef.current = form;

  function update<K extends keyof MedicalRecord>(key: K, value: MedicalRecord[K]) {
    if (!canEdit) return;
    setForm((f) => ({ ...f, [key]: value }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = sanitizePayload(formRef.current);
      upsertMut.mutate(payload);
    }, 1500);
  }

  function toggleArrayValue(key: 'triggers' | 'methodsTried' | 'contraindications', val: string) {
    const current = (form[key] ?? []) as string[];
    const next = current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
    update(key, next as MedicalRecord[typeof key]);
  }

  const computedBmi = useMemo(() => {
    if (form.weight && form.height) {
      return Number((form.weight / Math.pow(form.height / 100, 2)).toFixed(1));
    }
    return null;
  }, [form.weight, form.height]);

  const progress = useMemo(() => {
    if (!form) return 0;
    const sectionHasContent: Record<string, boolean> = {
      addiction: !!(form.yearsOfAddiction || form.dailyQuantity || form.startedAt),
      context: !!(form.triggers?.length || form.consumptionMoments || form.socialContext),
      history: !!(form.previousAttempts || form.longestQuit || form.methodsTried?.length),
      scores: [
        form.stressScore,
        form.anxietyScore,
        form.cravingScore,
        form.sleepScore,
        form.motivationScore,
      ].some((s) => s !== null && s !== undefined),
      exam: !!(form.weight || form.height || form.bloodPressure),
      antecedents: !!(form.medicalHistory || form.allergies || form.currentMedications),
      contraindications: !!(form.contraindications?.length || form.contraindicationNotes),
      standardized: !!(
        form.fagerstromScore ||
        form.auditScore ||
        form.duditScore ||
        form.yfasScore ||
        form.hadAnxietyScore ||
        form.hadDepressionScore
      ),
      protocol: !!(form.auricularPoints || form.laserDuration || form.sessionFrequency),
      goals: !!(form.patientGoals || form.treatmentPlan),
      notes: !!form.privateNotes,
    };
    const filled = SECTIONS.filter((s) => sectionHasContent[s.id]).length;
    return Math.round((filled / SECTIONS.length) * 100);
  }, [form]);

  if (!patient) return <div className="p-7">{t('common.loading')}</div>;

  return (
    <>
      <PageHeader
        title={`🩺 ${t('clinical.title', 'Fiche clinique')}`}
        subtitle={`${patient.firstName} ${patient.lastName}${
          patient.age ? ` · ${patient.age} ${t('common.years', 'ans')}` : ''
        } · ${t(`addiction.${patient.primaryAddiction}`)}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/patients/${patientId}?tab=clinique`}>
              <ChevronLeft className="w-4 h-4 me-1" />
              {t('common.back', 'Retour')}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block border-e border-border bg-surface sticky top-0 self-start h-screen overflow-y-auto py-7 ps-7 pe-3">
          <div className="mb-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
              {t('clinical.progress', 'Progression')}
            </div>
            <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-text-secondary mt-1.5">
              {progress}%{' '}
              {isFinalized && (
                <span className="text-primary-dark font-semibold">
                  · ✓ {t('clinical.finalized', 'Terminée')}
                </span>
              )}
            </div>
          </div>

          <nav className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
              {t('clinical.sections', 'Sections')}
            </div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-sm px-3 py-1.5 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text transition-colors"
              >
                <span className="me-1.5">{s.icon}</span>
                {t(`clinical.section.${s.id}`, s.label)}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="p-7 max-w-4xl">
          {canEdit && (
            <div
              className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border mb-5 text-sm ${
                isFinalized
                  ? 'border-primary-light bg-primary-lightest text-primary-dark'
                  : saveError
                    ? 'border-danger-light bg-danger-light text-danger-dark'
                    : upsertMut.isPending
                      ? 'border-info-light bg-info-light text-info-dark'
                      : savedAt
                        ? 'border-primary-light/40 bg-primary-lightest/50 text-text-secondary'
                        : 'border-border bg-bg-secondary/40 text-text-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                {isFinalized ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">
                      {t('clinical.finalizedOn', 'Fiche terminée le')}{' '}
                      {new Date(record!.finalizedAt!).toLocaleDateString(i18n.language)}
                    </span>
                    {record?.finalizedBy && (
                      <span className="text-xs">par Dr. {record.finalizedBy.firstName}</span>
                    )}
                  </>
                ) : saveError ? (
                  <span>⚠️ {t('clinical.saveError', 'Erreur')} : {saveError}</span>
                ) : upsertMut.isPending ? (
                  <>
                    <Save className="w-4 h-4 animate-pulse" />
                    <span>{t('clinical.saving', 'Sauvegarde…')}</span>
                  </>
                ) : savedAt ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('clinical.savedAt', 'Sauvegardé')} {timeAgo(savedAt)}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('clinical.autoSave', 'Auto-save toutes les 1.5s')}</span>
                  </>
                )}
              </div>
              {isFinalized && (
                <span className="text-xs italic">
                  {t('clinical.stillEditable', 'Reste modifiable pour le suivi')}
                </span>
              )}
            </div>
          )}

          {!canEdit && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-bg-secondary/40 mb-5 text-sm text-text-secondary">
              <Lock className="w-4 h-4" />
              <span>
                {t('clinical.readOnly', 'Mode consultation — seul le médecin peut modifier cette fiche.')}
              </span>
            </div>
          )}

          {isLoading && !record ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <Section id="addiction" icon="🚬" title="L'addiction en détail" description="Comprendre quand et comment a démarré la dépendance.">
                <Grid>
                  <NumberField label="Années d'addiction" suffix="ans" value={form.yearsOfAddiction} onChange={(v) => update('yearsOfAddiction', v)} disabled={!canEdit} />
                  <DateField label="Date de début (approx.)" value={form.startedAt} onChange={(v) => update('startedAt', v)} disabled={!canEdit} />
                  <TextField label="Quantité quotidienne" placeholder="ex: 1 paquet/jour" value={form.dailyQuantity} onChange={(v) => update('dailyQuantity', v)} disabled={!canEdit} />
                  <NumberField label="Coût estimé / mois" suffix="EGP" value={form.estimatedCostPerMonth as number | null} onChange={(v) => update('estimatedCostPerMonth', v as unknown as MedicalRecord['estimatedCostPerMonth'])} disabled={!canEdit} />
                </Grid>
              </Section>

              <Section id="context" icon="🎯" title="Déclencheurs & contexte" description="Qu'est-ce qui pousse le patient à consommer ?">
                <FieldLabel label="Déclencheurs (multi)">
                  <div className="flex flex-wrap gap-1.5">
                    {TRIGGERS.map((trg) => (
                      <Chip key={trg} active={(form.triggers ?? []).includes(trg)} onClick={() => toggleArrayValue('triggers', trg)} disabled={!canEdit}>
                        {t(`clinical.triggers.${trg}`, trg)}
                      </Chip>
                    ))}
                  </div>
                </FieldLabel>
                <TextareaField label="Moments précis de consommation" placeholder="ex: après chaque repas, en sortie le weekend…" value={form.consumptionMoments} onChange={(v) => update('consumptionMoments', v)} disabled={!canEdit} />
                <Grid>
                  <TextareaField label="Contexte social" placeholder="ex: conjoint fume aussi, groupe d'amis…" value={form.socialContext} onChange={(v) => update('socialContext', v)} disabled={!canEdit} />
                  <TextareaField label="Contexte professionnel" placeholder="ex: métier stressant, pauses cigarette…" value={form.workContext} onChange={(v) => update('workContext', v)} disabled={!canEdit} />
                </Grid>
              </Section>

              <Section id="history" icon="⏪" title="Tentatives précédentes" description="Ce qui a marché, ce qui n'a pas marché.">
                <Grid>
                  <NumberField label="Nombre de tentatives" value={form.previousAttempts} onChange={(v) => update('previousAttempts', v)} disabled={!canEdit} />
                  <TextField label="Plus longue période d'arrêt" placeholder="ex: 6 mois en 2022" value={form.longestQuit} onChange={(v) => update('longestQuit', v)} disabled={!canEdit} />
                </Grid>
                <TextareaField label="Raisons de la rechute" placeholder="ex: deuil familial, retour au boulot…" value={form.relapseReasons} onChange={(v) => update('relapseReasons', v)} disabled={!canEdit} />
                <FieldLabel label="Méthodes déjà essayées (multi)">
                  <div className="flex flex-wrap gap-1.5">
                    {METHODS.map((m) => (
                      <Chip key={m} active={(form.methodsTried ?? []).includes(m)} onClick={() => toggleArrayValue('methodsTried', m)} disabled={!canEdit}>
                        {t(`clinical.methods.${m}`, m)}
                      </Chip>
                    ))}
                  </div>
                </FieldLabel>
              </Section>

              <Section id="scores" icon="📊" title="Évaluations 0-10" description="Auto-évaluation du patient de 0 (rien) à 10 (extrême).">
                {[
                  { key: 'stressScore', label: 'Stress' },
                  { key: 'anxietyScore', label: 'Anxiété' },
                  { key: 'cravingScore', label: 'Force des envies (craving)' },
                  { key: 'sleepScore', label: 'Qualité du sommeil' },
                  { key: 'motivationScore', label: 'Motivation à arrêter' },
                  { key: 'selfEsteemScore', label: 'Estime de soi' },
                ].map((s) => (
                  <SliderField key={s.key} label={s.label} value={form[s.key as keyof MedicalRecord] as number | null} onChange={(v) => update(s.key as keyof MedicalRecord, v as never)} disabled={!canEdit} />
                ))}
              </Section>

              <Section id="exam" icon="🩺" title="Examen clinique" description="Mesures de base avant le protocole laser.">
                <Grid>
                  <NumberField label="Poids" suffix="kg" step={0.1} value={form.weight} onChange={(v) => update('weight', v)} disabled={!canEdit} />
                  <NumberField label="Taille" suffix="cm" value={form.height} onChange={(v) => update('height', v)} disabled={!canEdit} />
                  <div className="rounded-lg bg-primary-lightest/40 px-3 py-2 border border-primary-lightest">
                    <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">IMC (auto)</div>
                    <div className="text-lg font-bold text-primary-dark mt-0.5" data-numeric>
                      {computedBmi !== null ? computedBmi : '—'}
                    </div>
                  </div>
                </Grid>
                <Grid>
                  <TextField label="Tension artérielle" placeholder="120/80" value={form.bloodPressure} onChange={(v) => update('bloodPressure', v)} disabled={!canEdit} />
                  <NumberField label="Pulsations" suffix="bpm" value={form.heartRate} onChange={(v) => update('heartRate', v)} disabled={!canEdit} />
                  <NumberField label="SpO₂" suffix="%" value={form.spo2} onChange={(v) => update('spo2', v)} disabled={!canEdit} />
                </Grid>
              </Section>

              <Section id="antecedents" icon="💊" title="Antécédents médicaux">
                <TextareaField label="Antécédents médicaux" value={form.medicalHistory} onChange={(v) => update('medicalHistory', v)} disabled={!canEdit} />
                <Grid>
                  <TextareaField label="Antécédents chirurgicaux" value={form.surgicalHistory} onChange={(v) => update('surgicalHistory', v)} disabled={!canEdit} />
                  <TextareaField label="Antécédents familiaux" value={form.familyHistory} onChange={(v) => update('familyHistory', v)} disabled={!canEdit} />
                </Grid>
                <Grid>
                  <TextareaField label="Médicaments en cours" value={form.currentMedications} onChange={(v) => update('currentMedications', v)} disabled={!canEdit} />
                  <TextareaField label="Allergies" value={form.allergies} onChange={(v) => update('allergies', v)} disabled={!canEdit} />
                </Grid>
              </Section>

              <Section id="contraindications" icon="⚠️" title="Contre-indications laser" description="À vérifier obligatoirement avant tout traitement." tone="warning">
                <FieldLabel label="Contre-indications (multi)">
                  <div className="flex flex-wrap gap-1.5">
                    {CONTRAINDICATIONS.map((c) => (
                      <Chip key={c} active={(form.contraindications ?? []).includes(c)} onClick={() => toggleArrayValue('contraindications', c)} disabled={!canEdit}>
                        ⚠️ {t(`clinical.contraindications.${c}`, c)}
                      </Chip>
                    ))}
                  </div>
                </FieldLabel>
                <TextareaField label="Notes complémentaires" value={form.contraindicationNotes} onChange={(v) => update('contraindicationNotes', v)} disabled={!canEdit} />
              </Section>

              <Section id="standardized" icon="📋" title="Scores standardisés" description="Selon le type d'addiction.">
                <Grid>
                  {patient.primaryAddiction === 'TOBACCO' && (
                    <NumberField label="Fagerström (0-10)" min={0} max={10} value={form.fagerstromScore} onChange={(v) => update('fagerstromScore', v)} disabled={!canEdit} />
                  )}
                  {patient.primaryAddiction === 'ALCOHOL' && (
                    <NumberField label="AUDIT (0-40)" min={0} max={40} value={form.auditScore} onChange={(v) => update('auditScore', v)} disabled={!canEdit} />
                  )}
                  {patient.primaryAddiction === 'DRUGS' && (
                    <NumberField label="DUDIT (0-44)" min={0} max={44} value={form.duditScore} onChange={(v) => update('duditScore', v)} disabled={!canEdit} />
                  )}
                  {patient.primaryAddiction === 'SUGAR' && (
                    <NumberField label="YFAS (0-11)" min={0} max={11} value={form.yfasScore} onChange={(v) => update('yfasScore', v)} disabled={!canEdit} />
                  )}
                  <NumberField label="HAD-Anxiété (0-21)" min={0} max={21} value={form.hadAnxietyScore} onChange={(v) => update('hadAnxietyScore', v)} disabled={!canEdit} />
                  <NumberField label="HAD-Dépression (0-21)" min={0} max={21} value={form.hadDepressionScore} onChange={(v) => update('hadDepressionScore', v)} disabled={!canEdit} />
                </Grid>
              </Section>

              <Section id="protocol" icon="💎" title="Protocole thérapeutique">
                <TextareaField label="Points d'auriculothérapie" placeholder="ex: Shen Men, Estomac, Foie…" value={form.auricularPoints} onChange={(v) => update('auricularPoints', v)} disabled={!canEdit} />
                <Grid>
                  <NumberField label="Durée du laser" suffix="min" value={form.laserDuration} onChange={(v) => update('laserDuration', v)} disabled={!canEdit} />
                  <TextField label="Fréquence des séances" placeholder="ex: 1x/semaine" value={form.sessionFrequency} onChange={(v) => update('sessionFrequency', v)} disabled={!canEdit} />
                  <NumberField label="Nb estimé de séances" value={form.estimatedSessions} onChange={(v) => update('estimatedSessions', v)} disabled={!canEdit} />
                </Grid>
              </Section>

              <Section id="goals" icon="🎯" title="Objectifs & plan">
                <TextareaField label="Objectifs du patient" placeholder="ex: arrêter complètement avant juin" value={form.patientGoals} onChange={(v) => update('patientGoals', v)} disabled={!canEdit} />
                <TextareaField label="Plan thérapeutique" value={form.treatmentPlan} onChange={(v) => update('treatmentPlan', v)} disabled={!canEdit} />
              </Section>

              {isPractitioner && (
                <Section id="notes" icon="🔒" title="Notes privées" description="Visibles uniquement par les médecins." tone="warning">
                  <TextareaField label="Notes" value={form.privateNotes} onChange={(v) => update('privateNotes', v)} rows={6} disabled={!canEdit} />
                </Section>
              )}

              {canEdit && (
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-sm">
                        {isFinalized
                          ? t('clinical.alreadyFinalized', 'Fiche déjà terminée')
                          : t('clinical.readyToFinalize', 'Marquer la fiche comme terminée ?')}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 max-w-md">
                        {isFinalized
                          ? "La fiche a été marquée comme terminée. Elle reste modifiable pour le suivi — chaque édition est tracée."
                          : "Une fois terminée, la fiche reste modifiable mais sera marquée comme « complète » avec la date et votre nom."}
                      </p>
                      {isFinalized && record?.finalizedAt && (
                        <Badge variant="success" className="mt-2">
                          ✓{' '}
                          {new Date(record.finalizedAt).toLocaleString(i18n.language, {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}{' '}
                          · Dr. {record.finalizedBy?.firstName}
                        </Badge>
                      )}
                    </div>
                    {!isFinalized && (
                      <Button onClick={() => finalizeMut.mutate()} disabled={finalizeMut.isPending}>
                        <CheckCircle2 className="w-4 h-4 me-1.5" />
                        {finalizeMut.isPending ? 'Finalisation…' : 'Terminer la fiche'}
                      </Button>
                    )}
                    {isFinalized && (
                      <Button variant="outline" onClick={() => navigate(`/patients/${patientId}?tab=clinique`)}>
                        OK
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({
  id,
  icon,
  title,
  description,
  tone = 'default',
  children,
}: {
  id: string;
  icon: string;
  title: string;
  description?: string;
  tone?: 'default' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card>
        <div className={`px-5 py-4 border-b border-border-light ${tone === 'warning' ? 'bg-warning-light/40' : ''}`}>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            {title}
          </h3>
          {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
        </div>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, disabled }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <FieldLabel label={label}>
      <Input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} disabled={disabled} />
    </FieldLabel>
  );
}

function NumberField({ label, value, onChange, suffix, step, min, max, disabled }: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; suffix?: string; step?: number; min?: number; max?: number; disabled?: boolean }) {
  return (
    <FieldLabel label={suffix ? `${label} (${suffix})` : label}>
      <Input type="number" value={value ?? ''} onChange={(e) => { const v = e.target.value; onChange(v === '' ? null : Number(v)); }} step={step} min={min} max={max} disabled={disabled} />
    </FieldLabel>
  );
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void; disabled?: boolean }) {
  const dateStr = value ? new Date(value).toISOString().slice(0, 10) : '';
  return (
    <FieldLabel label={label}>
      <Input type="date" value={dateStr} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />
    </FieldLabel>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, disabled }: { label: string; value: string | null | undefined; onChange: (v: string | null) => void; placeholder?: string; rows?: number; disabled?: boolean }) {
  return (
    <FieldLabel label={label}>
      <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder} rows={rows} disabled={disabled} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-50 disabled:cursor-not-allowed resize-none" />
    </FieldLabel>
  );
}

function SliderField({ label, value, onChange, disabled }: { label: string; value: number | null | undefined; onChange: (v: number) => void; disabled?: boolean }) {
  const v = value ?? 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-2xl font-bold text-primary-dark tabular-nums w-12 text-end">{v}</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={v} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled} className="w-full accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" />
      <div className="flex justify-between text-[10px] text-text-tertiary mt-0.5 px-0.5">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 5_000) return "à l'instant";
  if (diff < 60_000) return `il y a ${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  return `à ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function sanitizePayload(form: Partial<MedicalRecord>): Partial<MedicalRecord> {
  const blacklist = ['id', 'patientId', 'bmi', 'createdBy', 'finalizedBy', 'createdById', 'finalizedById', 'finalizedAt', 'createdAt', 'updatedAt'];
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form)) {
    if (blacklist.includes(key)) continue;
    payload[key] = value;
  }
  return payload as Partial<MedicalRecord>;
}
