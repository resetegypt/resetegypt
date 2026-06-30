// ============================================================================
// internal-cron.ts — endpoints déclenchés par les Vercel Cron Jobs.
//
// Protection : Vercel injecte automatiquement Authorization: Bearer ${CRON_SECRET}
// quand CRON_SECRET est défini dans les env vars du projet. On vérifie la
// présence et l'égalité (timing-safe) — sinon 404 (pas 401 pour ne pas exposer
// l'existence du cron).
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { executeAutomations } from '../modules/automations/executor.js';
import { runBackup } from '../../scripts/backup-db.js';

function checkCronSecret(auth: string | undefined, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  if (!auth || auth.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function internalCronRoutes(app: FastifyInstance): Promise<void> {
  app.get('/internal/cron/automations', async (req, reply) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || !checkCronSecret(req.headers.authorization, secret)) {
      return reply.status(404).send({ error: 'NotFound' });
    }
    const result = await executeAutomations(app);
    app.log.info({ result }, '[cron] automations tick executed');
    return { ok: true, ...result };
  });

  app.get('/internal/cron/backup-db', async (req, reply) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || !checkCronSecret(req.headers.authorization, secret)) {
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
