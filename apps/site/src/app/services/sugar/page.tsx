import type { Metadata } from 'next';
import { Candy } from 'lucide-react';
import { ServicePage } from '../../../components/ServicePage';

export const metadata: Metadata = {
  title: 'Gestion du sucre — Stop aux fringales naturellement',
  description:
    'Méthode RESET pour la gestion des fringales sucrées : laser de photobiomodulation pour neutraliser les centres d\'addiction au sucre et faciliter la perte de poids.',
};

export default function SugarPage() {
  return (
    <ServicePage
      heroPhoto="/photos/service-sugar.jpeg"
      Icon={Candy}
      eyebrow="Gestion du sucre"
      title="Brisez le cycle du sucre."
      tagline="Stop aux fringales, stabilisez votre énergie."
      intro={'Notre thérapie laser cible les centres d’addiction de votre cerveau pour neutraliser le « besoin » de sucre. Elle vous aide à gérer votre poids et à prévenir le diabète sans la lutte de la seule volonté.'}
      benefits={[
        {
          title: 'Neutralisation des fringales',
          description:
            "Le laser cible les zones cérébrales liées à l'envie de sucre, réduisant les pulsions compulsives qui sabotent vos efforts.",
        },
        {
          title: 'Stabilisation de l\'énergie',
          description:
            "Fini les pics et chutes de glycémie. Vous retrouvez une énergie stable tout au long de la journée.",
        },
        {
          title: 'Perte de poids naturelle',
          description:
            'En neutralisant les envies, vous réduisez naturellement votre apport calorique sans frustration ni régime strict.',
        },
        {
          title: 'Prévention du diabète',
          description:
            'Réduire l\'addiction au sucre est l\'un des leviers les plus puissants pour prévenir le diabète de type 2.',
        },
      ]}
      process={[
        'Consultation initiale pour comprendre vos habitudes alimentaires et objectifs.',
        "Application du laser sur les points auriculaires liés à la régulation de l'appétit.",
        "Conseils nutritionnels simples pour soutenir votre nouvelle relation à l'alimentation.",
        'Suivi pour ajuster et maintenir vos progrès dans le temps.',
      ]}
      cta="Reprenez le contrôle de votre alimentation."
    />
  );
}
