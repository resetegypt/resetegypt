/**
 * Extrait les Message-IDs candidats pour rattacher un email entrant à un thread
 * existant. In-Reply-To en priorité, puis les References. Trim + déduplication
 * en conservant l'ordre.
 */
export function extractThreadingRefs(
  inReplyTo: string | null | undefined,
  references: string[] | null | undefined,
): string[] {
  const ids: string[] = [];
  if (inReplyTo && inReplyTo.trim()) ids.push(inReplyTo.trim());
  if (references) {
    for (const r of references) {
      const t = (r ?? '').trim();
      if (t) ids.push(t);
    }
  }
  return [...new Set(ids)];
}
