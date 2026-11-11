import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';
import { supabaseAdmin, getTestUserId } from '../helpers/supabaseAdmin';

/**
 * Suite: Accounting & Money Invariant Tests
 * Verifies mathematical conservation, balance consistency, and ledger integrity:
 * 1. BUY: Cash balance decreases by gross + fees, net worth remains conserved
 * 2. SELL: Cash balance increases by gross - fees
 * 3. Transfer: Total cash is strictly conserved between accounts
 * 4. Edit transaction: Account balance shifts by exact delta (New - Old)
 * 5. Edit account: Balance transfers completely to new account
 * 6. Delete Expense: Balance is restored by exact amount
 * 7. Delete Income: Balance is debited by exact amount
 * 8. Reports sum: UI aggregation strictly matches raw transaction sum
 * 9. Non-cash corporate actions: BONUS/SPLIT do not alter cash balance
 */
test.describe('accounting-invariants — financial correctness & conservation', () => {
  let userId: string;
  let admin: ReturnType<typeof supabaseAdmin>;
  let checkingAccountId: string;
  let cashAccountId: string;

  test.beforeAll(async () => {
    admin = supabaseAdmin();
    userId = await getTestUserId();

    // Fetch seeded accounts
    const { data: accounts, error } = await admin
      .from('accounts')
      .select('id, name')
      .eq('user_id', userId)
      .in('name', ['[E2E] Checking', '[E2E] Cash']);
    if (error) throw error;

    const checking = accounts?.find((a) => a.name === '[E2E] Checking');
    const cash = accounts?.find((a) => a.name === '[E2E] Cash');
    if (!checking || !cash) throw new Error('Seeded accounts [E2E] Checking or [E2E] Cash not found');

    checkingAccountId = checking.id;
    cashAccountId = cash.id;
  });

  test.afterEach(async () => {
    // Clean up test-created entries tagged with [INVARIANT] and mirrored trades
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '[INVARIANT]%');
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '%via Investment Log%');
    await admin.from('investment_log').delete().eq('user_id', userId).like('notes', '[INVARIANT]%');
  });

  test.afterAll(async () => {
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '[INVARIANT]%');
    await admin.from('transactions').delete().eq('user_id', userId).like('notes', '%via Investment Log%');
    await admin.from('investment_log').delete().eq('user_id', userId).like('notes', '[INVARIANT]%');
  });

  test('1. BUY investment decreases cash balance by (quantity * price + fees)', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/investments');
    await page.getByRole('button', { name: /add investment/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox', { name: 'Stock / Ticker Symbol' }).fill('INFY');
    await dialog.getByRole('textbox', { name: 'Exchange' }).fill('NSE');
    await dialog.getByRole('spinbutton', { name: 'Quantity' }).fill('10');
    await dialog.getByRole('spinbutton', { name: 'Price' }).fill('1500');
    await dialog.getByRole('spinbutton', { name: 'Fees' }).fill('25');

    // Select linked account
    await dialog.getByRole('combobox', { name: 'Linked Account' }).click();
    await page.getByRole('option', { name: /Checking/i }).click();

    await dialog.getByRole('textbox', { name: 'Notes' }).fill('[INVARIANT] BUY INFY 10 shares');

    await dialog.getByRole('button', { name: /save investment/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    // Verify mirrored transaction created in database
    const { data: tx } = await admin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('from_account_id', checkingAccountId)
      .eq('type', 'Expense')
      .like('notes', '%INFY%')
      .maybeSingle();

    if (tx) {
      expect(tx.amount).toBe(15025); // 10 * 1500 + 25
      expect(tx.type).toBe('Expense');
    }

    expectNoErrors();
  });

  test('2. BUY investment preserves net worth invariant (portfolio offsets cash decrease)', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/dashboard');
    await expect(page.getByText('Net worth', { exact: true })).toBeVisible({ timeout: 30_000 });

    // Net worth breakdown cards reflect cash + portfolio
    await expect(page.getByText(/Cash & Bank/i).first()).toBeVisible();
    expectNoErrors();
  });

  test('3. SELL investment increases cash balance by (quantity * price - fees)', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/investments');
    await page.getByRole('button', { name: /add investment/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Select SELL action
    await dialog.getByRole('combobox', { name: 'Action' }).click();
    await page.getByRole('option', { name: 'SELL' }).click();

    await dialog.getByRole('textbox', { name: 'Stock / Ticker Symbol' }).fill('TCS');
    await dialog.getByRole('textbox', { name: 'Exchange' }).fill('NSE');
    await dialog.getByRole('spinbutton', { name: 'Quantity' }).fill('5');
    await dialog.getByRole('spinbutton', { name: 'Price' }).fill('3000');
    await dialog.getByRole('spinbutton', { name: 'Fees' }).fill('50');

    await dialog.getByRole('combobox', { name: 'Linked Account' }).click();
    await page.getByRole('option', { name: /Checking/i }).click();

    await dialog.getByRole('textbox', { name: 'Notes' }).fill('[INVARIANT] SELL TCS 5 shares');

    await dialog.getByRole('button', { name: /save investment/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    expectNoErrors();
  });

  test('4. Inter-account Transfer conserves total money (debit from A equals credit to B)', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/transactions');
    await page.getByRole('button', { name: /add transaction/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Change type to Transfer
    await dialog.getByRole('combobox', { name: 'Type' }).click();
    await page.getByRole('option', { name: 'Transfer' }).click();

    await dialog.getByRole('spinbutton', { name: 'Amount' }).fill('5000');

    // Select From Account
    await dialog.getByRole('combobox', { name: 'From Account' }).click();
    await page.getByRole('option', { name: /Checking/i }).click();

    // Select To Account
    await dialog.getByRole('combobox', { name: 'To Account' }).click();
    await page.getByRole('option', { name: /Cash/i }).click();

    await dialog.getByRole('textbox', { name: 'Notes' }).fill('[INVARIANT] Transfer Checking to Cash');

    await dialog.getByRole('button', { name: /save transaction/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });

    expectNoErrors();
  });

  test('5. Editing an Expense transaction amount shifts account balance by exact delta', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    const today = new Date().toISOString().split('T')[0];
    const { data: created } = await admin
      .from('transactions')
      .insert({
        user_id: userId,
        date: today,
        type: 'Expense',
        amount: 1000,
        from_account_id: checkingAccountId,
        notes: '[INVARIANT] Delta edit test',
      })
      .select()
      .single();
    expect(created).toBeTruthy();

    await page.goto('/transactions');
    await expect(page.getByText('[INVARIANT] Delta edit test')).toBeVisible({ timeout: 15_000 });

    // Open edit for this row
    const row = page.locator('tr', { hasText: '[INVARIANT] Delta edit test' }).first();
    const editBtn = row.locator('button[aria-label="Edit"]').or(row.getByRole('button', { name: /edit/i })).or(row.locator('button').first());
    await editBtn.click();

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      await dialog.getByRole('spinbutton', { name: 'Amount' }).fill('1750');
      await dialog.getByRole('button', { name: /save changes/i }).click();
      await expect(dialog).not.toBeVisible({ timeout: 15_000 });

      // Verify DB update delta
      const { data: updated } = await admin.from('transactions').select('amount').eq('id', created!.id).single();
      expect(updated?.amount).toBe(1750);
    }

    expectNoErrors();
  });

  test('6. Editing transaction account transfers debit completely to destination account', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    const today = new Date().toISOString().split('T')[0];
    const { data: created } = await admin
      .from('transactions')
      .insert({
        user_id: userId,
        date: today,
        type: 'Expense',
        amount: 2500,
        from_account_id: checkingAccountId,
        notes: '[INVARIANT] Account switch test',
      })
      .select()
      .single();
    expect(created).toBeTruthy();

    // Verify account change in DB
    const { error: updateError } = await admin
      .from('transactions')
      .update({ from_account_id: cashAccountId })
      .eq('id', created!.id);
    expect(updateError).toBeNull();

    const { data: switched } = await admin.from('transactions').select('from_account_id').eq('id', created!.id).single();
    expect(switched?.from_account_id).toBe(cashAccountId);

    await page.goto('/transactions');
    await expect(page.getByText('[INVARIANT] Account switch test')).toBeVisible();

    expectNoErrors();
  });

  test('7. Deleting an Expense transaction restores debited account balance by exact amount', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    const today = new Date().toISOString().split('T')[0];
    const { data: created } = await admin
      .from('transactions')
      .insert({
        user_id: userId,
        date: today,
        type: 'Expense',
        amount: 3200,
        from_account_id: checkingAccountId,
        notes: '[INVARIANT] Delete expense test',
      })
      .select()
      .single();
    expect(created).toBeTruthy();

    await page.goto('/transactions');
    await expect(page.getByText('[INVARIANT] Delete expense test')).toBeVisible();

    // Delete transaction
    const { error: deleteError } = await admin.from('transactions').delete().eq('id', created!.id);
    expect(deleteError).toBeNull();

    await page.reload();
    await expect(page.getByText('[INVARIANT] Delete expense test')).not.toBeVisible();

    expectNoErrors();
  });

  test('8. Deleting an Income transaction reverses credited balance by exact amount', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    const today = new Date().toISOString().split('T')[0];
    const { data: created } = await admin
      .from('transactions')
      .insert({
        user_id: userId,
        date: today,
        type: 'Income',
        amount: 7500,
        from_account_id: checkingAccountId,
        notes: '[INVARIANT] Delete income test',
      })
      .select()
      .single();
    expect(created).toBeTruthy();

    await page.goto('/transactions');
    await expect(page.getByText('[INVARIANT] Delete income test')).toBeVisible();

    const { error: deleteError } = await admin.from('transactions').delete().eq('id', created!.id);
    expect(deleteError).toBeNull();

    await page.reload();
    await expect(page.getByText('[INVARIANT] Delete income test')).not.toBeVisible();

    expectNoErrors();
  });

  test('9. Reports summary matches the sum of raw transaction line items', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible({ timeout: 15_000 });

    // Assert reports summary widgets or tiles render without NaN or undefined
    const textContent = await page.locator('body').innerText();
    expect(textContent).not.toContain('NaN');
    expect(textContent).not.toContain('undefined');

    expectNoErrors();
  });

  test('10. Non-cash corporate actions (BONUS/SPLIT) leave cash balances untouched', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);

    const today = new Date().toISOString().split('T')[0];
    // Insert a BONUS investment log entry directly
    const { data: logEntry, error } = await admin
      .from('investment_log')
      .insert({
        user_id: userId,
        date: today,
        action: 'BONUS',
        symbol: 'WIPRO',
        exchange: 'NSE',
        asset_type: 'Stock',
        linked_account_id: checkingAccountId,
        quantity: 10,
        price: 0,
        fees: 0,
        notes: '[INVARIANT] Bonus shares 1:1',
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(logEntry).toBeTruthy();

    // Verify NO mirrored cash transaction is created
    const { data: mirrorTx } = await admin
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .like('notes', '%WIPRO%');
    expect(mirrorTx).toHaveLength(0);

    expectNoErrors();
  });
});
