import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du centre Reset Egypt — Le Caire, Loi 151/2020.',
};

export default function LegalPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 prose prose-neutral prose-headings:font-bold">
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        <strong>Reset Egypt</strong>
        <br />
        N Teseen, New Cairo 1, Le Caire 11835, Égypte
        <br />
        Branch: Cairo East CMC
        <br />
        Email : <a href="mailto:contact@reset-egypt.com">contact@reset-egypt.com</a>
        <br />
        Registre du commerce : <em>en cours d&apos;attribution</em>
        <br />
        TIN (Tax Identification Number) : <em>en cours d&apos;attribution auprès du Ministère des Finances</em>
      </p>

      <h2>Directeur de la publication</h2>
      <p>Direction du centre Reset Egypt.</p>

      <h2>Hébergement</h2>
      <p>
        Ce site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA
        91789, USA — <a href="https://vercel.com/legal/privacy-policy">vercel.com/legal</a>.
        <br />
        La base de données patients est hébergée sur <strong>Supabase</strong> (région eu-central,
        Frankfurt, Allemagne).
      </p>

      <h2>Nature de l&apos;activité</h2>
      <p>
        Reset Egypt propose des séances d&apos;auriculothérapie combinées à la photobiomodulation
        laser (méthode française non médicamenteuse) pour l&apos;accompagnement des personnes
        souhaitant se libérer d&apos;une addiction ou gérer leur stress.
      </p>
      <p>
        <strong>⚠️ Important : ces séances ne constituent pas un acte médical.</strong> Elles
        ne remplacent pas un diagnostic ou un traitement médical. Pour toute pathologie, consultez
        votre médecin.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus (textes, images, logos, code source) présents sur ce site
        sont la propriété exclusive de Reset Egypt. Toute reproduction, distribution ou
        modification sans autorisation écrite est interdite.
      </p>

      <h2>Voir aussi</h2>
      <ul>
        <li>
          <Link href="/privacy">Politique de confidentialité</Link>
        </li>
        <li>
          <Link href="/cookies">Gestion des cookies</Link>
        </li>
      </ul>
    </article>
  );
}
