import type { Metadata } from 'next';
import { LocalizedContactPage } from '../../../components/LocalizedContactPage';
import { getContactContent } from '../../../lib/page-content';

const content = getContactContent('fr');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function ContactFRPage() {
  return <LocalizedContactPage locale="fr" />;
}
