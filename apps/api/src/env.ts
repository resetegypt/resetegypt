import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  // ENCRYPTION_KEY dédiée pour chiffrer les secrets sensibles (totpSecret, futurs PII).
  // Optionnelle : si absente, fallback silencieux sur JWT_SECRET (retrocompat critique
  // — les secrets déjà chiffrés doivent rester déchiffrables). En prod set une valeur
  // dédiée >= 32 chars et NE JAMAIS la faire tourner sans plan de re-chiffrement des
  // colonnes existantes (User.totpSecret notamment).
  ENCRYPTION_KEY: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().transform((s) => s.split(',').map((o) => o.trim())),
  // Email (Resend ou SMTP fallback)
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_FROM: z.string().default('Reset Egypt <noreply@reset-egypt.com>'),
  // Messagerie praticien
  INBOUND_EMAIL_SECRET: z.string().optional(), // secret partagé du webhook /inbound/email
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  // URLs publiques (pour les emails et CORS)
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),
  BOOKING_URL: z.string().url().default('https://book.reset-egypt.com'),
  SITE_URL: z.string().url().default('https://reset-egypt.com'),
  // Coordonnées du centre pour les emails/notifications
  CENTER_EMAIL: z.string().email().default('contact@reset-egypt.com'),
  CENTER_PHONE: z.string().default('+201234567890'),
  CENTER_WHATSAPP: z.string().default('201234567890'), // format E.164 sans + pour wa.me/xxxxx
  // Monitoring (Sentry — optionnel; si absent, init no-op)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('production'),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  // Sécurité : warn si on tourne en prod sans clé de chiffrement dédiée.
  // Le fallback JWT_SECRET reste actif pour retrocompat (secrets déjà en base
  // chiffrés avec JWT_SECRET dérivé), mais c'est une dette : rotation JWT_SECRET
  // = perte des totpSecret existants.
  if (result.data.NODE_ENV === 'production' && !result.data.ENCRYPTION_KEY) {
    console.warn(
      '⚠️  ENCRYPTION_KEY absente en production — fallback sur JWT_SECRET. ' +
        'Set ENCRYPTION_KEY (>=32 chars) dans Vercel env pour découpler la ' +
        'rotation JWT du chiffrement des secrets TOTP.',
    );
  }
  return result.data;
}

export const env = parseEnv();
