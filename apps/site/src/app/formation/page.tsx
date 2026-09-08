import type { Metadata } from 'next';
import Link from 'next/link';

// Contenu métier interne — pas d'indexation Google.
export const metadata: Metadata = {
  title: 'Formation praticien — Reset Egypt',
  description: 'Modules de formation interne pour les praticiens Reset Egypt.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

interface Module {
  slug: string;
  title: string;
  blurb: string;
  chapters: string[];
  href: string;
  status: 'available' | 'coming';
}

const MODULES: Module[] = [
  {
    slug: 'discours-praticien',
    title: 'Le discours praticien',
    blurb:
      'Trois chapitres, du premier regard échangé au démarrage de la séance. Chacun se suit indépendamment.',
    chapters: [
      "Recevoir le client & expliquer l'addiction",
      'Établir le sevrage',
      'La récompense et la séance',
    ],
    href: '/formation/discours-praticien.html',
    status: 'available',
  },
];

export default function FormationIndex() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F2F0EB',
        color: '#16201D',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        padding: 'clamp(24px, 5vw, 60px)',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <header
          style={{
            borderBottom: '1px solid rgba(22,32,29,0.14)',
            paddingBottom: 24,
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#B8542F',
              margin: 0,
            }}
          >
            Reset Egypt · Formation interne
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 700,
              margin: '10px 0 12px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Formation praticien
          </h1>
          <p style={{ color: '#5D6C67', maxWidth: '62ch', margin: 0, lineHeight: 1.55 }}>
            Modules pédagogiques trilingues (français / مصري / english) pour les praticiens
            certifiés Reset. Contenu métier confidentiel — ne pas diffuser hors équipe.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 20 }}>
          {MODULES.map((m) => (
            <article
              key={m.slug}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(22,32,29,0.10)',
                borderRadius: 4,
                padding: 'clamp(20px, 3vw, 32px)',
                display: 'grid',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    margin: 0,
                    letterSpacing: '-0.012em',
                  }}
                >
                  {m.title}
                </h2>
                <span
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: m.status === 'available' ? '#0E6E68' : '#94A39E',
                    border: `1px solid ${m.status === 'available' ? '#0E6E68' : 'rgba(22,32,29,0.14)'}`,
                    borderRadius: 2,
                    padding: '6px 10px',
                    height: 'fit-content',
                  }}
                >
                  {m.status === 'available' ? 'Disponible' : 'Bientôt'}
                </span>
              </div>
              <p style={{ color: '#5D6C67', margin: 0, maxWidth: '66ch', lineHeight: 1.5 }}>
                {m.blurb}
              </p>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {m.chapters.map((c, i) => (
                  <li
                    key={c}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: 12,
                      alignItems: 'baseline',
                      fontSize: '0.95rem',
                      color: '#16201D',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: 11,
                        color: '#B8542F',
                        border: '1px solid #B8542F',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{c}</span>
                  </li>
                ))}
              </ol>
              {m.status === 'available' ? (
                <Link
                  href={m.href}
                  style={{
                    justifySelf: 'start',
                    display: 'inline-block',
                    marginTop: 4,
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '1px solid #0E6E68',
                    background: '#0E6E68',
                    color: '#FFFFFF',
                    borderRadius: 2,
                    padding: '10px 18px',
                    textDecoration: 'none',
                  }}
                >
                  Ouvrir le module →
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <footer
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid rgba(22,32,29,0.10)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#94A39E',
          }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            ← Retour au site
          </Link>
        </footer>
      </div>
    </main>
  );
}
