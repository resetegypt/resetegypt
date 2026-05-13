import Image from 'next/image';
import Link from 'next/link';
import {
  Cigarette,
  Pill,
  Wine,
  Candy,
  Brain,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  HeartHandshake,
  Microscope,
  Zap,
  Award,
  Calendar,
  Phone,
} from 'lucide-react';
import { Section } from '../components/Section';

// ============================================================================
// HOMEPAGE
// ============================================================================
// Structure inspirée des codes Linear / Stripe / Mercury :
// 1. Hero plein écran avec logo + tagline + CTA
// 2. Bandeau confiance défilant
// 3. 5 services en grid
// 4. La méthode (3 piliers)
// 5. Process step-by-step
// 6. Témoignages
// 7. FAQ
// 8. CTA final + visite du centre

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandRibbon />
      <ServicesSection />
      <RegisteredSection />
      <VisitCenterSection />
      <MethodSection />
      <ProcessSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}

// ============================================================================
// Registered & Regulated Center — section symétrique avec 2 badges officiels
// ============================================================================

function RegisteredSection() {
  return (
    <Section
      eyebrow="Centre agréé"
      title="Un centre enregistré et régulé"
      subtitle="Notre dispositif laser est certifié et utilisé en pleine conformité avec les normes en vigueur. Les séances sont conduites dans un environnement contrôlé par un praticien certifié."
      align="center"
    >
      {/* Grid 2 colonnes parfaitement symétrique — même taille, même hauteur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-3xl mx-auto">
        <BadgeCard
          src="/photos/badge-moh.png"
          alt="Ministry of Health Registration"
          title="Ministry of Health"
          subtitle="Enregistrement en cours"
        />
        <BadgeCard
          src="/photos/badge-eda.png"
          alt="EDA — Egyptian Drug Authority"
          title="EDA · Egyptian Drug Authority"
          subtitle="Enregistrement en cours"
        />
      </div>
    </Section>
  );
}

function BadgeCard({
  src,
  alt,
  title,
  subtitle,
}: {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-6 lg:p-8 flex flex-col items-center text-center shadow-sm">
      <div className="aspect-square w-32 sm:w-36 lg:w-40 flex items-center justify-center mb-5">
        <Image
          src={src}
          alt={alt}
          width={300}
          height={300}
          className="object-contain max-w-full max-h-full"
        />
      </div>
      <h3 className="text-base font-bold text-text leading-tight">{title}</h3>
      <p className="text-xs text-primary font-semibold mt-1.5 tracking-wider uppercase">
        {subtitle}
      </p>
    </div>
  );
}

// ============================================================================
// Visit Our Center (recrée la section WP avec IMG_8661 en bg + 2 photos)
// ============================================================================

function VisitCenterSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 my-16 lg:my-24">
      <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative">
        {/* BG */}
        <Image
          src="/photos/center-bg.jpeg"
          alt=""
          fill
          className="object-cover -z-10"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/85 via-primary/75 to-primary/30 -z-10" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 p-8 sm:p-12 lg:p-16">
          {/* Texte */}
          <div>
            <div className="text-[11px] tracking-[0.32em] font-bold text-secondary uppercase mb-4">
              Visitez RESET
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Centre RESET<br />Branch Cairo East CMC
            </h2>
            <p className="mt-5 text-white/85 leading-relaxed max-w-md">
              Technologie certifiée, accompagnement expert. Nous sommes dédiés à vous offrir la
              percée dont vous avez besoin pour reprendre le contrôle de votre vie.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/85">
              <div className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">📍</span>
                <span>N Teseen, New Cairo 1<br />Le Caire 11835, Égypte</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">🕐</span>
                <span>11h00 – 22h00 · 7 jours sur 7</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">📞</span>
                <span className="font-mono">+811.2311.785 · +811.2311.657</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="https://book.reset-egypt.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] bg-secondary text-primary rounded-md hover:bg-white transition-all"
              >
                Réserver une séance
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white border border-white/40 rounded-md hover:bg-white/10 transition-all"
              >
                Nous contacter
              </Link>
            </div>
          </div>

          {/* Photo unique du centre — plus impactante qu'un duo asymétrique */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden ring-2 ring-white/30 shadow-2xl">
              <Image
                src="/photos/hero-center.png"
                alt="Centre RESET — Branch Cairo East CMC"
                width={600}
                height={750}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-primary shadow-xl text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              Ouvert 7/7
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 1. HERO
// ============================================================================

function Hero() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      {/* Container card géant arrondi (recrée le hero de l'ancien WP) */}
      <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden">
        {/* Background image */}
        <Image
          src="/photos/hero-bg.png"
          alt=""
          fill
          priority
          quality={85}
          className="object-cover object-center -z-10"
          sizes="100vw"
        />
        {/* Overlay gradient primary → transparent (recrée l'opacity 0.73 du WP) */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/60 to-primary/30 -z-10" />
        {/* Légère vignette latérale pour ancrer le texte */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/40 to-transparent -z-10" />

        <div className="relative px-6 sm:px-10 lg:px-16 py-16 sm:py-20 lg:py-28 min-h-[560px] lg:min-h-[640px] flex flex-col justify-center">
          {/* Eyebrow */}
          <div className="text-[11px] sm:text-xs tracking-[0.32em] font-bold text-secondary uppercase mb-5">
            BRANCH CAIRO EAST CMC
          </div>

          {/* Titre principal — grand, blanc, à la WP */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[80px] font-extrabold text-white tracking-tight leading-[1.05] max-w-3xl">
            Arrêtez de fumer.
            <span className="block">Autrement.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
            Une méthode non-invasive combinant l'<strong className="text-white">auriculothérapie française</strong>{' '}
            et une technologie laser avancée pour neutraliser naturellement les envies de nicotine et le stress —
            <strong className="text-white"> sans douleur ni médicament</strong>.
          </p>

          {/* Bullet list inline 5 services */}
          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 max-w-2xl text-sm sm:text-[15px] text-white/95">
            {[
              'Tabac',
              'Drogues',
              'Sucre',
              'Alcool',
              'Stress & anxiété',
            ].map((label) => (
              <li key={label} className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" strokeWidth={2.25} />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] bg-secondary text-primary rounded-md hover:bg-white transition-all"
            >
              Nos services
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://book.reset-egypt.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] bg-primary-dark text-white border border-white/20 rounded-md hover:bg-primary transition-all"
            >
              Réserver une séance
              <Calendar className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Logo flottant discret en haut à droite */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/40 hidden sm:block">
          <Image
            src="/logo.svg"
            alt="RESET"
            width={64}
            height={64}
            className="block w-14 h-14 lg:w-16 lg:h-16"
          />
        </div>
      </div>

      {/* Bandeau de réassurance sous le hero */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: '90%', label: 'Taux de succès' },
          { value: '1', label: 'Séance suffit (souvent)' },
          { value: '0', label: 'Médicament' },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-surface border border-border-light p-4 sm:p-5 text-center"
          >
            <div className="text-2xl sm:text-4xl font-extrabold text-primary tracking-tight tabular-nums">
              {m.value}
            </div>
            <div className="text-[10px] sm:text-xs text-text-secondary mt-1 tracking-wide">
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KeyMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-text-secondary mt-0.5">{label}</div>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-10 bg-border-light" />;
}

function FloatingBadge({
  className,
  Icon,
  label,
  tone,
}: {
  className: string;
  Icon: typeof Award;
  label: string;
  tone: 'primary' | 'success';
}) {
  const tones = {
    primary: 'bg-primary text-white',
    success: 'bg-primary-dark text-white',
  };
  return (
    <div
      className={`absolute ${className} inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-xl backdrop-blur-sm ${tones[tone]} hidden sm:inline-flex`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

// ============================================================================
// 2. BRAND RIBBON — bandeau défilant
// ============================================================================

const RIBBON_ITEMS = [
  'PAINLESS',
  'ONE SESSION',
  '100% NATURAL',
  'SCIENCE-BACKED',
  'ZERO CRAVINGS',
  'FAST RESULTS',
  'NEURAL RESET',
  'NON-INVASIVE',
];

function BrandRibbon() {
  return (
    <div className="bg-primary text-white overflow-hidden border-y border-primary-dark">
      <div className="flex animate-marquee whitespace-nowrap py-4">
        {[...RIBBON_ITEMS, ...RIBBON_ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-12 px-6 text-sm font-bold tracking-[0.32em]">
            <span>{item}</span>
            <Sparkles className="w-4 h-4 text-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. SERVICES
// ============================================================================

const SERVICES = [
  {
    href: '/services/smoking',
    Icon: Cigarette,
    title: 'Sevrage tabagique',
    description: 'Arrêter de fumer en une séance.',
    photo: '/photos/service-smoking.webp',
  },
  {
    href: '/services/drugs',
    Icon: Pill,
    title: 'Sevrage drogues',
    description: 'Briser le cycle de la dépendance chimique.',
    photo: '/photos/service-drugs.jpeg',
  },
  {
    href: '/services/alcohol',
    Icon: Wine,
    title: 'Sevrage alcool',
    description: 'Reprenez le contrôle naturellement.',
    photo: '/photos/service-alcohol.jpeg',
  },
  {
    href: '/services/sugar',
    Icon: Candy,
    title: 'Gestion du sucre',
    description: 'Stop aux fringales sucrées.',
    photo: '/photos/service-sugar.jpeg',
  },
  {
    href: '/services/stress',
    Icon: Brain,
    title: 'Stress & anxiété',
    description: 'Apaisez votre système nerveux.',
    photo: '/photos/service-stress.jpeg',
  },
];

function ServicesSection() {
  return (
    <Section
      eyebrow="Nos services"
      title="Une méthode, plusieurs libérations"
      subtitle="Chaque programme RESET cible une addiction ou un déséquilibre spécifique avec un protocole personnalisé."
      align="center"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {SERVICES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative rounded-2xl bg-surface border border-border-light overflow-hidden transition-all hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Photo en haut */}
            <div className="relative aspect-[5/3] overflow-hidden bg-bg-secondary">
              <Image
                src={s.photo}
                alt={s.title}
                width={808}
                height={485}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              {/* Icône badge en haut à gauche */}
              <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-sm text-primary flex items-center justify-center shadow-md">
                <s.Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
            <div className="p-5 lg:p-6">
              <h3 className="text-lg font-bold text-text leading-tight">{s.title}</h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {s.description}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                En savoir plus
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
        {/* Carte CTA */}
        <Link
          href="https://book.reset-egypt.com"
          className="group relative rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-secondary/20 blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col h-full p-6 lg:p-8 min-h-[260px]">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm text-white flex items-center justify-center mb-5">
              <Calendar className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-2xl font-bold leading-tight">
              Prêt(e) à commencer&nbsp;?
            </h3>
            <p className="text-sm text-white/80 mt-2 leading-relaxed">
              Réservez votre 1ère consultation en moins de 2 minutes.
            </p>
            <div className="mt-auto inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all pt-5">
              Réserver maintenant
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      </div>
    </Section>
  );
}

// ============================================================================
// 4. METHOD — 3 piliers
// ============================================================================

const PILLARS = [
  {
    Icon: Microscope,
    title: 'Régulation du stress',
    description:
      'Laser de photobiomodulation basse intensité pour apaiser naturellement le système nerveux.',
  },
  {
    Icon: Zap,
    title: 'Stimulation auriculaire',
    description:
      'Cible précise sur les points neurologiques qui neutralisent les envies physiques.',
  },
  {
    Icon: HeartHandshake,
    title: 'Accompagnement personnel',
    description:
      'Un praticien dédié vous guide pendant et après la transition comportementale.',
  },
];

function MethodSection() {
  return (
    <Section
      eyebrow="La méthode RESET"
      title="Un héritage scientifique français"
      subtitle="Dans les années 1950, le Dr. Paul Nogier identifia une cartographie précise de correspondances neurales entre l'oreille externe et le corps. Cette découverte fonde l'auriculothérapie moderne — la base scientifique de notre approche."
    >
      {/* Visuel méthode en grand — portrait du Dr. Paul Nogier (fondateur) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-center mb-12">
        <div className="lg:col-span-2 relative">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-xl shadow-primary/15 bg-bg-secondary">
            <Image
              src="/photos/dr-nogier.webp"
              alt="Dr. Paul Nogier — fondateur de l'auriculothérapie moderne"
              width={600}
              height={800}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="absolute -bottom-5 -right-5 lg:-bottom-6 lg:-right-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white shadow-xl text-sm font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Dr. Paul Nogier · 1950
          </div>
        </div>
        <div className="lg:col-span-3 space-y-4 text-base text-text-secondary leading-relaxed">
          <p>
            RESET combine la <strong className="text-text">précision de l'auriculothérapie française</strong>{' '}
            avec la <strong className="text-text">photobiomodulation laser</strong> avancée. Notre approche est
            entièrement non-invasive, sans médicament, et non-médicale.
          </p>
          <p>
            Dans les années 1950, le médecin français <strong className="text-text">Dr. Paul Nogier</strong>{' '}
            établit la base scientifique de l'auriculothérapie moderne en cartographiant les
            correspondances neuronales de l'oreille externe avec le corps humain. Une méthode
            reconnue mondialement pour son efficacité dans la régulation comportementale.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            En apprendre plus sur la méthode
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3 piliers avec GIFs animés */}
      <div className="text-center mb-8">
        <div className="text-[10px] tracking-[0.32em] font-bold text-primary uppercase">
          Les 3 piliers
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mt-2">
          Comment ça marche concrètement
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {PILLARS.map((p, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light p-7 lg:p-8 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary-lightest text-primary flex items-center justify-center">
                <p.Icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <span className="text-5xl font-extrabold text-primary/15 tabular-nums leading-none">
                0{idx + 1}
              </span>
            </div>
            <h3 className="text-lg font-bold text-text leading-tight">{p.title}</h3>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-6 lg:p-8">
        <div className="flex items-start gap-4 flex-col sm:flex-row">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-text">
              Notre approche est entièrement non-invasive, sans médicament et non-médicale.
            </h4>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              Aucune douleur, aucune piqûre, aucune chaleur destructrice. Le laser froid de
              photobiomodulation est une technologie certifiée, sûre et sans effet secondaire connu.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// 5. PROCESS — étape par étape
// ============================================================================

const PROCESS = [
  {
    Icon: HeartHandshake,
    title: 'Consultation initiale',
    description: "Un échange personnalisé pour comprendre votre profil et votre motivation.",
    duration: '15 min',
  },
  {
    Icon: Zap,
    title: 'Stimulation laser',
    description: 'Application précise sur les points auriculaires.',
    duration: '20–30 min',
  },
  {
    Icon: CheckCircle2,
    title: 'Recommandations',
    description: 'Conseils simples et actionnables à suivre après votre séance.',
    duration: '5 min',
  },
];

function ProcessSection() {
  return (
    <Section
      eyebrow="Votre séance étape par étape"
      title="Une heure pour changer de vie"
      subtitle="Le déroulement précis d'une consultation au centre RESET. Simple, rapide, transparent."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {PROCESS.map((p, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light p-7 lg:p-8 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
                <p.Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <span className="text-5xl font-extrabold text-primary/15 tabular-nums leading-none">
                0{idx + 1}
              </span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.28em] text-primary uppercase mb-1.5">
              Étape 0{idx + 1}
            </div>
            <h3 className="text-base font-bold text-text leading-tight">{p.title}</h3>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">{p.description}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-text-tertiary border border-border-light px-2.5 py-1 rounded-md">
              <Sparkles className="w-3 h-3 text-primary" />
              {p.duration}
            </div>
          </div>
        ))}
      </div>

      {/* 4e étape — suivi long terme */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-6 lg:p-7 flex items-start gap-4 flex-col sm:flex-row">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.28em] text-primary uppercase mb-1">
            Étape 04 · Suivi long terme
          </div>
          <h3 className="text-base font-bold text-text">
            Nous restons disponibles pour assurer votre succès durable.
          </h3>
          <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
            Un suivi régulier pour consolider les résultats et prévenir la rechute. WhatsApp,
            téléphone, ou nouvelle séance — comme vous préférez.
          </p>
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// 6. TESTIMONIALS
// ============================================================================

const TESTIMONIALS = [
  {
    name: 'Sarah J.',
    role: 'Cliente — anxiété',
    rating: 5,
    quote:
      "Je suis venue chez RESET pour gérer mon anxiété. La séance de photobiomodulation était incroyablement relaxante — sans douleur et silencieuse. Elle m'a aidée à retrouver mon focus et a significativement amélioré la qualité de mon sommeil.",
  },
  {
    name: 'Ahmed M.',
    role: 'Client — sevrage tabac',
    rating: 5,
    quote:
      "J'étais sceptique au début, mais après une seule séance chez RESET, mon envie de cigarette a littéralement disparu. Même dans les bouchons stressants du Caire, je n'ai pas ressenti le besoin de fumer. 3 mois après, je n'ai jamais été mieux.",
  },
  {
    name: 'Khaled S.',
    role: 'Client — sevrage tabac',
    rating: 5,
    quote:
      "J'avais tout essayé — patchs, gommes, volonté pure — rien ne fonctionnait jusqu'à RESET. L'équipe est professionnelle et le centre top. Je suis sorti de ma séance avec le sentiment d'être un non-fumeur. Aucun symptôme de sevrage, aucune irritabilité.",
  },
];

function TestimonialsSection() {
  return (
    <Section
      eyebrow="Témoignages"
      title="Ils ont repris le contrôle"
      subtitle="Des clients réels qui ont retrouvé leur liberté grâce à la méthode RESET."
      className="bg-bg-secondary/40"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <figure
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light p-7 hover:shadow-lg transition-shadow"
          >
            {/* Étoiles de notation en haut */}
            <div className="flex items-center gap-0.5 mb-4">
              {Array.from({ length: t.rating }, (_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-amber-400 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-sm text-text-secondary leading-relaxed">
              {t.quote}
            </blockquote>
            <figcaption className="mt-5 pt-5 border-t border-border-light flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md shadow-primary/15">
                {t.name.split(' ').map((p) => p.charAt(0)).join('').toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-text">{t.name}</div>
                <div className="text-xs text-text-tertiary">{t.role}</div>
              </div>
              {/* Badge "Vérifié" */}
              <div className="ms-auto inline-flex items-center gap-1 text-[10px] font-semibold text-primary-dark bg-primary-lightest px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Vérifié
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// 7. FAQ
// ============================================================================

const FAQ = [
  {
    q: 'Le traitement est-il douloureux ?',
    a: 'Aucunement. Notre laser de photobiomodulation est un "laser froid" — vous ne ressentirez aucune douleur, aucune chaleur, aucune piqûre. La plupart de nos clients décrivent la séance comme profondément relaxante.',
  },
  {
    q: 'Est-ce une procédure médicale ?',
    a: 'Non. RESET est un centre de bien-être et d\'accompagnement au sevrage. Nos services sont non-médicaux : nous ne posons pas de diagnostic, ne prescrivons pas de médicaments et n\'interférons pas avec vos traitements en cours.',
  },
  {
    q: 'Les résultats sont-ils garantis ?',
    a: "La méthode RESET a un taux de succès très élevé, mais aucune méthode de sevrage ne peut offrir 100% de garantie — la motivation personnelle reste essentielle. Nous garantissons en revanche une technologie de pointe et un accompagnement rigoureux.",
  },
  {
    q: 'Combien de séances sont nécessaires ?',
    a: "Généralement une seule. Pour le sevrage tabagique, une séance primaire suffit dans la majorité des cas. Selon votre profil, une séance de suivi peut être planifiée pour consolider les résultats et prévenir la rechute.",
  },
  {
    q: 'Y a-t-il des effets secondaires ?',
    a: "Aucun. La photobiomodulation laser est une technologie sûre, sans effet secondaire connu. Contrairement aux substituts nicotiniques, elle ne provoque ni nausées, ni irritations cutanées, ni troubles du sommeil.",
  },
  {
    q: 'Le laser est-il certifié ?',
    a: 'Oui. La sécurité est notre priorité absolue. Notre dispositif laser est entièrement certifié et conforme aux normes européennes et internationales en vigueur, opéré par des praticiens formés en environnement contrôlé.',
  },
];

function FaqSection() {
  return (
    <Section
      eyebrow="Une question ?"
      title="Foire aux questions"
      subtitle="Tout ce que vous devez savoir avant votre première séance."
    >
      <div className="max-w-3xl mx-auto">
        <div className="space-y-3">
          {FAQ.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl bg-surface border border-border-light overflow-hidden hover:border-primary/40 transition-colors"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                <h3 className="text-base font-semibold text-text leading-tight pr-4">
                  {item.q}
                </h3>
                <span className="w-8 h-8 rounded-full bg-primary-lightest text-primary flex items-center justify-center text-lg font-bold transition-transform group-open:rotate-45 shrink-0">
                  +
                </span>
              </summary>
              <div className="px-6 pb-6 text-sm text-text-secondary leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// 8. FINAL CTA
// ============================================================================

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Premier RDV disponible cette semaine
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
          Votre liberté commence
          <span className="block text-primary">aujourd'hui.</span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Réservez votre première consultation en moins de 2 minutes. Sans engagement, sans
          médicament, sans douleur.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center justify-center">
          <Link
            href="https://book.reset-egypt.com"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 hover:-translate-y-0.5"
          >
            Réserver ma séance
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/201234567890"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-text hover:text-primary border border-border-light rounded-xl hover:border-primary/40 transition-all"
          >
            <Phone className="w-4 h-4" />
            Nous joindre
          </a>
        </div>

        <div className="mt-10 text-xs text-text-tertiary">
          📍 N Teseen, New Cairo 1 · Le Caire · Ouvert 11h-22h tous les jours
        </div>
      </div>
    </section>
  );
}
