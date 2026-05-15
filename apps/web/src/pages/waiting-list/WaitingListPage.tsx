import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
} from '@reset/ui';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { useToast } from '../../lib/toast';
import { SkelList } from '../../components/skeletons';
import {
  Users,
  Bell,
  Plus,
  Star,
  Trash2,
  Phone,
  MessageCircle,
  X,
  Search,
  Mail,
  CheckCheck,
  Calendar,
} from 'lucide-react';

interface WaitingPatient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  tags: string[];
}

interface WaitingEntry {
  id: string;
  service: 'TOBACCO' | 'DRUGS' | 'ALCOHOL' | 'SUGAR' | 'STRESS';
  preferredFrom: string | null;
  preferredTo: string | null;
  preferredDays: string[];
  preferredHours: string | null;
  practitionerId: string | null;
  priority: number;
  status: 'WAITING' | 'NOTIFIED' | 'BOOKED' | 'EXPIRED' | 'CANCELLED';
  notifiedAt: string | null;
  notifiedSlotAt: string | null;
  createdAt: string;
  notes: string | null;
  patient: WaitingPatient;
}

interface PatientLite {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  primaryAddiction: 'TOBACCO' | 'DRUGS' | 'ALCOHOL' | 'SUGAR' | 'STRESS';
}

const SERVICE_LABEL: Record<string, string> = {
  TOBACCO: 'Sevrage tabagique',
  DRUGS: 'Sevrage drogues',
  ALCOHOL: 'Sevrage alcool',
  SUGAR: 'Gestion du sucre',
  STRESS: 'Stress / anxiété',
};

const SERVICE_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'En attente',
  NOTIFIED: 'Notifié',
  BOOKED: 'Réservé',
  EXPIRED: 'Expiré',
  CANCELLED: 'Annulé',
};

export function WaitingListPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillPatientId = searchParams.get('prefillPatientId');
  const [showAddModal, setShowAddModal] = useState(!!prefillPatientId);
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    if (prefillPatientId) {
      setShowAddModal(true);
    }
  }, [prefillPatientId]);

  const { data, isLoading } = useQuery({
    queryKey: ['waiting-list', statusFilter],
    queryFn: () =>
      apiGet<{ entries: WaitingEntry[] }>(
        statusFilter === 'all' ? '/waiting-list?status=' : '/waiting-list',
      ),
  });

  const entries = data?.entries ?? [];
  const byService = useMemo(() => {
    const map = new Map<string, WaitingEntry[]>();
    entries.forEach((e) => {
      const arr = map.get(e.service) ?? [];
      arr.push(e);
      map.set(e.service, arr);
    });
    return map;
  }, [entries]);

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/waiting-list/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
      toast.success(t('waitingList.toasts.removed', 'Patient retiré de la liste'));
    },
    onError: () => toast.error(t('toasts.actionFailed', 'Action impossible')),
  });

  const notify = useMutation({
    mutationFn: ({ id, slotAt }: { id: string; slotAt?: string }) =>
      apiPost(`/waiting-list/${id}/notify`, slotAt ? { slotAt } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
      toast.success(t('waitingList.toasts.notified', 'Email envoyé au patient'));
    },
    onError: (err: Error) => {
      toast.error(
        err.message?.includes('PatientHasNoEmail')
          ? t('waitingList.toasts.noEmail', "Ce patient n'a pas d'email")
          : t('waitingList.toasts.notifyFailed', "Échec de l'envoi"),
      );
    },
  });

  const counts = {
    total: entries.length,
    waiting: entries.filter((e) => e.status === 'WAITING').length,
    notified: entries.filter((e) => e.status === 'NOTIFIED').length,
  };

  return (
    <>
      <PageHeader
        title={t('waitingList.title', "Liste d'attente")}
        subtitle={t(
          'waitingList.subtitle',
          `${counts.waiting} patient(s) en attente · ${counts.notified} notifié(s)`,
          counts,
        )}
        actions={
          <>
            <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-1">
              {(['active', 'all'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === s
                      ? 'bg-surface shadow-sm text-text'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {s === 'active' ? 'En cours' : 'Toutes'}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 me-1.5" />
              {t('waitingList.add', 'Ajouter un patient')}
            </Button>
          </>
        }
      />

      <div className="p-7 space-y-6 max-w-[1400px]">
        {isLoading ? (
          <SkelList rows={4} />
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-lightest text-primary-dark flex items-center justify-center mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {t('waitingList.empty.title', "Aucun patient en liste d'attente")}
              </h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
                {t(
                  'waitingList.empty.subtitle',
                  "Ajoutez les patients qui veulent venir dès qu'un créneau se libère. Ils seront notifiés automatiquement par email.",
                )}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 me-1.5" />
                {t('waitingList.add', 'Ajouter un patient')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          Array.from(byService.entries()).map(([service, list]) => (
            <Card key={service} className="overflow-hidden">
              <div className="px-5 py-4 border-b border-border-light bg-bg-secondary/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{SERVICE_ICON[service]}</span>
                  <h3 className="text-base font-semibold tracking-tight">{SERVICE_LABEL[service]}</h3>
                </div>
                <span className="text-xs text-text-secondary">
                  {list.length} {t('waitingList.entries', 'entrée(s)')}
                </span>
              </div>
              <div className="divide-y divide-border-light">
                {list.map((e) => (
                  <WaitingRow
                    key={e.id}
                    entry={e}
                    lang={i18n.language}
                    onNotify={(slotAt) => notify.mutate({ id: e.id, slotAt })}
                    onRemove={() => {
                      if (confirm('Retirer ce patient de la liste d\'attente ?')) {
                        remove.mutate(e.id);
                      }
                    }}
                  />
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      {showAddModal && (
        <AddToWaitingListModal
          prefillPatientId={prefillPatientId}
          onClose={() => {
            setShowAddModal(false);
            if (prefillPatientId) {
              const next = new URLSearchParams(searchParams);
              next.delete('prefillPatientId');
              setSearchParams(next, { replace: true });
            }
          }}
          onAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
            setShowAddModal(false);
          }}
        />
      )}
    </>
  );
}

function WaitingRow({
  entry,
  lang,
  onNotify,
  onRemove,
}: {
  entry: WaitingEntry;
  lang: string;
  onNotify: (slotAt?: string) => void;
  onRemove: () => void;
}) {
  const p = entry.patient;
  const initials = (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase();
  const phoneClean = p.phone?.replace(/[^0-9]/g, '') ?? '';
  const waitingDays = Math.floor(
    (Date.now() - new Date(entry.createdAt).getTime()) / (24 * 60 * 60 * 1000),
  );

  return (
    <div className="px-5 py-4 flex items-center gap-4 hover:bg-bg-secondary/30 transition-colors">
      <Avatar className="h-11 w-11 shrink-0">
        {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt={`${p.firstName} ${p.lastName}`} /> : null}
        <AvatarFallback className="bg-gradient-to-br from-primary-light to-secondary text-primary-dark font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/patients/${p.id}`}
            className="text-sm font-semibold text-text hover:text-primary truncate"
          >
            {p.firstName} {p.lastName}
          </Link>
          <Badge variant={entry.status === 'NOTIFIED' ? 'info' : 'warning'}>
            {STATUS_LABEL[entry.status]}
          </Badge>
          {entry.priority > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
              Priorité {entry.priority}
            </span>
          )}
          {p.tags.includes('vip') && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
              VIP
            </span>
          )}
        </div>
        <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="font-mono">{p.phone}</span>
          {p.email && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3" /> {p.email}
              </span>
            </>
          )}
          <span className="text-text-tertiary">·</span>
          <span>
            Ajouté il y a {waitingDays === 0 ? "aujourd'hui" : `${waitingDays} jour(s)`}
          </span>
          {entry.notifiedAt && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="text-info-dark">
                <CheckCheck className="w-3 h-3 inline" /> Notifié le{' '}
                {new Date(entry.notifiedAt).toLocaleDateString(lang)}
              </span>
            </>
          )}
        </div>
        {entry.notes && (
          <p className="text-[11px] text-text-tertiary mt-1 italic line-clamp-2">{entry.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`tel:${p.phone}`}>
            <Phone className="w-3.5 h-3.5" />
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noreferrer">
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNotify(undefined)}
          disabled={!p.email}
          title={!p.email ? "Pas d'email enregistré" : 'Envoyer un email de notification'}
        >
          <Bell className="w-3.5 h-3.5 me-1" />
          Notifier
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5 text-text-tertiary hover:text-danger" />
        </Button>
      </div>
    </div>
  );
}

function AddToWaitingListModal({
  prefillPatientId,
  onClose,
  onAdded,
}: {
  prefillPatientId: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientLite | null>(null);
  const [service, setService] = useState<WaitingEntry['service']>('TOBACCO');
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState('');
  const [preferredHours, setPreferredHours] = useState('');

  // Préchargement si on a un prefillPatientId (depuis Cmd+K)
  useQuery({
    queryKey: ['prefill-patient', prefillPatientId],
    queryFn: async () => {
      const r = await apiGet<{ patient: PatientLite & { primaryAddiction: WaitingEntry['service'] } }>(
        `/patients/${prefillPatientId}`,
      );
      setSelectedPatient(r.patient);
      setService(r.patient.primaryAddiction);
      return r;
    },
    enabled: !!prefillPatientId,
  });

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['waiting-list-add-search', search],
    queryFn: () =>
      apiGet<{ patients: PatientLite[] }>(
        `/patients?search=${encodeURIComponent(search)}&status=all`,
      ),
    enabled: search.length >= 2 && !selectedPatient,
  });

  const submit = useMutation({
    mutationFn: () =>
      apiPost('/waiting-list', {
        patientId: selectedPatient!.id,
        service,
        priority,
        preferredHours: preferredHours || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => onAdded(),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-center justify-center px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t('waitingList.add', "Ajouter à la liste d'attente")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!selectedPatient ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                  Patient
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nom ou téléphone…"
                    autoFocus
                    className="w-full ps-9 pe-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              {search.length >= 2 && (
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border-light max-h-64 overflow-y-auto">
                  {isFetching && (
                    <div className="px-4 py-3 text-sm text-text-tertiary text-center">
                      Recherche…
                    </div>
                  )}
                  {searchResults?.patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setService(p.primaryAddiction);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-bg-secondary transition-colors text-start"
                    >
                      <Avatar className="w-8 h-8">
                        {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt={`${p.firstName} ${p.lastName}`} /> : null}
                        <AvatarFallback className="text-[10px] font-bold">
                          {(p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[11px] text-text-secondary font-mono">{p.phone}</div>
                      </div>
                    </button>
                  ))}
                  {searchResults?.patients.length === 0 && !isFetching && (
                    <div className="px-4 py-3 text-sm text-text-tertiary text-center">
                      Aucun patient trouvé
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-secondary/30">
                <Avatar className="w-10 h-10">
                  {selectedPatient.avatarUrl ? (
                    <AvatarImage src={selectedPatient.avatarUrl} alt={`${selectedPatient.firstName} ${selectedPatient.lastName}`} />
                  ) : null}
                  <AvatarFallback className="text-xs font-bold">
                    {(
                      selectedPatient.firstName.charAt(0) + selectedPatient.lastName.charAt(0)
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </div>
                  <div className="text-[11px] text-text-secondary font-mono">{selectedPatient.phone}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-text-secondary hover:text-danger"
                >
                  Changer
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                  Service
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setService(s)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        service === s
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      <span>{SERVICE_ICON[s]}</span>
                      <span className="truncate">{SERVICE_LABEL[s]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                  Priorité (0 = normale, 10 = urgente)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Math.max(0, Math.min(10, Number(e.target.value))))}
                  className="w-24 px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                  Préférence horaire (optionnel)
                </label>
                <input
                  type="text"
                  value={preferredHours}
                  onChange={(e) => setPreferredHours(e.target.value)}
                  placeholder="Ex: matin uniquement, 18h+, weekends…"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Ex: revient de vacances le 15, préfère le créneau matin…"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-primary focus:outline-none resize-y"
                />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-bg-secondary/30 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submit.isPending}>
            Annuler
          </Button>
          <Button
            disabled={!selectedPatient || submit.isPending}
            onClick={() => submit.mutate()}
          >
            <Plus className="w-4 h-4 me-1.5" />
            {submit.isPending ? 'Ajout…' : 'Ajouter à la file'}
          </Button>
        </div>
      </div>
    </div>
  );
}
