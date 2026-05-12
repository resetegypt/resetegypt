import { type ReactElement } from 'react';

type BrandMarkProps = {
  className?: string;
  tagline?: string;
  /** Taille du wordmark — "sm" (24px), "md" (40px), "lg" (56px), "xl" (72px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** "wordmark" (default) = RESET + S stylisé, "icon" = juste l'icône S, "stacked" = wordmark + tagline empilé */
  variant?: 'wordmark' | 'icon' | 'stacked';
};

const SIZE_PX: Record<NonNullable<BrandMarkProps['size']>, number> = {
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72,
};

/**
 * BrandMark — Logo Reset Egypt (Reset Yourself).
 *
 * Le wordmark RESET utilise du texte HTML (police de la page, font-extrabold)
 * et le S central est remplacé par une icône SVG :
 *   • Deux flèches courbées formant un S en spirale (style du logo officiel)
 *   • Point corail (rgb(var(--danger))) au centre, au point de croisement
 *
 * La couleur du wordmark et du tracé suit `currentColor` du parent (utilise
 * `text-primary`, `text-primary-light`, `text-white`, etc. sur le parent).
 *
 * Variantes :
 *   - wordmark   : "RE[S]ET" en ligne (par défaut)
 *   - stacked    : wordmark + tagline en dessous (centré)
 *   - icon       : juste l'icône S (sans le texte)
 */
export function BrandMark({
  className = '',
  tagline,
  size = 'lg',
  variant = 'wordmark',
}: BrandMarkProps): ReactElement {
  const px = SIZE_PX[size];
  const iconPx = Math.round(px * 0.95);

  // Icône S : deux flèches courbées en spirale + point rouge au centre.
  // Reconstitution fidèle du symbole du logo Reset Yourself.
  const SIcon = (
    <svg
      viewBox="0 0 64 64"
      width={iconPx}
      height={iconPx}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        display: 'inline-block',
        verticalAlign: 'baseline',
        position: 'relative',
        top: `${Math.round(px * 0.04)}px`,
        flexShrink: 0,
      }}
    >
      {/* Demi-flèche supérieure : entre depuis la droite haut, courbe descendante vers la gauche,
          se termine par une pointe de flèche pointant vers la gauche-bas. */}
      <path
        d="M52 18 C 50 8, 36 6, 24 10 C 14 13, 10 22, 16 28"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 28 L 11 25 M16 28 L 21 25"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Demi-flèche inférieure : entre depuis la gauche bas, courbe montante vers la droite,
          se termine par une pointe de flèche pointant vers la droite-haut. */}
      <path
        d="M12 46 C 14 56, 28 58, 40 54 C 50 51, 54 42, 48 36"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M48 36 L 53 39 M48 36 L 43 39"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Point corail au centre — l'accent visuel du logo */}
      <circle cx="32" cy="32" r="5" fill="rgb(var(--danger))" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label="Reset Egypt">
        {SIcon}
      </span>
    );
  }

  // Wordmark : "RE" + icône S + "ET" — texte aligné baseline, font-extrabold
  const wordmark = (
    <span
      className="inline-flex items-center font-extrabold tracking-tight whitespace-nowrap leading-none"
      style={{ fontSize: `${px}px`, gap: `${Math.round(px * 0.02)}px` }}
      aria-label="Reset"
    >
      <span>RE</span>
      {SIcon}
      <span>ET</span>
    </span>
  );

  if (variant === 'stacked') {
    return (
      <span className={`inline-flex flex-col items-center ${className}`}>
        {wordmark}
        {tagline && (
          <span
            className="font-medium tracking-[0.4em] opacity-80 mt-2"
            style={{ fontSize: `${Math.round(px * 0.2)}px` }}
          >
            {tagline}
          </span>
        )}
      </span>
    );
  }

  // Variante horizontale : wordmark + tagline sur la même ligne
  return (
    <span className={`inline-flex items-baseline gap-3 ${className}`}>
      {wordmark}
      {tagline && (
        <span
          className="font-medium tracking-[0.3em] opacity-80"
          style={{ fontSize: `${Math.round(px * 0.2)}px` }}
        >
          {tagline}
        </span>
      )}
    </span>
  );
}
