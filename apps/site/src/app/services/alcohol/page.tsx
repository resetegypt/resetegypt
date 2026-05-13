import type { Metadata } from 'next';
import { Wine } from 'lucide-react';
import { ServicePage } from '../../../components/ServicePage';

export const metadata: Metadata = {
  title: "Sevrage alcool — Reprendre le contrôle naturellement",
  description:
    "Méthode RESET pour le sevrage alcoolique : laser de photobiomodulation pour neutraliser les envies physiques et stabiliser le système nerveux. Non-médical, non-invasif.",
};

export default function AlcoholPage() {
  return (
    <ServicePage
      Icon={Wine}
      eyebrow="Sevrage alcool"
      title="Libérez-vous de l'alcool."
      tagline="Reprenez votre vie et votre santé."
      intro="Notre protocole laser spécialisé aide à neutraliser les envies physiques et les symptômes de sevrage, vous donnant la clarté mentale nécessaire pour maintenir une sobriété durable. Démarrez votre voyage vers un futur plus net dès aujourd'hui."
      benefits={[
        {
          title: 'Neutralisation des envies physiques',
          description:
            "Le laser cible les points neuronaux qui régulent l'envie d'alcool, réduisant significativement l'appel compulsif.",
        },
        {
          title: 'Clarté mentale retrouvée',
          description:
            'En stabilisant le système nerveux, vous regagnez la concentration et la maîtrise de soi nécessaires à un changement durable.',
        },
        {
          title: 'Régulation émotionnelle',
          description:
            'La photobiomodulation aide à atténuer le stress, l\'anxiété et la dépression souvent associés à l\'arrêt.',
        },
        {
          title: 'Sobriété long terme',
          description:
            'Un suivi personnalisé pour vous accompagner dans la consolidation de votre nouvelle hygiène de vie.',
        },
      ]}
      process={[
        'Consultation initiale pour évaluer votre consommation et vos motivations (confidentielle).',
        'Application du laser sur les points auriculaires de la dépendance et de la régulation émotionnelle.',
        'Recommandations comportementales pour les premières semaines.',
        'Suivi régulier pour prévenir la rechute et consolider vos acquis.',
      ]}
      cta="Démarrez votre voyage vers la sobriété."
    />
  );
}
