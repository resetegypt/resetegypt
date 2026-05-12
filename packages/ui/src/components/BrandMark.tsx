import { type ReactElement } from 'react';

type BrandMarkProps = {
  className?: string;
  tagline?: string;
  /** "horizontal" (default) = logo + texte côte à côte, "stacked" = empilé, "icon" = juste l'icône S */
  variant?: 'horizontal' | 'stacked' | 'icon';
};

/**
 * BrandMark — Logo Reset Egypt en SVG.
 * Rend le wordmark RESET en cyan clair avec le S formé d'une flèche en spirale
 * et le point rouge corail (cf. logo officiel Reset Yourself).
 *
 * Couleurs viennent du token --primary-light (cyan), --danger (corail).
 * Sur fond clair les lettres apparaissent en primary (bleu royal) pour la lisibilité.
 */
export function BrandMark({
  className = '',
  tagline,
  variant = 'horizontal',
}: BrandMarkProps): ReactElement {
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Reset Egypt"
      >
        {/* Spirale (S stylisé) */}
        <path
          d="M44 18c-3-3-7.5-4.5-12-4.5-9 0-16 7-16 16s7 16 16 16c4.5 0 9-1.5 12-4.5"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M44 18l-6 3 4 5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M20 46l6-3-4-5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Point corail */}
        <circle cx="32" cy="29.5" r="3.5" fill="rgb(var(--danger))" />
      </svg>
    );
  }

  const Wordmark = (
    <svg
      viewBox="0 0 280 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      role="img"
      aria-label="Reset Egypt"
    >
      {/* R E S E T en grosses capitales, S spécial avec swirl */}
      <text
        x="0"
        y="50"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="56"
        letterSpacing="-1"
        fill="currentColor"
      >
        RE
      </text>
      {/* Le S est dessiné en path pour intégrer la spirale */}
      <g transform="translate(102, 8)">
        {/* Lettre S de base, en currentColor */}
        <path
          d="M44 12c-4-4-10-6-16-6-8 0-15 4-15 12 0 7 6 11 16 12 10 1 16 5 16 12 0 8-7 12-15 12-7 0-13-3-17-7"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Pointes de flèches du swirl */}
        <path
          d="M44 12l-7 3 5 5"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M13 47l7-3-5-5"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Point corail au centre du S */}
        <circle cx="28" cy="28" r="4.5" fill="rgb(var(--danger))" />
      </g>
      <text
        x="158"
        y="50"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="56"
        letterSpacing="-1"
        fill="currentColor"
      >
        ET
      </text>
    </svg>
  );

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        {Wordmark}
        {tagline && (
          <span className="text-xs tracking-[0.3em] font-medium opacity-80">{tagline}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-baseline gap-3 ${className}`}>
      {Wordmark}
      {tagline && <span className="text-xs tracking-[0.3em] font-medium opacity-80">{tagline}</span>}
    </div>
  );
}
