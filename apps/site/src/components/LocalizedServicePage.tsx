// ============================================================================
// LocalizedServicePage — wrapper qui résout l'icône + la photo + le contenu
// d'un service depuis sa clé et sa locale, puis rend <ServicePage>.
//
// Utilisé par toutes les pages /services/{key} et /{locale}/services/{key}.
// ============================================================================

import { Cigarette, Pill, Wine, Candy, Brain, type LucideIcon } from 'lucide-react';
import type { Locale } from '../lib/i18n';
import { ServicePage } from './ServicePage';
import { getServiceContent } from '../lib/services-content';

type ServiceKey = 'smoking' | 'drugs' | 'alcohol' | 'sugar' | 'stress';

const ICONS: Record<ServiceKey, LucideIcon> = {
  smoking: Cigarette,
  drugs: Pill,
  alcohol: Wine,
  sugar: Candy,
  stress: Brain,
};

const PHOTOS: Record<ServiceKey, string> = {
  smoking: '/photos/service-smoking.jpeg',
  drugs: '/photos/service-drugs.jpeg',
  alcohol: '/photos/service-alcohol.jpeg',
  sugar: '/photos/service-sugar.jpeg',
  stress: '/photos/service-stress.jpeg',
};

export function LocalizedServicePage({ serviceKey, locale }: { serviceKey: ServiceKey; locale: Locale }) {
  const content = getServiceContent(locale, serviceKey);
  return (
    <ServicePage
      heroPhoto={PHOTOS[serviceKey]}
      Icon={ICONS[serviceKey]}
      eyebrow={content.eyebrow}
      title={content.title}
      tagline={content.tagline}
      intro={content.intro}
      benefits={content.benefits}
      process={content.process}
      cta={content.cta}
    />
  );
}

/** Export pour le pageMetadata helper */
export type { ServiceKey };
