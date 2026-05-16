import type { Metadata } from 'next';
import { LocalizedAboutPage } from '../../../components/LocalizedAboutPage';
import { getAboutContent } from '../../../lib/page-content';

const content = getAboutContent('en');

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
};

export default function AboutENPage() {
  return <LocalizedAboutPage locale="en" />;
}
