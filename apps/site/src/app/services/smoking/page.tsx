import type { Metadata } from 'next';
import { Cigarette } from 'lucide-react';
import { ServicePage } from '../../../components/ServicePage';

export const metadata: Metadata = {
  title: 'Sevrage tabagique — Arrêter de fumer en une séance',
  description:
    'Méthode RESET : auriculothérapie + laser de photobiomodulation pour arrêter de fumer en une séance, sans patchs, sans gommes, sans médicament. Centre RESET Le Caire.',
};

export default function SmokingPage() {
  return (
    <ServicePage
      heroPhoto="/photos/service-smoking.jpeg"
      Icon={Cigarette}
      eyebrow="Sevrage tabagique"
      title="Arrêtez de fumer en une séance."
      tagline="Oubliez les patchs et les gommes."
      intro="Notre technologie de photobiomodulation cible la dépendance à sa source pour neutraliser les symptômes de manque instantanément. Une séance suffit dans la grande majorité des cas — sans douleur, sans médicament, sans effet secondaire."
      benefits={[
        {
          title: 'Neutralisation des envies physiques',
          description:
            'Le laser stimule des points neuronaux précis qui annulent la sensation de manque physique. Vous sortez de la séance comme un non-fumeur.',
        },
        {
          title: 'Réduction du stress lié au sevrage',
          description:
            "La photobiomodulation calme le système nerveux, évitant l'irritabilité et l'anxiété typiques de l'arrêt du tabac.",
        },
        {
          title: 'Une seule séance dans 80% des cas',
          description:
            'Pour la majorité de nos clients, une séance primaire suffit. Une consolidation peut être planifiée selon votre profil.',
        },
        {
          title: 'Aucun substitut nicotinique',
          description:
            'Pas de patchs, pas de gommes, pas de cigarettes électroniques. Une méthode 100% naturelle et non-invasive.',
        },
      ]}
      process={[
        'Consultation initiale pour comprendre votre profil de fumeur et votre motivation (15 minutes).',
        "Application précise du laser sur les points auriculaires liés à l'addiction à la nicotine (20–30 minutes).",
        'Recommandations personnalisées pour les premières heures et premiers jours sans tabac.',
        "Suivi long terme par notre équipe pour consolider votre nouvelle vie de non-fumeur.",
      ]}
      cta="Devenez non-fumeur dès aujourd'hui."
    />
  );
}
