// API base URL :
// - En dev : vide → utilise le proxy Vite (/api → :3001)
// - En prod : VITE_API_URL définie sur Vercel (ex: https://api.reset-egypt.com)
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${status}`);
  }
}

// Callback global pour gérer les 401 (session expirée) — wiré depuis App.tsx
// au démarrage. Skip /auth/me et /auth/login pour éviter une boucle.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}
function shouldHandleUnauth(path: string): boolean {
  return !path.startsWith('/auth/login')
    && !path.startsWith('/auth/me')
    && !path.startsWith('/auth/password/');
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else if (API_BASE) {
    // Prod : appel direct cross-origin (https://api.reset-egypt.com/...)
    url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  } else {
    // Dev : proxy Vite /api/...
    url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : '/' + path}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;
  if (!res.ok) {
    if (res.status === 401 && shouldHandleUnauth(path) && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiPut = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' });
