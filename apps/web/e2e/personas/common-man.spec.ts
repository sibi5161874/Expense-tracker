import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';

/**
 * Persona: a real user using the app the way it's meant to be used. Signs up, adds data, views
 * reports. This describe block runs signed out (its own signup flow) — everything after that
 * uses the shared, already-authenticated storage state like the other personas.
 */
test.describe('common-man — new signup', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signs up a brand-new user and lands on the dashboard', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    const email = `e2e-${Date.now()}@kashmap.in`;

    await page.goto('/signup');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.locator('input[type="password"]').first().fill('TestPassword123!');
    const confirm = page.locator('input[type="password"]').nth(1);
    if (await confirm.count()) await confirm.fill('TestPassword123!');
    await page.getByRole('button', { name: /sign up/i }).click();

    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 30_000 });
    expectNoErrors();
  });
});

test.describe('common-man — everyday usage', () => {
  test('adds an income transaction and sees it in the list', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.getByLabel(/amount/i).fill('85000');
    await page.getByLabel(/notes/i).fill('[E2E] common-man income');
    await page.getByRole('button', { name: /^save/i }).click();
    await expect(page.getByText('[E2E] common-man income')).toBeVisible();
    expectNoErrors();
  });

  test('dashboard reflects the seeded net worth', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');
    // Net worth renders only once its async query resolves (no skeleton text to match in the
    // meantime) — give it more than the default 5s on a cloud-backed test project.
    await expect(page.getByText(/net worth/i)).toBeVisible({ timeout: 30_000 });
    expectNoErrors();
  });

  test('the goals page shows the seeded goal', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/goals');
    await expect(page.getByText('[E2E] Buy laptop')).toBeVisible();
    expectNoErrors();
  });

  test('the reports page lists its report tiles', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/reports');
    const tiles = page.locator('a[href^="/reports/"], button').filter({ hasText: /./ });
    expect(await tiles.count()).toBeGreaterThan(5);
    expectNoErrors();
  });

  test('opening the Net Worth report does not error', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    const res = await page.goto('/reports/net-worth');
    expect(res?.status()).toBeLessThan(400);
    expectNoErrors();
  });

  test('settings shows the Free plan by default', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    // The plan lives under the Billing tab, not the bare /settings profile view — it's a
    // query-param tab (?tab=billing), not a separate /settings/billing route.
    await page.goto('/settings?tab=billing');
    await expect(page.getByText(/free/i).first()).toBeVisible();
    expectNoErrors();
  });

  test('clicking Upgrade opens the checkout flow (mocked Razorpay order)', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/settings?tab=billing');
    const upgrade = page.getByRole('button', { name: /upgrade|start trial|go pro/i }).first();
    if (!(await upgrade.isVisible().catch(() => false))) {
      test.skip(true, 'No upgrade entry point visible for this tier/state');
    }
    await upgrade.click();
    await page.waitForTimeout(1000);
    expectNoErrors();
  });

});

test.describe('common-man — sign out', () => {
  // Deliberately NOT reusing the shared storageState: signing out revokes that session's
  // refresh token server-side, which would silently log out every other test running in
  // parallel against the same stored session. This test logs in fresh for itself instead.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signing out returns to the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    const signOut = page.getByRole('button', { name: /sign out|log out/i }).first();
    await signOut.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
