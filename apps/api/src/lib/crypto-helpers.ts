// ============================================================================
// crypto-helpers.ts — utilitaires de chiffrement pour secrets sensibles en BDD.
//
// - encryptSecret/decryptSecret : AES-256-GCM avec clé dérivée de
//   ENCRYPTION_KEY (env var). Pour totpSecret, futurs PII chiffrés…
// - hashCode/verifyCode : bcrypt-like pour les backup codes 2FA, comparable
//   en timing-safe au moment de l'usage.
// - escapeCsvCell : protection anti-injection CSV (cellules =/+/-/@ préfixées).
// ============================================================================

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const KEY_LEN = 32;
const SALT = Buffer.from('reset-egypt-totp-salt-v1', 'utf8');

let cachedKey: Buffer | null = null;

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;
  // ENCRYPTION_KEY peut ne pas exister en local dev → fallback sur JWT_SECRET
  // (déjà secret, déjà set partout). En prod set ENCRYPTION_KEY dédié.
  const raw = process.env.ENCRYPTION_KEY ?? process.env.JWT_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error('crypto-helpers: ENCRYPTION_KEY (or JWT_SECRET fallback) missing or too short');
  }
  cachedKey = scryptSync(raw, SALT, KEY_LEN);
  return cachedKey;
}

/** Chiffre un secret. Output : base64 "iv:tag:ciphertext" pour stockage en DB. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, deriveKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/** Déchiffre un secret produit par encryptSecret. Renvoie null en cas de tag invalide. */
export function decryptSecret(encrypted: string): string | null {
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) return null;
    const [iv, tag, ct] = parts.map((s) => Buffer.from(s, 'base64'));
    if (!iv || !tag || !ct) return null;
    const decipher = createDecipheriv(ALGO, deriveKey(), iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return null;
  }
}

/** Hash un backup code (one-shot, lecture-une-fois) avec bcrypt cost 10. */
export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code.trim().toUpperCase(), 10);
}

/** Vérifie un backup code submitted contre une liste de hashes. Renvoie l'index match ou -1. */
export async function findMatchingBackupCode(submitted: string, hashes: string[]): Promise<number> {
  const target = submitted.trim().toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(target, hashes[i]!)) return i;
  }
  return -1;
}

/**
 * Anti-CSV-injection : si une cellule commence par =, +, -, @ ou tab, on la
 * préfixe d'une apostrophe pour neutraliser Excel/Google Sheets formula
 * execution (CVE-class : nom de patient `=cmd|'/c calc'!A1` = RCE chez le
 * comptable à l'ouverture du CSV).
 */
export function escapeCsvCell(value: unknown): string {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Construit une ligne CSV protégée. */
export function csvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',');
}

/** timing-safe compare 2 strings (longueur d'abord, puis crypto compare). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
