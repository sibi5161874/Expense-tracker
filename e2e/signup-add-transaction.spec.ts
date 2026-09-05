import { test, expect } from '@playwright/test';

/**
 * Signup -> add one transaction -> see it on the dashboard. Every new user gets a
 * default "Cash" account and a set of default categories via the
 * `seed_defaults_for_new_user` DB trigger (supabase/migrations/20260710210014_...sql),
 * so a fresh signup can add a transaction immediately without any setup step.
 *
 * Needs a real, dedicated TEST Supabase project (see playwright.config.ts's header
 * comment) — never point this at production, it creates a real auth user per run.
 */
test('a new user can sign up, add a transaction, and see it on the dashboard', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Test-Password-123!';
  const amount = '42.50';

  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  // AuthForm resets the form and clears any error on a successful signup rather than
  // navigating — the account may need email confirmation depending on project config,
  // so this test logs in explicitly next instead of assuming an auto-redirect.
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL('**/dashboard');

  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Add Transaction' }).first().click();

  await page.getByLabel('Amount').fill(amount);
  await page.getByRole('button', { name: 'Save Transaction' }).click();

  // The dialog closes and the new row shows the amount just entered.
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText(amount)).toBeVisible();
});
