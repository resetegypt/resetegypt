import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('fr', 'drugs');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function DrugsFRPage() {
  return <LocalizedServicePage serviceKey="drugs" locale="fr" />;
}
