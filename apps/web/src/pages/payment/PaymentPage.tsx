import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Input } from '@reset/ui';
import { apiGet, apiPost } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

const PAYMENT_METHODS = [
  { value: 'CASH', label: '💵 Espèces' },
  { value: 'CARD', label: '💳 Carte bancaire' },
  { value: 'VODAFONE_CASH', label: '📱 Vodafone Cash' },
  { value: 'INSTAPAY', label: '⚡ Instapay' },
  { value: 'FAWRY', label: '🏦 Fawry' },
  { value: 'BANK_TRANSFER', label: '🔄 Virement' },
] as const;

const SERVICE_LABEL: Record<string, string> = {
  TOBACCO: 'Sevrage tabagique',
  DRUGS: 'Sevrage drogues',
  ALCOHOL: 'Sevrage alcool',
  SUGAR: 'Sucre',
  STRESS: 'Stress / anxiété',
};

export function PaymentPage() {
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

  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([]);
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
          ? `✓ Email "envoyé" en mode mock (SMTP non configuré). Destinataire : ${res.to}`
          : `✓ Facture envoyée à ${res.to}`,
      });
    } catch {
      setEmailMessage({ ok: false, text: "Erreur lors de l'envoi. Vérifie l'adresse." });
    } finally {
      setEmailSending(false);
    }
  }

  useEffect(() => {
    if (data?.appointment && items.length === 0) {
      const a = data.appointment;
      setItems([
        {
          description: `Séance ${a.visitType === 'FIRST' ? '1ère' : 'suivi'} · ${SERVICE_LABEL[a.service]} · Auriculothérapie + photobiomodulation`,
          quantity: 1,
          unitPrice: Number(a.price),
        },
      ]);
    }
  }, [data, items.length]);

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
      setError((err as { message?: string }).message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) return <div className="p-7">Chargement…</div>;

  if (success) {
    const patientEmail = data?.appointment.patient.email;
    return (
      <>
        <PageHeader title="Encaissement validé" subtitle={`Facture ${success.invoiceNumber}`} />
        <div className="p-7 max-w-2xl space-y-4">
          <Card>
            <CardContent className="space-y-4 text-center py-8">
              <div className="text-6xl">✅</div>
              <h2 className="text-xl font-bold text-primary-dark">Paiement enregistré</h2>
              <p className="text-text-secondary">
                <strong>{success.total.toLocaleString()} EGP</strong> encaissé via{' '}
                {PAYMENT_METHODS.find((m) => m.value === method)?.label}
              </p>
              <div className="bg-bg-secondary rounded p-4 text-sm text-left space-y-1">
                <p>
                  <strong>Facture :</strong> {success.invoiceNumber}
                </p>
                <p className="font-mono text-xs">
                  <strong>UUID ETA :</strong> {success.etaUuid}
                </p>
                <p className="text-text-tertiary text-xs italic">
                  ⚠️ ETA mocké en développement. Branchement réel : Phase 6.5.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📧 Envoyer la facture au patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientEmail ? (
                <p className="text-sm text-text-secondary">
                  Email du patient : <strong>{patientEmail}</strong>
                </p>
              ) : (
                <p className="text-sm text-warning-dark">
                  ⚠️ Aucun email enregistré. Saisis-en un :
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={patientEmail ?? 'patient@example.com'}
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                />
                <Button onClick={handleEmail} disabled={emailSending || (!emailTo && !patientEmail)}>
                  {emailSending ? 'Envoi…' : '✉️ Envoyer'}
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
                💡 Tu peux aussi{' '}
                <a
                  href={`/api/payments/${success.id}/invoice.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-info underline"
                >
                  visualiser/imprimer la facture
                </a>
                .
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => navigate('/accounting')}>
                📊 Voir la comptabilité
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/patients/${data.appointment.patientId}`)}>
                  Dossier patient
                </Button>
                <Button onClick={() => navigate('/agenda')}>Agenda</Button>
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
        title="Encaissement"
        subtitle={`${a.patient.firstName} ${a.patient.lastName} · ${SERVICE_LABEL[a.service]}`}
      />
      <div className="p-7 space-y-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>🧾 Articles facturables</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.map((it, idx) => (
              <div key={idx} className="px-4 py-3 border-b border-border last:border-0 grid grid-cols-[1fr_80px_120px_40px] gap-2 items-center">
                <Input
                  value={it.description}
                  onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))}
                />
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))}
                  className="text-center"
                />
                <Input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x)))}
                  className="text-right"
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
            <div className="px-4 py-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItems([...items, { description: 'Forfait 5 séances', quantity: 1, unitPrice: 6000 }])}
              >
                ➕ Forfait 5 séances
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItems([...items, { description: 'Carte fidélité', quantity: 1, unitPrice: 12000 }])}
              >
                ➕ Carte fidélité
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total brut</span>
              <span className="font-mono">{subtotalRaw.toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>Remise</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-32 text-right"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>Sous-total HT</span>
              <span className="font-mono">{subtotal.toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>TVA 14%</span>
              <span className="font-mono">{Math.round(vat).toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-border">
              <strong>Total TTC</strong>
              <strong className="font-mono text-primary-dark">{Math.round(total).toLocaleString()} EGP</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💳 Mode de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m.value} active={method === m.value} onClick={() => setMethod(m.value)}>
                  {m.label}
                </Chip>
              ))}
            </div>
            {['CARD', 'VODAFONE_CASH', 'INSTAPAY', 'FAWRY', 'BANK_TRANSFER'].includes(method) && (
              <div>
                <label className="block text-xs font-medium mb-1">
                  Référence (n° transaction / téléphone / IBAN)
                </label>
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📄 Aperçu facture (ETA Egypt)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-bg-secondary text-sm">
            <div className="flex justify-between mb-4">
              <div>
                <strong className="text-base">RESET</strong>
                <p className="text-xs text-text-tertiary">Auriculothérapie & laser non-invasif</p>
                <p className="text-xs text-text-tertiary">N° fiscal (TIN) : xxx-xxx-xxx (à remplir)</p>
              </div>
              <div className="text-right">
                <Badge variant="info">FACTURE ÉLECTRONIQUE</Badge>
                <p className="text-xs mt-1">À générer après encaissement</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
              <div>
                <p className="text-text-tertiary uppercase text-[10px]">Émetteur</p>
                <strong>Reset Egypt</strong>
                <p className="text-text-secondary">N Teseen, New Cairo, Le Caire</p>
              </div>
              <div>
                <p className="text-text-tertiary uppercase text-[10px]">Patient</p>
                <strong>{a.patient.firstName} {a.patient.lastName}</strong>
                <p className="text-text-secondary">{a.patient.phone}</p>
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-3 italic">
              UUID ETA généré après "Encaisser". Mock en développement.
            </p>
          </CardContent>
        </Card>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button onClick={handleEncaisser} disabled={submitting || items.length === 0}>
            {submitting ? 'Encaissement…' : `✓ Encaisser ${Math.round(total).toLocaleString()} EGP`}
          </Button>
        </div>
      </div>
    </>
  );
}
