/**
 * Envoi d'un email test (facture brandée) à hadadzak@gmail.com via Resend.
 *
 * Usage: node apps/api/scripts/send-test-email.mjs
 */
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? 're_gNE8C9Xi_KvpTkWKnsUfNUg5h2vKqoVdH';
const FROM = process.env.SMTP_FROM ?? 'Reset Egypt <noreply@reset-egypt.com>';
const TO = 'hadadzak@gmail.com';
const APP_URL = 'https://app.reset-egypt.com';

// === Palette de marque Reset ===
const BRAND = {
  primary: '#1E0FBA',
  primaryDark: '#130982',
  primaryLight: '#79C9EE',
  primaryLightest: '#E6F3FB',
  danger: '#FF5440',
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  border: '#D1DDEB',
  borderLight: '#E6EEF7',
  bgSecondary: '#EDF4FB',
  surface: '#FFFFFF',
};

const PAYMENT_METHOD_LABEL = {
  CASH: 'Espèces',
  CARD: 'Carte bancaire',
  VODAFONE_CASH: 'Vodafone Cash',
  INSTAPAY: 'Instapay',
  FAWRY: 'Fawry',
  BANK_TRANSFER: 'Virement bancaire',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// === Données mock pour le test ===
const payment = {
  invoiceNumber: 'RST-2026-000142',
  createdAt: new Date(),
  subtotal: 877.19,
  vat: 122.81,
  total: 1000.0,
  discount: 0,
  paymentMethod: 'INSTAPAY',
  paymentRef: 'IPN-7891234',
  etaUuid: 'b7f3e8a2-c4d5-4e6f-9a8b-1c2d3e4f5a6b',
  etaHash: 'sha256:9f8e7d6c5b4a3210',
  etaSubmittedAt: new Date(),
};

const patient = {
  id: 'pat_demo_2026',
  firstName: 'Zakaria',
  lastName: 'Hadad',
  phone: '+201234567890',
  email: TO,
};

const date = new Date(payment.createdAt);

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${payment.invoiceNumber} — Reset Egypt</title>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.bgSecondary}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif; color: ${BRAND.text}; line-height: 1.5;">

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${BRAND.bgSecondary}; padding: 40px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background: ${BRAND.surface}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30, 15, 186, 0.08);">

          <!-- Hero header brandé avec logo officiel -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); padding: 36px 32px 32px; color: white; text-align: center;">
              <img src="${APP_URL}/logo.svg" alt="Reset" width="120" height="120" style="display: inline-block; width: 120px; height: 120px; border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);" />
              <div style="font-size: 10px; color: ${BRAND.primaryLight}; letter-spacing: 0.32em; font-weight: 600; margin-top: 14px;">BRANCH CAIRO EAST CMC</div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 10px;">Auriculothérapie &amp; laser non-invasif</div>
            </td>
          </tr>

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

          <tr>
            <td style="padding: 16px 32px 0;">
              <div style="background: ${BRAND.primaryLightest}; border-radius: 10px; padding: 14px 18px; font-size: 11px; color: ${BRAND.primaryDark}; line-height: 1.6;">
                <strong style="display: block; font-size: 11px; letter-spacing: 0.04em; margin-bottom: 6px;">✓ Conformité ETA — Egyptian Tax Authority</strong>
                <span style="font-family: monospace; color: ${BRAND.textSecondary};">UUID ${escapeHtml(payment.etaUuid)}</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px 0; text-align: center;">
              <a href="${APP_URL}/patients/${escapeHtml(patient.id)}" style="display: inline-block; background: ${BRAND.primary}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(30, 15, 186, 0.25); letter-spacing: 0.01em;">
                Voir mon dossier patient →
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px 0; color: ${BRAND.textSecondary}; font-size: 14px;">
              <p style="margin: 0;">Pour toute question ou pour reprendre rendez-vous, contactez-nous par <a href="https://wa.me/201234567890" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">WhatsApp</a> ou par téléphone.</p>
              <p style="margin: 20px 0 0;">À très vite,<br><strong style="color: ${BRAND.text};">L'équipe Reset Egypt</strong></p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid ${BRAND.borderLight}; padding-top: 24px;">
                <tr>
                  <td style="text-align: center; color: ${BRAND.textTertiary}; font-size: 11px; line-height: 1.7;">
                    <strong style="color: ${BRAND.primary}; font-size: 12px;">Reset Egypt — Branch Cairo East CMC</strong><br>
                    N Teseen, New Cairo 1, Le Caire 11835 · Égypte<br>
                    Centre de bien-être non médical · Auriculothérapie + photobiomodulation laser<br>
                    <a href="${APP_URL}" style="color: ${BRAND.primary}; text-decoration: none; margin-top: 8px; display: inline-block;">reset-egypt.com</a>
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

const resend = new Resend(RESEND_API_KEY);

console.log(`📧 Envoi facture test à ${TO}...`);
console.log(`   From    : ${FROM}`);
console.log(`   Subject : Facture ${payment.invoiceNumber} — Reset Egypt`);

const result = await resend.emails.send({
  from: FROM,
  to: TO,
  subject: `Facture ${payment.invoiceNumber} — Reset Egypt`,
  html,
  text: `Bonjour ${patient.firstName},\n\nMerci pour votre séance chez Reset Egypt.\nFacture ${payment.invoiceNumber} — Total ${fmtMoney(payment.total)} EGP (${PAYMENT_METHOD_LABEL[payment.paymentMethod]}).\nVoir votre dossier : ${APP_URL}/patients/${patient.id}\n\nÀ très vite,\nL'équipe Reset Egypt — Branch Cairo East CMC`,
});

if (result.error) {
  console.error('❌ Échec Resend :', result.error);
  process.exit(1);
}

console.log('✅ Email envoyé avec succès');
console.log('   Message ID :', result.data?.id);
