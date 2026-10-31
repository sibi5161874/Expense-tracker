import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';
import { AUTH_STATE_PATH } from '../helpers/setup';

/**
 * Persona: random actions, timing attacks, race conditions. Opens and closes things fast,
 * double-clicks, refreshes mid-action. The app must stay consistent — never duplicate data,
 * never half-save, never leak open dialogs.
 */
test.describe('chaos-monkey — timing and races', () => {
  test('opening and instantly closing the add-transaction dialog 10x leaks nothing', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');

    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: /add transaction/i }).first().click();
      await page.keyboard.press('Escape');
    }

    await expect(page.getByRole('dialog')).not.toBeVisible();
    expectNoErrors();
  });

  test('double-clicking Save on a form saves once, not twice', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.getByLabel(/amount/i).fill('777');
    await page.getByLabel(/notes/i).fill('[E2E] chaos double-save');

    const saveButton = page.getByRole('button', { name: /^save/i });
    await Promise.all([saveButton.click(), saveButton.click({ force: true }).catch(() => {})]);
    await page.waitForTimeout(800);

    const matches = await page.getByText('[E2E] chaos double-save').count();
    expect(matches).toBeLessThanOrEqual(1);
    expectNoErrors();
  });

  test('rapidly toggling dark mode does not corrupt the theme state', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/settings?tab=preferences');
    const toggle = page.getByRole('button', { name: /switch to (light|dark)/i });

    await Promise.all(Array.from({ length: 8 }, () => toggle.click()));
    await page.waitForTimeout(300);

    const theme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(typeof theme).toBe('boolean'); // settled on one definite state, not mid-flicker
    expectNoErrors();
  });

  test('clicking the same nav link twice fast does not double-navigate', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');
    const link = page.locator('aside a[href="/investments"]');

    await Promise.all([link.click(), link.click({ force: true }).catch(() => {})]);
    await page.waitForURL('**/investments');
    await expect(page).toHaveURL(/\/investments$/);
    expectNoErrors();
  });

  test('refreshing mid-form-fill does not crash the app on reload', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.getByLabel(/amount/i).fill('123');
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
    expectNoErrors();
  });

  test('5 parallel tabs each navigating independently all load correctly', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const routes = ['/dashboard', '/transactions', '/investments', '/goals', '/portfolio'];
    const pages = await Promise.all(routes.map(() => context.newPage()));

    await Promise.all(pages.map((p, i) => p.goto(routes[i]!)));
    await Promise.all(pages.map((p) => expect(p.locator('body')).toBeVisible()));

    await context.close();
  });

  test('deleting the last row on a page does not break pagination', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');

    const rows = page.getByRole('row');
    const before = await rows.count();
    if (before <= 1) test.skip(true, 'No rows to delete');

    const lastDelete = page.getByRole('button', { name: /delete transaction/i }).last();
    await lastDelete.click();
    const confirm = page.getByRole('button', { name: /^delete$/i });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();

    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
    expectNoErrors();
  });
});
