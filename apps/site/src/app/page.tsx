import { HomeContent } from '../components/HomeContent';
import { getDict } from '../lib/i18n';

// Racine = arabe par défaut (langue principale du site)
export default function HomePage() {
  return <HomeContent dict={getDict('ar')} locale="ar" />;
}
