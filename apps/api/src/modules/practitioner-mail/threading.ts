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

/**
 * Fenêtre pour le fallback threading (subject+sender). Au-delà, on considère
 * qu'un nouvel email au même sujet est une conversation neuve.
 */
export const THREADING_FALLBACK_WINDOW_DAYS = 30;

/**
 * Retire les préfixes de réponse/transfert usuels (Re:, Fwd:, Fw:, TR:, AW:, RV:, FW:)
 * — répétés éventuellement — et normalise pour comparaison inter-clients :
 * lowercase, trim, whitespace collapsé, accents/emojis conservés.
 *
 * Utilisé pour le fallback threading quand In-Reply-To/References sont absents
 * (Gmail ne les préserve pas toujours lors des transferts entre boîtes).
 */
export function normalizeSubject(subject: string | null | undefined): string {
  if (!subject) return '';
  // Regex : optionnellement précédé d'espaces, un des préfixes courants,
  // suivi de : ou :, ou ] (pour "[EXT] Re: xxx" — on strip juste le préfixe
  // réponse mais on garde le [EXT] volontairement, c'est un vrai marqueur).
  // On boucle jusqu'à ce que le préfixe disparaisse pour gérer "Re: Fwd: Re: ...".
  const PREFIX_RE = /^\s*(re|fwd?|fw|tr|aw|rv|sv|antw|res|réf|ref)\s*:\s*/i;
  let s = subject;
  // Garde-fou : max 10 dépilages pour éviter un pathological input
  for (let i = 0; i < 10; i++) {
    const next = s.replace(PREFIX_RE, '');
    if (next === s) break;
    s = next;
  }
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Compare 2 subjects après normalisation. Renvoie true si probablement le
 * même thread (Re:/Fwd: strippés, casse et whitespace normalisés).
 */
export function subjectsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeSubject(a);
  const nb = normalizeSubject(b);
  if (!na || !nb) return false;
  return na === nb;
}
