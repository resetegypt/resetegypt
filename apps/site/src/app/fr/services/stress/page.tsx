import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('fr', 'stress');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function StressFRPage() {
  return <LocalizedServicePage serviceKey="stress" locale="fr" />;
}
