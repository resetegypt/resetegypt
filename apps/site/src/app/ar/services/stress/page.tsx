import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('ar', 'stress');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function StressARPage() {
  return <LocalizedServicePage serviceKey="stress" locale="ar" />;
}
