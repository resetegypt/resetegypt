import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface PaymentRow {
  id: string;
  invoiceNumber: string;
  patient: { firstName: string; lastName: string; phone: string; email: string | null };
  subtotal: string;
  discount: string;
  vat: string;
  total: string;
  paymentMethod: string;
  paymentRef: string | null;
  etaUuid: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

interface Summary {
  count: number;
  totalTTC: number;
  totalHT: number;
  totalVAT: number;
  byMethod: Array<{ method: string; total: number; count: number }>;
  byDay: Array<{ day: string; total: number; count: number }>;
}

const METHOD_ICON: Record<string, string> = {
  CASH: '💵',
  CARD: '💳',
  VODAFONE_CASH: '📱',
  INSTAPAY: '⚡',
  FAWRY: '🏦',
  BANK_TRANSFER: '🔄',
};

function firstDayOfCurrentMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingPage() {
  const { t, i18n } = useTranslation();
  const [from, setFrom] = useState(firstDayOfCurrentMonth());
  const [to, setTo] = useState(today());
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');

  const fromIso = from ? new Date(from + 'T00:00:00').toISOString() : undefined;
  const toIso = to ? new Date(to + 'T23:59:59').toISOString() : undefined;

  const queryParams = new URLSearchParams();
  if (fromIso) queryParams.set('from', fromIso);
  if (toIso) queryParams.set('to', toIso);
  if (method) queryParams.set('method', method);
  if (search) queryParams.set('search', search);

  const { data: list } = useQuery({
    queryKey: ['payments', from, to, method, search],
    queryFn: () => apiGet<{ payments: PaymentRow[] }>(`/payments?${queryParams.toString()}`),
  });

  const { data: summary } = useQuery({
    queryKey: ['accounting-summary', from, to],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (fromIso) sp.set('from', fromIso);
      if (toIso) sp.set('to', toIso);
      return apiGet<Summary>(`/payments/accounting/summary?${sp.toString()}`);
    },
  });

  function exportCsv() {
    const url = `/api/payments/accounting/export.csv?${queryParams.toString()}`;
    window.open(url, '_blank');
  }

  return (
    <>
      <PageHeader
        title={t('accounting.title')}
        subtitle={t('accounting.subtitle')}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            📥 {t('accounting.exportCsv')}
          </Button>
        }
      />
      <div className="p-7 space-y-4 max-w-7xl">
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">{t('accounting.filters.from')}</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('accounting.filters.to')}</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t('accounting.filters.method')}</label>
              <select
                className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="">{t('accounting.filters.allMethods')}</option>
                {Object.keys(METHOD_ICON).map((k) => (
                  <option key={k} value={k}>
                    {METHOD_ICON[k]} {t(`payment.methods.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">{t('accounting.filters.search')}</label>
              <Input
                placeholder={t('accounting.filters.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">🧾 {t('accounting.kpi.invoices')}</p>
              <p className="text-3xl font-bold" data-numeric>{summary?.count ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">💰 {t('accounting.kpi.totalHT')}</p>
              <p className="text-2xl font-bold" data-numeric>
                {(summary?.totalHT ?? 0).toLocaleString(i18n.language)}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">🏛️ {t('accounting.kpi.vat')}</p>
              <p className="text-2xl font-bold text-warning-dark" data-numeric>
                {Math.round(summary?.totalVAT ?? 0).toLocaleString(i18n.language)}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">💵 {t('accounting.kpi.totalTTC')}</p>
              <p className="text-2xl font-bold text-primary-dark" data-numeric>
                {Math.round(summary?.totalTTC ?? 0).toLocaleString(i18n.language)}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
        </div>

        {summary && summary.byMethod.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>💳 {t('accounting.methodBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.byMethod.map((m) => (
                <div key={m.method} className="flex items-center gap-3 text-sm">
                  <span className="w-44 text-start">
                    {METHOD_ICON[m.method]} {t(`payment.methods.${m.method}`)}
                  </span>
                  <div className="flex-1 bg-bg-secondary rounded h-3">
                    <div
                      className="bg-primary h-3 rounded"
                      style={{ width: `${(m.total / Math.max(1, summary.totalTTC)) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs" data-numeric>
                    {m.count} {t('accounting.invoicesCount')}
                  </span>
                  <span className="font-bold w-24 text-end font-mono" data-numeric>
                    {Math.round(m.total).toLocaleString(i18n.language)} EGP
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📋 {t('accounting.invoicesIssued')}</CardTitle>
            <span className="text-xs text-text-secondary">
              {t('accounting.resultsCount', { count: list?.payments.length ?? 0 })}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="text-start px-4 py-2">{t('accounting.columns.date')}</th>
                    <th className="text-start px-4 py-2">{t('accounting.columns.invoiceNumber')}</th>
                    <th className="text-start px-4 py-2">{t('accounting.columns.patient')}</th>
                    <th className="text-start px-4 py-2">{t('accounting.columns.method')}</th>
                    <th className="text-end px-4 py-2">{t('accounting.columns.ht')}</th>
                    <th className="text-end px-4 py-2">{t('accounting.columns.vat')}</th>
                    <th className="text-end px-4 py-2">{t('accounting.columns.ttc')}</th>
                    <th className="text-center px-4 py-2">{t('accounting.columns.eta')}</th>
                    <th className="text-center px-4 py-2">{t('accounting.columns.email')}</th>
                    <th className="text-end px-4 py-2">{t('accounting.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list?.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-bg-secondary/40">
                      <td className="px-4 py-2 text-xs text-text-tertiary" data-numeric>
                        {new Date(p.createdAt).toLocaleDateString(i18n.language)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs font-medium" data-numeric>
                        <Link to={`/payments/${p.id}`} className="text-info hover:underline">
                          {p.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        {p.patient.firstName} {p.patient.lastName}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {METHOD_ICON[p.paymentMethod]} {t(`payment.methods.${p.paymentMethod}`)}
                      </td>
                      <td className="px-4 py-2 text-end font-mono text-xs" data-numeric>
                        {Number(p.subtotal).toLocaleString(i18n.language)}
                      </td>
                      <td className="px-4 py-2 text-end font-mono text-xs text-warning-dark" data-numeric>
                        {Math.round(Number(p.vat)).toLocaleString(i18n.language)}
                      </td>
                      <td className="px-4 py-2 text-end font-mono font-bold text-primary-dark" data-numeric>
                        {Math.round(Number(p.total)).toLocaleString(i18n.language)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {p.etaUuid ? <Badge variant="success">✓</Badge> : <Badge variant="neutral">—</Badge>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {p.emailSentAt ? (
                          <Badge variant="info">✓</Badge>
                        ) : (
                          <Badge variant="neutral">—</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-end">
                        <Link to={`/payments/${p.id}`}>
                          <Button size="sm" variant="outline">
                            {t('accounting.view')}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {list && list.payments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-text-secondary">
                        {t('accounting.emptyPeriod')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
