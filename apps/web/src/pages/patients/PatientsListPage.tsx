import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, Input } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import { ClipboardPlus, Search, ChevronRight, Users as UsersIcon } from 'lucide-react';

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

const SERVICE_DOT: Record<string, string> = {
  TOBACCO: 'bg-amber-500',
  DRUGS: 'bg-purple-500',
  ALCOHOL: 'bg-rose-500',
  SUGAR: 'bg-pink-400',
  STRESS: 'bg-sky-500',
};

type StatusFilter = 'ACTIVE' | 'ARCHIVED' | 'all';

export function PatientsListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('status', statusFilter);
      return apiGet<{ patients: PatientRow[] }>(`/patients?${params.toString()}`);
    },
  });

  const patients = data?.patients ?? [];

  return (
    <>
      <PageHeader
        title={t('patients.title')}
        subtitle={t('patients.subtitle', { count: patients.length })}
        actions={
          <Link to="/patients/intake">
            <Button>
              <ClipboardPlus className="w-4 h-4 me-2" />
              {t('patients.newPatient')}
            </Button>
          </Link>
        }
      />
      <div className="p-7 max-w-7xl">
        <Card>
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex rounded-lg border border-border bg-bg-secondary/40 p-1">
              {(['ACTIVE', 'ARCHIVED', 'all'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === f
                      ? 'bg-surface shadow-sm text-text'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {f === 'ACTIVE'
                    ? t('patients.filterActive', 'Actifs')
                    : f === 'ARCHIVED'
                      ? t('patients.filterArchived', 'Archivés')
                      : t('patients.filterAll', 'Tous')}
                </button>
              ))}
            </div>
            <div className="relative max-w-xs flex-1">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              <Input
                placeholder={t('patients.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <PatientSkeleton />
            ) : patients.length === 0 ? (
              <div className="px-4 py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-bg-secondary text-text-tertiary mx-auto flex items-center justify-center mb-4">
                  <UsersIcon className="w-8 h-8" />
                </div>
                <p className="text-base font-semibold">{t('patients.empty')}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {t(
                    'patients.emptyHint',
                    statusFilter === 'ACTIVE'
                      ? 'Aucun patient actif. Ajoutez-en un avec le bouton ci-dessus.'
                      : "Aucun patient ne correspond à ces critères.",
                  )}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary/50 text-[11px] uppercase tracking-wide text-text-tertiary font-semibold">
                    <tr>
                      <th className="text-start px-5 py-3">{t('patients.columns.name')}</th>
                      <th className="text-start px-3 py-3">{t('patients.columns.phone')}</th>
                      <th className="text-start px-3 py-3">{t('patients.columns.age')}</th>
                      <th className="text-start px-3 py-3">{t('patients.columns.followup')}</th>
                      <th className="text-start px-3 py-3">{t('patients.columns.status')}</th>
                      <th className="text-end px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {patients.map((p) => (
                      <PatientRowItem key={p.id} p={p} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PatientRowItem({ p }: { p: PatientRow }) {
  const { t } = useTranslation();
  const initials = (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase();
  return (
    <tr className="group hover:bg-bg-secondary/30 transition-colors">
      <td className="px-5 py-3">
        <Link to={`/patients/${p.id}`} className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-secondary text-primary-dark text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-text group-hover:text-primary transition-colors truncate">
              {p.firstName} {p.lastName}
            </div>
            <div className="text-xs text-text-tertiary">
              {new Date(p.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-text-secondary" data-numeric>
        {p.phone}
      </td>
      <td className="px-3 py-3 text-text-secondary tabular-nums" data-numeric>
        {p.age ?? '—'}
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <span className={`w-1.5 h-1.5 rounded-full ${SERVICE_DOT[p.primaryAddiction] ?? 'bg-text-tertiary'}`} />
          {t(`addiction.${p.primaryAddiction}`)}
        </span>
      </td>
      <td className="px-3 py-3">
        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {t(`patientStatus.${p.status}`, p.status)}
        </Badge>
      </td>
      <td className="px-5 py-3 text-end">
        <Link
          to={`/patients/${p.id}`}
          className="inline-flex items-center text-xs font-medium text-text-tertiary group-hover:text-primary transition-colors"
        >
          {t('common.view')}
          <ChevronRight className="w-4 h-4 ms-0.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </td>
    </tr>
  );
}

function PatientSkeleton() {
  return (
    <div className="divide-y divide-border-light">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <div className="w-9 h-9 rounded-full bg-bg-secondary animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 bg-bg-secondary rounded animate-pulse" />
            <div className="h-2.5 w-20 bg-bg-secondary/60 rounded animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-bg-secondary rounded animate-pulse" />
          <div className="h-5 w-16 bg-bg-secondary rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}
