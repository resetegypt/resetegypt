import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('en', 'stress');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function StressENPage() {
  return <LocalizedServicePage serviceKey="stress" locale="en" />;
}
