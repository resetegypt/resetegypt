import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
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
    'Espace de formation interne pour les praticiens Reset Egypt — modules pédagogiques trilingues (FR / مصري / EN).',
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
  title: string;
  blurb: string;
  chapters: string[];
  href: string;
  status: 'available' | 'coming';
  duration: string; // ex "45 min"
  level: Level;
  languages: Locale[];
  category: CategorySlug;
}

type CategorySlug = 'fundamentals' | 'techniques' | 'clinical' | 'business';

interface Category {
  slug: CategorySlug;
  title: string;
  description: string;
  Icon: typeof BookOpen;
}

const CATEGORIES: Category[] = [
  {
    slug: 'fundamentals',
    title: 'Fondamentaux',
    description:
      "Les bases indispensables : le discours à tenir, la méthode auriculothérapique, l'appareil et son fonctionnement.",
    Icon: Compass,
  },
  {
    slug: 'techniques',
    title: 'Techniques par addiction',
    description:
      'Protocoles spécifiques par service : tabac, drogues, alcool, sucre, stress. À utiliser en pratique quotidienne.',
    Icon: Wrench,
  },
  {
    slug: 'clinical',
    title: 'Clinique & suivi',
    description:
      'Contre-indications, cas complexes, suivi post-séance, gestion des rechutes. Compléments cliniques.',
    Icon: Stethoscope,
  },
  {
    slug: 'business',
    title: 'Cabinet & relation client',
    description:
      'Accueil, tarifs, éthique, communication patient, marketing. La partie non-clinique du métier.',
    Icon: Users,
  },
];

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

const MODULES: Module[] = [
  {
    slug: 'discours-praticien',
    title: 'Le discours praticien',
    blurb:
      "Trois chapitres, du premier regard échangé au démarrage de la séance. Le script complet — accueil, définition de l'addiction, images pédagogiques (tétine, faux capteur, tagine), sevrage psychologique, récompense.",
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
    category: 'fundamentals',
  },
  {
    slug: 'manuel-laser-anti-tabac',
    title: 'Manuel Laser Anti-Tabac',
    blurb:
      "Le manuel complet ORYZEN, réorganisé en 4 parties : comprendre la méthode, connaître l'oreille, maîtriser les outils et les protocoles, accompagner le fumeur.",
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
    category: 'fundamentals',
  },
];

// Groupement des modules par catégorie
function modulesInCategory(slug: CategorySlug): Module[] {
  return MODULES.filter((m) => m.category === slug);
}

export default function FormationIndex() {
  const totalModules = MODULES.filter((m) => m.status === 'available').length;

  return (
    <div className="bg-bg min-h-screen">
      {/* HERO */}
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
            L&apos;espace de formation
            <br />
            des praticiens certifiés
          </h1>
          <p className="mt-6 text-base lg:text-lg text-white/85 max-w-2xl leading-relaxed">
            Modules pédagogiques trilingues (français · مصري · english) pour maîtriser le discours,
            l&apos;auriculothérapie laser, les protocoles et l&apos;accompagnement. Contenu métier
            confidentiel — ne pas diffuser hors équipe.
          </p>

          {/* Meta chips */}
          <div className="mt-10 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-white/85">
              <BookOpen className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>
                <strong className="text-white font-semibold">{totalModules}</strong> module
                {totalModules > 1 ? 's' : ''} disponible{totalModules > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/85">
              <Sparkles className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>
                <strong className="text-white font-semibold">3</strong> langues (FR · AR · EN)
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/85">
              <Lock className="w-4 h-4 text-secondary" strokeWidth={1.75} />
              <span>Accès réservé aux praticiens Reset</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {CATEGORIES.map((cat) => {
          const modules = modulesInCategory(cat.slug);
          const CatIcon = cat.Icon;
          const empty = modules.length === 0;

          return (
            <div key={cat.slug} className="mb-16 last:mb-0">
              {/* Category header */}
              <div className="flex items-start gap-4 mb-8 pb-6 border-b border-border-light">
                <div className="w-11 h-11 rounded-xl bg-primary-lightest text-primary flex items-center justify-center shrink-0">
                  <CatIcon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="text-xl lg:text-2xl font-bold text-text tracking-tight">
                      {cat.title}
                    </h2>
                    <span className="text-xs font-medium text-text-tertiary">
                      {empty
                        ? 'Bientôt'
                        : `${modules.length} module${modules.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Modules grid */}
              {empty ? (
                <div className="rounded-xl border-2 border-dashed border-border-light bg-surface/40 px-6 py-10 text-center">
                  <p className="text-sm text-text-tertiary">
                    Aucun module publié dans cette catégorie pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {modules.map((m) => (
                    <ModuleCard key={m.slug} module={m} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* FOOTER de la section — confidentiality notice */}
      <section className="border-t border-border-light bg-bg-secondary/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start gap-3 max-w-3xl">
            <Lock className="w-4 h-4 text-primary mt-1 shrink-0" strokeWidth={2} />
            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text font-semibold">Confidentialité.</strong> Le contenu de
              cette section est destiné aux praticiens certifiés Reset. Ne le partagez pas hors
              équipe, ne copiez pas les URLs à l&apos;extérieur : cela constitue votre savoir-faire
              métier et notre différenciation clinique.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ module: m }: { module: Module }) {
  const isAvailable = m.status === 'available';

  return (
    <article className="group rounded-xl bg-surface border border-border-light overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="p-6 lg:p-7 flex flex-col gap-4 h-full">
        {/* Header : titre + status */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg lg:text-xl font-bold text-text tracking-tight leading-tight">
            {m.title}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
              isAvailable
                ? 'bg-primary-lightest text-primary'
                : 'bg-bg-secondary text-text-tertiary'
            }`}
          >
            {isAvailable ? 'Disponible' : 'Bientôt'}
          </span>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-secondary text-text-secondary">
            {LEVEL_LABEL[m.level]}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-secondary text-text-secondary">
            {m.duration}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-secondary text-text-secondary">
            {m.languages.map((l) => LANG_LABEL[l]).join(' · ')}
          </span>
        </div>

        {/* Blurb */}
        <p className="text-sm text-text-secondary leading-relaxed">{m.blurb}</p>

        {/* Chapters list */}
        <ol className="space-y-1.5 mt-1">
          {m.chapters.map((c, i) => (
            <li key={c} className="flex items-baseline gap-2.5 text-sm text-text">
              <span className="text-[10px] font-mono text-text-tertiary shrink-0 w-4">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-text-secondary">{c}</span>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <div className="mt-auto pt-4">
          {isAvailable ? (
            <Link
              href={m.href}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors group/cta"
            >
              Ouvrir le module
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          ) : (
            <span className="text-sm text-text-tertiary italic">Bientôt disponible</span>
          )}
        </div>
      </div>
    </article>
  );
}
