import { pathToFileURL } from 'node:url';
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { env } from './env.js';
import { loggerOptions } from './lib/logger.js';
import { initSentry, attachSentryToFastify } from './lib/sentry.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerCors } from './plugins/cors.js';
import { registerRateLimit } from './plugins/rate-limit.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import { registerRoutes } from './routes/index.js';

// Init Sentry au plus tôt (avant tout import de logique métier qui pourrait throw)
initSentry();

export async function buildApp() {
  const app = Fastify({ logger: loggerOptions, trustProxy: true });
  await app.register(sensible);
  await registerHelmet(app);
  await registerCors(app);
  await registerRateLimit(app);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  registerErrorHandler(app);
  await registerRoutes(app);
  attachSentryToFastify(app);
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

// Démarre seulement quand exécuté directement en local dev (jamais en serverless Vercel)
if (!process.env.VERCEL && !process.env.LAMBDA_TASK_ROOT) {
  const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
  if (import.meta.url === entryUrl) {
    start();
  }
}
