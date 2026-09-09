import type { Metadata } from 'next';
import Link from 'next/link';
import { Nunito } from 'next/font/google';
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
import { ForceFrenchLtr } from './ForceFrenchLtr';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
});

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
  order: number;
  title: string;
  eyebrow: string;
  emoji: string;
  blurb: string;
  chapters: string[];
  href: string;
  status: 'available' | 'coming';
  duration: string;
  level: Level;
  languages: Locale[];
  accentClass: string; // classe couleur pour cette carte
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

const MODULES: Module[] = [
  {
    slug: 'manuel-laser-anti-tabac',
    order: 1,
    title: 'Manuel Laser Anti-Tabac',
    eyebrow: 'Le socle théorique',
    emoji: '📚',
    blurb:
      "Le manuel de référence complet, réorganisé en quatre parties qui se suivent : comprendre la méthode auriculothérapique, connaître l'anatomie et la cartographie de l'oreille, maîtriser les outils et les protocoles, et accompagner le fumeur au quotidien.",
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
    accentClass: 'primary',
  },
  {
    slug: 'discours-praticien',
    order: 2,
    title: 'Le discours praticien',
    eyebrow: 'La relation client',
    emoji: '💬',
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
    accentClass: 'secondary',
  },
];

export default function FormationIndex() {
  const totalModules = MODULES.filter((m) => m.status === 'available').length;

  return (
    <div className={`${nunito.className} bg-bg min-h-screen overflow-hidden`}>
      <ForceFrenchLtr />

      {/* ============================================================
          HERO — plus ludique avec blobs & floating badges
      ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-[#160A99] to-[#100090] text-white">
        {/* Blob decorations */}
        <div
          aria-hidden
          className="absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full bg-secondary/20 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '5s' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-32 w-[460px] h-[460px] rounded-full bg-pink/15 blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '7s', animationDelay: '1s' }}
        />
        <div
          aria-hidden
          className="absolute top-1/3 left-1/4 w-[220px] h-[220px] rounded-full bg-white/5 blur-2xl pointer-events-none"
        />

        {/* Floating decorative dots */}
        <div
          aria-hidden
          className="absolute top-16 right-16 w-2 h-2 rounded-full bg-secondary animate-bounce"
          style={{ animationDuration: '3s' }}
        />
        <div
          aria-hidden
          className="absolute top-24 right-32 w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
          style={{ animationDuration: '4s', animationDelay: '0.5s' }}
        />
        <div
          aria-hidden
          className="absolute bottom-32 left-20 w-3 h-3 rounded-full bg-pink/60 animate-bounce"
          style={{ animationDuration: '3.5s', animationDelay: '1s' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          {/* Badge eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-xs font-bold tracking-wider uppercase text-white mb-6">
            <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Formation praticien</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.02] max-w-4xl">
            Le parcours{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-secondary">praticien</span>
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 right-0 h-3 bg-pink/40 -z-0 -skew-x-6"
              />
            </span>
            <br />
            Reset <span className="inline-block animate-pulse">🎓</span>
          </h1>

          <p className="mt-8 text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed font-medium">
            Du socle théorique à la relation client, deux modules à suivre dans l&apos;ordre —
            trilingues (français · مصري · english). Contenu métier confidentiel réservé aux
            praticiens certifiés Reset.
          </p>

          {/* Stats chips avec émojis */}
          <div className="mt-12 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 hover:bg-white/15 transition-colors">
              <span className="text-xl">📖</span>
              <div>
                <div className="text-xl font-black leading-none">{totalModules}</div>
                <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  modules
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 hover:bg-white/15 transition-colors">
              <span className="text-xl">⏱️</span>
              <div>
                <div className="text-xl font-black leading-none">≈ 3h</div>
                <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  de contenu
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 hover:bg-white/15 transition-colors">
              <span className="text-xl">🌍</span>
              <div>
                <div className="text-base font-black leading-none">FR · AR · EN</div>
                <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  3 langues
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
              <span className="text-xl">🔒</span>
              <div>
                <div className="text-base font-black leading-none">Privé</div>
                <div className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  praticiens
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave transition */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-bg" />
      </section>

      {/* ============================================================
          PARCOURS — timeline avec cards ludiques
      ============================================================ */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.28em] text-primary uppercase mb-3 bg-primary-lightest px-4 py-1.5 rounded-full">
            <span>✨</span>
            <span>Le parcours</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-black text-text tracking-tight leading-tight max-w-3xl mx-auto">
            D&apos;abord le savoir,
            <br />
            puis le savoir-faire.
          </h2>
          <p className="mt-4 text-base text-text-secondary max-w-xl mx-auto">
            Deux modules pensés pour se suivre dans l&apos;ordre, mais indépendants.
          </p>
        </div>

        {/* Timeline verticale */}
        <ol className="relative space-y-16 lg:space-y-24">
          <div
            aria-hidden
            className="absolute left-8 lg:left-10 top-8 bottom-8 w-1 bg-gradient-to-b from-primary via-secondary to-primary-light rounded-full pointer-events-none opacity-40"
          />
          {MODULES.map((m) => (
            <li key={m.slug} className="relative">
              <ModuleStep module={m} />
            </li>
          ))}
        </ol>
      </section>

      {/* ============================================================
          À VENIR — 3 catégories futures, cards ludiques
      ============================================================ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="mb-8 lg:mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.28em] text-text-tertiary uppercase mb-3 bg-bg-secondary px-4 py-1.5 rounded-full">
            <span>🚀</span>
            <span>Bientôt</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-text tracking-tight leading-tight">
            Les prochaines catégories
          </h2>
          <p className="mt-3 text-sm text-text-secondary max-w-xl mx-auto">
            La structure est prête pour recevoir les modules spécialisés à mesure qu&apos;ils sont
            produits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {UPCOMING_CATEGORIES.map((cat, i) => {
            const Icon = cat.Icon;
            return (
              <div
                key={cat.slug}
                className="group rounded-2xl border-2 border-dashed border-border bg-surface/50 p-6 flex flex-col gap-4 hover:border-primary/40 hover:bg-primary-lightest/30 transition-all"
                style={{ animation: `float 6s ease-in-out ${i * 0.5}s infinite` }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${cat.bgClass} group-hover:scale-110 transition-transform`}
                >
                  {cat.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-text tracking-tight leading-tight mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{cat.blurb}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-bg-secondary text-text-tertiary self-start">
                  <Icon className="w-3 h-3" strokeWidth={2.5} />
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
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="w-10 h-10 rounded-2xl bg-primary-lightest flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-primary" strokeWidth={2.5} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-text font-black">Confidentialité.</strong> Le contenu de cette
              section est destiné aux praticiens certifiés Reset. Ne le partagez pas hors équipe, ne
              copiez pas les URLs à l&apos;extérieur : c&apos;est votre savoir-faire métier et notre
              différenciation clinique.
            </p>
          </div>
        </div>
      </section>

      {/* Animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function ModuleStep({ module: m }: { module: Module }) {
  const isAvailable = m.status === 'available';
  const isPrimary = m.accentClass === 'primary';

  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 lg:gap-8">
      {/* Numéro avec animation */}
      <div className="relative">
        <div
          className={`w-16 h-16 lg:w-20 lg:h-20 rounded-3xl flex items-center justify-center shadow-xl relative z-10 rotate-3 hover:rotate-0 transition-transform ${
            isPrimary
              ? 'bg-gradient-to-br from-primary to-primary-dark shadow-primary/30'
              : 'bg-gradient-to-br from-secondary to-primary-light shadow-secondary/30'
          }`}
        >
          <span className="font-black text-white text-2xl lg:text-3xl tabular-nums">
            {String(m.order).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Card contenu */}
      <article
        className={`group relative rounded-3xl bg-surface border-2 transition-all overflow-hidden ${
          isAvailable
            ? 'border-border-light hover:border-primary hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15'
            : 'border-border-light/50 opacity-70'
        }`}
      >
        {/* Barre décorative en tête */}
        <div
          className={`h-2 ${
            isPrimary
              ? 'bg-gradient-to-r from-primary via-secondary to-primary-light'
              : 'bg-gradient-to-r from-secondary via-pink to-primary'
          }`}
        />

        {/* Émoji flottant décoratif */}
        <div
          aria-hidden
          className="absolute -top-2 -right-4 text-8xl opacity-5 pointer-events-none rotate-12 group-hover:opacity-10 transition-opacity"
        >
          {m.emoji}
        </div>

        <div className="relative p-6 lg:p-8 flex flex-col gap-5">
          {/* Header : eyebrow + titre + status */}
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase mb-2 bg-primary-lightest px-3 py-1 rounded-full">
                <span>{m.emoji}</span>
                <span>{m.eyebrow}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-text tracking-tight leading-tight">
                {m.title}
              </h3>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isAvailable ? 'bg-green-100 text-green-700' : 'bg-bg-secondary text-text-tertiary'
              }`}
            >
              {isAvailable && <CheckCircle2 className="w-3 h-3" strokeWidth={3} />}
              {isAvailable ? 'Disponible' : 'Bientôt'}
            </span>
          </header>

          {/* Blurb */}
          <p className="text-sm lg:text-base text-text-secondary leading-relaxed">{m.blurb}</p>

          {/* Chapters card ludique */}
          <div className="bg-gradient-to-br from-primary-lightest/50 to-bg-secondary/30 rounded-2xl p-5 border border-primary-lightest">
            <div className="text-[10px] tracking-wider font-black text-primary uppercase mb-3 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>
                Au sommaire — {m.chapters.length} chapitre{m.chapters.length > 1 ? 's' : ''}
              </span>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {m.chapters.map((c, i) => (
                <li key={c} className="flex items-baseline gap-2.5 text-sm">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-text font-medium">{c}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Meta chips + CTA */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-bg-secondary text-text-secondary">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                {m.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-bg-secondary text-text-secondary">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                {LEVEL_LABEL[m.level]}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-bg-secondary text-text-secondary">
                <Globe className="w-3.5 h-3.5" strokeWidth={2.5} />
                {m.languages.map((l) => LANG_LABEL[l]).join(' · ')}
              </span>
            </div>

            {isAvailable ? (
              <Link
                href={m.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-100 transition-all shadow-lg shadow-primary/25 group/cta"
              >
                Ouvrir le module
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover/cta:translate-x-1"
                  strokeWidth={3}
                />
              </Link>
            ) : (
              <span className="text-sm text-text-tertiary italic font-medium">
                Bientôt disponible
              </span>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

const UPCOMING_CATEGORIES = [
  {
    slug: 'techniques',
    title: 'Techniques par addiction',
    blurb: 'Protocoles tabac, drogues, alcool, sucre, stress — un module par service.',
    Icon: Wrench,
    emoji: '🎯',
    bgClass: 'bg-primary-lightest',
  },
  {
    slug: 'clinical',
    title: 'Clinique & suivi',
    blurb: 'Contre-indications, cas complexes, gestion des rechutes.',
    Icon: Stethoscope,
    emoji: '🩺',
    bgClass: 'bg-pink/10',
  },
  {
    slug: 'business',
    title: 'Cabinet & relation client',
    blurb: 'Accueil, tarifs, communication patient, éthique, marketing.',
    Icon: Users,
    emoji: '💼',
    bgClass: 'bg-secondary/20',
  },
];
