import type { Metadata } from 'next';
import { Pill } from 'lucide-react';
import { ServicePage } from '../../../components/ServicePage';

export const metadata: Metadata = {
  title: 'Sevrage drogues — Accompagnement non-médical au sevrage',
  description:
    'Programme RESET pour le sevrage des drogues : approche non-médicale, non-invasive, basée sur le laser de photobiomodulation et l\'auriculothérapie.',
};

export default function DrugsPage() {
  return (
    <ServicePage
      Icon={Pill}
      eyebrow="Sevrage drogues"
      title="Reprenez votre vie en main."
      tagline="Briser le cycle de la dépendance chimique."
      intro="Notre thérapie laser privée et non-invasive aide à réduire la douleur physique du sevrage et à stabiliser votre système nerveux pendant la récupération. Démarrez votre chemin vers un futur clean dans un environnement sûr et sans jugement."
      benefits={[
        {
          title: 'Réduction des symptômes de sevrage',
          description:
            "Le laser stimule la libération d'endorphines naturelles qui atténuent les douleurs physiques et l'inconfort liés à l'arrêt.",
        },
        {
          title: 'Stabilisation du système nerveux',
          description:
            'La photobiomodulation aide à réguler l\'humeur, l\'anxiété et les troubles du sommeil pendant la phase critique de récupération.',
        },
        {
          title: 'Environnement confidentiel',
          description:
            'Vos séances se déroulent en privé, dans un centre sans jugement, avec un praticien dédié à votre parcours.',
        },
        {
          title: 'Soutien long terme',
          description:
            'Un suivi régulier pour prévenir la rechute et consolider votre nouvelle vie clean.',
        },
      ]}
      process={[
        'Consultation initiale confidentielle pour évaluer votre situation et vos objectifs.',
        "Application du laser sur les points auriculaires liés à l'addiction et à la régulation émotionnelle.",
        'Conseils pratiques pour gérer les premières 72 heures post-séance.',
        'Suivi régulier pour consolider votre nouvelle trajectoire.',
      ]}
      cta="Démarrez votre nouvelle vie."
    />
  );
}
