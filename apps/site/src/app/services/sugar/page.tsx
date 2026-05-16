import type { Metadata } from 'next';
import { LocalizedServicePage } from '../../../components/LocalizedServicePage';
import { getServiceContent } from '../../../lib/services-content';
import { DEFAULT_LOCALE } from '../../../lib/i18n';

const content = getServiceContent(DEFAULT_LOCALE, 'sugar');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function SugarPage() {
  return <LocalizedServicePage serviceKey="sugar" locale={DEFAULT_LOCALE} />;
}
