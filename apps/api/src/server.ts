import { pathToFileURL } from 'node:url';
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerCors } from './plugins/cors.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({ loggerInstance: logger, trustProxy: true });
  await app.register(sensible);
  await registerHelmet(app);
  await registerCors(app);
  registerErrorHandler(app);
  await registerRoutes(app);
  return app;
}

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`🚀 Reset API listening on http://localhost:${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  start();
}
