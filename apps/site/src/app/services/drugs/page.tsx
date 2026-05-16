import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../lib/services-content';
import { DEFAULT_LOCALE } from '../../../lib/i18n';

const content = getServiceContent(DEFAULT_LOCALE, 'drugs');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function DrugsPage() {
  return <LocalizedServicePage serviceKey="drugs" locale={DEFAULT_LOCALE} />;
}
