// ============================================================================
// push.routes.ts — Web Push (browser notifications) pour staff app.
//
// Pré-requis env :
//   VAPID_PUBLIC_KEY   — distribuée au client via GET /push/vapid-public-key
//   VAPID_PRIVATE_KEY  — secret, jamais distribué
//   VAPID_SUBJECT      — mailto:contact@reset-egypt.com (RFC 8292)
//
// Génération initiale des clés :
//   npx web-push generate-vapid-keys
//
// Endpoints :
//   GET  /push/vapid-public-key         — clé publique (à charger client side)
//   POST /push/subscribe                — enregistre une subscription
//   POST /push/unsubscribe              — supprime une subscription
//   POST /push/test                     — envoie une notif de test à soi-même
//
// Helper exporté `sendPushToUser(userId, payload)` utilisable par d'autres
// modules (mailbox inbound, automation workflows…).
// ============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import webpush from 'web-push';

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const prv = process.env.VAPID_PRIVATE_KEY;
  const sub = process.env.VAPID_SUBJECT ?? 'mailto:contact@reset-egypt.com';
  if (!pub || !prv) return false;
  webpush.setVapidDetails(sub, pub, prv);
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;  // URL ouverte au clic
  icon?: string;
  badge?: string;
  tag?: string;  // groupe notifications (remplace celle existante)
}

/** Envoie une notif à toutes les subscriptions d'un user. Purge celles cassées. */
export async function sendPushToUser(
  app: FastifyInstance,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) {
    app.log.warn('push: VAPID keys not configured, skipping');
    return { sent: 0, failed: 0 };
  }
  const subs = await app.prisma.pushSubscription.findMany({ where: { userId } });
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    icon: payload.icon ?? '/pwa-192.png',
    badge: payload.badge ?? '/pwa-192.png',
    tag: payload.tag,
  });
  let sent = 0, failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
      sent++;
      // Touch lastSeenAt occasionally (every 10th to avoid spam)
      if (Math.random() < 0.1) {
        await app.prisma.pushSubscription.update({
          where: { id: s.id },
          data: { lastSeenAt: new Date() },
        });
      }
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        // Subscription expirée / désabonnée → on purge
        await app.prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => undefined);
      }
      failed++;
      app.log.warn({ err, status, endpoint: s.endpoint.slice(0, 50) }, 'push send failed');
    }
  }
  return { sent, failed };
}

export async function pushRoutes(app: FastifyInstance): Promise<void> {
  // GET /push/vapid-public-key — public, pas d'auth (le client en a besoin avant subscribe)
  app.get('/push/vapid-public-key', async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? null };
  });

  // POST /push/subscribe — enregistre la subscription du client
  app.post('/push/subscribe', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      }),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });
    const { endpoint, keys } = parsed.data;
    const userAgent = req.headers['user-agent'] ?? null;

    // Upsert sur endpoint (unique) — un même device qui re-subscribe écrase
    await app.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: req.currentUser!.sub,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? undefined,
      },
      update: {
        userId: req.currentUser!.sub,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? undefined,
        lastSeenAt: new Date(),
      },
    });
    return { ok: true };
  });

  // POST /push/unsubscribe { endpoint }
  app.post('/push/unsubscribe', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({ endpoint: z.string().url() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: 'ValidationError' });
    await app.prisma.pushSubscription
      .deleteMany({ where: { endpoint: parsed.data.endpoint, userId: req.currentUser!.sub } });
    return { ok: true };
  });

  // POST /push/test — envoie une notif à soi-même
  app.post('/push/test', { onRequest: [app.authenticate] }, async (req) => {
    const result = await sendPushToUser(app, req.currentUser!.sub, {
      title: 'Reset Egypt — Test',
      body: 'Tu reçois bien les notifications. ✅',
      tag: 'test',
    });
    return result;
  });
}
