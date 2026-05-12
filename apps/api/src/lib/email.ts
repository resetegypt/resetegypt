import nodemailer, { type Transporter } from 'nodemailer';
import pino from 'pino';
import { env } from '../env.js';

const logger = pino({ level: 'info' });

let cached: { transporter: Transporter | null; verified: boolean } | null = null;

async function getTransporter(): Promise<{ transporter: Transporter | null; verified: boolean }> {
  if (cached) return cached;
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
    logger.warn(
      { err, host: env.SMTP_HOST, port: env.SMTP_PORT },
      'SMTP not reachable — email send will fall back to log-only mock mode',
    );
  }
  cached = { transporter, verified };
  return cached;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
}

export interface EmailResult {
  sent: boolean;
  mocked: boolean;
  messageId?: string;
  error?: string;
}

const FROM_ADDRESS = 'Reset Egypt <noreply@reset-egypt.com>';

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const { transporter, verified } = await getTransporter();
  if (!transporter || !verified) {
    logger.info({ to: msg.to, subject: msg.subject }, '[MOCK EMAIL] would send');
    return { sent: true, mocked: true };
  }
  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      attachments: msg.attachments,
    });
    logger.info({ to: msg.to, messageId: info.messageId }, 'email sent');
    return { sent: true, mocked: false, messageId: info.messageId };
  } catch (err) {
    logger.error({ err, to: msg.to }, 'email send failed');
    return { sent: false, mocked: false, error: (err as Error).message };
  }
}
