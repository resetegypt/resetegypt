import type { Metadata } from 'next';
import { LocalizedServicesIndexPage } from '../../../components/LocalizedServicesIndexPage';
import { getDict } from '../../../lib/i18n';

const dict = getDict('en');

export const metadata: Metadata = {
  title: `${dict.services.title} — RESET`,
  description: dict.services.description,
};

export default function ServicesENPage() {
  return <LocalizedServicesIndexPage locale="en" />;
}
