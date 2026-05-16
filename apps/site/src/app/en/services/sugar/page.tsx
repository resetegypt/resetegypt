import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('en', 'sugar');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function SugarENPage() {
  return <LocalizedServicePage serviceKey="sugar" locale="en" />;
}
