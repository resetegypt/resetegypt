import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import pino from 'pino';
import { env } from '../env.js';

const logger = pino({ level: 'info' });

let resendClient: Resend | null = null;
let smtpTransporter: { transporter: Transporter | null; verified: boolean } | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  if (env.RESEND_API_KEY) {
    resendClient = new Resend(env.RESEND_API_KEY);
    logger.info('Resend client initialized');
    return resendClient;
  }
  return null;
}

async function getSmtpTransporter(): Promise<{ transporter: Transporter | null; verified: boolean }> {
  if (smtpTransporter) return smtpTransporter;
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    ignoreTLS: true,
  });
  let verified = false;
  try {
    await transporter.verify();
    verified = true;
    logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT }, 'SMTP transporter verified');
  } catch (err) {
    logger.warn({ err }, 'SMTP not reachable — falls back to mock');
  }
  smtpTransporter = { transporter, verified };
  return smtpTransporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Expéditeur. Défaut : env.SMTP_FROM. Format : "Nom <email@domaine>". */
  from?: string;
  /** Adresse de réponse (Reply-To). */
  replyTo?: string;
  /** Destinataires en copie. */
  cc?: string[];
  /** Headers RFC822 supplémentaires (ex: In-Reply-To, References, Message-ID). */
  headers?: Record<string, string>;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
}

export interface EmailResult {
  sent: boolean;
  mocked: boolean;
  provider: 'resend' | 'smtp' | 'mock';
  messageId?: string;
  error?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  // Préférence : Resend (si configuré) — production grade
  const resend = getResend();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: msg.from ?? env.SMTP_FROM,
        to: msg.to,
        cc: msg.cc,
        replyTo: msg.replyTo,
        headers: msg.headers,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        attachments: msg.attachments?.map((a) => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
        })),
      });
      if (result.error) {
        logger.error({ err: result.error }, 'Resend send failed');
        return { sent: false, mocked: false, provider: 'resend', error: result.error.message };
      }
      logger.info({ to: msg.to, id: result.data?.id }, 'email sent via Resend');
      return { sent: true, mocked: false, provider: 'resend', messageId: result.data?.id };
    } catch (err) {
      logger.error({ err }, 'Resend exception');
      // Fall through to SMTP
    }
  }

  // Fallback : SMTP (MailHog en dev)
  const { transporter, verified } = await getSmtpTransporter();
  if (!transporter || !verified) {
    logger.info({ to: msg.to, subject: msg.subject }, '[MOCK EMAIL] would send');
    return { sent: true, mocked: true, provider: 'mock' };
  }
  try {
    const info = await transporter.sendMail({
      from: msg.from ?? env.SMTP_FROM,
      to: msg.to,
      cc: msg.cc,
      replyTo: msg.replyTo,
      headers: msg.headers,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      attachments: msg.attachments,
    });
    logger.info({ to: msg.to, messageId: info.messageId }, 'email sent via SMTP');
    return { sent: true, mocked: false, provider: 'smtp', messageId: info.messageId };
  } catch (err) {
    logger.error({ err }, 'SMTP send failed');
    return { sent: false, mocked: false, provider: 'smtp', error: (err as Error).message };
  }
}
