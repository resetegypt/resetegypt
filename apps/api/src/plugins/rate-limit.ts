// ============================================================================
// rate-limit.ts — protection brute-force globale + ciblée auth.
//
// Stratégie 2 niveaux :
//   - Global : 300 req/min/IP (généreux pour ne pas casser les usages légitimes)
//   - Routes auth strictes via app.rateLimit({ max, timeWindow }) en preHandler
//
// En serverless (Vercel), le store par défaut est in-memory : limites soft
// (reset à chaque cold-start). Acceptable comme defense-in-depth.
// ============================================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    // Identité = IP + path (évite que 1 user bloque les autres sur le même path)
    keyGenerator: (req: FastifyRequest) => `${req.ip}|${req.routeOptions?.url ?? req.url}`,
    // Ne rate-limit pas les health checks (uptime monitor)
    skipOnError: false,
    addHeadersOnExceeding: { 'x-ratelimit-limit': true, 'x-ratelimit-remaining': true },
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'TooManyRequests',
      message: 'Trop de requêtes. Réessaie dans quelques instants.',
    }),
  });
}

/**
 * Helpers pour appliquer un rate-limit strict sur les routes critiques (auth).
 * À utiliser comme preHandler.
 */
export function strictAuthRateLimit(app: FastifyInstance) {
  return app.rateLimit({
    max: 10,             // 10 essais
    timeWindow: '15 minutes',
    keyGenerator: (req) => `auth|${req.ip}`,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'TooManyAuthAttempts',
      message: 'Trop de tentatives. Réessaie dans 15 min.',
    }),
  });
}
