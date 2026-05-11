import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '@reset/shared';
import { useAuthStore } from '../lib/auth';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Chargement…
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
          <p className="text-danger font-semibold">Accès refusé</p>
          <p className="text-sm text-text-secondary">
            Cette page nécessite le rôle : {roles.join(' ou ')}
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
