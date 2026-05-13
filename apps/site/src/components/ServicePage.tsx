import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, type LucideIcon } from 'lucide-react';
import { Section } from './Section';

export interface ServicePageProps {
  Icon: LucideIcon;
  eyebrow: string;
  title: string;
  tagline: string;
  intro: string;
  benefits: Array<{ title: string; description: string }>;
  process?: string[];
  cta?: string;
  /** Photo principale du service (chemin /photos/...). */
  heroPhoto: string;
}

/**
 * Layout générique pour les 5 pages services (Tabac, Drogues, Alcool, Sucre, Stress).
 * Variantes seulement par le contenu — l'identité visuelle reste primary uniforme
 * pour cohérence brand.
 */
export function ServicePage(props: ServicePageProps) {
  const { Icon, eyebrow, title, tagline, intro, benefits, process, cta, heroPhoto } = props;
  return (
    <>
      {/* HERO avec photo en split-screen */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 -right-20 w-[24rem] h-[24rem] rounded-full bg-secondary/12 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-20 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-start order-2 lg:order-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-5 shadow-xl shadow-primary/30">
                <Icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-border-light text-xs font-semibold text-primary mb-4 shadow-sm">
                <Sparkles className="w-3 h-3" />
                {eyebrow}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text tracking-tight leading-[1.05]">
                {title}
              </h1>
              <p className="mt-3 text-lg sm:text-xl text-primary font-semibold">{tagline}</p>
              <p className="mt-5 text-base text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
                {intro}
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center justify-center lg:justify-start">
                <Link
                  href="https://book.reset-egypt.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Réserver ma séance
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-text hover:text-primary transition-colors"
                >
                  Autres services
                </Link>
              </div>
            </div>

            {/* Photo */}
            <div className="relative order-1 lg:order-2 max-w-md mx-auto lg:max-w-none">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-2xl shadow-primary/20">
                <Image
                  src={heroPhoto}
                  alt={title}
                  width={1200}
                  height={900}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <Section
        eyebrow="Pourquoi ça marche"
        title="Les bénéfices concrets"
        subtitle="Ce que vous gagnez avec la méthode RESET pour ce programme."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-surface border border-border-light p-6 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-primary-lightest text-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text leading-tight">{b.title}</h3>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PROCESS (optionnel) */}
      {process && process.length > 0 && (
        <Section
          eyebrow="Déroulement de la séance"
          title="À quoi vous attendre"
          className="bg-bg-secondary/40"
        >
          <ol className="max-w-2xl mx-auto space-y-3">
            {process.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-4 rounded-xl bg-surface border border-border-light p-4"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-text leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* CTA */}
      <section className="py-20 lg:py-28 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text tracking-tight leading-tight">
            {cta ?? 'Prêt(e) à reprendre le contrôle ?'}
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            Réservez votre première séance — sans engagement, sans médicament.
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
