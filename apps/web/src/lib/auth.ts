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
  /** Si non null, l'étape 2 du login (TOTP) est requise avec ce challenge JWT. */
  totpChallenge: string | null;
  init: () => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ user: CurrentUser | null; totpRequired: boolean }>;
  verifyTotp: (code: string) => Promise<CurrentUser>;
  cancelTotp: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  totpChallenge: null,
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
    set({ loading: true, error: null, totpChallenge: null });
    try {
      const res = await apiPost<
        { user: CurrentUser } | { totpRequired: true; challenge: string }
      >('/auth/login', { email, password, rememberMe });
      if ('totpRequired' in res && res.totpRequired) {
        set({ loading: false, totpChallenge: res.challenge });
        return { user: null, totpRequired: true };
      }
      const { user } = res as { user: CurrentUser };
      set({ user, loading: false });
      return { user, totpRequired: false };
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
  verifyTotp: async (code) => {
    const challenge = get().totpChallenge;
    if (!challenge) throw new Error('no_active_totp_challenge');
    set({ loading: true, error: null });
    try {
      const { user } = await apiPost<{ user: CurrentUser }>('/auth/2fa/verify', {
        challenge,
        code,
      });
      set({ user, loading: false, totpChallenge: null });
      return user;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'Code incorrect ou expiré'
          : 'Erreur de vérification 2FA';
      set({ loading: false, error: message });
      throw err;
    }
  },
  cancelTotp: () => set({ totpChallenge: null, error: null }),
  logout: async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // swallow
    }
    set({ user: null, error: null, totpChallenge: null });
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
