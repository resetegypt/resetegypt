import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Role } from '@reset/shared';
import { useAuthStore } from '../lib/auth';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, initialized } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        {t('common.loading')}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-danger font-semibold">{t('auth.accessDenied')}</p>
          <p className="text-sm text-text-secondary">
            {t('auth.roleRequired')}: {roles.map((r) => t(`roles.${r}`)).join(' / ')}
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
