// Vercel Serverless Handler — adapte Fastify pour s'exécuter en function serverless.
// Vercel détecte ce fichier comme handler par convention (apps/api/api/index.ts).
// La route catch-all dans vercel.json envoie TOUTES les requêtes ici.
// Fastify est instancié une seule fois (cold start), puis réutilisé entre invocations chaudes.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../src/server.js';

type FastifyApp = Awaited<ReturnType<typeof buildApp>>;
let app: FastifyApp | null = null;
let appReady: Promise<FastifyApp> | null = null;

async function getApp(): Promise<FastifyApp> {
  if (app) return app;
  if (!appReady) {
    appReady = (async () => {
      const instance = await buildApp();
      await instance.ready();
      app = instance;
      return instance;
    })();
  }
  return appReady;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const instance = await getApp();
  instance.server.emit('request', req, res);
}
