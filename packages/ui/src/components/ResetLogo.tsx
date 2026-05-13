import { type ReactElement } from 'react';

type Variant = 'full' | 'wordmark' | 'icon';

interface ResetLogoProps {
  /**
   * - "full" : carte carrée avec fond bleu royal + wordmark + tagline YOURSELF (par défaut)
   * - "wordmark" : juste RESET sans fond ni tagline — couleur via currentColor
   * - "icon" : juste le S + swirl + point corail dans un carré arrondi
   */
  variant?: Variant;
  className?: string;
  /** Étiquette accessibilité — par défaut "Reset Yourself" */
  ariaLabel?: string;
  /** Affiche ou masque la tagline "YOURSELF" (uniquement pour variant="full") */
  showTagline?: boolean;
}

/**
 * Logo officiel Reset Yourself en SVG.
 *
 * Trois variantes :
 *
 *  <ResetLogo />                  // carré avec fond bleu — pour login hero, email
 *  <ResetLogo variant="wordmark" /> // juste RESET, couleur héritée (text-primary, text-white…)
 *  <ResetLogo variant="icon" />     // carré bleu avec juste le S — pour favicon, badge
 *
 * Composé du wordmark "RE[S]ET" en bleu cyan, avec le S décoré de deux flèches
 * en spirale et un point corail au centre. C'est le symbole officiel du centre.
 */
export function ResetLogo({
  variant = 'full',
  className = '',
  ariaLabel = 'Reset Yourself',
  showTagline = true,
}: ResetLogoProps): ReactElement {
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        role="img"
        aria-label={ariaLabel}
        className={className}
      >
        <rect width="256" height="256" rx="48" fill="#1E0FBA" />
        <g transform="translate(80, 28)">
          <text
            x="0"
            y="172"
            fill="#79C9EE"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
            fontWeight="800"
            fontSize="200"
          >
            S
          </text>
          <g fill="none" stroke="#79C9EE" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
            <path d="M110 56 C 124 80, 112 112, 64 125" />
            <path d="M110 56 l-30 -8 M110 56 l8 30" />
            <path d="M-4 152 C -18 128, -6 96, 42 83" />
            <path d="M-4 152 l30 8 M-4 152 l-8 -30" />
          </g>
          <circle cx="56" cy="104" r="15" fill="#FF5440" />
        </g>
      </svg>
    );
  }

  if (variant === 'wordmark') {
    // Wordmark seul, transparent, couleur héritée de currentColor.
    // Utiliser avec text-primary, text-white, etc. sur le parent.
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 320"
        role="img"
        aria-label={ariaLabel}
        className={className}
        fill="currentColor"
      >
        <g
          fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
          fontWeight="800"
          fontSize="280"
        >
          <text x="40" y="260">RE</text>

          <g transform="translate(380, -360)">
            <text x="0" y="620">S</text>
            <g
              transform="translate(45, 360)"
              fill="none"
              stroke="currentColor"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M180 30 C 200 70, 180 130, 100 145" />
              <path d="M180 30 l-40 -10 M180 30 l10 40" />
            </g>
            <g
              transform="translate(45, 360)"
              fill="none"
              stroke="currentColor"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 200 C 0 160, 20 100, 100 85" />
              <path d="M20 200 l40 10 M20 200 l-10 -40" />
            </g>
            <circle cx="145" cy="475" r="22" fill="#FF5440" />
          </g>

          <text x="700" y="260">ET</text>
        </g>
      </svg>
    );
  }

  // variant === "full"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1500 1500"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <rect width="1500" height="1500" fill="#1E0FBA" />

      <g
        fill="#79C9EE"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
        fontWeight="800"
        fontSize="280"
      >
        <text x="290" y="820">RE</text>

        <g transform="translate(630, 0)">
          <text x="0" y="820">S</text>
          <g
            transform="translate(45, 600)"
            fill="none"
            stroke="#79C9EE"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M180 30 C 200 70, 180 130, 100 145" />
            <path d="M180 30 l-40 -10 M180 30 l10 40" />
          </g>
          <g
            transform="translate(45, 600)"
            fill="none"
            stroke="#79C9EE"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 200 C 0 160, 20 100, 100 85" />
            <path d="M20 200 l40 10 M20 200 l-10 -40" />
          </g>
          <circle cx="145" cy="715" r="22" fill="#FF5440" />
        </g>

        <text x="945" y="820">ET</text>
      </g>

      {showTagline && (
        <text
          x="750"
          y="1000"
          textAnchor="middle"
          fill="#EDEBFC"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
          fontWeight="500"
          fontSize="55"
          letterSpacing="22"
        >
          YOURSELF
        </text>
      )}
    </svg>
  );
}
