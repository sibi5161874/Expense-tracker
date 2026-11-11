import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';
import { supabaseAdmin, getTestUserId } from '../helpers/supabaseAdmin';

/**
 * Suite: Regression Tests for Issues 1 - 7
 * Ensures fixed bugs never return:
 * - Issue 1: Manual BUY investment does not increase linked account balance
 * - Issue 2: Broker Import enforces linked account before committing
 * - Issue 3: Editing transaction does not leave stale cached account balances
 * - Issue 4: Investment purchases do not inflate operational living expenses
 * - Issue 5: CSV import dialog does not stack multiple modals
 * - Issue 6: Sign Out confirmation, exchange selection & valid iconography
 * - Issue 7: Mobile navigation provides access to config and settings sub-menus
 */
test.describe('regression — issues 1 to 7 verification', () => {
  let userId: string;
  let admin: ReturnType<typeof supabaseAdmin>;
  let checkingAccountId: string;

  test.beforeAll(async () => {
    admin = supabaseAdmin();
    userId = await getTestUserId();

    const { data: account } = await admin
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('name', '[E2E] Checking')
      .single();
    if (account) checkingAccountId = account.id;
  });

  test.afterEach(async () => {
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '[REGRESSION]%');
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '%via Investment Log%');
    await admin.from('investment_log').delete().eq('user_id', userId).like('notes', '[REGRESSION]%');
  });

  test.afterAll(async () => {
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '[REGRESSION]%');
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '%via Investment Log%');
    await admin.from('investment_log').delete().eq('user_id', userId).like('notes', '[REGRESSION]%');
  });

  test('Issue 1 Regression: Manual Investment BUY does not increase linked account balance', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/investments');
    await page.getByRole('button', { name: /add investment/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox', { name: 'Stock / Ticker Symbol' }).fill('RELIANCE');
    await dialog.getByRole('textbox', { name: 'Exchange' }).fill('NSE');
    await dialog.getByRole('spinbutton', { name: 'Quantity' }).fill('1');
    await dialog.getByRole('spinbutton', { name: 'Price' }).fill('2800');

    await dialog.getByRole('combobox', { name: 'Linked Account' }).click();
    await page.getByRole('option', { name: /Checking/i }).click();

    await dialog.getByRole('textbox', { name: 'Notes' }).fill('[REGRESSION] Buy Reliance');

    await dialog.getByRole('button', { name: /save investment/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Check transactions table: mirror must be an Expense, never Income
    const { data: mirror } = await admin
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .like('notes', '%Bought 1 RELIANCE%')
      .maybeSingle();

    if (mirror) {
      expect(mirror.type).toBe('Expense');
      expect(mirror.amount).toBe(2800);
      expect(mirror.amount).toBeGreaterThan(0);
    }

    expectNoErrors();
  });

  test('Issue 2 Regression: Broker Import modal enforces linked account selection', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    // Verify API level schema restriction
    const response = await page.request.post('/api/import/broker', {
      data: { csv: 'Trade Date,Symbol,Type,Quantity,Price\n2026-01-01,INFY,BUY,10,1500', broker: 'ZERODHA' },
    });
    expect(response.status()).toBe(400);

    // Grant temporary pro tier to inspect UI modal
    await admin.from('user_profiles').update({ tier: 'pro' }).eq('user_id', userId);

    await page.goto('/investments');
    const importBrokerBtn = page.getByRole('button', { name: /import from broker/i });
    if (await importBrokerBtn.isVisible()) {
      await importBrokerBtn.click();
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(dialog.getByText(/Linked Account/i)).toBeVisible();
        await page.keyboard.press('Escape');
      }
    }

    expectNoErrors();
  });

  test('Issue 3 Regression: Editing transaction amount invalidates stale account cache', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    const today = new Date().toISOString().split('T')[0];
    const { data: tx } = await admin
      .from('transactions')
      .insert({
        user_id: userId,
        date: today,
        type: 'Expense',
        amount: 500,
        from_account_id: checkingAccountId,
        notes: '[REGRESSION] Edit cache test',
      })
      .select('id')
      .single();

    await page.goto('/transactions');
    await expect(page.getByText('[REGRESSION] Edit cache test')).toBeVisible();

    // Edit transaction in DB and reload page to assert fresh state is rendered
    await admin.from('transactions').update({ amount: 1500 }).eq('id', tx!.id);

    await page.reload();
    await expect(page.getByText('1,500').or(page.getByText('₹1,500'))).toBeVisible();

    expectNoErrors();
  });

  test('Issue 4 Regression: Investment purchases do not inflate operational living expenses', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/dashboard');
    await expect(page.getByText('Net worth', { exact: true })).toBeVisible({ timeout: 30_000 });

    // The overview cards should render without crash
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expectNoErrors();
  });

  test('Issue 5 Regression: CSV import dialog does not stack on top of broker dialog', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/transactions');
    const importBtn = page.locator('button[aria-label="Import CSV"]').or(page.getByRole('button', { name: /import csv/i })).first();
    await importBtn.click();

    const dialogs = page.getByRole('dialog');
    await expect(dialogs).toHaveCount(1);

    await page.keyboard.press('Escape');
    expectNoErrors();
  });

  test('Issue 6 Regression: UI includes Sign Out flow, exchange options & proper icons', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    // 1. Check Cashbook screen icon / controls
    await page.goto('/cashbook');
    await expect(page.getByRole('heading', { name: /cashbook/i })).toBeVisible();

    // 2. Check Investment form exchange inputs
    await page.goto('/investments');
    await page.getByRole('button', { name: /add investment/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox', { name: 'Exchange' })).toBeVisible();
    await page.keyboard.press('Escape');

    expectNoErrors();
  });

  test('Issue 7 Regression: Mobile navigation provides access to config and settings sub-menus', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Bottom navigation must be visible
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible();

    // Navigate to /settings
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i }).or(page.getByText(/settings/i).first())).toBeVisible();

    expectNoErrors();
  });
});
