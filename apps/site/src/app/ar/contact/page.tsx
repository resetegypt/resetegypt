import type { Metadata } from 'next';
import { LocalizedContactPage } from '../../../components/LocalizedContactPage';
import { getContactContent } from '../../../lib/page-content';

const content = getContactContent('ar');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function ContactARPage() {
  return <LocalizedContactPage locale="ar" />;
}
