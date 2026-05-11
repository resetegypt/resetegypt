import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardContent } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface WeekData {
  weekStart: string;
  appointments: Array<{
    id: string;
    scheduledAt: string;
    patientName: string;
    practitioner: string;
    service: string;
    visitType: string;
    status: string;
    price: number;
  }>;
}

const SLOTS_PER_DAY = 18;
const SLOT_DURATION_MIN = 40;
const START_HOUR = 10;

function slotTime(idx: number): string {
  const totalMinutes = START_HOUR * 60 + idx * SLOT_DURATION_MIN;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function AgendaPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const start = new Date();
  start.setDate(start.getDate() + weekOffset * 7);
  const { data } = useQuery({
    queryKey: ['agenda-week', start.toISOString().slice(0, 10)],
    queryFn: () => apiGet<WeekData>(`/appointments/week?start=${start.toISOString()}`),
  });

  const weekStart = data ? new Date(data.weekStart) : start;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const byKey = new Map<string, WeekData['appointments'][0]>();
  data?.appointments.forEach((a) => {
    const d = new Date(a.scheduledAt);
    const key = `${d.toISOString().slice(0, 10)}_${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    byKey.set(key, a);
  });

  const todayKey = new Date().toISOString().slice(0, 10);

  const totalCount = data?.appointments.length ?? 0;
  const capacity = 7 * SLOTS_PER_DAY;
  const occupation = capacity > 0 ? Math.round((totalCount / capacity) * 100) : 0;
  const expectedRevenue = (data?.appointments ?? []).reduce((sum, a) => sum + a.price, 0);
  const toConfirm = (data?.appointments ?? []).filter((a) => a.status === 'SCHEDULED').length;

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`Semaine du ${weekStart.toLocaleDateString()}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>← Semaine -1</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Aujourd'hui</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o + 1)}>Semaine +1 →</Button>
            <Link to="/appointments/new">
              <Button size="sm">➕ Nouveau RDV</Button>
            </Link>
          </>
        }
      />
      <div className="p-7 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">RDV / capacité</p>
              <p className="text-2xl font-bold">{totalCount} / {capacity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Occupation</p>
              <p className="text-2xl font-bold">{occupation}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">CA prévu</p>
              <p className="text-2xl font-bold text-primary-dark">{expectedRevenue.toLocaleString()} EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">À confirmer</p>
              <p className="text-2xl font-bold text-warning-dark">{toConfirm}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-2 py-2 text-left font-mono w-16">Heure</th>
                  {days.map((d) => {
                    const isToday = d.toISOString().slice(0, 10) === todayKey;
                    return (
                      <th
                        key={d.toISOString()}
                        className={`px-2 py-2 text-left ${isToday ? 'bg-info-light text-info-dark' : ''}`}
                      >
                        <div className="text-[10px] uppercase">{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                        <div className="font-bold">{d.getDate()}/{d.getMonth() + 1}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1 font-mono text-[10px] text-text-tertiary">{slotTime(i)}</td>
                    {days.map((d) => {
                      const key = `${d.toISOString().slice(0, 10)}_${slotTime(i)}`;
                      const a = byKey.get(key);
                      return (
                        <td key={d.toISOString()} className="px-1 py-0.5 align-top">
                          {a ? (
                            <Link to={`/patients/${a.patientName}`} className="block">
                              <div
                                className={`text-[10px] rounded px-1.5 py-1 cursor-pointer truncate ${
                                  statusColor(a.status)
                                }`}
                                title={`${a.patientName} — Dr.${a.practitioner}`}
                              >
                                <div className="font-medium truncate">{a.patientName}</div>
                                <div className="text-[9px] opacity-75 truncate">Dr.{a.practitioner}</div>
                              </div>
                            </Link>
                          ) : (
                            <Link to={`/appointments/new?slot=${encodeURIComponent(new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor((START_HOUR * 60 + i * SLOT_DURATION_MIN) / 60), (START_HOUR * 60 + i * SLOT_DURATION_MIN) % 60).toISOString())}`}>
                              <div className="text-[10px] text-text-tertiary border border-dashed border-border-light rounded px-1.5 py-1 hover:bg-bg-secondary/60 hover:border-info cursor-pointer">
                                +
                              </div>
                            </Link>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary"></span> Reda</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary"></span> Layla</span>
          <Badge variant="success">Confirmé</Badge>
          <Badge variant="warning">À confirmer</Badge>
          <Badge variant="info">En cours</Badge>
        </div>
      </div>
    </>
  );
}

function statusColor(status: string): string {
  if (status === 'CONFIRMED') return 'bg-primary-light text-primary-dark border border-primary';
  if (status === 'SCHEDULED') return 'bg-warning-light text-warning-dark border border-warning';
  if (status === 'IN_PROGRESS') return 'bg-info-light text-info-dark border border-info';
  if (status === 'COMPLETED') return 'bg-bg-secondary text-text-secondary';
  if (status === 'NO_SHOW') return 'bg-danger-light text-danger-dark border border-danger';
  return 'bg-bg-secondary text-text-secondary';
}
