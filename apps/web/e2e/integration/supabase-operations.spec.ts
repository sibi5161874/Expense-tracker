import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import { createInvestmentLog, createInvestmentLogsBulk } from '@repo/shared/queries/investmentLog';
import { supabaseAdmin } from '../helpers/supabaseAdmin';

/**
 * Suite: Database & Supabase Operations Integration Tests
 * Verifies:
 * 1. createInvestmentLog mirrors BUY as Expense in transactions table
 * 2. createInvestmentLog mirrors SELL as Income in transactions table
 * 3. createInvestmentLogsBulk mirrors multiple entries accurately
 * 4. RLS isolation: User A cannot read User B's transactions
 * 5. RLS isolation: User A cannot mutate User B's account balance
 */
test.describe('supabase-operations — DB integration & RLS isolation', () => {
  let admin: ReturnType<typeof supabaseAdmin>;
  let userAId: string;
  let userAClient: ReturnType<typeof createClient<Database>>;
  let userBClient: ReturnType<typeof createClient<Database>>;
  let userAAccountId: string;

  test.beforeAll(async () => {
    admin = supabaseAdmin();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const emailA = process.env.TEST_USER_EMAIL!;
    const passwordA = process.env.TEST_USER_PASSWORD!;
    const emailB = process.env.TEST_HACKER_EMAIL!;
    const passwordB = process.env.TEST_HACKER_PASSWORD!;

    // Authenticate client for User A
    userAClient = createClient<Database>(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: authA, error: errA } = await userAClient.auth.signInWithPassword({ email: emailA, password: passwordA });
    if (errA || !authA.user) throw errA ?? new Error('Failed to sign in User A');
    userAId = authA.user.id;

    // Authenticate client for User B (Hacker)
    userBClient = createClient<Database>(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: authB, error: errB } = await userBClient.auth.signInWithPassword({ email: emailB, password: passwordB });
    if (errB || !authB.user) throw errB ?? new Error('Failed to sign in User B');
    expect(authB.user.id).toBeDefined();

    // Fetch or create an account for User A
    const { data: accA } = await admin
      .from('accounts')
      .select('id')
      .eq('user_id', userAId)
      .eq('name', '[E2E] Checking')
      .single();
    if (accA) {
      userAAccountId = accA.id;
    } else {
      const { data: createdAcc } = await admin
        .from('accounts')
        .insert({ user_id: userAId, name: '[E2E] Checking', type: 'Bank', opening_balance: 100_000 })
        .select('id')
        .single();
      userAAccountId = createdAcc!.id;
    }
  });

  test.afterEach(async () => {
    await admin.from('transactions').delete().eq('user_id', userAId).like('notes', '[INTEGRATION]%');
    await admin.from('transactions').delete().eq('user_id', userAId).like('notes', '%via Investment Log%');
    await admin.from('investment_log').delete().eq('user_id', userAId).like('notes', '[INTEGRATION]%');
  });

  test.afterAll(async () => {
    await admin.from('transactions').delete().eq('user_id', userAId).like('notes', '[INTEGRATION]%');
    await admin.from('transactions').delete().eq('user_id', userAId).like('notes', '%via Investment Log%');
    await admin.from('investment_log').delete().eq('user_id', userAId).like('notes', '[INTEGRATION]%');
  });

  test('1. createInvestmentLog mirrors BUY as an Expense in transactions table', async () => {
    const logEntry = await createInvestmentLog(userAClient, userAId, {
      date: '2026-02-10',
      action: 'BUY',
      symbol: 'INFY',
      exchange: 'NSE',
      asset_type: 'Stock',
      quantity: 10,
      price: 1500,
      fees: 25,
      linked_account_id: userAAccountId,
      notes: '[INTEGRATION] Buy INFY with mirror',
    });

    expect(logEntry).toBeTruthy();
    expect(logEntry.id).toBeDefined();

    // Verify mirrored transaction row in `transactions`
    const { data: mirrored, error } = await userAClient
      .from('transactions')
      .select('*')
      .eq('user_id', userAId)
      .eq('from_account_id', userAAccountId)
      .like('notes', '%Bought 10 INFY%')
      .single();

    expect(error).toBeNull();
    expect(mirrored).toBeTruthy();
    expect(mirrored?.type).toBe('Expense');
    expect(mirrored?.amount).toBe(15025); // 10 * 1500 + 25
  });

  test('2. createInvestmentLog mirrors SELL as Income in transactions table', async () => {
    const logEntry = await createInvestmentLog(userAClient, userAId, {
      date: '2026-02-11',
      action: 'SELL',
      symbol: 'TCS',
      exchange: 'NSE',
      asset_type: 'Stock',
      quantity: 5,
      price: 3000,
      fees: 50,
      linked_account_id: userAAccountId,
      notes: '[INTEGRATION] Sell TCS with mirror',
    });

    expect(logEntry).toBeTruthy();

    const { data: mirrored, error } = await userAClient
      .from('transactions')
      .select('*')
      .eq('user_id', userAId)
      .eq('from_account_id', userAAccountId)
      .like('notes', '%Sold 5 TCS%')
      .single();

    expect(error).toBeNull();
    expect(mirrored).toBeTruthy();
    expect(mirrored?.type).toBe('Income');
    expect(mirrored?.amount).toBe(14950); // 5 * 3000 - 50
  });

  test('3. createInvestmentLogsBulk creates mirrored rows in batch', async () => {
    const rows = [
      {
        date: '2026-02-12',
        action: 'BUY' as const,
        symbol: 'WIPRO',
        exchange: 'NSE',
        asset_type: 'Stock' as const,
        quantity: 100,
        price: 400,
        fees: 20,
        linked_account_id: userAAccountId,
        notes: '[INTEGRATION] Bulk BUY Wipro',
      },
      {
        date: '2026-02-12',
        action: 'BUY' as const,
        symbol: 'HCLTECH',
        exchange: 'NSE',
        asset_type: 'Stock' as const,
        quantity: 50,
        price: 1200,
        fees: 30,
        linked_account_id: userAAccountId,
        notes: '[INTEGRATION] Bulk BUY HCL',
      },
    ];

    const inserted = await createInvestmentLogsBulk(userAClient, userAId, rows);
    expect(inserted).toHaveLength(2);

    const { data: mirrored, error } = await userAClient
      .from('transactions')
      .select('*')
      .eq('user_id', userAId)
      .in('notes', [
        'Bought 100 WIPRO @ ₹400 via Investment Log',
        'Bought 50 HCLTECH @ ₹1200 via Investment Log',
      ]);

    expect(error).toBeNull();
    expect(mirrored).toHaveLength(2);
  });

  test('4. RLS isolation: User B cannot read User A transactions', async () => {
    // Seed a transaction owned by User A
    const { data: userATx } = await admin
      .from('transactions')
      .insert({
        user_id: userAId,
        date: '2026-02-15',
        type: 'Expense',
        amount: 9999,
        from_account_id: userAAccountId,
        notes: '[INTEGRATION] Secret Transaction',
      })
      .select('id')
      .single();

    expect(userATx).toBeTruthy();

    // Query as User B (Hacker)
    const { data: readAttempt } = await userBClient
      .from('transactions')
      .select('*')
      .eq('id', userATx!.id);

    // RLS filters out rows owned by other users -> returns empty array
    expect(readAttempt).toEqual([]);
  });

  test('5. RLS isolation: User B cannot mutate User A account balance', async () => {
    await userBClient
      .from('accounts')
      .update({ opening_balance: 0 })
      .eq('id', userAAccountId);

    // Either 0 rows affected or rejected by policy
    const { data: verified } = await admin
      .from('accounts')
      .select('opening_balance')
      .eq('id', userAAccountId)
      .single();

    expect(verified?.opening_balance).toBe(100_000);
  });
});
