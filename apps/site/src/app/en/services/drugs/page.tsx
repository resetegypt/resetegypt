import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../../lib/services-content';

const content = getServiceContent('en', 'drugs');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function DrugsENPage() {
  return <LocalizedServicePage serviceKey="drugs" locale="en" />;
}
