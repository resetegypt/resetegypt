import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../server.js';

// INBOUND_EMAIL_SECRET = 'test-inbound-secret' (fixé par vitest.setup.ts).
const SECRET = 'test-inbound-secret';

describe('POST /inbound/email', () => {
  let app: FastifyInstance;
  let userId: string;
  let mailboxId: string;
  const address = `it-mailbox-${Date.now()}@reset-egypt.com`;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    const user = await app.prisma.user.create({
      data: {
        email: `it-doctor-${Date.now()}@reset-egypt.com`,
        passwordHash: 'x',
        role: 'PRACTITIONER',
        firstName: 'Test',
        lastName: 'Doctor',
      },
    });
    userId = user.id;
    const mailbox = await app.prisma.mailbox.create({
      data: { userId, address, displayName: 'Test Doctor' },
    });
    mailboxId = mailbox.id;
  });

  afterAll(async () => {
    await app.prisma.emailAttachment.deleteMany({ where: { email: { mailboxId } } });
    await app.prisma.emailMessage.deleteMany({ where: { mailboxId } });
    await app.prisma.emailThread.deleteMany({ where: { mailboxId } });
    await app.prisma.mailbox.delete({ where: { id: mailboxId } });
    await app.prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('rejette une requête sans header secret (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      payload: { to: address, from: 'x@gmail.com', messageId: '<no-secret@x>' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejette un mauvais secret (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': 'mauvais' },
      payload: { to: address, from: 'x@gmail.com', messageId: '<bad-secret@x>' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejette un payload invalide (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload: { to: 'pas-un-email', from: 'x@gmail.com', messageId: '<bad@x>' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('crée un thread + un message pour un email entrant valide', async () => {
    const messageId = `<happy-${Date.now()}@gmail.com>`;
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload: {
        to: address,
        from: 'patient@gmail.com',
        fromName: 'Un Patient',
        subject: 'Question test',
        messageId,
        bodyText: 'Bonjour docteur',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.threadId).toBeDefined();

    const msg = await app.prisma.emailMessage.findUnique({ where: { messageId } });
    expect(msg).not.toBeNull();
    expect(msg!.direction).toBe('INBOUND');
    expect(msg!.snippet).toBe('Bonjour docteur');

    const thread = await app.prisma.emailThread.findUnique({ where: { id: body.threadId } });
    expect(thread!.unreadCount).toBe(1);
  });

  it('est idempotent sur un messageId déjà reçu', async () => {
    const messageId = `<dup-${Date.now()}@gmail.com>`;
    const payload = { to: address, from: 'patient@gmail.com', subject: 'Dup', messageId, bodyText: 'x' };
    const first = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload,
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload,
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().deduplicated).toBe(true);
  });
});
