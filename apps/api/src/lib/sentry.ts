// ============================================================================
// sentry.ts — initialisation Sentry pour error tracking côté API.
// No-op si SENTRY_DSN absente (env de dev, branches preview, etc.).
// ============================================================================

import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';

let initialized = false;

/**
 * Initialise Sentry au plus tôt dans le boot.
 * Idempotent : safe à appeler plusieurs fois.
 */
export function initSentry(): void {
  if (initialized) return;
  if (!env.SENTRY_DSN) {
    console.log('[sentry] disabled (no SENTRY_DSN)');
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    // PII : on n'envoie pas les corps de requête par défaut pour respecter la Loi 151/2020
    sendDefaultPii: false,
    // Ignore les erreurs client connues / bruyantes
    ignoreErrors: [
      // Auth errors normaux (mauvais mot de passe, token expiré)
      'InvalidCredentials',
      'TokenExpired',
      'Unauthorized',
    ],
    beforeSend(event) {
      // Strip cookies et headers Authorization
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h.authorization;
        delete h.cookie;
        delete h['x-webhook-secret'];
        delete h['x-debug-token'];
      }
      // Strip les query params qui pourraient contenir un token
      if (event.request?.query_string) {
        const raw = String(event.request.query_string);
        // Redact token=..., code=..., password=..., email=...
        event.request.query_string = raw.replace(
          /\b(token|code|password|email|secret|api[_-]?key)=[^&\s]+/gi,
          '$1=[REDACTED]',
        );
      }
      // Strip breadcrumbs qui pourraient contenir des URLs avec token
      if (event.breadcrumbs) {
        for (const bc of event.breadcrumbs) {
          if (bc.data && typeof bc.data === 'object') {
            const d = bc.data as Record<string, unknown>;
            if (typeof d.url === 'string') {
              d.url = d.url.replace(
                /\b(token|code|password|email|secret)=[^&\s]+/gi,
                '$1=[REDACTED]',
              );
            }
          }
        }
      }
      return event;
    },
  });
  initialized = true;
  console.log('[sentry] initialized for', env.SENTRY_ENVIRONMENT);
}

/**
 * Branche Sentry sur le hook onError de Fastify.
 * À appeler une fois après buildApp.
 */
export function attachSentryToFastify(app: FastifyInstance): void {
  if (!env.SENTRY_DSN) return;
  app.addHook('onError', async (request, reply, error) => {
    Sentry.withScope((scope) => {
      scope.setTag('route', request.routeOptions?.url ?? request.url);
      scope.setTag('method', request.method);
      const userId =
        (request as unknown as { user?: { sub?: string; id?: string } }).user?.sub ??
        (request as unknown as { user?: { sub?: string; id?: string } }).user?.id;
      if (userId) scope.setUser({ id: userId });
      scope.setContext('request', {
        url: request.url,
        method: request.method,
        // PAS de body ni headers sensibles
      });
      Sentry.captureException(error);
    });
  });
}

export { Sentry };
