// ============================================================================
// public-site.spec.ts — Tests E2E des sites publics (marketing + booking).
//
// Vérifie l'i18n (FR / EN / AR), l'accessibilité basique, et la responsivité.
// ============================================================================

import { test, expect } from '@playwright/test';

const SITE = 'https://reset-egypt.com';
const BOOK = 'https://book.reset-egypt.com';

test.describe('Marketing site · public', () => {
  test('homepage (default AR) HTTP 200', async ({ page }) => {
    await page.goto(SITE);
    await expect(page).toHaveTitle(/RESET/i);
  });

  test('FR services smoking — contenu français', async ({ page }) => {
    await page.goto(`${SITE}/fr/services/smoking`);
    await expect(page.locator('body')).toContainText('Arrêtez de fumer');
  });

  test('EN services smoking — contenu anglais', async ({ page }) => {
    await page.goto(`${SITE}/en/services/smoking`);
    await expect(page.locator('body')).toContainText('Quit smoking');
  });

  test('AR services smoking — contenu arabe + RTL', async ({ page }) => {
    await page.goto(`${SITE}/ar/services/smoking`);
    await expect(page.locator('body')).toContainText('أقلع عن التدخين');
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('about pages en 3 langues', async ({ page }) => {
    await page.goto(`${SITE}/fr/about`);
    await expect(page.locator('body')).toContainText('héritage scientifique');

    await page.goto(`${SITE}/en/about`);
    await expect(page.locator('body')).toContainText('scientific heritage');

    await page.goto(`${SITE}/ar/about`);
    await expect(page.locator('body')).toContainText('إرث علمي');
  });

  test('contact page accessible', async ({ page }) => {
    await page.goto(`${SITE}/fr/contact`);
    await expect(page.locator('body')).toContainText('CMC');
    await expect(page.locator('body')).toContainText('Teseen');
  });

  test('mobile responsive — débordement contenu < 50px (tolérance images/ornements)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${SITE}/fr`);
    // Wait images load (les blur orbs peuvent déborder légèrement de façon visible)
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    const viewportWidth = 375;
    const overflow = bodyWidth - viewportWidth;
    // Tolérance 50px pour les ornements visuels (blur orbs, gradients) qui peuvent légèrement déborder
    // Le test échoue si la page débroge VRAIMENT (>50px = layout cassé)
    expect(overflow).toBeLessThan(50);
  });
});

test.describe('Booking site · public', () => {
  test('book.reset-egypt.com répond', async ({ page }) => {
    await page.goto(BOOK);
    // La page de booking devrait charger sans erreur
    await expect(page.locator('body')).toBeVisible();
  });
});
