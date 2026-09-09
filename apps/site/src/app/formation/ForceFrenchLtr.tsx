'use client';

// Les pages "meta" du site (formation, legal, privacy) sont uniquement en
// français. Or Header.tsx détecte la locale depuis l'URL et applique
// DEFAULT_LOCALE (= 'ar') aux routes sans préfixe → dir=rtl → layout mirroré.
// Ce composant force lang=fr / dir=ltr en aval de tous les autres useEffect.
import { useEffect } from 'react';

export function ForceFrenchLtr() {
  useEffect(() => {
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  });
  return null;
}
