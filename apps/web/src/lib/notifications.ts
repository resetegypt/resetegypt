// ============================================================================
// Notifications navigateur + sons.
//
// Permissions :
//   - Notifications : on demande via requestPermission() au premier appel.
//   - Sons : pas de permission nécessaire, mais on respecte les politiques
//     d'autoplay (un user gesture doit avoir eu lieu sur la page sinon
//     l'AudioContext sera suspendu).
//
// Le son est généré via Web Audio API — pas de fichier MP3 à charger,
// fonctionne offline et reste ultra léger (~0 KB).
// ============================================================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Joue un court "ding" branding (deux notes : E5 puis A5, ~250ms total).
 * Volume bas pour ne pas effrayer en consultation. Non bloquant.
 */
export function playStartSessionSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime;
  playNote(ctx, 659.25, now, 0.18, 0.14); // E5
  playNote(ctx, 880, now + 0.12, 0.22, 0.18); // A5
}

/**
 * Joue un "bip" simple plus discret pour les notifications passives
 * (patient arrivé, nouveau message, etc.).
 */
export function playSoftPing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime;
  playNote(ctx, 880, now, 0.2, 0.1);
}

function playNote(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  // Enveloppe ADSR très courte pour un son "cristallin" plutôt qu'un bip plat.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

// ============================================================================
// Web Notifications API
// ============================================================================

export interface NotifyOpts {
  title: string;
  body?: string;
  tag?: string; // utile pour dédoublonner (un seul "patient arrivé" affiché)
  icon?: string;
  onClick?: () => void;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

/**
 * Envoie une notification système (en plus du toast in-app).
 * No-op si l'utilisateur n'a pas accordé la permission.
 */
export function sendDesktopNotification(opts: NotifyOpts): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      icon: opts.icon ?? '/logo-icon.svg',
      badge: '/logo-icon.svg',
      silent: false,
    });
    if (opts.onClick) {
      n.onclick = () => {
        window.focus();
        opts.onClick!();
        n.close();
      };
    }
  } catch {
    /* swallow — pas critique */
  }
}

/**
 * Helper combiné : son + notification desktop. Utilisé par les hooks
 * qui détectent un événement important (RDV démarré, patient arrivé…).
 */
export function notifyImportantEvent(opts: NotifyOpts, sound: 'ding' | 'soft' = 'ding'): void {
  if (sound === 'ding') playStartSessionSound();
  else playSoftPing();
  sendDesktopNotification(opts);
}
