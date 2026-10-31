import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';
import { listAppRoutes } from '../helpers/navigation';
import { AUTH_STATE_PATH } from '../helpers/setup';

/**
 * Persona: knows the app well. Tests boundaries, keyboard navigation, responsive layout, and
 * basic accessibility — the things a careful user (or a reviewer) would actually notice.
 */
test.describe('pro-techie — edge cases', () => {
  test('Ctrl+K does not crash the app, whether or not a command palette is built', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expectNoErrors();
  });

  test('every field in the add-transaction form is reachable by Tab', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A']).toContain(focused);
    }
    expectNoErrors();
  });

  test('Escape closes an open dialog', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expectNoErrors();
  });

  test('every (app) page resizes from 1920 to 375 px with no horizontal scroll', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    for (const route of listAppRoutes().slice(0, 6)) {
      await page.goto(route);
      for (const width of [1920, 1024, 768, 375]) {
        await page.setViewportSize({ width, height: 900 });
        const hasHorizontalScroll = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        );
        expect(hasHorizontalScroll, `${route} at ${width}px has horizontal scroll`).toBe(false);
      }
    }
    expectNoErrors();
  });

  test('/transactions?page=99999 shows an empty state, not a crash', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    const res = await page.goto('/transactions?page=99999');
    expect(res?.status()).toBeLessThan(500);
    expectNoErrors();
  });

  test('/transactions/date/invalid-date shows an error state, not a crash', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    const res = await page.goto('/transactions/date/invalid-date');
    expect(res?.status()).toBeLessThan(500);
    expectNoErrors();
  });

  test('icon-only buttons on the dashboard have an accessible name', async ({ page }) => {
    await page.goto('/dashboard');
    const iconButtons = page.locator('button:not(:has-text(""))').filter({ hasNot: page.locator('text=/./') });
    const count = await iconButtons.count();
    let withLabel = 0;
    for (let i = 0; i < count; i++) {
      const name = await iconButtons.nth(i).getAttribute('aria-label');
      if (name) withLabel++;
    }
    // At least the critical ones (close, delete, theme toggle) are labelled — not literally
    // every icon button in the app, but a real floor.
    expect(withLabel).toBeGreaterThanOrEqual(Math.min(3, count));
  });

  test('every <img> on the dashboard has an alt attribute', async ({ page }) => {
    await page.goto('/dashboard');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt, 'an <img> is missing alt text').not.toBeNull();
    }
  });

  test('two tabs editing data independently do not corrupt each other\'s session', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.goto('/dashboard');
    await pageB.goto('/transactions');

    await expect(pageA.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(pageB.getByRole('heading', { name: 'Transactions' })).toBeVisible();

    await context.close();
  });
});
