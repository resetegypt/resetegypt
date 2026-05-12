import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const ADDICTION_ICON: Record<string, string> = {
  TOBACCO: '🚬',
  DRUGS: '💊',
  ALCOHOL: '🍷',
  SUGAR: '🍬',
  STRESS: '😰',
};

type StatusFilter = 'ACTIVE' | 'ARCHIVED' | 'all';

export function PatientsListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const { data } = useQuery({
    queryKey: ['patients', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('status', statusFilter);
      return apiGet<{ patients: PatientRow[] }>(`/patients?${params.toString()}`);
    },
  });

  return (
    <>
      <PageHeader
        title={t('patients.title')}
        subtitle={t('patients.subtitle', { count: data?.patients.length ?? 0 })}
        actions={
          <Link to="/patients/intake">
            <Button>➕ {t('patients.newPatient')}</Button>
          </Link>
        }
      />
      <div className="p-7 max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>👥 {t('patients.list')}</CardTitle>
              <div className="flex items-center gap-2">
                {(['ACTIVE', 'ARCHIVED', 'all'] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={statusFilter === f ? 'primary' : 'outline'}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === 'ACTIVE'
                      ? t('patients.filterActive', 'Actifs')
                      : f === 'ARCHIVED'
                        ? t('patients.filterArchived', 'Archivés')
                        : t('patients.filterAll', 'Tous')}
                  </Button>
                ))}
                <Input
                  placeholder={t('patients.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-start px-4 py-2">{t('patients.columns.name')}</th>
                  <th className="text-start px-4 py-2">{t('patients.columns.phone')}</th>
                  <th className="text-start px-4 py-2">{t('patients.columns.age')}</th>
                  <th className="text-start px-4 py-2">{t('patients.columns.followup')}</th>
                  <th className="text-start px-4 py-2">{t('patients.columns.status')}</th>
                  <th className="text-end px-4 py-2">{t('patients.columns.actions')}</th>
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
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs" data-numeric>
                      {p.phone}
                    </td>
                    <td className="px-4 py-3 text-text-secondary" data-numeric>
                      {p.age ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {ADDICTION_ICON[p.primaryAddiction]} {t(`addiction.${p.primaryAddiction}`)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link to={`/patients/${p.id}`}>
                        <Button size="sm" variant="outline">
                          {t('common.view')}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {data && data.patients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                      {t('patients.empty')}
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
