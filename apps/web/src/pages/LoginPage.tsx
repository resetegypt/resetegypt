import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@reset/ui';
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
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
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="text-xl text-primary">Reset Egypt</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-semibold">{t('auth.login')}</h2>
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
  );
}
