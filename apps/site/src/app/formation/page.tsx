import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { FormationClient } from './FormationClient';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
});

// /formation (sans préfixe) = AR par défaut (cohérent avec DEFAULT_LOCALE du site).
// Le rendu bascule automatiquement selon la locale via FormationClient.
export const metadata: Metadata = {
  title: 'تدريب الممارس',
  description: 'مسار التدريب الداخلي لممارسي Reset Egypt — بثلاث لغات FR / مصري / EN.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function FormationIndex() {
  return (
    <div className={nunito.className}>
      <FormationClient />
    </div>
  );
}
