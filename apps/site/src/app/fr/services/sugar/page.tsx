import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('fr', 'sugar');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function SugarFRPage() {
  return <LocalizedServicePage serviceKey="sugar" locale="fr" />;
}
