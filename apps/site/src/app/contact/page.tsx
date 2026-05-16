import type { Metadata } from 'next';
import { LocalizedContactPage } from '../../components/LocalizedContactPage';
import { getContactContent } from '../../lib/page-content';
import { DEFAULT_LOCALE } from '../../lib/i18n';

const content = getContactContent(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function ContactPage() {
  return <LocalizedContactPage locale={DEFAULT_LOCALE} />;
}
