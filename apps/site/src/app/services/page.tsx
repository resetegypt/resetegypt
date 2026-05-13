import type { Metadata } from 'next';
import Link from 'next/link';
import { Cigarette, Pill, Wine, Candy, Brain, ArrowRight } from 'lucide-react';
import { Section } from '../../components/Section';

export const metadata: Metadata = {
  title: 'Nos services — Sevrage et bien-être au laser',
  description:
    'RESET propose 5 programmes : sevrage tabagique, drogues, alcool, gestion du sucre et stress/anxiété. Tous basés sur l\'auriculothérapie et le laser de photobiomodulation.',
};

const SERVICES = [
  { href: '/services/smoking', Icon: Cigarette, title: 'Sevrage tabagique', tagline: 'Arrêter de fumer en une séance.' },
  { href: '/services/drugs', Icon: Pill, title: 'Sevrage drogues', tagline: 'Briser le cycle de la dépendance.' },
  { href: '/services/alcohol', Icon: Wine, title: 'Sevrage alcool', tagline: 'Reprenez votre vie et votre santé.' },
  { href: '/services/sugar', Icon: Candy, title: 'Gestion du sucre', tagline: 'Stop aux fringales sucrées.' },
  { href: '/services/stress', Icon: Brain, title: 'Stress & anxiété', tagline: 'Apaisez votre système nerveux.' },
];

export default function ServicesPage() {
  return (
    <Section
      eyebrow="Nos programmes"
      title="Cinq services, une seule méthode"
      subtitle="Que vous cherchiez à arrêter une addiction ou à mieux gérer le stress, la méthode RESET est conçue pour répondre à votre objectif spécifique."
      align="center"
      className="pt-16 lg:pt-24"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {SERVICES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative rounded-2xl bg-surface border border-border-light p-7 transition-all hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-lightest text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <s.Icon className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold text-text leading-tight">{s.title}</h3>
            <p className="text-sm text-primary font-semibold mt-1.5">{s.tagline}</p>
            <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
              Découvrir
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
