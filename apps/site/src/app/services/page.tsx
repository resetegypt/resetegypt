import type { Metadata } from 'next';
import { LocalizedServicesIndexPage } from '../../components/LocalizedServicesIndexPage';
import { DEFAULT_LOCALE, getDict } from '../../lib/i18n';

const dict = getDict(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: `${dict.services.title} — RESET`,
  description: dict.services.description,
};

export default function ServicesPage() {
  return <LocalizedServicesIndexPage locale={DEFAULT_LOCALE} />;
}
