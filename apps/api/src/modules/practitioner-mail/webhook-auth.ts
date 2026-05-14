import { timingSafeEqual } from 'node:crypto';

/**
 * Compare le secret fourni par le webhook au secret attendu, en temps constant.
 * Retourne false si l'un est vide ou si les longueurs diffèrent.
 */
export function secretMatches(provided: string | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
