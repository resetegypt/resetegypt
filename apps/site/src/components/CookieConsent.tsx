'use client';

// ============================================================================
// CookieConsent.tsx — bannière RGPD / Loi 151/2020 (Égypte) côté marketing.
//
// Conforme Loi 151/2020 (Personal Data Protection Law - Égypte) + RGPD pour
// visiteurs EU. Granularité minimale : essentiels (toujours actifs) + analytics
// (opt-in explicite).
//
// Persistance : localStorage `reset-cookie-consent` = JSON { accepted, analytics, at }.
// Pas de re-prompt avant 12 mois.
// ============================================================================

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'reset-cookie-consent';
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 mois

interface Consent {
  accepted: boolean;
  analytics: boolean;
  at: number;
}

function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    if (Date.now() - c.at > TTL_MS) return null; // expiré
    return c;
  } catch {
    return null;
  }
}

function saveConsent(c: Omit<Consent, 'at'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, at: Date.now() }));
}

function detectLocale(): 'fr' | 'en' | 'ar' {
  if (typeof window === 'undefined') return 'fr';
  const seg = window.location.pathname.split('/')[1];
  if (seg === 'en') return 'en';
  if (seg === 'ar') return 'ar';
  return 'fr';
}

export function CookieConsent({ locale: localeProp }: { locale?: 'fr' | 'en' | 'ar' } = {}) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [locale, setLocale] = useState<'fr' | 'en' | 'ar'>(localeProp ?? 'fr');

  useEffect(() => {
    if (!localeProp) setLocale(detectLocale());
    if (!readConsent()) setVisible(true);
  }, [localeProp]);

  function acceptAll() {
    saveConsent({ accepted: true, analytics: true });
    setVisible(false);
  }
  function acceptEssential() {
    saveConsent({ accepted: true, analytics: false });
    setVisible(false);
  }
  function saveCustom() {
    saveConsent({ accepted: true, analytics: analyticsEnabled });
    setVisible(false);
  }

  if (!visible) return null;

  const t = TRANSLATIONS[locale] ?? TRANSLATIONS.fr;
  const isRTL = locale === 'ar';

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      dir={isRTL ? 'rtl' : 'ltr'}
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 md:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 sm:p-6">
        {!showDetails ? (
          <>
            <h2 id="cookie-consent-title" className="font-semibold text-base sm:text-lg text-gray-900">
              {t.title}
            </h2>
            <p id="cookie-consent-desc" className="text-sm text-gray-600 mt-2 leading-relaxed">
              {t.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none sm:order-3 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                {t.acceptAll}
              </button>
              <button
                onClick={acceptEssential}
                className="flex-1 sm:flex-none sm:order-2 px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {t.essentialOnly}
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 sm:flex-none sm:order-1 px-5 py-2.5 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t.customize}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-lg text-gray-900">{t.detailsTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">{t.detailsDescription}</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <input type="checkbox" checked disabled className="mt-1 cursor-not-allowed opacity-60" />
                <div>
                  <div className="font-medium text-sm text-gray-900">{t.essentialTitle}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t.essentialDesc}</div>
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm text-gray-900">{t.analyticsTitle}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t.analyticsDesc}</div>
                </div>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveCustom}
                className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                {t.save}
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="px-5 py-2.5 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t.back}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TRANSLATIONS = {
  fr: {
    title: 'Vos données, votre choix',
    description:
      "Nous utilisons des cookies essentiels pour faire fonctionner le site, et facultativement des cookies d'analyse pour comprendre comment vous l'utilisez. Vos données médicales ne sont jamais partagées avec des tiers. Conforme Loi 151/2020.",
    acceptAll: 'Tout accepter',
    essentialOnly: 'Essentiels uniquement',
    customize: 'Personnaliser',
    detailsTitle: 'Paramètres des cookies',
    detailsDescription: "Choisissez ce que vous autorisez. Vous pouvez changer d'avis à tout moment.",
    essentialTitle: 'Cookies essentiels (toujours actifs)',
    essentialDesc: 'Indispensables au fonctionnement : session, sécurité, préférence de langue.',
    analyticsTitle: "Cookies d'analyse",
    analyticsDesc: "Mesure d'audience anonyme pour améliorer le site (pages vues, durée). Aucune donnée personnelle.",
    save: 'Enregistrer mes choix',
    back: 'Retour',
  },
  en: {
    title: 'Your data, your choice',
    description:
      'We use essential cookies to make the site work, and optionally analytics cookies to understand how you use it. Your medical data is never shared with third parties. Compliant with Egyptian Law 151/2020.',
    acceptAll: 'Accept all',
    essentialOnly: 'Essential only',
    customize: 'Customize',
    detailsTitle: 'Cookie settings',
    detailsDescription: 'Choose what you allow. You can change your mind anytime.',
    essentialTitle: 'Essential cookies (always on)',
    essentialDesc: 'Required for site operation: session, security, language preference.',
    analyticsTitle: 'Analytics cookies',
    analyticsDesc: 'Anonymous audience measurement to improve the site (pageviews, duration). No personal data.',
    save: 'Save my preferences',
    back: 'Back',
  },
  ar: {
    title: 'بياناتك، اختيارك',
    description:
      'نستخدم ملفات تعريف الارتباط الأساسية لتشغيل الموقع، واختياريًا ملفات التحليلات لفهم كيفية استخدامك له. بياناتك الطبية لا تُشارك أبدًا مع أطراف ثالثة. متوافق مع القانون المصري 151/2020.',
    acceptAll: 'قبول الكل',
    essentialOnly: 'الأساسي فقط',
    customize: 'تخصيص',
    detailsTitle: 'إعدادات ملفات تعريف الارتباط',
    detailsDescription: 'اختر ما تسمح به. يمكنك تغيير رأيك في أي وقت.',
    essentialTitle: 'ملفات الارتباط الأساسية (مفعّلة دائمًا)',
    essentialDesc: 'مطلوبة لتشغيل الموقع: الجلسة، الأمن، تفضيل اللغة.',
    analyticsTitle: 'ملفات تحليلات',
    analyticsDesc: 'قياس مجهول للجمهور لتحسين الموقع (عدد المشاهدات، المدة). لا توجد بيانات شخصية.',
    save: 'حفظ خياراتي',
    back: 'رجوع',
  },
} as const;
