import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@reset/ui';
import { useAuthStore, defaultRouteForRole } from '../lib/auth';

export function NotFoundPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const homePath = user ? defaultRouteForRole(user.role) : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-bg to-bg-secondary">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-7xl font-extrabold text-primary/30 tabular-nums">404</div>
          <h1 className="text-2xl font-bold text-text">
            {t('errors.notFoundTitle', 'Page introuvable')}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t('errors.notFoundBody', "La page demandée n'existe pas ou a été déplacée.")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="ghost">
            <Link to={homePath} className="inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back', 'Retour')}
            </Link>
          </Button>
          <Button asChild>
            <Link to={homePath} className="inline-flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              {t('common.home', "Page d'accueil")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
