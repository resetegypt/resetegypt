import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('ar', 'alcohol');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function AlcoholARPage() {
  return <LocalizedServicePage serviceKey="alcohol" locale="ar" />;
}
