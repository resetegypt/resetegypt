import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../server.js';

describe('practitioner-mail routes — frontière d auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /practitioner-mail/threads sans cookie → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/practitioner-mail/threads' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /practitioner-mail/unread-count sans cookie → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/practitioner-mail/unread-count' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /practitioner-mail/send sans cookie → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/practitioner-mail/send',
      payload: { to: ['x@y.com'], subject: 'x', bodyText: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /practitioner-mail/attachments/:id sans cookie → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/practitioner-mail/attachments/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(401);
  });
});
