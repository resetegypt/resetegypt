/**
 * Construit un aperçu court (max 140 caractères) d'un email, pour la liste des
 * threads. Préfère le texte brut ; à défaut, déshtmlise grossièrement le HTML.
 */
export function buildSnippet(
  bodyText?: string | null,
  bodyHtml?: string | null,
): string {
  let raw = (bodyText ?? '').trim();
  if (!raw && bodyHtml) {
    raw = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  }
  raw = raw.replace(/\s+/g, ' ').trim();
  return raw.length > 140 ? raw.slice(0, 139) + '…' : raw;
}
