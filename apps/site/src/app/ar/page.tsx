import { HomeContent } from '../../components/HomeContent';
import { getDict } from '../../lib/i18n';

export default function HomePage() {
  return <HomeContent dict={getDict('ar')} locale="ar" />;
}
