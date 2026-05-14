import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env.js';

const BUCKET = 'email-attachments';

let client: SupabaseClient | null = null;

/** Retourne le client Supabase, ou null si non configuré. */
function getClient(): SupabaseClient | null {
  if (client) return client;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  return client;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_KEY manquants)');
    this.name = 'StorageNotConfiguredError';
  }
}

/** Construit la clé de stockage d'une pièce jointe. */
export function attachmentKey(mailboxId: string, emailId: string, filename: string): string {
  const safe = filename.replace(/[^\w.-]/g, '_');
  return `${mailboxId}/${emailId}/${safe}`;
}

/** Upload une pièce jointe dans le bucket privé. Throw si le stockage n'est pas configuré. */
export async function uploadAttachment(
  key: string,
  content: Buffer,
  contentType: string,
): Promise<void> {
  const sb = getClient();
  if (!sb) throw new StorageNotConfiguredError();
  const { error } = await sb.storage.from(BUCKET).upload(key, content, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Échec upload pièce jointe : ${error.message}`);
}

/** Génère une URL signée de courte durée pour télécharger une pièce jointe. */
export async function signedAttachmentUrl(key: string, expiresInSec = 300): Promise<string> {
  const sb = getClient();
  if (!sb) throw new StorageNotConfiguredError();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(key, expiresInSec);
  if (error || !data) throw new Error(`Échec URL signée : ${error?.message ?? 'inconnu'}`);
  return data.signedUrl;
}
