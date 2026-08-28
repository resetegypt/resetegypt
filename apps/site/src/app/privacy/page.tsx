import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité Reset Egypt — Loi 151/2020 (Personal Data Protection Law, Égypte) + RGPD si visiteur EU.',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16 prose prose-neutral prose-headings:font-bold">
      <h1>Politique de confidentialité</h1>
      <p className="text-sm text-neutral-500">
        Dernière mise à jour : 2026. Conforme à la Loi 151/2020 (Personal Data Protection Law,
        Égypte) et au RGPD pour les visiteurs de l&apos;Union européenne.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Reset Egypt (N Teseen, New Cairo 11835). Contact du délégué à la protection des données
        (DPO) : <a href="mailto:contact@reset-egypt.com">contact@reset-egypt.com</a>.
      </p>

      <h2>2. Données collectées</h2>
      <h3>2.1 Visite du site</h3>
      <ul>
        <li>Cookies techniques essentiels (session, préférence de langue)</li>
        <li>Cookies analytiques (opt-in via bannière consent) : nombre de pages vues, durée</li>
      </ul>
      <h3>2.2 Prise de rendez-vous en ligne</h3>
      <ul>
        <li>Nom, prénom, téléphone, email, âge, langue préférée</li>
        <li>Motif de la séance (tabac, drogues, alcool, sucre, stress)</li>
        <li>Consentement traitement des données + acknowledgement non-médical</li>
      </ul>
      <h3>2.3 Séance et suivi</h3>
      <ul>
        <li>Antécédents renseignés lors de l&apos;entretien préalable</li>
        <li>Notes cliniques rédigées par le praticien</li>
        <li>Historique des séances et paiements</li>
        <li>Messages échangés avec le centre (email, WhatsApp)</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Exécution de la prestation</strong> (contrat) : gestion RDV, suivi thérapeutique
        </li>
        <li>
          <strong>Facturation légale</strong> (obligation légale, Décret 188/2020) : émission de
          factures conformes ETA, conservation 5+ ans
        </li>
        <li>
          <strong>Relances automatisées</strong> (intérêt légitime + consentement SMS) : rappels
          J-1, suivi bien-être J+7/J+30/J+90
        </li>
        <li>
          <strong>Analyse d&apos;audience</strong> (consentement explicite) : uniquement si tu as
          accepté la bannière analytics
        </li>
      </ul>

      <h2>4. Destinataires des données</h2>
      <p>
        Tes données ne sont <strong>jamais vendues</strong> ni transmises à des tiers commerciaux.
        Sous-traitants techniques :
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> (base de données patients, hébergée en UE — Frankfurt)
        </li>
        <li>
          <strong>Vercel</strong> (hébergement du site web + API — région Frankfurt)
        </li>
        <li>
          <strong>Resend</strong> (envoi d&apos;emails transactionnels — Ireland)
        </li>
        <li>
          <strong>Cloudflare</strong> (DNS + Email Routing)
        </li>
        <li>
          <strong>Sentry</strong> (monitoring d&apos;erreurs — données anonymisées, PII strippée)
        </li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li>Dossier patient actif : durée de la relation + 5 ans</li>
        <li>Factures : 10 ans (obligation fiscale)</li>
        <li>Logs d&apos;audit sécurité : 12 mois</li>
        <li>Cookies analytiques : 12 mois</li>
      </ul>

      <h2>6. Tes droits (Loi 151/2020 + RGPD)</h2>
      <ul>
        <li>
          <strong>Accès</strong> : demande une copie complète de tes données
        </li>
        <li>
          <strong>Rectification</strong> : corrige une info incorrecte
        </li>
        <li>
          <strong>Effacement</strong> : demande la suppression (les factures légales restent
          anonymisées pour conformité fiscale)
        </li>
        <li>
          <strong>Portabilité</strong> : reçois tes données dans un format machine-readable
        </li>
        <li>
          <strong>Opposition</strong> : refuse les relances automatisées
        </li>
      </ul>
      <p>
        Pour exercer un droit : envoie un email à{' '}
        <a href="mailto:contact@reset-egypt.com">contact@reset-egypt.com</a> avec pièce
        d&apos;identité. Réponse sous 30 jours.
      </p>

      <h2>7. Sécurité</h2>
      <ul>
        <li>Chiffrement TLS obligatoire (HTTPS + HSTS 2 ans)</li>
        <li>Mots de passe hashés bcrypt cost 12</li>
        <li>2FA disponible pour tous les comptes staff</li>
        <li>
          Rate-limit anti brute-force sur les endpoints d&apos;authentification (10 essais / 15
          min)
        </li>
        <li>Audit log de toutes les actions sensibles</li>
        <li>Backup base de données quotidien (rétention 30 jours)</li>
      </ul>

      <h2>8. Contact / réclamation</h2>
      <p>
        Toute réclamation peut être adressée à{' '}
        <a href="mailto:contact@reset-egypt.com">contact@reset-egypt.com</a>. Tu peux également
        saisir le régulateur compétent (Personal Data Protection Center en Égypte, ou l&apos;autorité
        de protection de ton pays de résidence pour les visiteurs EU).
      </p>
    </article>
  );
}
