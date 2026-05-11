import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../env.js';

export type Role = 'ADMIN' | 'PRACTITIONER' | 'SECRETARY';

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: Role[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    currentUser?: JWTPayload;
  }
}

const COOKIE_NAME = 'reset_session';
const ONE_DAY_SEC = 60 * 60 * 24;

async function authPlugin(app: FastifyInstance) {
  await app.register(cookie, { secret: env.JWT_SECRET });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: COOKIE_NAME, signed: false },
    sign: { expiresIn: '8h' },
  });

  app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await req.jwtVerify<JWTPayload>();
      req.currentUser = payload;
    } catch {
      reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }
  });

  app.decorate(
    'requireRole',
    function (...roles: Role[]) {
      return async function (req: FastifyRequest, reply: FastifyReply) {
        if (!req.currentUser) {
          reply.status(401).send({ error: 'Unauthorized' });
          return;
        }
        if (!roles.includes(req.currentUser.role)) {
          reply.status(403).send({
            error: 'Forbidden',
            message: `Required role: ${roles.join(' or ')}`,
          });
        }
      };
    },
  );
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SEC = ONE_DAY_SEC;

export default fp(authPlugin, { name: 'auth' });
