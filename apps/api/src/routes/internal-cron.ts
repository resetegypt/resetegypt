// ============================================================================
// internal-cron.ts — endpoints déclenchés par les Vercel Cron Jobs.
//
// Protection : Vercel injecte automatiquement Authorization: Bearer ${CRON_SECRET}
// quand CRON_SECRET est défini dans les env vars du projet. On vérifie la
// présence et l'égalité — sinon 404 (pas 401 pour ne pas exposer l'existence).
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { executeAutomations } from '../modules/automations/executor.js';

export async function internalCronRoutes(app: FastifyInstance): Promise<void> {
  // GET car Vercel Cron utilise GET par défaut
  app.get('/internal/cron/automations', async (req, reply) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return reply.status(404).send({ error: 'NotFound' });
    }
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${secret}`) {
      return reply.status(404).send({ error: 'NotFound' });
    }

    const result = await executeAutomations(app);
    app.log.info({ result }, '[cron] automations tick executed');
    return { ok: true, ...result };
  });
}
