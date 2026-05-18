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
      // Strip toute donnée patient des extras au cas où
      if (event.request?.cookies) delete event.request.cookies;
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
      const userId = (request as unknown as { user?: { sub?: string; id?: string } }).user?.sub
        ?? (request as unknown as { user?: { sub?: string; id?: string } }).user?.id;
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
