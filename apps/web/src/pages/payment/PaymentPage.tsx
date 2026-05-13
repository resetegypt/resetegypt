import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

const PAYMENT_METHODS = [
  { value: 'CASH', icon: '💵' },
  { value: 'CARD', icon: '💳' },
  { value: 'VODAFONE_CASH', icon: '📱' },
  { value: 'INSTAPAY', icon: '⚡' },
  { value: 'FAWRY', icon: '🏦' },
  { value: 'BANK_TRANSFER', icon: '🔄' },
] as const;

export function PaymentPage() {
  const { t, i18n } = useTranslation();
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () =>
      apiGet<{
        appointment: {
          id: string;
          patientId: string;
          service: string;
          visitType: string;
          price: string;
          patient: { firstName: string; lastName: string; phone: string; email: string | null };
          practitioner: { firstName: string };
        };
      }>(`/appointments/${appointmentId}`),
    enabled: !!appointmentId,
  });

  const [items, setItems] = useState<
    Array<{ description: string; quantity: number; unitPrice: number }>
  >([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]['value']>('VODAFONE_CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    id: string;
    invoiceNumber: string;
    etaUuid: string;
    total: number;
  } | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    if (data?.appointment && items.length === 0) {
      const a = data.appointment;
      const visitLabel = t(`dashboard.visitType.${a.visitType}`);
      const serviceLabel = t(`addiction.${a.service}`);
      setItems([
        {
          description: `${visitLabel} · ${serviceLabel}`,
          quantity: 1,
          unitPrice: Number(a.price),
        },
      ]);
    }
  }, [data, items.length, t]);

  const subtotalRaw = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const subtotal = subtotalRaw - discount;
  const vat = subtotal * 0.14;
  const total = subtotal + vat;

  async function handleEncaisser() {
    if (!data?.appointment) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiPost<{
        payment: { id: string; invoiceNumber: string; etaUuid: string; total: string };
      }>('/payments', {
        appointmentId: data.appointment.id,
        patientId: data.appointment.patientId,
        items: items.map((it) => ({
          description: it.description,
          service: data.appointment.service,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          vatRate: 14,
        })),
        discount,
        paymentMethod: method,
        paymentRef: paymentRef || undefined,
      });
      setSuccess({
        id: res.payment.id,
        invoiceNumber: res.payment.invoiceNumber,
        etaUuid: res.payment.etaUuid,
        total: Number(res.payment.total),
      });
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmail() {
    if (!success) return;
    setEmailSending(true);
    setEmailMessage(null);
    try {
      const target = emailTo || data?.appointment.patient.email;
      const res = await apiPost<{ to: string; mocked: boolean }>(
        `/payments/${success.id}/email`,
        target ? { to: target } : {},
      );
      setEmailMessage({
        ok: true,
        text: res.mocked
          ? t('payment.success.emailMocked', { to: res.to })
          : t('payment.success.emailSent', { to: res.to }),
      });
    } catch {
      setEmailMessage({ ok: false, text: t('payment.success.emailError') });
    } finally {
      setEmailSending(false);
    }
  }

  if (!data) return <div className="p-7">{t('common.loading')}</div>;

  if (success) {
    const patientEmail = data?.appointment.patient.email;
    const methodLabel = t(`payment.methods.${method}`);
    return (
      <>
        <PageHeader
          title={t('payment.success.title')}
          subtitle={t('payment.success.subtitle', { invoice: success.invoiceNumber })}
        />
        <div className="p-7 max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="space-y-4 text-center py-8">
              <div className="text-6xl">✅</div>
              <h2 className="text-xl font-bold text-primary-dark">
                {t('payment.success.paymentRecorded')}
              </h2>
              <p className="text-text-secondary" data-numeric>
                {t('payment.success.paidVia', {
                  amount: success.total.toLocaleString(i18n.language),
                  method: methodLabel,
                })}
              </p>
              <div className="bg-bg-secondary rounded p-4 text-sm text-start space-y-1">
                <p>
                  <strong>{t('payment.success.invoiceLabel')}</strong> {success.invoiceNumber}
                </p>
                <p className="font-mono text-xs" data-numeric>
                  <strong>{t('payment.success.uuidEtaLabel')}</strong> {success.etaUuid}
                </p>
                <p className="text-text-tertiary text-xs italic">
                  {t('payment.success.etaMockedNote')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📧 {t('payment.success.emailToPatient')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientEmail ? (
                <p className="text-sm text-text-secondary">
                  {t('payment.success.patientEmailLabel')} <strong>{patientEmail}</strong>
                </p>
              ) : (
                <p className="text-sm text-warning-dark">
                  {t('payment.success.noEmailWarning')}
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={patientEmail ?? t('payment.success.emailPlaceholder')}
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
                <Button
                  onClick={handleEmail}
                  disabled={emailSending || (!emailTo && !patientEmail)}
                >
                  {emailSending ? t('payment.success.sending') : `✉️ ${t('payment.success.sendEmail')}`}
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
              <p className="text-xs text-text-tertiary">
                {t('payment.success.printableLinkPrefix')}{' '}
                <a
                  href={`/api/payments/${success.id}/invoice.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-info underline"
                >
                  {t('payment.success.printableLinkText')}
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex gap-2 justify-between flex-wrap">
              <Button variant="outline" onClick={() => navigate('/accounting')}>
                📊 {t('payment.success.viewAccounting')}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/patients/${data.appointment.patientId}`)}
                >
                  {t('payment.success.patientFile')}
                </Button>
                <Button onClick={() => navigate('/agenda')}>{t('payment.success.calendar')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const a = data.appointment;

  return (
    <>
      <PageHeader
        title={t('payment.title')}
        subtitle={`${a.patient.firstName} ${a.patient.lastName} · ${t(`addiction.${a.service}`)}`}
      />
      <div className="p-7 space-y-4 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧾 {t('payment.items')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="px-4 py-3 border-b border-border last:border-0 grid grid-cols-[1fr_80px_120px_40px] gap-2 items-center"
              >
                <Input
                  value={it.description}
                  onChange={(e) =>
                    setItems(
                      items.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) =>
                    setItems(
                      items.map((x, i) =>
                        i === idx ? { ...x, quantity: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="text-center"
                />
                <Input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) =>
                    setItems(
                      items.map((x, i) =>
                        i === idx ? { ...x, unitPrice: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="text-end"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                >
                  ×
                </Button>
              </div>
            ))}
            <div className="px-4 py-2 flex gap-2 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([
                    ...items,
                    { description: t('payment.addPackage5'), quantity: 1, unitPrice: 6000 },
                  ])
                }
              >
                ➕ {t('payment.addPackage5')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setItems([
                    ...items,
                    { description: t('payment.addLoyaltyCard'), quantity: 1, unitPrice: 12000 },
                  ])
                }
              >
                ➕ {t('payment.addLoyaltyCard')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 {t('payment.totals')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('payment.subtotalGross')}</span>
              <span className="font-mono" data-numeric>
                {subtotalRaw.toLocaleString(i18n.language)} EGP
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>{t('payment.discount')}</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-32 text-end"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('payment.subtotalHT')}</span>
              <span className="font-mono" data-numeric>
                {subtotal.toLocaleString(i18n.language)} EGP
              </span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>{t('payment.vat14')}</span>
              <span className="font-mono" data-numeric>
                {Math.round(vat).toLocaleString(i18n.language)} EGP
              </span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-border">
              <strong>{t('payment.totalTTC')}</strong>
              <strong className="font-mono text-primary-dark" data-numeric>
                {Math.round(total).toLocaleString(i18n.language)} EGP
              </strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💳 {t('payment.method')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m.value} active={method === m.value} onClick={() => setMethod(m.value)}>
                  {m.icon} {t(`payment.methods.${m.value}`)}
                </Chip>
              ))}
            </div>
            {['CARD', 'VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER'].includes(method) && (
              <div>
                <label className="block text-xs font-medium mb-1">{t('payment.paymentRef')}</label>
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📄 {t('payment.invoicePreview')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-bg-secondary text-sm">
            <div className="flex justify-between mb-4">
              <div>
                <strong className="text-base">RESET</strong>
                <p className="text-xs text-text-tertiary">{t('app.subtitle')}</p>
              </div>
              <div className="text-end">
                <Badge variant="info">{t('payment.electronicInvoice')}</Badge>
                <p className="text-xs mt-1">{t('payment.generatedAfter')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
              <div>
                <p className="text-text-tertiary uppercase text-[10px]">{t('payment.issuer')}</p>
                <strong>Reset Egypt</strong>
                <p className="text-text-secondary">N Teseen, New Cairo</p>
              </div>
              <div>
                <p className="text-text-tertiary uppercase text-[10px]">{t('payment.patient')}</p>
                <strong>
                  {a.patient.firstName} {a.patient.lastName}
                </strong>
                <p className="text-text-secondary" data-numeric>{a.patient.phone}</p>
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-3 italic">{t('payment.etaMockNote')}</p>
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleEncaisser} disabled={submitting || items.length === 0}>
            {submitting
              ? t('payment.cashing')
              : `✓ ${t('payment.cashButton', { amount: Math.round(total).toLocaleString(i18n.language) })}`}
          </Button>
        </div>
      </div>
    </>
  );
}
