import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

const METHOD_LABEL: Record<string, string> = {
  CASH: '💵 Espèces',
  CARD: '💳 Carte',
  VODAFONE_CASH: '📱 Vodafone Cash',
  INSTAPAY: '⚡ Instapay',
  FAWRY: '🏦 Fawry',
  BANK_TRANSFER: '🔄 Virement',
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
        title="Comptabilité"
        subtitle="Suivi des factures et chiffre d'affaires"
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            📥 Exporter CSV
          </Button>
        }
      />
      <div className="p-7 space-y-4 max-w-7xl">
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Du</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Au</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mode</label>
              <select
                className="w-full h-10 rounded border border-border bg-surface px-3 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="">Tous</option>
                {Object.entries(METHOD_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Recherche</label>
              <Input
                placeholder="N° facture, nom, téléphone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">🧾 Factures</p>
              <p className="text-3xl font-bold">{summary?.count ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">💰 Total HT</p>
              <p className="text-2xl font-bold">{(summary?.totalHT ?? 0).toLocaleString('fr-FR')}</p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">🏛️ TVA 14%</p>
              <p className="text-2xl font-bold text-warning-dark">{Math.round(summary?.totalVAT ?? 0).toLocaleString('fr-FR')}</p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">💵 Total TTC</p>
              <p className="text-2xl font-bold text-primary-dark">{Math.round(summary?.totalTTC ?? 0).toLocaleString('fr-FR')}</p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
        </div>

        {summary && summary.byMethod.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>💳 Répartition par mode de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.byMethod.map((m) => (
                <div key={m.method} className="flex items-center gap-3 text-sm">
                  <span className="w-44">{METHOD_LABEL[m.method] ?? m.method}</span>
                  <div className="flex-1 bg-bg-secondary rounded h-3">
                    <div
                      className="bg-primary h-3 rounded"
                      style={{ width: `${(m.total / Math.max(1, summary.totalTTC)) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs">{m.count} fact.</span>
                  <span className="font-bold w-24 text-right font-mono">
                    {Math.round(m.total).toLocaleString('fr-FR')} EGP
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📋 Factures émises</CardTitle>
            <span className="text-xs text-text-secondary">{list?.payments.length ?? 0} résultats</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">N° Facture</th>
                    <th className="text-left px-4 py-2">Patient</th>
                    <th className="text-left px-4 py-2">Mode</th>
                    <th className="text-right px-4 py-2">HT</th>
                    <th className="text-right px-4 py-2">TVA</th>
                    <th className="text-right px-4 py-2">TTC</th>
                    <th className="text-center px-4 py-2">ETA</th>
                    <th className="text-center px-4 py-2">📧</th>
                    <th className="text-right px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list?.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-bg-secondary/40">
                      <td className="px-4 py-2 text-xs text-text-tertiary">
                        {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs font-medium">
                        <Link to={`/payments/${p.id}`} className="text-info hover:underline">
                          {p.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        {p.patient.firstName} {p.patient.lastName}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs">
                        {Number(p.subtotal).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-warning-dark">
                        {Math.round(Number(p.vat)).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-primary-dark">
                        {Math.round(Number(p.total)).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {p.etaUuid ? <Badge variant="success">✓</Badge> : <Badge variant="neutral">—</Badge>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {p.emailSentAt ? (
                          <Badge variant="info" title={new Date(p.emailSentAt).toLocaleString()}>✓</Badge>
                        ) : (
                          <Badge variant="neutral">—</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link to={`/payments/${p.id}`}>
                          <Button size="sm" variant="outline">Voir</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {list && list.payments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-text-secondary">
                        Aucune facture pour cette période.
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
