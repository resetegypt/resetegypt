// ============================================================================
// InstallPWA.tsx — bouton "Installer l'app" pour PWA Reset Staff.
//
// Détecte l'événement `beforeinstallprompt` (Chrome/Edge/Android) ou affiche
// des instructions iOS Safari (qui n'expose pas cet event mais permet l'install
// via "Partager → Sur l'écran d'accueil").
//
// Auto-cache après install ou dismiss.
// ============================================================================

import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'reset-pwa-install-dismissed-until';

function isIOSSafari(): boolean {
  const ua = window.navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && notChrome;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isDismissed(): boolean {
  const until = localStorage.getItem(DISMISS_KEY);
  if (!until) return false;
  return Date.now() < parseInt(until, 10);
}

export function InstallPWA() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [iosBannerVisible, setIosBannerVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari : pas d'event, on affiche la bannière manuellement
    if (isIOSSafari()) {
      setIosBannerVisible(true);
    }

    const installed = () => {
      setDeferred(null);
      setIosBannerVisible(false);
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  function dismiss() {
    // Re-propose dans 7 jours
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setDeferred(null);
    setIosBannerVisible(false);
    setShowIOSHelp(false);
  }

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') {
        setDeferred(null);
      } else {
        dismiss();
      }
    } else if (isIOSSafari()) {
      setShowIOSHelp(true);
    }
  }

  // Aucun prompt dispo + pas iOS → ne rien rendre
  if (!deferred && !iosBannerVisible) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium hover:brightness-110 transition-all shadow-sm"
        aria-label={t('pwa.install', "Installer l'application")}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{t('pwa.install', "Installer l'app")}</span>
        <span
          className="opacity-60 hover:opacity-100 -mr-1 -my-1 p-1 rounded hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          role="button"
          aria-label={t('pwa.dismiss', 'Ignorer pendant 7 jours')}
        >
          <X className="w-3.5 h-3.5" />
        </span>
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <Smartphone className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-text">
                  {t('pwa.iosTitle', 'Installer sur iPhone')}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {t('pwa.iosSteps', "Dans Safari, touche le bouton Partager (carré avec flèche), puis « Sur l'écran d'accueil »")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="w-full py-2.5 rounded-lg bg-bg-secondary text-text-secondary text-sm font-medium hover:bg-bg-secondary/80 transition-colors"
            >
              {t('common.close', 'Fermer')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
