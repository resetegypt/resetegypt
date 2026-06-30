'use client';

// ============================================================================
// LocaleHtmlSync.tsx — synchronise <html lang/dir> avec la locale de l'URL.
//
// SSR rend le HTML avec lang="fr" dir="ltr" (défaut). Au mount client, on lit
// le 1er segment d'URL (/fr|/en|/ar) et on update document.documentElement.
// Ça permet aux outils a11y (lecteurs d'écran, traducteurs) + au CSS RTL de
// se déclencher immédiatement sans flash.
// ============================================================================

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function LocaleHtmlSync() {
  const pathname = usePathname() ?? '/';
  useEffect(() => {
    const seg = pathname.split('/')[1];
    const lang = seg === 'en' || seg === 'ar' ? seg : 'fr';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [pathname]);
  return null;
}
