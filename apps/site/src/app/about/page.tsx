import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Microscope, Zap, HeartHandshake, ArrowRight, Sparkles, Award, Shield } from 'lucide-react';
import { Section } from '../../components/Section';

export const metadata: Metadata = {
  title: 'La méthode RESET — Auriculothérapie + laser, un héritage scientifique français',
  description:
    "RESET combine l'auriculothérapie française du Dr. Paul Nogier (années 1950) avec la photobiomodulation laser moderne. Méthode non-invasive, non-médicale et sans médicament.",
};

const PILLARS = [
  {
    Icon: Microscope,
    title: 'Régulation du stress',
    description:
      'La technologie laser basse intensité (photobiomodulation) calme naturellement le système nerveux en stimulant la production d\'endorphines et la régulation du cortisol.',
  },
  {
    Icon: Zap,
    title: 'Stimulation auriculaire',
    description:
      'Cible précise sur les points neuronaux de l\'oreille externe pour neutraliser les envies physiques de nicotine, sucre, alcool ou drogues.',
  },
  {
    Icon: HeartHandshake,
    title: 'Accompagnement personnel',
    description:
      'Un praticien dédié vous guide pendant et après la transition comportementale, avec un suivi disponible sur le long terme.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* === HERO ============================================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-20 -right-20 w-[24rem] h-[24rem] rounded-full bg-secondary/15 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-12 lg:pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-6 shadow-sm">
            <Sparkles className="w-3 h-3" />
            Bienvenue chez RESET
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
            Un héritage scientifique
            <span className="block text-primary">né en France.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Nous proposons une régulation neuronale avancée pour libérer nos clients à travers le
            monde. Le meilleur moment pour RESET, c'est avant le point de rupture.
          </p>
        </div>
      </section>

      {/* === KPI ============================================================= */}
      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-3 gap-8 text-center">
          <KpiBlock value="90%" label="Taux de succès" />
          <KpiBlock value="∞" label="Vies remises sur les rails" />
          <KpiBlock value="★★★★★" label="Excellence du service" />
        </div>
      </section>

      {/* === STORY =========================================================== */}
      <Section
        eyebrow="Notre histoire"
        title="La méthode RESET — un héritage scientifique"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-4 text-base text-text-secondary leading-relaxed">
            <p>
              RESET est un programme spécialisé qui combine la précision de
              l'<strong className="text-text">auriculothérapie française</strong> avec la
              <strong className="text-text"> photobiomodulation laser</strong> avancée.
              Notre approche est entièrement non-invasive, sans médicament, et non-médicale —
              focalisée sur la régulation neuronale naturelle.
            </p>
            <p>
              Dans les <strong className="text-text">années 1950</strong>, le médecin français
              <strong className="text-text"> Dr. Paul Nogier</strong> identifia une cartographie
              précise de correspondances neuronales entre l'oreille externe et le corps humain.
              Cette recherche pionnière a établi la base de l'auriculothérapie moderne, une
              méthode aujourd'hui reconnue mondialement pour son efficacité dans la régulation
              comportementale.
            </p>
            <p>
              Aujourd'hui, le centre <strong className="text-text">RESET Branch Cairo East CMC</strong>{' '}
              applique cette méthode au Caire avec un laser de photobiomodulation certifié et un
              accompagnement humain personnalisé.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-primary-lightest to-white border border-primary-light p-8 flex items-center justify-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 ring-8 ring-white">
                <Image
                  src="/logo.svg"
                  alt="RESET"
                  width={280}
                  height={280}
                  className="block w-56 h-56"
                />
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 lg:-bottom-6 lg:-left-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface shadow-xl border border-border-light text-sm font-semibold">
              <Award className="w-4 h-4 text-primary" />
              Méthode certifiée
            </div>
            <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white shadow-xl text-sm font-semibold">
              <Shield className="w-4 h-4" />
              100% non-invasif
            </div>
          </div>
        </div>
      </Section>

      {/* === 3 PILLARS ======================================================= */}
      <Section
        eyebrow="Les 3 piliers de votre succès"
        title="Comment ça marche concrètement"
        subtitle="Trois composants qui agissent ensemble pour rétablir l'équilibre neuronal."
        align="center"
        className="bg-bg-secondary/40"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {PILLARS.map((p, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-surface border border-border-light p-7 hover:shadow-lg hover:border-primary/40 transition-all"
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
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* === KEYWORDS BAND =================================================== */}
      <section className="bg-primary text-white overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-5">
          {[...Array(2)].map((_, copy) => (
            <div key={copy} className="flex items-center gap-10 px-6 text-sm font-bold tracking-[0.32em]">
              {['SANS DOULEUR', 'UNE SÉANCE', '100% NATUREL', 'PROUVÉ SCIENTIFIQUEMENT', 'ZÉRO ENVIES', 'RÉSULTATS RAPIDES', 'RESET NEURONAL', 'NON-INVASIF'].map((w, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-10">
                  {w}
                  <Sparkles className="w-4 h-4 text-secondary" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* === CTA ============================================================= */}
      <section className="py-20 lg:py-28 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
            Prêt(e) à <span className="text-primary">commencer</span> ?
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            Choisissez votre service, votre créneau, c'est tout.
          </p>
          <Link
            href="https://book.reset-egypt.com"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 text-base font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/25"
          >
            Réserver ma séance
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function KpiBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-none tabular-nums">
        {value}
      </div>
      <div className="text-[10px] lg:text-xs tracking-[0.28em] font-bold text-primary-light/80 uppercase mt-3">
        {label}
      </div>
    </div>
  );
}
