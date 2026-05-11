import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../server.js';

describe('Health endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({ status: 'ok', service: 'reset-api' });
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /health/deep returns 200 with database ok when DB is reachable', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/deep' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.checks.database).toBe('ok');
    expect(body.status).toBe('ok');
  });
});
