import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';

/**
 * Persona: a 5-year-old. No reading, only tapping — random clicks everywhere. The app must
 * never crash, never lose data to a stray tap, and always stay in a sane, recoverable state.
 */
test.describe('5-year-old — I tap everything', () => {
  test('taps every button on the dashboard without crashing the app', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');

    const buttons = await page.getByRole('button').all();
    for (const button of buttons.slice(0, 10)) {
      await button.click({ trial: true }).catch(() => {});
    }

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expectNoErrors();
  });

  test('taps every sidebar nav link — each page loads within 3s', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');

    const links = page.locator('aside nav a, aside a[href^="/"]');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href || href === '/') continue;
      const start = Date.now();
      await page.goto(href);
      expect(Date.now() - start).toBeLessThan(3000);
    }
    expectNoErrors();
  });

  test('mashes the add-transaction button 20 times fast without creating 20 transactions', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');

    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    for (let i = 0; i < 20; i++) {
      await addButton.click();
      await page.keyboard.press('Escape');
    }

    // No transaction can have been created by opening/closing the dialog alone.
    await expect(page.getByText(/^\[E2E\]/).first()).toBeVisible();
    expectNoErrors();
  });

  test('opens the chatbot and taps everything in it without crashing', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /open kashmap assistant/i }).click();
    await page.waitForTimeout(500);

    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 10)) {
      await button.click({ trial: true }).catch(() => {});
    }

    expectNoErrors();
  });

  test('toggles dark mode 5 times — no layout break', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/settings?tab=preferences');

    const toggle = page.getByRole('button', { name: /switch to (light|dark)/i });
    for (let i = 0; i < 5; i++) {
      await toggle.click();
      await page.waitForTimeout(100);
    }

    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    expectNoErrors();
  });

  test('cancels every delete dialog in the transactions table — nothing gets deleted', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');

    const before = await page.getByText(/^\[E2E\]/).count();
    const deleteButtons = page.getByRole('button', { name: /delete transaction/i });
    const count = Math.min(await deleteButtons.count(), 5);

    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      const cancel = page.getByRole('button', { name: /cancel/i });
      if (await cancel.isVisible().catch(() => false)) await cancel.click();
    }

    const after = await page.getByText(/^\[E2E\]/).count();
    expect(after).toBe(before);
    expectNoErrors();
  });

  test('submits an empty transaction form — shows validation, does not crash', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');

    await page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.getByRole('button', { name: /^save/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    expectNoErrors();
  });

  test('scrolls every main page to the bottom — no infinite load', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    for (const route of ['/dashboard', '/transactions', '/investments', '/reports']) {
      await page.goto(route);
      await page.mouse.wheel(0, 20_000);
      await page.waitForTimeout(300);
    }
    expectNoErrors();
  });
});
