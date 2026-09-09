import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { FormationClient } from '../../formation/FormationClient';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Formation praticien',
  description:
    'Parcours de formation interne pour les praticiens Reset Egypt — trilingue FR / مصري / EN.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function FormationFR() {
  return (
    <div className={nunito.className}>
      <FormationClient />
    </div>
  );
}
