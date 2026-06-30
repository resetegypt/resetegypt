import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'reset-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/health/deep', async () => {
    let db: 'ok' | 'down';
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      db = 'down';
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      service: 'reset-api',
      checks: { database: db },
      timestamp: new Date().toISOString(),
    };
  });

  // Debug-only Sentry trigger. Protected par shared secret comparé timing-safe.
  //   curl -H "X-Debug-Token: $SENTRY_DEBUG_TOKEN" https://api.reset-egypt.com/__debug/sentry
  app.get('/__debug/sentry', async (req, reply) => {
    const expected = process.env.SENTRY_DEBUG_TOKEN;
    const got = req.headers['x-debug-token'];
    const gotStr = typeof got === 'string' ? got : '';
    let ok = false;
    if (expected && gotStr.length === expected.length) {
      try {
        const { timingSafeEqual } = await import('node:crypto');
        ok = timingSafeEqual(Buffer.from(gotStr), Buffer.from(expected));
      } catch { /* noop */ }
    }
    if (!ok) {
      reply.status(404).send({ error: 'NotFound' });
      return;
    }
    throw new Error('Sentry test trigger — safe to ignore (manual debug)');
  });
}
