// ============================================================================
// playwright.config.ts — config tests E2E pour le portail staff.
// Tests run contre la prod live (https://api.reset-egypt.com).
// Pour tester contre une instance locale : PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test:e2e
// ============================================================================

import { defineConfig, devices } from '@playwright/test';

const apiUrl = process.env.PLAYWRIGHT_API_URL ?? 'https://api.reset-egypt.com';
const webUrl = process.env.PLAYWRIGHT_WEB_URL ?? 'https://app.reset-egypt.com';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // sérialiser pour éviter conflits BDD partagée
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: webUrl,
    extraHTTPHeaders: {
      'x-e2e-test': '1',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  metadata: {
    apiUrl,
    webUrl,
  },
});
