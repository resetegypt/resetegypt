import type { Metadata } from 'next';
import { Brain } from 'lucide-react';
import { ServicePage } from '../../../components/ServicePage';

export const metadata: Metadata = {
  title: 'Stress & anxiété — Régulation neuronale naturelle',
  description:
    "Méthode RESET pour la gestion du stress et de l'anxiété : laser de photobiomodulation qui régule cortisol et endorphines pour un sommeil et un calme profonds.",
};

export default function StressPage() {
  return (
    <ServicePage
      heroPhoto="/photos/service-stress.jpeg"
      Icon={Brain}
      eyebrow="Stress & anxiété"
      title="Apaisez votre système nerveux."
      tagline="Calmez le bruit du quotidien."
      intro="Notre régulation neuronale non-invasive abaisse naturellement le cortisol et stimule les endorphines, vous aidant à gérer l'anxiété et à améliorer la qualité du sommeil sans médicaments."
      benefits={[
        {
          title: 'Réduction du cortisol',
          description:
            "Le laser stimule la production naturelle d'endorphines, qui contrebalance l'hormone du stress et apaise le corps.",
        },
        {
          title: 'Sommeil profond',
          description:
            'Régulation du système nerveux pour s\'endormir plus vite, dormir plus profondément et se réveiller reposé(e).',
        },
        {
          title: 'Concentration retrouvée',
          description:
            "Sans la charge mentale constante du stress, vous regagnez la clarté nécessaire pour vous concentrer et performer.",
        },
        {
          title: 'Sans médicament',
          description:
            "Aucun anxiolytique, aucun somnifère. Une approche 100% naturelle qui complète parfaitement vos autres pratiques (sport, méditation, etc.).",
        },
      ]}
      process={[
        'Consultation initiale pour identifier les sources de stress et vos objectifs personnels.',
        "Application du laser sur les points auriculaires de la régulation parasympathique.",
        'Conseils de respiration et de routine pour entretenir le bénéfice de la séance.',
        'Séances de consolidation possibles pour les profils très tendus.',
      ]}
      cta="Retrouvez votre calme intérieur."
    />
  );
}
