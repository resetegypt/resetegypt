import { type ReactElement, type ImgHTMLAttributes } from 'react';

type Variant = 'full' | 'wordmark' | 'icon';

interface ResetLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /**
   * - "full" : carte carrée bleue avec wordmark + tagline YOURSELF (logo officiel)
   * - "wordmark" : juste le wordmark sur fond transparent (utilise currentColor)
   * - "icon" : carré bleu avec juste le S + swirl + point corail
   */
  variant?: Variant;
  /** Base URL des assets (par défaut "" — utilise des chemins relatifs depuis le domaine courant) */
  baseUrl?: string;
}

/**
 * Logo officiel Reset Yourself.
 *
 * Le fichier source est fourni par le graphiste et stocké dans
 * apps/web/public/logo.svg (full), logo-wordmark.svg (transparent),
 * logo-icon.svg (juste l'icône). Le composant renvoie une balise
 * <img> qui pointe vers le SVG statique servi par Vercel CDN.
 *
 * 3 variantes :
 *
 *   <ResetLogo />                  // carré bleu officiel — pour login hero, email
 *   <ResetLogo variant="wordmark" /> // wordmark transparent, suit currentColor
 *   <ResetLogo variant="icon" />     // carré bleu avec juste le S
 */
export function ResetLogo({
  variant = 'full',
  baseUrl = '',
  className = '',
  ...imgProps
}: ResetLogoProps): ReactElement {
  const src =
    variant === 'full'
      ? `${baseUrl}/logo.svg`
      : variant === 'icon'
        ? `${baseUrl}/logo-icon.svg`
        : `${baseUrl}/logo-wordmark.svg`;
  return (
    <img
      src={src}
      alt="Reset Yourself"
      draggable={false}
      className={className}
      {...imgProps}
    />
  );
}
