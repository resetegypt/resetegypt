import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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

const PRICE: Record<Addiction, { FIRST: number; FOLLOWUP: number }> = {
  TOBACCO: { FIRST: 3500, FOLLOWUP: 1500 },
  DRUGS: { FIRST: 4000, FOLLOWUP: 1800 },
  ALCOHOL: { FIRST: 4000, FOLLOWUP: 1800 },
  SUGAR: { FIRST: 2500, FOLLOWUP: 1100 },
  STRESS: { FIRST: 2000, FOLLOWUP: 900 },
};

export function NewAppointmentPage() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialPatientId = params.get('patientId') ?? '';
  const slotIso = params.get('slot');

  const initialDate = slotIso ? new Date(slotIso) : new Date();
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState<string>(initialPatientId);
  const [practitionerId, setPractitionerId] = useState<string>('');
  const [service, setService] = useState<Addiction>('TOBACCO');
  const [visitType, setVisitType] = useState<'FIRST' | 'FOLLOWUP'>('FIRST');
  const [date, setDate] = useState(initialDate.toISOString().slice(0, 10));
  const [time, setTime] = useState(slotIso ? new Date(slotIso).toTimeString().slice(0, 5) : '10:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: practitionersData } = useQuery({
    queryKey: ['practitioners'],
    queryFn: () =>
      apiGet<{ practitioners: Array<{ id: string; firstName: string; lastName: string }> }>(
        '/practitioners',
      ),
  });

  useEffect(() => {
    if (practitionersData && practitionersData.practitioners.length > 0 && !practitionerId) {
      setPractitionerId(practitionersData.practitioners[0]!.id);
    }
  }, [practitionersData, practitionerId]);

  const { data: patientsData } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () =>
      apiGet<{
        patients: Array<{
          id: string;
          firstName: string;
          lastName: string;
          phone: string;
          primaryAddiction: string;
        }>;
      }>(
        // status=ACTIVE par défaut côté API — exclut les patients archivés
        // de l'autocomplete de création RDV.
        patientSearch
          ? `/patients?search=${encodeURIComponent(patientSearch)}&status=ACTIVE`
          : '/patients?status=ACTIVE',
      ),
    enabled: !initialPatientId && patientSearch.length >= 2,
  });

  const selectedPatient = patientsData?.patients.find((p) => p.id === patientId);
  const price = PRICE[service][visitType];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!patientId || !practitionerId) {
      setError(t('newAppointment.errPatientPractitionerRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await apiPost<{ appointment: { id: string } }>('/appointments', {
        patientId,
        practitionerId,
        scheduledAt,
        service,
        visitType,
        source: 'phone',
        notes: notes || undefined,
      });
      navigate(`/patients/${patientId}`);
    } catch (err) {
      const msg = (err as { payload?: { error?: string } }).payload?.error;
      setError(
        msg === 'TimeSlotConflict'
          ? t('newAppointment.errSlotConflict')
          : t('newAppointment.errGeneric'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title={t('newAppointment.title')} subtitle={t('newAppointment.subtitle')} />
      <form onSubmit={submit} className="p-7 space-y-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>👤 {t('newAppointment.patient')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialPatientId ? (
              <p className="text-sm">
                <strong>{t('newAppointment.patientSelectedFromFile')}</strong> · ID {initialPatientId}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={t('newAppointment.patientSearchPlaceholder')}
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Link
                    to={`/patients/intake${slotIso ? `?slot=${encodeURIComponent(slotIso)}` : ''}`}
                    className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-primary/40 bg-primary-lightest text-primary-dark text-sm font-medium hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                  >
                    +{' '}
                    {t('newAppointment.newPatient', 'Nouveau patient')}
                  </Link>
                </div>
                {patientSearch.length >= 2 && (
                  <div className="max-h-48 overflow-y-auto border border-border rounded">
                    {patientsData?.patients.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPatientId(p.id)}
                        className={`w-full text-start px-3 py-2 text-sm border-b border-border-light last:border-0 ${
                          patientId === p.id ? 'bg-info-light' : 'hover:bg-bg-secondary'
                        }`}
                      >
                        <strong>
                          {p.firstName} {p.lastName}
                        </strong>{' '}
                        · <span data-numeric>{p.phone}</span> ·{' '}
                        <span className="text-text-tertiary">
                          {ADDICTION_ICON[p.primaryAddiction as Addiction]}{' '}
                          {t(`addiction.${p.primaryAddiction}`)}
                        </span>
                      </button>
                    ))}
                    {patientsData && patientsData.patients.length === 0 && (
                      <p className="px-3 py-4 text-sm text-text-secondary">
                        {t('newAppointment.noPatientFound')}{' '}
                        <Link
                          to={`/patients/intake${slotIso ? `?slot=${encodeURIComponent(slotIso)}` : ''}`}
                          className="text-primary underline"
                        >
                          {t('newAppointment.createIntakeLink')}
                        </Link>
                      </p>
                    )}
                  </div>
                )}
                {patientSearch.length < 2 && !selectedPatient && (
                  <p className="text-xs text-text-tertiary italic">
                    {t(
                      'newAppointment.searchHint',
                      'Tapez 2 caractères pour chercher un patient existant, ou créez un nouveau patient.',
                    )}
                  </p>
                )}
                {selectedPatient && (
                  <p className="text-sm">
                    ✓ <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>{' '}
                    {t('newAppointment.patientSelected')}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🩺 {t('newAppointment.serviceTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">{t('newAppointment.service')}</label>
              <div className="flex gap-2 flex-wrap">
                {ADDICTIONS.map((a) => (
                  <Chip key={a} active={service === a} onClick={() => setService(a)}>
                    {ADDICTION_ICON[a]} {t(`addiction.${a}`)}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">{t('newAppointment.visitType')}</label>
                <div className="flex gap-2">
                  <Chip active={visitType === 'FIRST'} onClick={() => setVisitType('FIRST')}>
                    {t('newAppointment.firstSession')}
                  </Chip>
                  <Chip
                    active={visitType === 'FOLLOWUP'}
                    onClick={() => setVisitType('FOLLOWUP')}
                  >
                    {t('newAppointment.followup')}
                  </Chip>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('newAppointment.price')}</label>
                <Input
                  readOnly
                  value={`${price.toLocaleString(i18n.language)} EGP`}
                  className="bg-bg-secondary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('newAppointment.practitioner')}</label>
              <select
                className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                value={practitionerId}
                onChange={(e) => setPractitionerId(e.target.value)}
              >
                {practitionersData?.practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    Dr. {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📅 {t('newAppointment.dateTime')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">{t('newAppointment.date')}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('newAppointment.timeSlot')}</label>
              <Input
                type="time"
                step={2400}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              <p className="text-xs text-text-tertiary mt-1">{t('newAppointment.slotInfo')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 {t('newAppointment.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded border border-border bg-surface p-3 text-sm min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('newAppointment.notesPlaceholder')}
            />
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('newAppointment.creating') : `✓ ${t('newAppointment.create')}`}
          </Button>
        </div>
      </form>
    </>
  );
}
