// ============================================================================
// SettingsPage.tsx — page paramètres utilisateur (2FA + notifications).
//
// Toutes les actions sont sur le compte de l'utilisateur connecté (lui-même).
// ============================================================================

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Smartphone, Check, X, Copy, Bell, BellOff, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, Input } from '@reset/ui';
import { apiGet, apiPost } from '../lib/api';
import {
  isPushSupported, getPermissionState, subscribePush, unsubscribePush, sendTestPush,
} from '../lib/push';

export function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text">Paramètres</h1>
        <p className="text-sm text-text-secondary mt-1">Sécurité et notifications de ton compte.</p>
      </header>
      <TwoFactorSection />
      <NotificationsSection />
    </div>
  );
}

// =============================================================================
// 2FA section
// =============================================================================

function TwoFactorSection() {
  const qc = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => apiGet<{ enabled: boolean; backupCodesRemaining: number }>('/auth/2fa/status'),
  });
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string; otpauth: string } | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const beginSetup = useMutation({
    mutationFn: () => apiPost<{ secret: string; qrDataUrl: string; otpauth: string }>('/auth/2fa/setup'),
    onSuccess: setSetup,
    onError: () => setError('Erreur lors du setup'),
  });
  const enable = useMutation({
    mutationFn: (c: string) => apiPost<{ ok: true; backupCodes: string[] }>('/auth/2fa/enable', { code: c }),
    onSuccess: (r) => {
      setBackupCodes(r.backupCodes);
      setSetup(null); setCode('');
      qc.invalidateQueries({ queryKey: ['2fa-status'] });
    },
    onError: () => setError('Code incorrect. Réessaie.'),
  });
  const disable = useMutation({
    mutationFn: (c: string) => apiPost('/auth/2fa/disable', { code: c }),
    onSuccess: () => {
      setDisableCode('');
      qc.invalidateQueries({ queryKey: ['2fa-status'] });
    },
    onError: () => setError('Code incorrect'),
  });

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div className="flex-1">
            <h2 className="font-semibold text-text">Authentification à deux facteurs (2FA)</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Une couche supplémentaire de sécurité après ton mot de passe.
            </p>
          </div>
          {status?.enabled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-info-light text-info-dark text-xs font-medium">
              <Check className="w-3 h-3" /> Activée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-light text-warning-dark text-xs font-medium">
              <X className="w-3 h-3" /> Désactivée
            </span>
          )}
        </div>

        {error && <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">{error}</div>}

        {!status?.enabled && !setup && !backupCodes && (
          <Button onClick={() => { setError(null); beginSetup.mutate(); }} disabled={beginSetup.isPending}>
            {beginSetup.isPending ? 'Génération…' : 'Activer le 2FA'}
          </Button>
        )}

        {setup && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-text">
              1. Scanne ce QR code avec <strong>Google Authenticator</strong> / Authy / 1Password :
            </p>
            <img src={setup.qrDataUrl} alt="QR code 2FA" className="border border-border rounded p-2 bg-white" />
            <details className="text-xs text-text-secondary">
              <summary className="cursor-pointer">Saisir manuellement le code</summary>
              <code className="block mt-1 p-2 bg-bg-secondary rounded font-mono text-xs break-all">{setup.secret}</code>
            </details>
            <p className="text-sm text-text">2. Entre le code à 6 chiffres affiché par l'app :</p>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="font-mono text-center text-xl tracking-widest"
              />
              <Button
                onClick={() => { setError(null); enable.mutate(code); }}
                disabled={code.length !== 6 || enable.isPending}
              >
                Valider
              </Button>
            </div>
          </div>
        )}

        {backupCodes && (
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-medium text-text">
              ✅ 2FA activée. <strong>Sauvegarde ces codes de secours</strong> dans un endroit sûr :
            </p>
            <p className="text-xs text-warning-dark">
              Tu n'auras plus accès à ton compte si tu perds ton téléphone ET ces codes.
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 bg-bg-secondary rounded">
              {backupCodes.map((c) => (
                <code key={c} className="font-mono text-sm">{c}</code>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(backupCodes.join('\n'))}
              className="gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copier
            </Button>
            <Button size="sm" onClick={() => setBackupCodes(null)} className="ms-2">J'ai sauvegardé</Button>
          </div>
        )}

        {status?.enabled && !setup && !backupCodes && (
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs text-text-secondary">
              Codes de secours restants : <strong>{status.backupCodesRemaining}</strong>
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer text-danger-dark">Désactiver le 2FA</summary>
              <div className="mt-3 flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Code 2FA actuel"
                  className="font-mono text-center"
                />
                <Button
                  variant="danger"
                  onClick={() => { setError(null); disable.mutate(disableCode); }}
                  disabled={disableCode.length < 6}
                >
                  Désactiver
                </Button>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Notifications push section
// =============================================================================

function NotificationsSection() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    getPermissionState().then((p) => setPermission(p));
    if (isPushSupported()) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  async function handleSubscribe() {
    setLoading(true); setMessage(null);
    const r = await subscribePush();
    setLoading(false);
    if (r.ok) {
      setSubscribed(true);
      setPermission('granted');
      setMessage('Notifications activées ✅');
    } else {
      setMessage(
        r.reason === 'permission_denied'
          ? 'Permission refusée. Vérifie les paramètres du navigateur.'
          : r.reason === 'vapid_not_configured'
            ? 'Configuration serveur incomplète (VAPID).'
            : 'Erreur — non supporté par ce navigateur.',
      );
    }
  }
  async function handleUnsubscribe() {
    setLoading(true);
    await unsubscribePush();
    setSubscribed(false);
    setLoading(false);
    setMessage('Notifications désactivées.');
  }
  async function handleTest() {
    setLoading(true); setMessage(null);
    const r = await sendTestPush();
    setLoading(false);
    setMessage(r.sent > 0 ? 'Notif de test envoyée — regarde ton browser !' : 'Aucun device abonné.');
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          {subscribed ? <Bell className="w-6 h-6 text-primary" /> : <BellOff className="w-6 h-6 text-text-tertiary" />}
          <div className="flex-1">
            <h2 className="font-semibold text-text">Notifications push</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Reçois une notif quand un nouveau email arrive ou un RDV est créé.
            </p>
          </div>
        </div>
        {!supported && (
          <div className="bg-warning-light text-warning-dark text-sm p-3 rounded inline-flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Non supporté par ton navigateur (iOS Safari requiert l'app installée sur l'écran d'accueil).</span>
          </div>
        )}
        {permission === 'denied' && (
          <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">
            Permission refusée. Va dans les paramètres du navigateur pour autoriser les notifications.
          </div>
        )}
        {message && (
          <div className="bg-info-light text-info-dark text-sm p-3 rounded">{message}</div>
        )}
        <div className="flex gap-2 flex-wrap">
          {!subscribed && supported && permission !== 'denied' && (
            <Button onClick={handleSubscribe} disabled={loading}>
              {loading ? 'Activation…' : 'Activer les notifications'}
            </Button>
          )}
          {subscribed && (
            <>
              <Button variant="ghost" onClick={handleUnsubscribe} disabled={loading}>
                Désactiver
              </Button>
              <Button variant="secondary" onClick={handleTest} disabled={loading}>
                Envoyer une notif de test
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
