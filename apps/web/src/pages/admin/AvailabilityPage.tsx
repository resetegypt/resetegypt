// ============================================================================
// AvailabilityPage.tsx — gestion des horaires des praticiens (admin uniquement).
//
// Fonctionnalités :
//   - Sélection praticien dropdown
//   - Grille semaine (lun-dim) : créneaux par jour
//   - Ajout / suppression de créneaux (start-end en HH:MM)
//   - Liste des congés à venir + ajout / suppression
//   - Sauvegarde atomique via PUT /practitioners/:id/availability
// ============================================================================

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@reset/ui';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface Slot { id?: string; dayOfWeek: number; startMinutes: number; endMinutes: number; isActive: boolean }
interface TimeOff { id: string; startAt: string; endAt: string; type: 'TIME_OFF' | 'EXTRA'; reason: string | null }
interface Practitioner { id: string; firstName: string; lastName: string }

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
function fromHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function AvailabilityPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();

  const { data: practitioners = [] } = useQuery<Practitioner[]>({
    queryKey: ['practitioners-list'],
    queryFn: async () => {
      const r = await apiGet<{ practitioners: Practitioner[] }>('/practitioners');
      return r.practitioners;
    },
    enabled: isAdmin,
  });

  const [selectedId, setSelectedId] = useState<string>(user?.role === 'PRACTITIONER' ? user.id : '');

  useEffect(() => {
    if (isAdmin && !selectedId && practitioners.length > 0) {
      setSelectedId(practitioners[0]!.id);
    }
  }, [isAdmin, selectedId, practitioners]);

  const { data: availability } = useQuery({
    queryKey: ['availability', selectedId],
    queryFn: async () => apiGet<{ weekly: Slot[]; upcomingTimeOff: TimeOff[] }>(`/practitioners/${selectedId}/availability`),
    enabled: !!selectedId,
  });

  const [draft, setDraft] = useState<Slot[]>([]);
  useEffect(() => {
    if (availability) setDraft(availability.weekly);
  }, [availability]);

  const saveMutation = useMutation({
    mutationFn: async () => apiPut(`/practitioners/${selectedId}/availability`, { slots: draft.map((s) => ({
      dayOfWeek: s.dayOfWeek, startMinutes: s.startMinutes, endMinutes: s.endMinutes, isActive: s.isActive,
    })) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability', selectedId] }),
  });

  function addSlot(day: number) {
    setDraft([...draft, { dayOfWeek: day, startMinutes: 10 * 60, endMinutes: 18 * 60, isActive: true }]);
  }
  function updateSlot(idx: number, patch: Partial<Slot>) {
    setDraft(draft.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function removeSlot(idx: number) {
    setDraft(draft.filter((_, i) => i !== idx));
  }

  // Time-off
  const [newTimeOff, setNewTimeOff] = useState<{ startAt: string; endAt: string; type: 'TIME_OFF' | 'EXTRA'; reason: string }>({ startAt: '', endAt: '', type: 'TIME_OFF', reason: '' });
  const timeOffMutation = useMutation({
    mutationFn: async () => apiPost(`/practitioners/${selectedId}/time-off`, {
      startAt: new Date(newTimeOff.startAt).toISOString(),
      endAt: new Date(newTimeOff.endAt).toISOString(),
      type: newTimeOff.type,
      reason: newTimeOff.reason || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability', selectedId] });
      setNewTimeOff({ startAt: '', endAt: '', type: 'TIME_OFF', reason: '' });
    },
  });
  const deleteTimeOffMutation = useMutation({
    mutationFn: async (id: string) => apiDelete(`/practitioners/${selectedId}/time-off/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability', selectedId] }),
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" /> Disponibilités praticien
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure les horaires de travail et les exceptions (congés, jours fériés).
          </p>
        </div>
        {isAdmin && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          >
            {practitioners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        )}
      </header>

      {/* Semaine */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Semaine type</h2>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
          <div className="space-y-3">
            {DAYS.map((label, dayIdx) => {
              const slotsForDay = draft.map((s, i) => ({ ...s, _idx: i })).filter((s) => s.dayOfWeek === dayIdx);
              return (
                <div key={dayIdx} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-sm text-text">{label}</strong>
                    <button
                      onClick={() => addSlot(dayIdx)}
                      className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> ajouter un créneau
                    </button>
                  </div>
                  {slotsForDay.length === 0 ? (
                    <p className="text-xs text-text-secondary italic">Aucun créneau — praticien indisponible ce jour</p>
                  ) : (
                    <div className="space-y-2">
                      {slotsForDay.map((s) => (
                        <div key={s._idx} className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="time"
                            value={toHHMM(s.startMinutes)}
                            onChange={(e) => updateSlot(s._idx, { startMinutes: fromHHMM(e.target.value) })}
                            className="w-28"
                          />
                          <span className="text-text-secondary">→</span>
                          <Input
                            type="time"
                            value={toHHMM(s.endMinutes)}
                            onChange={(e) => updateSlot(s._idx, { endMinutes: fromHHMM(e.target.value) })}
                            className="w-28"
                          />
                          <label className="flex items-center gap-1 text-xs text-text-secondary">
                            <input
                              type="checkbox"
                              checked={s.isActive}
                              onChange={(e) => updateSlot(s._idx, { isActive: e.target.checked })}
                            />
                            actif
                          </label>
                          <button
                            onClick={() => removeSlot(s._idx)}
                            className="text-danger hover:text-danger-dark ml-auto"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time-off */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold text-text">Congés & exceptions à venir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <Input
              type="datetime-local"
              value={newTimeOff.startAt}
              onChange={(e) => setNewTimeOff({ ...newTimeOff, startAt: e.target.value })}
              placeholder="Début"
            />
            <Input
              type="datetime-local"
              value={newTimeOff.endAt}
              onChange={(e) => setNewTimeOff({ ...newTimeOff, endAt: e.target.value })}
              placeholder="Fin"
            />
            <select
              value={newTimeOff.type}
              onChange={(e) => setNewTimeOff({ ...newTimeOff, type: e.target.value as 'TIME_OFF' | 'EXTRA' })}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
            >
              <option value="TIME_OFF">Congé / indisponible</option>
              <option value="EXTRA">Créneau spécial (dispo)</option>
            </select>
            <Input
              type="text"
              placeholder="Raison (optionnel)"
              value={newTimeOff.reason}
              onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
            />
            <Button
              onClick={() => timeOffMutation.mutate()}
              disabled={!newTimeOff.startAt || !newTimeOff.endAt || timeOffMutation.isPending}
            >
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {(availability?.upcomingTimeOff ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
                <div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                    t.type === 'EXTRA' ? 'bg-info-light text-info-dark' : 'bg-danger-light text-danger-dark'
                  } me-2`}>
                    {t.type === 'EXTRA' ? 'Extra' : 'Congé'}
                  </span>
                  <strong>{new Date(t.startAt).toLocaleString('fr-FR')}</strong>
                  {' → '}
                  <strong>{new Date(t.endAt).toLocaleString('fr-FR')}</strong>
                  {t.reason && <span className="text-text-secondary ms-2">— {t.reason}</span>}
                </div>
                <button
                  onClick={() => deleteTimeOffMutation.mutate(t.id)}
                  className="text-danger hover:text-danger-dark"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(availability?.upcomingTimeOff ?? []).length === 0 && (
              <p className="text-xs text-text-secondary italic">Aucune exception à venir.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
