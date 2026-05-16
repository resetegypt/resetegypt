import type { Metadata } from 'next';
import { LocalizedServicesIndexPage } from '../../../components/LocalizedServicesIndexPage';
import { getDict } from '../../../lib/i18n';

const dict = getDict('fr');

export const metadata: Metadata = {
  title: `${dict.services.title} — RESET`,
  description: dict.services.description,
};

export default function ServicesFRPage() {
  return <LocalizedServicesIndexPage locale="fr" />;
}
