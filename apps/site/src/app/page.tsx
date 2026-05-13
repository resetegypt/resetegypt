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
      <MethodSection />
      <ProcessSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}

// ============================================================================
// 1. HERO
// ============================================================================

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Halos en arrière-plan pour la profondeur */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-20 -right-20 w-[28rem] h-[28rem] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full bg-danger/10 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Texte */}
          <div className="text-center lg:text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Méthode française · Cairo East CMC
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
              Reprenez le contrôle.<br />
              <span className="text-primary">Sans médicaments.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
              Auriculothérapie française + laser de photobiomodulation : une méthode
              non-invasive et naturelle pour neutraliser le tabac, les addictions et le stress
              — souvent en <strong className="text-text">une seule séance</strong>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center justify-center lg:justify-start">
              <Link
                href="https://book.reset-egypt.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
              >
                Réserver ma séance
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-text hover:text-primary transition-colors"
              >
                Découvrir la méthode
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start flex-wrap text-xs text-text-secondary">
              <KeyMetric value="90%" label="Taux de succès" />
              <Divider />
              <KeyMetric value="1" label="Séance suffit (souvent)" />
              <Divider />
              <KeyMetric value="0" label="Médicament" />
            </div>
          </div>

          {/* Visual : photo réelle du centre + badges flottants */}
          <div className="relative max-w-md mx-auto lg:max-w-none">
            <div className="relative aspect-[4/5]">
              {/* Photo principale dans une carte avec ring */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-primary/25 ring-1 ring-black/5">
                <Image
                  src="/photos/hero-center.png"
                  alt="Centre RESET — Branch Cairo East CMC"
                  width={800}
                  height={1000}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>

              {/* Logo flottant en coin (signature brand discrète) */}
              <div className="absolute -bottom-5 -left-5 lg:-bottom-7 lg:-left-7 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white">
                <Image
                  src="/logo.svg"
                  alt="RESET"
                  width={72}
                  height={72}
                  className="block w-16 h-16 lg:w-20 lg:h-20"
                />
              </div>

              {/* Badges flottants */}
              <FloatingBadge
                className="-top-3 -right-2 lg:-top-3 lg:-right-3"
                Icon={Award}
                label="Méthode certifiée"
                tone="primary"
              />
              <FloatingBadge
                className="bottom-10 -right-3 lg:bottom-12 lg:-right-6"
                Icon={Shield}
                label="100% non-invasif"
                tone="success"
              />
            </div>
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {PILLARS.map((p, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-surface border border-border-light p-7 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-extrabold text-primary/30 tabular-nums leading-none">
                0{idx + 1}
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary-lightest text-primary flex items-center justify-center">
                <p.Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
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
    title: 'Consultation initiale',
    description: "Un échange personnalisé pour comprendre votre profil et votre motivation.",
    duration: '15 min',
    gif: '/photos/process-1.gif',
  },
  {
    title: 'Stimulation laser',
    description: 'Application précise sur les points auriculaires.',
    duration: '20–30 min',
    gif: '/photos/process-2.gif',
  },
  {
    title: 'Recommandations',
    description: 'Conseils simples et actionnables à suivre après votre séance.',
    duration: '5 min',
    gif: '/photos/process-3.gif',
  },
];

function ProcessSection() {
  return (
    <Section
      eyebrow="Votre séance étape par étape"
      title="Une heure pour changer de vie"
      subtitle="Le déroulement précis d'une consultation au centre RESET. Simple, rapide, transparent."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {PROCESS.map((p, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl bg-surface border border-border-light overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
          >
            {/* GIF animé du process */}
            <div className="relative aspect-video overflow-hidden bg-bg-secondary">
              <Image
                src={p.gif}
                alt={p.title}
                width={640}
                height={360}
                unoptimized
                className="object-cover w-full h-full"
              />
              <div className="absolute top-3 left-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-bold shadow-lg">
                {idx + 1}
              </div>
            </div>
            <div className="p-5 lg:p-6">
              <div className="text-[10px] font-bold tracking-[0.28em] text-primary uppercase mb-1.5">
                Étape 0{idx + 1}
              </div>
              <h3 className="text-base font-bold text-text leading-tight">{p.title}</h3>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">{p.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-mono tabular-nums text-text-tertiary border border-border-light px-2 py-1 rounded-md">
                ⏱ {p.duration}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4e étape — suivi (sans gif) */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-6 lg:p-7 flex items-start gap-4 flex-col sm:flex-row">
        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
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
    quote:
      "Je suis venue chez RESET pour gérer mon anxiété. La séance de photobiomodulation était incroyablement relaxante — sans douleur et silencieuse. Elle m'a aidée à retrouver mon focus et a significativement amélioré la qualité de mon sommeil.",
  },
  {
    name: 'Ahmed M.',
    role: 'Client — sevrage tabac',
    quote:
      "J'étais sceptique au début, mais après une seule séance chez RESET, mon envie de cigarette a littéralement disparu. Même dans les bouchons stressants du Caire, je n'ai pas ressenti le besoin de fumer. 3 mois après, je n'ai jamais été mieux.",
  },
  {
    name: 'Khaled S.',
    role: 'Client — sevrage tabac',
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
            <div className="text-5xl text-primary/15 font-serif leading-none mb-2 absolute top-4 right-5">
              "
            </div>
            <blockquote className="text-sm text-text-secondary leading-relaxed relative">
              {t.quote}
            </blockquote>
            <figcaption className="mt-5 pt-5 border-t border-border-light flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shrink-0">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-text">{t.name}</div>
                <div className="text-xs text-text-tertiary">{t.role}</div>
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
