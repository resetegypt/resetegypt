// ============================================================================
// workflows.spec.ts — Tests E2E des workflows métier critiques.
//
// READ-ONLY tests : on ne crée/modifie pas de données en prod.
// Pour les tests qui mutent, voir mutations.spec.ts (à créer avec une DB de test).
// ============================================================================

import { test, expect, request } from '@playwright/test';

const API = process.env.PLAYWRIGHT_API_URL ?? 'https://api.reset-egypt.com';
const DEFAULT_PWD = process.env.E2E_PASSWORD ?? '123.reset';

async function loginAdmin() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/auth/login`, {
    data: { email: 'direction@reset-egypt.com', password: DEFAULT_PWD },
  });
  expect(res.status()).toBe(200);
  return ctx;
}

async function loginPractitioner() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/auth/login`, {
    data: { email: 'dr.ahmadalashry@reset-egypt.com', password: DEFAULT_PWD },
  });
  expect(res.status()).toBe(200);
  return ctx;
}

async function loginSecretary() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/auth/login`, {
    data: { email: 'sara@reset-egypt.com', password: DEFAULT_PWD },
  });
  expect(res.status()).toBe(200);
  return ctx;
}

test.describe('API · Workflows métier (read-only)', () => {
  test('admin lit les KPIs globaux', async () => {
    const ctx = await loginAdmin();
    const res = await ctx.get(`${API}/admin/kpis`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Format de réponse réel: { active, locked, recentFailed, total }
    expect(body).toHaveProperty('active');
    expect(body).toHaveProperty('total');
    expect(typeof body.active).toBe('number');
    expect(typeof body.total).toBe('number');
    expect(body.active).toBeGreaterThan(0);
  });

  test('admin lit la liste des praticiens', async () => {
    const ctx = await loginAdmin();
    const res = await ctx.get(`${API}/practitioners`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const practitioners = body.practitioners ?? body;
    expect(Array.isArray(practitioners)).toBe(true);
    expect(practitioners.length).toBeGreaterThan(0);
    expect(practitioners.some((p: { firstName?: string }) => p.firstName === 'Ahmad')).toBe(true);
  });

  test('admin liste les patients (paginé)', async () => {
    const ctx = await loginAdmin();
    const res = await ctx.get(`${API}/patients?limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('patients');
    expect(Array.isArray(body.patients)).toBe(true);
  });

  test('praticien lit les RDV du jour', async () => {
    const ctx = await loginPractitioner();
    const res = await ctx.get(`${API}/appointments/today`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const appts = Array.isArray(body) ? body : body.appointments ?? [];
    expect(Array.isArray(appts)).toBe(true);
  });

  test('secrétaire lit les conversations Inbox', async () => {
    const ctx = await loginSecretary();
    const res = await ctx.get(`${API}/messages/conversations`);
    expect(res.status()).toBe(200);
  });

  test('praticien NE peut PAS accéder aux KPIs admin (403)', async () => {
    const ctx = await loginPractitioner();
    const res = await ctx.get(`${API}/admin/kpis`);
    expect([401, 403]).toContain(res.status());
  });

  test('secrétaire NE peut PAS accéder aux KPIs admin (403)', async () => {
    const ctx = await loginSecretary();
    const res = await ctx.get(`${API}/admin/kpis`);
    expect([401, 403]).toContain(res.status());
  });

  test('booking public — slots dispo (no auth)', async () => {
    const ctx = await request.newContext();
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const res = await ctx.get(`${API}/booking/slots?date=${tomorrow}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('slots');
    expect(Array.isArray(body.slots)).toBe(true);
    expect(body.slots.length).toBe(18); // 18 créneaux/jour
  });

  test('automation workflows existent', async () => {
    const ctx = await loginAdmin();
    const res = await ctx.get(`${API}/automation-workflows`);
    expect(res.status()).toBe(200);
  });
});
