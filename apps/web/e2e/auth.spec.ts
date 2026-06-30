// ============================================================================
// auth.spec.ts — Tests E2E flux d'authentification (live prod).
//
// Hits api.reset-egypt.com directly. Designed to be safe to run repeatedly
// (read-only, no DB mutations).
// ============================================================================

import { test, expect, request } from '@playwright/test';

const API = process.env.PLAYWRIGHT_API_URL ?? 'https://api.reset-egypt.com';

// SECURITE — passwords lus depuis env vars (E2E_PASSWORD ou tableau JSON
// PLAYWRIGHT_ACCOUNTS_JSON). Fallback "123.reset" pour permettre le run local
// après le password-reset commun. Jamais de password sensible commité.
const DEFAULT_PWD = process.env.E2E_PASSWORD ?? '123.reset';
const ACCOUNTS = process.env.PLAYWRIGHT_ACCOUNTS_JSON
  ? JSON.parse(process.env.PLAYWRIGHT_ACCOUNTS_JSON) as Array<{ email: string; password: string; role: string }>
  : [
      { email: 'direction@reset-egypt.com', password: DEFAULT_PWD, role: 'ADMIN' },
      { email: 'dr.ahmadalashry@reset-egypt.com', password: DEFAULT_PWD, role: 'PRACTITIONER' },
      { email: 'sara@reset-egypt.com', password: DEFAULT_PWD, role: 'SECRETARY' },
      { email: 'nora@reset-egypt.com', password: DEFAULT_PWD, role: 'SECRETARY' },
    ];

test.describe('API · Auth flow', () => {
  test('health endpoint répond 200', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('reset-api');
  });

  test('health deep — BDD connectée', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${API}/health/deep`);
    expect(res.status()).toBe(200);
  });

  for (const acc of ACCOUNTS) {
    test(`login ${acc.role} — ${acc.email}`, async () => {
      const ctx = await request.newContext();
      const res = await ctx.post(`${API}/auth/login`, {
        data: { email: acc.email, password: acc.password },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe(acc.email);
      expect(body.user.role).toBe(acc.role);

      // Cookie session posé
      const setCookie = res.headers()['set-cookie'];
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain('reset_session');
    });
  }

  test('login mauvais mot de passe → 401', async () => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API}/auth/login`, {
      data: { email: 'direction@reset-egypt.com', password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('InvalidCredentials');
  });

  test('logout invalide le cookie', async () => {
    const ctx = await request.newContext();
    // Login
    const loginRes = await ctx.post(`${API}/auth/login`, {
      data: { email: 'direction@reset-egypt.com', password: DEFAULT_PWD },
    });
    expect(loginRes.status()).toBe(200);

    // /auth/me OK
    const meRes = await ctx.get(`${API}/auth/me`);
    expect(meRes.status()).toBe(200);

    // Logout
    const logoutRes = await ctx.post(`${API}/auth/logout`);
    expect(logoutRes.status()).toBe(200);

    // /auth/me → 401
    const meAfter = await ctx.get(`${API}/auth/me`);
    expect(meAfter.status()).toBe(401);
  });
});
