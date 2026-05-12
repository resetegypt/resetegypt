import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@reset/ui';
import { apiGet, apiPost, ApiError } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';

interface PaymentDetail {
  payment: {
    id: string;
    invoiceNumber: string;
    items: Array<{ description: string; service: string; quantity: number; unitPrice: number; vatRate: number }>;
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

const METHOD_LABEL: Record<string, string> = {
  CASH: '💵 Espèces',
  CARD: '💳 Carte',
  VODAFONE_CASH: '📱 Vodafone Cash',
  INSTAPAY: '⚡ Instapay',
  FAWRY: '🏦 Fawry',
  BANK_TRANSFER: '🔄 Virement',
};

export function InvoicePage() {
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
          ? `✓ Email "envoyé" en mode mock (SMTP non configuré). Destinataire : ${r.to}`
          : `✓ Email envoyé à ${r.to}`,
      });
      refetch();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 400) {
        setEmailMessage({ ok: false, text: 'Saisis une adresse email valide' });
      } else {
        setEmailMessage({ ok: false, text: 'Erreur lors de l\'envoi' });
      }
    },
  });

  if (!data) return <div className="p-7">Chargement…</div>;
  const p = data.payment;

  const invoiceUrl = `/api/payments/${p.id}/invoice.html`;

  return (
    <>
      <PageHeader
        title={`Facture ${p.invoiceNumber}`}
        subtitle={`${p.patient.firstName} ${p.patient.lastName} · ${new Date(p.createdAt).toLocaleString('fr-FR')}`}
        actions={
          <>
            <a href={invoiceUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">🖨️ Imprimer / Voir PDF</Button>
            </a>
            <Link to="/accounting">
              <Button variant="outline" size="sm">📊 Comptabilité</Button>
            </Link>
          </>
        }
      />
      <div className="p-7 space-y-4 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Sous-total HT</p>
              <p className="text-2xl font-bold font-mono">{Number(p.subtotal).toLocaleString('fr-FR')}</p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">TVA 14%</p>
              <p className="text-2xl font-bold font-mono text-warning-dark">
                {Math.round(Number(p.vat)).toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Total TTC</p>
              <p className="text-2xl font-bold font-mono text-primary-dark">
                {Math.round(Number(p.total)).toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-text-tertiary">EGP</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-text-secondary">Mode</p>
              <p className="text-lg font-bold">{METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}</p>
              {p.paymentRef && <p className="text-xs text-text-tertiary mt-1">Réf : {p.paymentRef}</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🧾 Articles facturés</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-right px-4 py-2">Qté</th>
                  <th className="text-right px-4 py-2">PU TTC</th>
                  <th className="text-right px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((it, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-4 py-2">{it.description}</td>
                    <td className="px-4 py-2 text-right">{it.quantity}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {Number(it.unitPrice).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {(it.quantity * Number(it.unitPrice)).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📧 Envoi au patient</CardTitle>
            {p.emailSentAt && (
              <Badge variant="success">
                ✓ Envoyé le {new Date(p.emailSentAt).toLocaleString('fr-FR')} à {p.emailSentTo}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {p.patient.email ? (
              <p className="text-sm text-text-secondary">
                Email du patient : <strong>{p.patient.email}</strong>
              </p>
            ) : (
              <p className="text-sm text-warning-dark">
                ⚠️ Aucun email enregistré pour ce patient. Saisis-en un ci-dessous.
              </p>
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
                  ? 'Envoi…'
                  : p.emailSentAt
                    ? '↻ Renvoyer'
                    : '✉️ Envoyer par mail'}
              </Button>
            </div>
            {emailMessage && (
              <div
                className={`text-sm p-3 rounded ${
                  emailMessage.ok ? 'bg-primary-light text-primary-dark' : 'bg-danger-light text-danger-dark'
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
              <CardTitle>🏛️ Conformité ETA Egypt</CardTitle>
              <Badge variant="success">✓ Soumis</Badge>
            </CardHeader>
            <CardContent className="space-y-1 text-xs font-mono">
              <p>
                <strong className="text-text-secondary font-sans">UUID :</strong> {p.etaUuid}
              </p>
              <p>
                <strong className="text-text-secondary font-sans">Hash :</strong> {p.etaHash}
              </p>
              <p>
                <strong className="text-text-secondary font-sans">Soumis le :</strong>{' '}
                {p.etaSubmittedAt ? new Date(p.etaSubmittedAt).toLocaleString('fr-FR') : '—'}
              </p>
              <p className="font-sans italic text-text-tertiary text-xs pt-2">
                ⚠️ Mock dev. Branchement réel API tax.gov.eg en Phase 6.5 (besoin certificat + TIN du centre).
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="text-sm text-text-secondary">
            <p>
              <strong>Créée par :</strong> {p.createdBy.firstName} {p.createdBy.lastName}
            </p>
            <p>
              <strong>Patient :</strong>{' '}
              <Link to={`/patients/${p.patient.id}`} className="text-info hover:underline">
                {p.patient.firstName} {p.patient.lastName}
              </Link>{' '}
              · {p.patient.phone}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
