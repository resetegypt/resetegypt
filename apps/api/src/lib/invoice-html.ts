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

// === Palette de marque Reset ===
const BRAND = {
  primary: '#1E0FBA', // bleu royal (logo)
  primaryDark: '#130982', // bleu profond
  primaryLight: '#79C9EE', // cyan clair (lettres logo)
  primaryLightest: '#E6F3FB', // tint pâle
  danger: '#FF5440', // corail (point logo)
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  border: '#D1DDEB',
  borderLight: '#E6EEF7',
  bgSecondary: '#EDF4FB',
  surface: '#FFFFFF',
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
  body { font-family: -apple-system, "Inter", "Segoe UI", sans-serif; color: ${BRAND.text}; max-width: 210mm; margin: 0 auto; padding: 20px; font-size: 12px; background: ${BRAND.surface}; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${BRAND.primary}; padding-bottom: 16px; margin-bottom: 24px; }
  .brand-wordmark { font-size: 32px; font-weight: 800; color: ${BRAND.primary}; letter-spacing: -0.02em; line-height: 1; }
  .brand-branch { font-size: 9px; color: ${BRAND.textTertiary}; letter-spacing: 0.28em; font-weight: 600; margin-top: 6px; }
  .brand-detail { font-size: 11px; color: ${BRAND.textSecondary}; margin-top: 10px; line-height: 1.5; }
  .invoice-meta { text-align: right; font-size: 11px; }
  .invoice-meta strong { font-size: 14px; display: block; color: ${BRAND.primary}; letter-spacing: 0.05em; }
  .invoice-num { font-size: 18px; font-weight: 700; color: ${BRAND.text}; margin-top: 8px; font-variant-numeric: tabular-nums; }
  .invoice-date { color: ${BRAND.textSecondary}; margin-top: 2px; }
  .eta-tag { background: ${BRAND.primaryLightest}; color: ${BRAND.primaryDark}; padding: 4px 10px; border-radius: 12px; font-size: 10px; display: inline-block; margin-top: 6px; font-weight: 600; border: 1px solid ${BRAND.primaryLight}; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .party { background: ${BRAND.bgSecondary}; border-radius: 8px; padding: 14px 16px; }
  .party-label { font-size: 9px; text-transform: uppercase; color: ${BRAND.textTertiary}; letter-spacing: 0.12em; font-weight: 600; }
  .party-name { font-weight: 700; font-size: 14px; margin-top: 4px; color: ${BRAND.text}; }
  .party-detail { font-size: 11px; color: ${BRAND.textSecondary}; margin-top: 6px; line-height: 1.6; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.lines thead { background: ${BRAND.primary}; }
  table.lines th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; color: ${BRAND.primaryLight}; letter-spacing: 0.08em; font-weight: 600; }
  table.lines th.num { text-align: right; }
  table.lines td { padding: 12px; border-bottom: 1px solid ${BRAND.borderLight}; font-size: 11px; }
  table.lines td.num { text-align: right; font-variant-numeric: tabular-nums; }
  table.lines tr:last-child td { border-bottom: none; }
  .service-tag { color: ${BRAND.textTertiary}; font-size: 10px; margin-top: 2px; }
  .totals { margin-left: auto; width: 320px; border: 1px solid ${BRAND.border}; border-radius: 10px; overflow: hidden; }
  .totals tr td { padding: 8px 14px; border: none; font-size: 12px; color: ${BRAND.textSecondary}; }
  .totals tr td.num { text-align: right; font-variant-numeric: tabular-nums; color: ${BRAND.text}; font-weight: 500; }
  .totals tr.subtle td { background: ${BRAND.surface}; }
  .totals tr.total td { background: ${BRAND.primary}; color: ${BRAND.primaryLight}; padding-top: 12px; padding-bottom: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
  .totals tr.total td.num { color: white; font-size: 18px; }
  .pay-method { background: ${BRAND.bgSecondary}; padding: 12px 16px; border-radius: 8px; font-size: 11px; margin-top: 16px; border-left: 4px solid ${BRAND.primary}; }
  .pay-method strong { color: ${BRAND.primaryDark}; }
  .eta-block { margin-top: 16px; padding: 14px 16px; background: linear-gradient(135deg, ${BRAND.primaryLightest} 0%, white 100%); border: 1px solid ${BRAND.primaryLight}; border-radius: 8px; font-size: 10px; }
  .eta-block strong { font-size: 11px; color: ${BRAND.primaryDark}; display: block; margin-bottom: 8px; letter-spacing: 0.04em; }
  .eta-row { font-family: monospace; word-break: break-all; color: ${BRAND.textSecondary}; line-height: 1.7; }
  .eta-row b { color: ${BRAND.text}; }
  .qr-placeholder { width: 80px; height: 80px; background: repeating-linear-gradient(45deg, ${BRAND.primary} 0, ${BRAND.primary} 3px, white 3px, white 6px); border: 1px solid ${BRAND.primary}; display: flex; align-items: center; justify-content: center; float: right; margin: 0 0 12px 14px; border-radius: 4px; }
  .qr-placeholder span { background: white; padding: 2px 6px; font-size: 8px; font-family: monospace; color: ${BRAND.primary}; font-weight: 700; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid ${BRAND.borderLight}; font-size: 10px; color: ${BRAND.textTertiary}; text-align: center; line-height: 1.6; }
  .footer strong { color: ${BRAND.primary}; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand-wordmark">Reset</div>
    <div class="brand-branch">BRANCH CAIRO EAST CMC</div>
    <div class="brand-detail">
      Auriculothérapie &amp; laser non-invasif<br>
      N Teseen, New Cairo 1<br>
      Le Caire, Égypte 11835<br>
      N° fiscal (TIN) : ${escapeHtml(process.env.CENTER_TAX_ID ?? 'xxx-xxx-xxx')}
    </div>
  </div>
  <div class="invoice-meta">
    <strong>FACTURE ÉLECTRONIQUE</strong>
    <div class="invoice-num">${escapeHtml(payment.invoiceNumber)}</div>
    <div class="invoice-date">${date.toLocaleDateString('fr-FR')} · ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    ${payment.etaUuid ? `<span class="eta-tag">✓ Soumise ETA</span>` : ''}
  </div>
</div>

<div class="parties">
  <div class="party">
    <div class="party-label">Émetteur</div>
    <div class="party-name">Reset Egypt</div>
    <div class="party-detail">N Teseen, New Cairo 1<br>Le Caire 11835<br>${escapeHtml(process.env.CENTER_PHONE ?? '+201xxxxxxxxx')}</div>
  </div>
  <div class="party">
    <div class="party-label">Patient</div>
    <div class="party-name">${escapeHtml(patient.firstName)} ${escapeHtml(patient.lastName)}</div>
    <div class="party-detail">📞 ${escapeHtml(patient.phone)}${patient.email ? `<br>✉️ ${escapeHtml(patient.email)}` : ''}${patient.address ? `<br>${escapeHtml(patient.address)}` : ''}${patient.governorate ? ` · ${escapeHtml(patient.governorate)}` : ''}</div>
  </div>
</div>

<table class="lines">
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
        <div class="service-tag">Service : ${escapeHtml(SERVICE_LABEL[it.service] ?? it.service)}</div>
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
  <tr class="subtle"><td>Sous-total HT</td><td class="num">${fmtMoney(payment.subtotal)} EGP</td></tr>
  ${Number(payment.discount) > 0 ? `<tr class="subtle"><td>Remise</td><td class="num">- ${fmtMoney(payment.discount)} EGP</td></tr>` : ''}
  <tr class="subtle"><td>TVA 14%</td><td class="num">${fmtMoney(payment.vat)} EGP</td></tr>
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
  <strong>Vérification ETA (Egyptian Tax Authority)</strong>
  <div class="eta-row"><b>UUID :</b> ${escapeHtml(payment.etaUuid)}</div>
  <div class="eta-row"><b>Hash :</b> ${escapeHtml(payment.etaHash ?? '')}</div>
  <div class="eta-row"><b>Soumis le :</b> ${payment.etaSubmittedAt?.toLocaleString('fr-FR') ?? '—'}</div>
  <div style="clear:both;"></div>
</div>`
    : ''
}

<div class="footer">
  <strong>Reset Egypt — Branch Cairo East CMC</strong><br>
  Centre de bien-être non médical · Auriculothérapie + photobiomodulation laser<br>
  Conservation légale 5 ans · Conforme au décret 188/2020 (e-invoicing ETA)
</div>

</body>
</html>`;
}

export function renderInvoiceEmailBody(payment: Payment, patient: Patient, appUrl: string): string {
  const date = new Date(payment.createdAt);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${payment.invoiceNumber} — Reset Egypt</title>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.bgSecondary}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: ${BRAND.text}; line-height: 1.5;">

  <!-- Wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${BRAND.bgSecondary}; padding: 40px 16px;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: ${BRAND.surface}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30, 15, 186, 0.08);">

          <!-- Hero header brandé avec logo SVG inline -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); padding: 36px 32px 32px; color: white; text-align: center;">
              <img src="${escapeHtml(appUrl)}/logo-wordmark.svg" alt="Reset" width="180" height="48" style="display: inline-block; max-width: 180px; height: auto; filter: brightness(0) invert(1);" />
              <div style="font-size: 10px; color: ${BRAND.primaryLight}; letter-spacing: 0.32em; font-weight: 600; margin-top: 10px;">BRANCH CAIRO EAST CMC</div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 14px;">Auriculothérapie & laser non-invasif</div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 0;">
              <h1 style="font-size: 22px; font-weight: 700; color: ${BRAND.text}; margin: 0 0 8px;">
                Bonjour ${escapeHtml(patient.firstName)} 👋
              </h1>
              <p style="color: ${BRAND.textSecondary}; font-size: 14px; margin: 0;">
                Merci pour votre séance chez Reset Egypt. Vous trouverez votre facture conforme à la législation égyptienne ci-dessous.
              </p>
            </td>
          </tr>

          <!-- Big amount card -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, ${BRAND.primaryLightest} 0%, ${BRAND.surface} 100%); border: 1px solid ${BRAND.primaryLight}; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 10px; color: ${BRAND.textTertiary}; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 600;">Montant payé</div>
                    <div style="font-size: 36px; font-weight: 800; color: ${BRAND.primaryDark}; margin-top: 6px; letter-spacing: -0.02em; line-height: 1;">
                      ${fmtMoney(payment.total)}
                      <span style="font-size: 16px; color: ${BRAND.textSecondary}; font-weight: 500; margin-left: 4px;">EGP</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice details rows -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid ${BRAND.borderLight}; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid ${BRAND.borderLight}; color: ${BRAND.textSecondary}; font-size: 13px;">N° de facture</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid ${BRAND.borderLight}; text-align: right; color: ${BRAND.text}; font-weight: 600; font-size: 13px; font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', monospace;">${escapeHtml(payment.invoiceNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid ${BRAND.borderLight}; color: ${BRAND.textSecondary}; font-size: 13px;">Date</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid ${BRAND.borderLight}; text-align: right; color: ${BRAND.text}; font-weight: 500; font-size: 13px;">${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid ${BRAND.borderLight}; color: ${BRAND.textSecondary}; font-size: 13px;">Mode de paiement</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid ${BRAND.borderLight}; text-align: right; color: ${BRAND.text}; font-weight: 500; font-size: 13px;">${escapeHtml(PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod)}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; color: ${BRAND.textSecondary}; font-size: 13px;">Sous-total HT + TVA 14%</td>
                  <td style="padding: 14px 18px; text-align: right; color: ${BRAND.text}; font-weight: 500; font-size: 13px;">${fmtMoney(payment.subtotal)} + ${fmtMoney(payment.vat)} EGP</td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            payment.etaUuid
              ? `<tr>
            <td style="padding: 16px 32px 0;">
              <div style="background: ${BRAND.primaryLightest}; border-radius: 10px; padding: 14px 18px; font-size: 11px; color: ${BRAND.primaryDark}; line-height: 1.6;">
                <strong style="display: block; font-size: 11px; letter-spacing: 0.04em; margin-bottom: 6px;">✓ Conformité ETA — Egyptian Tax Authority</strong>
                <span style="font-family: monospace; color: ${BRAND.textSecondary};">UUID ${escapeHtml(payment.etaUuid)}</span>
              </div>
            </td>
          </tr>`
              : ''
          }

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 32px 0; text-align: center;">
              <a href="${escapeHtml(appUrl)}/patients/${escapeHtml(patient.id)}" style="display: inline-block; background: ${BRAND.primary}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(30, 15, 186, 0.25); letter-spacing: 0.01em;">
                Voir mon dossier patient →
              </a>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding: 28px 32px 0; color: ${BRAND.textSecondary}; font-size: 14px;">
              <p style="margin: 0;">Pour toute question ou pour reprendre rendez-vous, contactez-nous par <a href="https://wa.me/201xxxxxxxxx" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">WhatsApp</a> ou par téléphone.</p>
              <p style="margin: 20px 0 0;">À très vite,<br><strong style="color: ${BRAND.text};">L'équipe Reset Egypt</strong></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; margin-top: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid ${BRAND.borderLight}; padding-top: 24px;">
                <tr>
                  <td style="text-align: center; color: ${BRAND.textTertiary}; font-size: 11px; line-height: 1.7;">
                    <strong style="color: ${BRAND.primary}; font-size: 12px;">Reset Egypt — Branch Cairo East CMC</strong><br>
                    N Teseen, New Cairo 1, Le Caire 11835 · Égypte<br>
                    Centre de bien-être non médical · Auriculothérapie + photobiomodulation laser<br>
                    <a href="${escapeHtml(appUrl)}" style="color: ${BRAND.primary}; text-decoration: none; margin-top: 8px; display: inline-block;">reset-egypt.com</a>
                    <div style="margin-top: 14px; font-size: 10px; color: ${BRAND.textTertiary};">
                      Conservation légale 5 ans · Conforme décret 188/2020 (e-invoicing ETA) · Loi 151/2020 (protection données)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
