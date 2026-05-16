import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('ar', 'drugs');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function DrugsARPage() {
  return <LocalizedServicePage serviceKey="drugs" locale="ar" />;
}
