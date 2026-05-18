// ============================================================================
// internal-cron.ts — endpoints déclenchés par les Vercel Cron Jobs.
//
// Protection : Vercel injecte automatiquement Authorization: Bearer ${CRON_SECRET}
// quand CRON_SECRET est défini dans les env vars du projet. On vérifie la
// présence et l'égalité — sinon 404 (pas 401 pour ne pas exposer l'existence).
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { executeAutomations } from '../modules/automations/executor.js';
import { runBackup } from '../../scripts/backup-db.js';

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

  // Backup BDD quotidien → Cloudflare R2 (ou S3)
  // No-op si BACKUP_S3_BUCKET pas configuré (renvoie 200 skipped).
  app.get('/internal/cron/backup-db', async (req, reply) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) return reply.status(404).send({ error: 'NotFound' });
    if (req.headers.authorization !== `Bearer ${secret}`) {
      return reply.status(404).send({ error: 'NotFound' });
    }
    if (!process.env.BACKUP_S3_BUCKET) {
      return { ok: true, skipped: true, reason: 'BACKUP_S3_BUCKET_not_configured' };
    }
    try {
      const result = await runBackup();
      app.log.info({ result }, '[cron] backup-db completed');
      return result;
    } catch (err) {
      app.log.error({ err }, '[cron] backup-db failed');
      return reply.status(500).send({
        ok: false,
        error: (err as Error).message.slice(0, 500),
      });
    }
  });
}
