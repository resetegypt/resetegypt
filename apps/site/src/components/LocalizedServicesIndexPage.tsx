// ============================================================================
// LocalizedServicesIndexPage — page index /services avec contenu i18n.
// Utilise le dict existant dans lib/i18n.ts (section services).
// ============================================================================

import Link from 'next/link';
import { Cigarette, Pill, Wine, Candy, Brain, ArrowRight } from 'lucide-react';
import { Section } from './Section';
import { getDict, localizedPath, type Locale } from '../lib/i18n';

export function LocalizedServicesIndexPage({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  const s = dict.services;

  const SERVICES = [
    { key: 'smoking', Icon: Cigarette, title: s.smoking.title, tagline: s.smoking.tagline },
    { key: 'drugs', Icon: Pill, title: s.drugs.title, tagline: s.drugs.tagline },
    { key: 'alcohol', Icon: Wine, title: s.alcohol.title, tagline: s.alcohol.tagline },
    { key: 'sugar', Icon: Candy, title: s.sugar.title, tagline: s.sugar.tagline },
    { key: 'stress', Icon: Brain, title: s.stress.title, tagline: s.stress.tagline },
  ];

  return (
    <Section
      eyebrow={s.eyebrow}
      title={s.title}
      subtitle={s.subtitle}
      align="center"
      className="pt-16 lg:pt-24"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {SERVICES.map((srv) => (
          <Link
            key={srv.key}
            href={localizedPath(`/services/${srv.key}`, locale)}
            className="group relative rounded-2xl bg-surface border border-border-light p-7 transition-all hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-lightest text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <srv.Icon className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold text-text leading-tight">{srv.title}</h3>
            <p className="text-sm text-primary font-semibold mt-1.5">{srv.tagline}</p>
            <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
              {s.ctaMore}
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
