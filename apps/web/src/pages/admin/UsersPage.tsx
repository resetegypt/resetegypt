import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogTitle, DialogTrigger, Input } from '@reset/ui';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface UserRow {
  id: string;
  email: string;
  role: 'ADMIN' | 'PRACTITIONER' | 'SECRETARY';
  firstName: string;
  lastName: string;
  isActive: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, refetch } = useQuery({
    queryKey: ['users', search],
    queryFn: () => apiGet<{ users: UserRow[] }>(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
  const { data: kpis } = useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: () => apiGet<{ total: number; active: number; locked: number; recentFailed: number }>('/admin/kpis'),
  });

  const unlockMut = useMutation({
    mutationFn: (id: string) => apiPost(`/users/${id}/unlock`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    },
  });

  return (
    <>
      <PageHeader
        title="Gestion des comptes"
        subtitle="Administration des utilisateurs et permissions"
        actions={<CreateUserDialog onCreated={() => refetch()} />}
      />
      <div className="p-7 space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Total comptes</p>
              <p className="text-3xl font-bold">{kpis?.total ?? '–'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Actifs</p>
              <p className="text-3xl font-bold text-primary-dark">{kpis?.active ?? '–'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Verrouillés</p>
              <p className="text-3xl font-bold text-danger-dark">{kpis?.locked ?? '–'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Échecs 24h</p>
              <p className="text-3xl font-bold text-warning-dark">{kpis?.recentFailed ?? '–'}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>👤 Utilisateurs</CardTitle>
            <Input
              placeholder="Rechercher nom ou email…"
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
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Rôle</th>
                  <th className="text-left px-4 py-2">Statut</th>
                  <th className="text-left px-4 py-2">Dernière connexion</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          u.role === 'ADMIN' ? 'danger' : u.role === 'PRACTITIONER' ? 'success' : 'info'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.isLocked ? (
                        <Badge variant="danger">Verrouillé</Badge>
                      ) : u.isActive ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Badge variant="neutral">Désactivé</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-tertiary">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isLocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unlockMut.mutate(u.id)}
                          disabled={unlockMut.isPending}
                        >
                          Déverrouiller
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'SECRETARY' as const,
    password: '',
  });
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    try {
      await apiPost('/users', form);
      setOpen(false);
      onCreated();
      setForm({ email: '', firstName: '', lastName: '', role: 'SECRETARY', password: '' });
    } catch (e) {
      setErr((e as { message?: string }).message ?? 'Erreur');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>➕ Nouveau compte</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Créer un compte</DialogTitle>
        <div className="space-y-3 mt-4">
          <Input placeholder="Prénom" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input placeholder="Nom" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select
            className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
          >
            <option value="SECRETARY">SECRETARY</option>
            <option value="PRACTITIONER">PRACTITIONER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <Input type="password" placeholder="Mot de passe (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {err && <div className="text-sm text-danger">{err}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit}>Créer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
