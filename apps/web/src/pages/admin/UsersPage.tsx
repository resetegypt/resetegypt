import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, refetch } = useQuery({
    queryKey: ['users', search],
    queryFn: () =>
      apiGet<{ users: UserRow[] }>(
        `/users${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      ),
  });
  const { data: kpis } = useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: () =>
      apiGet<{ total: number; active: number; locked: number; recentFailed: number }>(
        '/admin/kpis',
      ),
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
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={<CreateUserDialog onCreated={() => refetch()} />}
      />
      <div className="p-7 space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('users.kpi.total')}</p>
              <p className="text-3xl font-bold" data-numeric>{kpis?.total ?? '–'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('users.kpi.active')}</p>
              <p className="text-3xl font-bold text-primary-dark" data-numeric>
                {kpis?.active ?? '–'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('users.kpi.locked')}</p>
              <p className="text-3xl font-bold text-danger-dark" data-numeric>
                {kpis?.locked ?? '–'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('users.kpi.failedAttempts')}</p>
              <p className="text-3xl font-bold text-warning-dark" data-numeric>
                {kpis?.recentFailed ?? '–'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>👤 {t('users.list')}</CardTitle>
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-start px-4 py-2">{t('users.columns.name')}</th>
                  <th className="text-start px-4 py-2">{t('users.columns.email')}</th>
                  <th className="text-start px-4 py-2">{t('users.columns.role')}</th>
                  <th className="text-start px-4 py-2">{t('users.columns.status')}</th>
                  <th className="text-start px-4 py-2">{t('users.columns.lastLogin')}</th>
                  <th className="text-end px-4 py-2">{t('users.columns.actions')}</th>
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
                          u.role === 'ADMIN'
                            ? 'danger'
                            : u.role === 'PRACTITIONER'
                              ? 'success'
                              : 'info'
                        }
                      >
                        {t(`roles.${u.role}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.isLocked ? (
                        <Badge variant="danger">{t('users.locked')}</Badge>
                      ) : u.isActive ? (
                        <Badge variant="success">{t('users.active')}</Badge>
                      ) : (
                        <Badge variant="neutral">{t('users.disabled')}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-tertiary" data-numeric>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString(i18n.language) : '—'}
                    </td>
                    <td className="px-4 py-3 text-end">
                      {u.isLocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unlockMut.mutate(u.id)}
                          disabled={unlockMut.isPending}
                        >
                          {t('users.unlock')}
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
  const { t } = useTranslation();
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
      setErr((e as { message?: string }).message ?? 'Error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>➕ {t('users.newAccount')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('users.createDialog.title')}</DialogTitle>
        <div className="space-y-3 mt-4">
          <Input
            placeholder={t('users.createDialog.firstName')}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            placeholder={t('users.createDialog.lastName')}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            type="email"
            placeholder={t('users.createDialog.email')}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <select
            className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as typeof form.role })
            }
          >
            <option value="SECRETARY">{t('roles.SECRETARY')}</option>
            <option value="PRACTITIONER">{t('roles.PRACTITIONER')}</option>
            <option value="ADMIN">{t('roles.ADMIN')}</option>
          </select>
          <Input
            type="password"
            placeholder={t('users.createDialog.password')}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {err && <div className="text-sm text-danger">{err}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('users.createDialog.cancel')}
            </Button>
            <Button onClick={submit}>{t('users.createDialog.create')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
