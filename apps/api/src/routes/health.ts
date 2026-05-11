import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'reset-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/health/deep', async () => {
    let db: 'ok' | 'down' = 'down';
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
}
