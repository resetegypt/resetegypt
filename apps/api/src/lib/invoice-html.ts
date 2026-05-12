import type { Payment, Patient } from '@prisma/client';

interface InvoiceItem {
  description: string;
  service: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'Carte bancaire',
  VODAFONE_CASH: 'Vodafone Cash',
  INSTAPAY: 'Instapay',
  FAWRY: 'Fawry',
  BANK_TRANSFER: 'Virement bancaire',
};

const SERVICE_LABEL: Record<string, string> = {
  TOBACCO: 'Sevrage tabagique',
  DRUGS: 'Sevrage drogues',
  ALCOHOL: 'Sevrage alcool',
  SUGAR: 'Sucre',
  STRESS: 'Stress / anxiété',
  OTHER: 'Autre',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n: number | string | { toString(): string }): string {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function renderInvoiceHtml(payment: Payment, patient: Patient): string {
  const items = payment.items as unknown as InvoiceItem[];
  const date = new Date(payment.createdAt);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${payment.invoiceNumber} — Reset Egypt</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system, "Inter", "Segoe UI", sans-serif; color: #2C2C2A; max-width: 210mm; margin: 0 auto; padding: 20px; font-size: 12px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1D9E75; padding-bottom: 14px; margin-bottom: 22px; }
  .brand { font-size: 28px; font-weight: 700; color: #1D9E75; letter-spacing: -0.02em; }
  .brand-sub { font-size: 10px; color: #5F5E5A; margin-top: 2px; }
  .invoice-meta { text-align: right; font-size: 11px; }
  .invoice-meta strong { font-size: 14px; display: block; }
  .eta-tag { background: #E1F5EE; color: #0F6E56; padding: 3px 8px; border-radius: 4px; font-size: 10px; display: inline-block; margin-top: 4px; font-weight: 600; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
  .party-label { font-size: 9px; text-transform: uppercase; color: #888780; letter-spacing: 0.04em; }
  .party-name { font-weight: 600; font-size: 13px; margin-top: 2px; }
  .party-detail { font-size: 11px; color: #5F5E5A; margin-top: 4px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead { background: #F1EFE8; border-bottom: 2px solid #2C2C2A; }
  th { text-align: left; padding: 8px; font-size: 10px; text-transform: uppercase; color: #5F5E5A; letter-spacing: 0.04em; }
  th.num { text-align: right; }
  td { padding: 10px 8px; border-bottom: 1px dotted #D3D1C7; font-size: 11px; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-left: auto; width: 280px; }
  .totals tr td { border: none; padding: 4px 8px; }
  .totals tr.total td { border-top: 2px solid #2C2C2A; padding-top: 8px; font-weight: 700; font-size: 14px; color: #0F6E56; }
  .pay-method { background: #F1EFE8; padding: 10px 12px; border-radius: 6px; font-size: 11px; margin-top: 14px; }
  .eta-block { margin-top: 14px; padding: 10px 12px; background: #F2FAF6; border: 1px solid #1D9E75; border-radius: 6px; font-size: 10px; font-family: monospace; word-break: break-all; }
  .qr-placeholder { width: 80px; height: 80px; background: repeating-linear-gradient(45deg, #2C2C2A 0, #2C2C2A 3px, white 3px, white 6px); border: 1px solid #2C2C2A; display: flex; align-items: center; justify-content: center; float: right; margin: 8px 0 8px 12px; }
  .qr-placeholder span { background: white; padding: 2px 4px; font-size: 8px; font-family: monospace; }
  .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #D3D1C7; font-size: 10px; color: #888780; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand">RESET</div>
    <div class="brand-sub">Egypt · Auriculothérapie & laser non-invasif</div>
    <div class="party-detail">N Teseen, New Cairo 1<br>Le Caire, Égypte 11835<br>N° fiscal (TIN) : ${escapeHtml(process.env.CENTER_TAX_ID ?? 'xxx-xxx-xxx')}</div>
  </div>
  <div class="invoice-meta">
    <strong>FACTURE ÉLECTRONIQUE</strong>
    <div style="margin-top: 6px;">N° ${escapeHtml(payment.invoiceNumber)}</div>
    <div style="color:#5F5E5A;">${date.toLocaleDateString('fr-FR')} · ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    ${payment.etaUuid ? `<span class="eta-tag">✓ Soumise ETA</span>` : ''}
  </div>
</div>

<div class="parties">
  <div>
    <div class="party-label">Émetteur</div>
    <div class="party-name">Reset Egypt</div>
    <div class="party-detail">N Teseen, New Cairo 1<br>Le Caire 11835<br>${escapeHtml(process.env.CENTER_PHONE ?? '+201xxxxxxxxx')}</div>
  </div>
  <div>
    <div class="party-label">Patient</div>
    <div class="party-name">${escapeHtml(patient.firstName)} ${escapeHtml(patient.lastName)}</div>
    <div class="party-detail">📞 ${escapeHtml(patient.phone)}${patient.email ? `<br>✉️ ${escapeHtml(patient.email)}` : ''}${patient.address ? `<br>${escapeHtml(patient.address)}` : ''}${patient.governorate ? ` · ${escapeHtml(patient.governorate)}` : ''}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Désignation</th>
      <th class="num">Qté</th>
      <th class="num">PU HT</th>
      <th class="num">TVA</th>
      <th class="num">Total HT</th>
    </tr>
  </thead>
  <tbody>
    ${items
      .map(
        (it) => `
    <tr>
      <td>
        <strong>${escapeHtml(it.description)}</strong>
        <div style="color:#888780; font-size:10px;">Service : ${escapeHtml(SERVICE_LABEL[it.service] ?? it.service)}</div>
      </td>
      <td class="num">${it.quantity}</td>
      <td class="num">${fmtMoney(it.unitPrice / (1 + it.vatRate / 100))} EGP</td>
      <td class="num">${it.vatRate}%</td>
      <td class="num">${fmtMoney((it.quantity * it.unitPrice) / (1 + it.vatRate / 100))} EGP</td>
    </tr>`,
      )
      .join('')}
  </tbody>
</table>

<table class="totals">
  <tr><td>Sous-total HT</td><td class="num">${fmtMoney(payment.subtotal)} EGP</td></tr>
  ${Number(payment.discount) > 0 ? `<tr><td>Remise</td><td class="num">- ${fmtMoney(payment.discount)} EGP</td></tr>` : ''}
  <tr><td>TVA 14%</td><td class="num">${fmtMoney(payment.vat)} EGP</td></tr>
  <tr class="total"><td>Total TTC</td><td class="num">${fmtMoney(payment.total)} EGP</td></tr>
</table>

<div class="pay-method">
  <strong>Mode de paiement :</strong> ${escapeHtml(PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod)}
  ${payment.paymentRef ? ` · Réf : ${escapeHtml(payment.paymentRef)}` : ''}
</div>

${
  payment.etaUuid
    ? `<div class="eta-block">
  <div class="qr-placeholder"><span>QR ETA</span></div>
  <strong>Vérification ETA (Egyptian Tax Authority)</strong><br>
  UUID : ${escapeHtml(payment.etaUuid)}<br>
  Hash : ${escapeHtml(payment.etaHash ?? '')}<br>
  Soumis le : ${payment.etaSubmittedAt?.toLocaleString('fr-FR') ?? '—'}
  <div style="clear:both;"></div>
</div>`
    : ''
}

<div class="footer">
  Reset Egypt — Centre de bien-être non médical · Auriculothérapie + photobiomodulation laser<br>
  Conservation légale 5 ans · Conforme au décret 188/2020 (e-invoicing ETA)
</div>

</body>
</html>`;
}

export function renderInvoiceEmailBody(payment: Payment, patient: Patient, appUrl: string): string {
  return `<!doctype html>
<html lang="fr">
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #2C2C2A;">
  <div style="border-bottom: 3px solid #1D9E75; padding-bottom: 16px; margin-bottom: 20px;">
    <h1 style="color: #1D9E75; margin: 0; font-size: 28px;">RESET</h1>
    <p style="color: #5F5E5A; margin: 4px 0 0; font-size: 12px;">Egypt · Auriculothérapie & laser</p>
  </div>

  <p>Bonjour ${escapeHtml(patient.firstName)},</p>

  <p>Merci pour votre séance d'aujourd'hui chez Reset Egypt. Vous trouverez ci-joint votre facture conforme à la législation égyptienne (loi 151/2020 + décret 188/2020).</p>

  <table style="width: 100%; background: #F2FAF6; border: 1px solid #1D9E75; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <tr>
      <td style="padding: 6px 8px;"><strong>Facture n°</strong></td>
      <td style="padding: 6px 8px; text-align: right;">${escapeHtml(payment.invoiceNumber)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 8px;"><strong>Date</strong></td>
      <td style="padding: 6px 8px; text-align: right;">${new Date(payment.createdAt).toLocaleDateString('fr-FR')}</td>
    </tr>
    <tr>
      <td style="padding: 6px 8px;"><strong>Montant TTC</strong></td>
      <td style="padding: 6px 8px; text-align: right; font-size: 18px; color: #0F6E56;"><strong>${fmtMoney(payment.total)} EGP</strong></td>
    </tr>
    ${payment.etaUuid ? `<tr><td colspan="2" style="padding: 6px 8px; font-size: 11px; color: #5F5E5A;">UUID ETA : ${escapeHtml(payment.etaUuid)}</td></tr>` : ''}
  </table>

  <p>Pour toute question, n'hésitez pas à nous contacter via WhatsApp.</p>

  <p style="margin-top: 30px;">À très vite,<br>L'équipe Reset Egypt</p>

  <hr style="border: none; border-top: 1px solid #D3D1C7; margin: 30px 0 16px;">
  <p style="font-size: 11px; color: #888780;">
    Reset Egypt — Centre de bien-être non médical<br>
    N Teseen, New Cairo 1, Le Caire 11835<br>
    <a href="${escapeHtml(appUrl)}" style="color: #185FA5;">${escapeHtml(appUrl)}</a>
  </p>
</body>
</html>`;
}
