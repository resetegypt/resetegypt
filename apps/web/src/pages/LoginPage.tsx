import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, Input, ResetLogo } from '@reset/ui';
import { useAuthStore, defaultRouteForRole } from '../lib/auth';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loading, error } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== '/login' ? from : defaultRouteForRole(user.role)} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const u = await login(email.trim(), password, rememberMe);
      navigate(defaultRouteForRole(u.role), { replace: true });
    } catch {
      /* error already in store */
    }
  }

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Volet gauche — fond bleu royal aux couleurs de la marque */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-light items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-dark/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative z-10 text-center w-full max-w-sm">
          <ResetLogo variant="full" className="w-72 h-72 mx-auto rounded-3xl shadow-2xl" />
          <div className="mt-6 text-xs tracking-[0.4em] font-semibold text-primary-light/80">
            BRANCH CAIRO EAST CMC
          </div>
          <p className="mt-8 text-primary-light/80 text-sm max-w-xs mx-auto leading-relaxed">
            {t('auth.heroTagline', "Plateforme métier — auriculothérapie laser, gestion patients et facturation conforme ETA.")}
          </p>
        </div>
      </div>

      {/* Volet droit — formulaire */}
      <div className="w-full lg:w-1/2 bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-center gap-1 mb-4">
            {SUPPORTED_LANGUAGES.map((lng) => (
              <button
                key={lng}
                onClick={() => i18n.changeLanguage(lng as Language)}
                className={`px-3 py-1 text-xs rounded ${
                  i18n.language === lng
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Logo visible aussi en mobile (où le volet gauche est caché) */}
          <div className="lg:hidden text-center">
            <ResetLogo variant="full" className="w-28 h-28 mx-auto rounded-2xl" />
            <div className="text-[10px] tracking-[0.4em] font-semibold text-text-secondary mt-2">
              BRANCH CAIRO EAST CMC
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-semibold text-primary">{t('auth.login')}</h2>
                <p className="text-sm text-text-secondary">{t('auth.loginSubtitle')}</p>

              <div>
                <label className="block text-xs font-medium mb-1">{t('auth.email')}</label>
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t('auth.password')}</label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded"
                />
                {t('auth.rememberMe')}
              </label>

              {error && (
                <div className="bg-danger-light text-danger-dark text-sm p-3 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('common.loading') : t('auth.signIn')}
              </Button>
              <p className="text-xs text-center text-text-tertiary pt-2">
                {t('auth.devCredentialsHint')}
              </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
