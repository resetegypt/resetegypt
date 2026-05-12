import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@reset/ui';
import { apiGet, apiPost, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface PaymentDetail {
  payment: {
    id: string;
    invoiceNumber: string;
    items: Array<{
      description: string;
      service: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }>;
    subtotal: string;
    discount: string;
    vat: string;
    total: string;
    paymentMethod: string;
    paymentRef: string | null;
    etaUuid: string | null;
    etaHash: string | null;
    etaSubmittedAt: string | null;
    emailSentAt: string | null;
    emailSentTo: string | null;
    createdAt: string;
    patient: { id: string; firstName: string; lastName: string; phone: string; email: string | null };
    createdBy: { firstName: string; lastName: string };
  };
}

const METHOD_ICON: Record<string, string> = {
  CASH: '💵',
  CARD: '💳',
  VODAFONE_CASH: '📱',
  INSTAPAY: '⚡',
  FAWRY: '🏦',
  BANK_TRANSFER: '🔄',
};

export function InvoicePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, refetch } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => apiGet<PaymentDetail>(`/payments/${id}`),
    enabled: !!id,
  });

  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const sendMut = useMutation({
    mutationFn: async () => {
      const target = emailTo || data?.payment.patient.email;
      return apiPost(`/payments/${id}/email`, target ? { to: target } : {});
    },
    onSuccess: (res) => {
      const r = res as { to: string; mocked: boolean };
      setEmailMessage({
        ok: true,
        text: r.mocked
          ? t('invoice.emailMocked', { to: r.to })
          : t('invoice.emailSent', { to: r.to }),
      });
      refetch();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 400) {
        setEmailMessage({ ok: false, text: t('invoice.emailInvalid') });
      } else {
        setEmailMessage({ ok: false, text: t('invoice.emailError') });
      }
    },
  });

  if (!data) return <div className="p-7">{t('common.loading')}</div>;
  const p = data.payment;

  const invoiceUrl = `/api/payments/${p.id}/invoice.html`;

  return (
    <>
      <PageHeader
        title={t('invoice.title', { number: p.invoiceNumber })}
        subtitle={`${p.patient.firstName} ${p.patient.lastName} · ${new Date(p.createdAt).toLocaleString(i18n.language)}`}
        actions={
          <>
            <a href={invoiceUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                🖨️ {t('invoice.printPdf')}
              </Button>
            </a>
            <Link to="/accounting">
              <Button variant="outline" size="sm">
                📊 {t('invoice.accounting')}
              </Button>
            </Link>
          </>
        }
      />
      <div className="p-7 space-y-4 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('invoice.kpi.subtotal')}</p>
              <p className="text-2xl font-bold font-mono" data-numeric>
                {Number(p.subtotal).toLocaleString(i18n.language)}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('invoice.kpi.vat')}</p>
              <p className="text-2xl font-bold font-mono text-warning-dark" data-numeric>
                {Math.round(Number(p.vat)).toLocaleString(i18n.language)}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('invoice.kpi.total')}</p>
              <p className="text-2xl font-bold font-mono text-primary-dark" data-numeric>
                {Math.round(Number(p.total)).toLocaleString(i18n.language)}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">{t('invoice.kpi.method')}</p>
              <p className="text-lg font-bold">
                {METHOD_ICON[p.paymentMethod]} {t(`payment.methods.${p.paymentMethod}`)}
              </p>
              {p.paymentRef && (
                <p className="text-xs text-text-tertiary mt-1" data-numeric>
                  Ref: {p.paymentRef}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🧾 {t('invoice.itemsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-start px-4 py-2">{t('invoice.columns.description')}</th>
                  <th className="text-end px-4 py-2">{t('invoice.columns.quantity')}</th>
                  <th className="text-end px-4 py-2">{t('invoice.columns.unitPrice')}</th>
                  <th className="text-end px-4 py-2">{t('invoice.columns.total')}</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((it, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-4 py-2">{it.description}</td>
                    <td className="px-4 py-2 text-end" data-numeric>
                      {it.quantity}
                    </td>
                    <td className="px-4 py-2 text-end font-mono" data-numeric>
                      {Number(it.unitPrice).toLocaleString(i18n.language)}
                    </td>
                    <td className="px-4 py-2 text-end font-mono" data-numeric>
                      {(it.quantity * Number(it.unitPrice)).toLocaleString(i18n.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📧 {t('invoice.emailSection')}</CardTitle>
            {p.emailSentAt && (
              <Badge variant="success">
                {t('invoice.emailSentBadge', {
                  date: new Date(p.emailSentAt).toLocaleString(i18n.language),
                  to: p.emailSentTo,
                })}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {p.patient.email ? (
              <p className="text-sm text-text-secondary">
                {t('invoice.patientEmail')} <strong>{p.patient.email}</strong>
              </p>
            ) : (
              <p className="text-sm text-warning-dark">{t('invoice.noEmail')}</p>
            )}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={p.patient.email ?? 'patient@example.com'}
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              <Button
                onClick={() => sendMut.mutate()}
                disabled={sendMut.isPending || (!emailTo && !p.patient.email)}
              >
                {sendMut.isPending
                  ? t('payment.success.sending')
                  : p.emailSentAt
                    ? `↻ ${t('invoice.resendButton')}`
                    : `✉️ ${t('invoice.sendButton')}`}
              </Button>
            </div>
            {emailMessage && (
              <div
                className={`text-sm p-3 rounded ${
                  emailMessage.ok
                    ? 'bg-primary-light text-primary-dark'
                    : 'bg-danger-light text-danger-dark'
                }`}
              >
                {emailMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {p.etaUuid && (
          <Card>
            <CardHeader>
              <CardTitle>🏛️ {t('invoice.etaTitle')}</CardTitle>
              <Badge variant="success">✓ {t('invoice.etaSubmitted')}</Badge>
            </CardHeader>
            <CardContent className="space-y-1 text-xs font-mono">
              <p data-numeric>
                <strong className="text-text-secondary font-sans">{t('invoice.uuid')}</strong>{' '}
                {p.etaUuid}
              </p>
              <p data-numeric>
                <strong className="text-text-secondary font-sans">{t('invoice.hash')}</strong>{' '}
                {p.etaHash}
              </p>
              <p>
                <strong className="text-text-secondary font-sans">{t('invoice.submittedOn')}</strong>{' '}
                {p.etaSubmittedAt ? new Date(p.etaSubmittedAt).toLocaleString(i18n.language) : '—'}
              </p>
              <p className="font-sans italic text-text-tertiary text-xs pt-2">
                {t('invoice.etaMockNote')}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="text-sm text-text-secondary">
            <p>
              <strong>{t('invoice.createdBy')}</strong> {p.createdBy.firstName} {p.createdBy.lastName}
            </p>
            <p>
              <strong>{t('invoice.patientLabel')}</strong>{' '}
              <Link to={`/patients/${p.patient.id}`} className="text-info hover:underline">
                {p.patient.firstName} {p.patient.lastName}
              </Link>{' '}
              · <span data-numeric>{p.patient.phone}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
