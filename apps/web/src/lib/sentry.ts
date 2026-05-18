// ============================================================================
// sentry.ts — initialisation Sentry pour error tracking côté frontend React.
// No-op si VITE_SENTRY_DSN absente.
// ============================================================================

import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // Pas de log en dev pour éviter le bruit
    if (import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.log('[sentry] disabled (no VITE_SENTRY_DSN)');
    }
    return;
  }
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string) ?? 'production',
    // Modeste sample rate pour éviter de saturer le quota
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // PII : pas d'envoi des cookies / headers sensibles par défaut
    sendDefaultPii: false,
    // Ignore les erreurs réseau / annulations normales
    ignoreErrors: [
      'AbortError',
      'NetworkError',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Protège les données patients
        blockAllMedia: true,
      }),
    ],
    // Sample des replays : seulement 10% des sessions, 100% si erreur
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  initialized = true;
}

export { Sentry };
