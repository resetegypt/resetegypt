/// <reference lib="webworker" />
// ============================================================================
// sw.ts — service worker custom (injectManifest mode pour vite-plugin-pwa).
//
// Combine :
//   - Workbox precaching auto (self.__WB_MANIFEST injecté au build)
//   - Runtime caching API + fonts
//   - Push notifications handler
//   - notificationclick → ouvre URL fournie
// ============================================================================

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// 1. Precaching du shell statique
precacheAndRoute(self.__WB_MANIFEST);

// 2. API → NetworkFirst (5s timeout, fallback cache 24h)
registerRoute(
  ({ url }: { url: URL }) => url.origin.includes('api.reset-egypt.com'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// 3. Google Fonts → CacheFirst 1 an
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gfonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// 4. Push notifications handler
self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data?.json() as {
        title?: string;
        body?: string;
        url?: string;
        icon?: string;
        badge?: string;
        tag?: string;
      };
    } catch {
      return { body: event.data?.text() ?? 'Notification Reset Egypt' };
    }
  })();

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Reset Egypt', {
      body: data.body ?? '',
      icon: data.icon ?? '/pwa-192.png',
      badge: data.badge ?? '/pwa-192.png',
      tag: data.tag,
      data: { url: data.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | null)?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          await (c as WindowClient).focus();
          if ('navigate' in c) {
            try { await (c as WindowClient).navigate(url); } catch { /* noop */ }
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    }),
  );
});

// 5. Skip waiting + claim
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
