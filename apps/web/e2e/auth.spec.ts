// ============================================================================
// auth.spec.ts — Tests E2E flux d'authentification (live prod).
//
// Hits api.reset-egypt.com directly. Designed to be safe to run repeatedly
// (read-only, no DB mutations).
// ============================================================================

import { test, expect, request } from '@playwright/test';

const API = process.env.PLAYWRIGHT_API_URL ?? 'https://api.reset-egypt.com';

const ACCOUNTS = [
  { email: 'direction@reset-egypt.com', password: '123.resetdirection', role: 'ADMIN' },
  { email: 'dr.ahmadalashry@reset-egypt.com', password: '123.resetahmad', role: 'PRACTITIONER' },
  { email: 'sara@reset-egypt.com', password: '123.resetsara', role: 'SECRETARY' },
  { email: 'nora@reset-egypt.com', password: '123.resetnora', role: 'SECRETARY' },
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
      data: { email: 'direction@reset-egypt.com', password: '123.resetdirection' },
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
