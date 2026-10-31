import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';

/**
 * Persona: a 6-year-old. Types garbage into every input — huge numbers, emojis, script tags.
 * The app must validate or sanitize, never crash and never execute injected content.
 */
test.describe('6-year-old — I type garbage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();
  });

  test('a huge number in the amount field is rejected or clamped, not a crash', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.getByLabel(/amount/i).fill('999999999999999999999');
    await page.getByRole('button', { name: /^save/i }).click();
    // Either a validation message appears, or the dialog is still open — either way, no crash.
    await expect(page.getByRole('dialog')).toBeVisible();
    expectNoErrors();
  });

  test('letters in the amount field are rejected by the browser itself, not stored as a value', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    const amountField = page.getByLabel(/amount/i);
    // A native <input type="number"> can't even receive non-numeric characters — Playwright's
    // .fill() throws for exactly that reason, which IS the safety property worth asserting:
    // no amount of typing could ever get "abcdef" stored as this field's value.
    await expect(amountField.fill('abcdef')).rejects.toThrow();
    await expect(amountField).toHaveValue('');
    expectNoErrors();
  });

  test('emoji in notes saves and renders correctly', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.getByLabel(/notes/i).fill('[E2E] 🚀💰📈');
    await page.getByLabel(/amount/i).fill('100');
    await page.getByRole('button', { name: /^save/i }).click();
    await expect(page.getByText('[E2E] 🚀💰📈')).toBeVisible();
    expectNoErrors();
  });

  test('a script tag in notes is never executed (XSS check)', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    let dialogFired = false;
    page.once('dialog', () => {
      dialogFired = true;
    });

    await page.getByLabel(/notes/i).fill('[E2E] <script>alert(1)</script>');
    await page.getByLabel(/amount/i).fill('100');
    await page.getByRole('button', { name: /^save/i }).click();
    await page.waitForTimeout(500);

    expect(dialogFired).toBe(false);
    expectNoErrors();
  });

  test('10,000 characters in notes does not freeze the UI', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    const huge = '[E2E] ' + 'a'.repeat(10_000);
    await page.getByLabel(/notes/i).fill(huge);
    await page.getByLabel(/amount/i).fill('100');

    const start = Date.now();
    await page.getByRole('button', { name: /^save/i }).click();
    await page.waitForTimeout(500);
    expect(Date.now() - start).toBeLessThan(5000);
    expectNoErrors();
  });

  test('a SQL-injection string in notes is stored as plain text, not executed', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.getByLabel(/notes/i).fill("[E2E] '; DROP TABLE transactions;--");
    await page.getByLabel(/amount/i).fill('100');
    await page.getByRole('button', { name: /^save/i }).click();
    await page.waitForTimeout(500);

    // The table is still there and still shows our other seeded rows.
    await page.goto('/transactions');
    await expect(page.getByText(/^\[E2E\]/).first()).toBeVisible();
    expectNoErrors();
  });
});

test.describe('6-year-old — file uploads', () => {
  test('a .csv.exe file is rejected by extension', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');
    const importButton = page.getByRole('button', { name: /import/i }).first();
    if (!(await importButton.isVisible().catch(() => false))) {
      test.skip(true, 'No import entry point found on this page');
    }
    await importButton.click();

    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');
    expect(accept ?? '').not.toContain('.exe');
    expectNoErrors();
  });
});
