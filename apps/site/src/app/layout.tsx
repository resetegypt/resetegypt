import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://reset-egypt.com'),
  title: {
    default: 'RESET — Auriculothérapie laser pour sevrage tabac, drogues, alcool, sucre et stress',
    template: '%s — RESET',
  },
  description:
    "Centre RESET au Caire (New Cairo) : méthode française non-invasive combinant auriculothérapie et laser de photobiomodulation. Sevrage tabagique, drogues, alcool, sucre et gestion du stress en une séance.",
  keywords: [
    'auriculothérapie',
    'laser photobiomodulation',
    'sevrage tabagique',
    'arrêter de fumer',
    'addiction',
    'stress',
    'anxiété',
    'Le Caire',
    'New Cairo',
    'RESET Egypt',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://reset-egypt.com',
    siteName: 'RESET',
    title: 'RESET — Reprenez le contrôle',
    description:
      'Auriculothérapie laser non-invasive — sevrage tabac, drogues, alcool, sucre, stress. Centre RESET au Caire, méthode française.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RESET — Branch Cairo East CMC',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RESET — Reprenez le contrôle',
    description:
      'Auriculothérapie laser non-invasive — sevrage tabac, drogues, alcool, sucre, stress.',
  },
  // Pas besoin d'override : Next.js App Router prend automatiquement
  // icon.png + apple-icon.png placés à côté de layout.tsx.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MedicalBusiness',
              name: 'RESET',
              alternateName: 'RESET Egypt',
              image: 'https://reset-egypt.com/logo.svg',
              url: 'https://reset-egypt.com',
              telephone: '+20 1xx xxx xxxx',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'N Teseen, New Cairo 1',
                addressLocality: 'Le Caire',
                postalCode: '11835',
                addressCountry: 'EG',
              },
              priceRange: 'EGP',
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ],
                  opens: '11:00',
                  closes: '22:00',
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-bg text-text antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
