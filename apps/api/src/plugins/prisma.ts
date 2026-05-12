import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(app: FastifyInstance) {
  const prisma = new PrismaClient({
    log: app.log.level === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

  // Pas de $connect() ici : Prisma se connecte automatiquement à la première requête.
  // Évite que le boot du serveur (et donc le cold start serverless) ne crash si la DB
  // n'est pas joignable au démarrage.
  app.decorate('prisma', prisma);

  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
