import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface PatientRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number | null;
  primaryAddiction: string;
  status: string;
  createdAt: string;
}

const ADDICTION_LABEL: Record<string, string> = {
  TOBACCO: '🚬 Tabac',
  DRUGS: '💊 Drogue',
  ALCOHOL: '🍷 Alcool',
  SUGAR: '🍬 Sucre',
  STRESS: '😰 Stress',
};

export function PatientsListPage() {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => apiGet<{ patients: PatientRow[] }>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={`${data?.patients.length ?? 0} patients`}
        actions={
          <Link to="/patients/intake">
            <Button>➕ Nouveau patient</Button>
          </Link>
        }
      />
      <div className="p-7 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>👥 Liste</CardTitle>
            <Input
              placeholder="Rechercher nom ou téléphone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-2">Nom</th>
                  <th className="text-left px-4 py-2">Téléphone</th>
                  <th className="text-left px-4 py-2">Âge</th>
                  <th className="text-left px-4 py-2">Suivi</th>
                  <th className="text-left px-4 py-2">Statut</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.patients.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-secondary/50">
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/patients/${p.id}`} className="hover:text-info">
                        {p.firstName} {p.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{p.phone}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.age ?? '—'}</td>
                    <td className="px-4 py-3">{ADDICTION_LABEL[p.primaryAddiction] ?? p.primaryAddiction}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/patients/${p.id}`}>
                        <Button size="sm" variant="outline">Voir</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {data && data.patients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                      Aucun patient trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
