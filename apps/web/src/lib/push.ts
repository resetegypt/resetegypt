// ============================================================================
// push.ts — helper client-side pour Web Push (subscribe/unsubscribe).
//
// Flow utilisateur :
//   1. requestPushPermission() → demande Notification.permission
//   2. subscribePush() → récupère VAPID public key + subscribe via SW + envoie au backend
//   3. unsubscribePush() → décharge subscription côté backend + browser
//
// Idempotent : si déjà subscribed, no-op silencieux.
// ============================================================================

import { apiGet, apiPost } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

export async function subscribePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  const granted = await requestPushPermission();
  if (!granted) return { ok: false, reason: 'permission_denied' };
  const { publicKey } = await apiGet<{ publicKey: string | null }>('/push/vapid-public-key');
  if (!publicKey) return { ok: false, reason: 'vapid_not_configured' };
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast pour compat TS lib.dom (ArrayBufferLike vs ArrayBuffer)
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });
  }
  const json = sub.toJSON();
  await apiPost('/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
  });
  return { ok: true };
}

export async function unsubscribePush(): Promise<{ ok: boolean }> {
  if (!isPushSupported()) return { ok: false };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await apiPost('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => undefined);
    await sub.unsubscribe();
  }
  return { ok: true };
}

export async function sendTestPush(): Promise<{ sent: number; failed: number }> {
  return apiPost<{ sent: number; failed: number }>('/push/test', {});
}
