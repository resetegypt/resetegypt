// ============================================================================
// password-policy.ts — validation d'un nouveau mot de passe staff.
//
// Règles (OWASP ASVS L1) :
//  - Longueur min 10, max 200 (bcrypt tronque à 72 mais on garde de la marge UX)
//  - Au moins 1 minuscule, 1 majuscule, 1 chiffre, 1 caractère spécial
//  - Pas dans la mini-liste des mots de passe évidents (top 200 leaks)
//
// À utiliser via `passwordSchema` (zod) — jetté par l'endpoint qui reçoit
// un nouveau mot de passe (create user, change password, reset password).
// Le LOGIN reste `z.string().min(1)` — on ne valide QUE la création.
// ============================================================================

import { z } from 'zod';

// Top 40 des mots de passe leakés + FR courants. Court volontairement (perf +
// pas de dépendance à un package) — c'est un filet, pas un rempart. La vraie
// défense = complexité + rate-limit + bcrypt cost 12 + 2FA.
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'azerty',
  'azerty123',
  'motdepasse',
  'motdepasse1',
  'admin',
  'admin123',
  'administrator',
  'letmein',
  'welcome',
  'welcome1',
  'welcome123',
  'monkey',
  'dragon',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'superman',
  'batman',
  '000000',
  '111111',
  '123123',
  'abc123',
  'abcd1234',
  'passw0rd',
  'p@ssw0rd',
  'p@ssword',
  'trustno1',
  'freedom',
  'whatever',
  'starwars',
  'changeme',
  'changeme1',
  'reset',
  'reset123',
  'resetegypt',
]);

/** Vrai si le password respecte la policy — utilisé par le refine zod ci-dessous. */
function validatePassword(pw: string): { ok: true } | { ok: false; reason: string } {
  if (pw.length < 10) return { ok: false, reason: 'password_too_short' };
  if (pw.length > 200) return { ok: false, reason: 'password_too_long' };
  if (!/[a-z]/.test(pw)) return { ok: false, reason: 'missing_lowercase' };
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: 'missing_uppercase' };
  if (!/\d/.test(pw)) return { ok: false, reason: 'missing_digit' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw))
    return { ok: false, reason: 'missing_special' };
  // Lookup common : d'abord direct (attrape "P@ssw0rd"), puis normalisé alphanum
  // (attrape "Password123!" en le réduisant à "password123", qui est dans la liste).
  const lower = pw.toLowerCase();
  const alphanumOnly = lower.replace(/[^a-z0-9]/g, '');
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(alphanumOnly))
    return { ok: false, reason: 'password_too_common' };
  return { ok: true };
}

/** Schema zod appliquant la password policy. Refuse un password non-conforme
 * avec un `message` structuré (le front peut mapper `.reason` en i18n). */
export const passwordSchema = z
  .string()
  .min(10, { message: 'password_too_short' })
  .max(200, { message: 'password_too_long' })
  .refine((pw) => validatePassword(pw).ok, {
    message: 'password_weak',
  });

/** Version debug/UI : renvoie la raison précise pour messages contextuels. */
export function checkPasswordStrength(pw: string): { ok: boolean; reason?: string } {
  const r = validatePassword(pw);
  if (r.ok) return { ok: true };
  return { ok: false, reason: r.reason };
}
