import type { Metadata } from 'next';
import { LocalizedAboutPage } from '../../../components/LocalizedAboutPage';
import { getAboutContent } from '../../../lib/page-content';

const content = getAboutContent('ar');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function AboutARPage() {
  return <LocalizedAboutPage locale="ar" />;
}
