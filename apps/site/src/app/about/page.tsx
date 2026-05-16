import type { Metadata } from 'next';
import { LocalizedAboutPage } from '../../components/LocalizedAboutPage';
import { getAboutContent } from '../../lib/page-content';
import { DEFAULT_LOCALE } from '../../lib/i18n';

const content = getAboutContent(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function AboutPage() {
  return <LocalizedAboutPage locale={DEFAULT_LOCALE} />;
}
