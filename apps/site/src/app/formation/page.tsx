import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Globe,
  Lock,
  Sparkles,
  Stethoscope,
  Users,
  Wrench,
} from 'lucide-react';

// Contenu métier interne — pas d'indexation Google.
export const metadata: Metadata = {
  title: 'Formation praticien',
  description:
    'Parcours de formation interne pour les praticiens Reset Egypt — trilingue FR / مصري / EN.',
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

type Locale = 'fr' | 'en' | 'ar';
type Level = 'foundation' | 'intermediate' | 'advanced';

interface Module {
  slug: string;
  order: number; // Numéro d'affichage — l'ordre du parcours pédagogique
  title: string;
  eyebrow: string; // petit tag catégorie/étape au-dessus du titre
  blurb: string;
  chapters: string[];
  href: string;
  status: 'available' | 'coming';
  duration: string;
  level: Level;
  languages: Locale[];
}

const LEVEL_LABEL: Record<Level, string> = {
  foundation: 'Fondamental',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

const LANG_LABEL: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
};

// Ordre pédagogique : d'abord la connaissance (manuel), puis la relation (discours).
const MODULES: Module[] = [
  {
    slug: 'manuel-laser-anti-tabac',
    order: 1,
    title: 'Manuel Laser Anti-Tabac',
    eyebrow: 'Savoir · Le socle théorique',
    blurb:
      "Le manuel de référence ORYZEN, réorganisé en quatre parties qui se suivent : comprendre la méthode auriculothérapique, connaître l'anatomie et la cartographie de l'oreille, maîtriser les outils et les protocoles, et accompagner le fumeur au quotidien.",
    chapters: [
      'Comprendre la méthode',
      "L'oreille : anatomie et cartographie",
      'Outils et protocoles',
      "Le tabac et l'accompagnement",
    ],
    href: '/formation/manuel-laser-anti-tabac.html',
    status: 'available',
    duration: '2 h',
    level: 'foundation',
    languages: ['fr', 'ar', 'en'],
  },
  {
    slug: 'discours-praticien',
    order: 2,
    title: 'Le discours praticien',
    eyebrow: 'Savoir-faire · La relation client',
    blurb:
      "Trois chapitres du premier regard échangé au démarrage de la séance : accueil et règle des cinq sens, définition de l'addiction avec ses images pédagogiques (tétine, faux capteur, tagine), et le sevrage psychologique en trois appuis — cœur, corps, esprit.",
    chapters: [
      "Recevoir le client & expliquer l'addiction",
      'Établir le sevrage psychologique',
      'La récompense et la séance',
    ],
    href: '/formation/discours-praticien.html',
    status: 'available',
    duration: '45 min',
    level: 'foundation',
    languages: ['fr', 'ar', 'en'],
  },
];

export default function FormationIndex() {
  const totalModules = MODULES.filter((m) => m.status === 'available').length;

  return (
    <div className="bg-bg min-h-screen">
      {/* ============================================================
          HERO
      ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#160A99] to-[#100090] text-white">
        <div
          aria-hidden
          className="absolute -top-40 -right-24 w-[420px] h-[420px] rounded-full bg-secondary/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-pink/10 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] font-semibold uppercase text-white/80 mb-4">
            <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Formation praticien — Reset Egypt</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-4xl">
            Le parcours <span className="text-secondary">praticien</span>
            <br />
            Reset
          </h1>
          <p className="mt-6 text-base lg:text-lg text-white/85 max-w-2xl leading-relaxed">
            Du socle théorique à la relation client, deux modules à suivre dans l&apos;ordre —
            trilingues (français · مصري · english). Contenu métier confidentiel, réservé aux
            praticiens certifiés Reset.
          </p>

          {/* Meta chips */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-white/85">
              <BookOpen className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>
                <strong className="text-white font-semibold">{totalModules}</strong> modules
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/85">
              <Clock className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>
                <strong className="text-white font-semibold">≈ 3 h</strong> de contenu
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/85">
              <Globe className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>FR · AR · EN</span>
            </div>
            <div className="flex items-center gap-2 text-white/85">
              <Lock className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>Accès réservé</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PARCOURS — timeline verticale, un module par étape
      ============================================================ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16">
          <div className="text-[10px] tracking-[0.28em] font-bold text-primary uppercase mb-3">
            Le parcours
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-text tracking-tight leading-tight max-w-2xl">
            Deux modules à suivre dans l&apos;ordre : d&apos;abord le savoir, puis le savoir-faire.
          </h2>
        </div>

        <ol className="relative space-y-14 lg:space-y-20">
          {/* Ligne verticale connectant les étapes */}
          <div
            aria-hidden
            className="absolute left-6 lg:left-8 top-6 bottom-6 w-px bg-gradient-to-b from-primary via-primary-light to-primary/20 pointer-events-none"
          />

          {MODULES.map((m, i) => (
            <li key={m.slug} className="relative">
              <ModuleStep module={m} isLast={i === MODULES.length - 1} />
            </li>
          ))}
        </ol>
      </section>

      {/* ============================================================
          À VENIR — 3 catégories futures avec placeholder discret
      ============================================================ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="mb-8 lg:mb-10">
          <div className="text-[10px] tracking-[0.28em] font-bold text-text-tertiary uppercase mb-2">
            À venir
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight leading-tight">
            Les prochaines catégories du parcours
          </h2>
          <p className="text-sm text-text-secondary mt-2 max-w-2xl leading-relaxed">
            La structure est prête pour recevoir les modules spécialisés à mesure qu&apos;ils sont
            produits. En attendant, les fondamentaux couvrent l&apos;essentiel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UPCOMING_CATEGORIES.map((cat) => {
            const Icon = cat.Icon;
            return (
              <div
                key={cat.slug}
                className="rounded-xl border-2 border-dashed border-border-light bg-surface/40 p-5 flex flex-col gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-bg-secondary text-text-tertiary flex items-center justify-center">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text tracking-tight leading-tight mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{cat.blurb}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-bg-secondary text-text-tertiary self-start mt-auto">
                  Bientôt
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          FOOTER — confidentiality notice
      ============================================================ */}
      <section className="border-t border-border-light bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start gap-3 max-w-3xl">
            <Lock className="w-4 h-4 text-primary mt-1 shrink-0" strokeWidth={2} />
            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text font-semibold">Confidentialité.</strong> Le contenu de
              cette section est destiné aux praticiens certifiés Reset. Ne le partagez pas hors
              équipe, ne copiez pas les URLs à l&apos;extérieur : c&apos;est votre savoir-faire
              métier et notre différenciation clinique.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const UPCOMING_CATEGORIES = [
  {
    slug: 'techniques',
    title: 'Techniques par addiction',
    blurb: 'Protocoles tabac, drogues, alcool, sucre, stress — un module par service.',
    Icon: Wrench,
  },
  {
    slug: 'clinical',
    title: 'Clinique & suivi',
    blurb: 'Contre-indications, cas complexes, gestion des rechutes.',
    Icon: Stethoscope,
  },
  {
    slug: 'business',
    title: 'Cabinet & relation client',
    blurb: 'Accueil, tarifs, communication patient, éthique, marketing.',
    Icon: Users,
  },
];

function ModuleStep({ module: m, isLast: _isLast }: { module: Module; isLast: boolean }) {
  const isAvailable = m.status === 'available';

  return (
    <div className="grid grid-cols-[auto_1fr] gap-5 lg:gap-8">
      {/* Numéro d'étape (cercle sur la timeline) */}
      <div className="relative">
        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-surface border-2 border-primary flex items-center justify-center shadow-md shadow-primary/10 relative z-10">
          <span className="font-bold text-primary text-base lg:text-xl tabular-nums">
            {String(m.order).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Carte contenu */}
      <article
        className={`group rounded-2xl bg-surface border transition-all ${
          isAvailable
            ? 'border-border-light hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
            : 'border-border-light/50 opacity-70'
        } overflow-hidden`}
      >
        {/* Barre supérieure décorative */}
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary-light" />

        <div className="p-6 lg:p-8 flex flex-col gap-5">
          {/* Header */}
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] tracking-[0.2em] font-bold text-primary uppercase mb-2">
                {m.eyebrow}
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-text tracking-tight leading-tight">
                {m.title}
              </h3>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isAvailable
                  ? 'bg-primary-lightest text-primary'
                  : 'bg-bg-secondary text-text-tertiary'
              }`}
            >
              {isAvailable && <CheckCircle2 className="w-3 h-3" strokeWidth={2.25} />}
              {isAvailable ? 'Disponible' : 'Bientôt'}
            </span>
          </header>

          {/* Blurb */}
          <p className="text-sm lg:text-base text-text-secondary leading-relaxed">{m.blurb}</p>

          {/* Chapters — grille de 2 colonnes en desktop */}
          <div className="bg-bg-secondary/50 rounded-xl p-4 lg:p-5">
            <div className="text-[10px] tracking-[0.2em] font-bold text-text-tertiary uppercase mb-3">
              Au sommaire — {m.chapters.length} chapitre{m.chapters.length > 1 ? 's' : ''}
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {m.chapters.map((c, i) => (
                <li key={c} className="flex items-baseline gap-2.5 text-sm">
                  <span className="text-[10px] font-mono font-semibold text-primary shrink-0 w-5 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-text">{c}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Meta chips + CTA */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2} />
                <span>{m.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Sparkles className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2} />
                <span>{LEVEL_LABEL[m.level]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Globe className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2} />
                <span>{m.languages.map((l) => LANG_LABEL[l]).join(' · ')}</span>
              </div>
            </div>

            {isAvailable ? (
              <Link
                href={m.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 group/cta"
              >
                Ouvrir le module
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5"
                  strokeWidth={2.25}
                />
              </Link>
            ) : (
              <span className="text-sm text-text-tertiary italic">Bientôt disponible</span>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
