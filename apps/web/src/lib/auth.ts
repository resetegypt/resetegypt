import { create } from 'zustand';
import type { Role } from '@reset/shared';
import { apiGet, apiPost, ApiError } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
}

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  init: async () => {
    set({ loading: true });
    try {
      const { user } = await apiGet<{ user: CurrentUser }>('/auth/me');
      set({ user, loading: false, initialized: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        set({ user: null, loading: false, initialized: true });
      } else {
        set({ user: null, loading: false, initialized: true, error: 'Could not check session' });
      }
    }
  },
  login: async (email, password, rememberMe = false) => {
    set({ loading: true, error: null });
    try {
      const { user } = await apiPost<{ user: CurrentUser }>('/auth/login', {
        email,
        password,
        rememberMe,
      });
      set({ user, loading: false });
      return user;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? 'Email ou mot de passe incorrect'
            : err.status === 423
              ? 'Compte verrouillé. Contactez un administrateur.'
              : err.status === 403
                ? 'Compte désactivé.'
                : `Erreur ${err.status}`
          : 'Erreur réseau';
      set({ loading: false, error: message });
      throw err;
    }
  },
  logout: async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // swallow
    }
    set({ user: null, error: null });
  },
}));

export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'PRACTITIONER':
      return '/agenda';
    case 'SECRETARY':
      return '/';
  }
}
