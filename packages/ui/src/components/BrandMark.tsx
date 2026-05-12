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
 * Le wordmark RESET utilise du texte HTML (police de la page, toujours visible)
 * et le S central est remplacé par une icône SVG :
 *   • Tracé courbé en spirale (flèches haut→bas) en couleur courante
 *   • Point corail (rgb(var(--danger))) au centre, qui rappelle l'accent du logo
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

  const SIcon = (
    <svg
      viewBox="0 0 64 64"
      width={Math.round(px * 0.9)}
      height={Math.round(px * 0.9)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'baseline', position: 'relative', top: `${Math.round(px * 0.05)}px` }}
    >
      {/* Arc supérieur droit-vers-gauche-vers-bas */}
      <path
        d="M50 18 C 50 10, 38 6, 28 8 C 16 11, 10 22, 14 30 C 17 36, 26 38, 32 32"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Pointe de flèche haut (entrée) */}
      <path
        d="M50 18 L 44 14 M50 18 L 46 24"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arc inférieur gauche-vers-droite-vers-haut */}
      <path
        d="M14 46 C 14 54, 26 58, 36 56 C 48 53, 54 42, 50 34 C 47 28, 38 26, 32 32"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Pointe de flèche bas (sortie) */}
      <path
        d="M14 46 L 20 50 M14 46 L 18 40"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Point corail au centre */}
      <circle cx="32" cy="32" r="4.5" fill="rgb(var(--danger))" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label="Reset Egypt">
        {SIcon}
      </span>
    );
  }

  // Wordmark : "RE" + icône S + "ET" — tout aligné, font lourd
  const wordmark = (
    <span
      className="inline-flex items-baseline font-extrabold tracking-tight whitespace-nowrap leading-none"
      style={{ fontSize: `${px}px`, gap: `${Math.round(px * 0.04)}px` }}
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
            className="font-medium tracking-[0.35em] opacity-80 mt-1"
            style={{ fontSize: `${Math.round(px * 0.18)}px` }}
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
          style={{ fontSize: `${Math.round(px * 0.18)}px` }}
        >
          {tagline}
        </span>
      )}
    </span>
  );
}
