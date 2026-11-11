import { supabaseAdmin, getTestUserId } from './supabaseAdmin';

/**
 * Deletes every row this test user owns whose relevant text field starts with "[E2E]" — run in
 * afterEach (or afterAll, for tests that don't mutate data) so one test's data never leaks into
 * the next. Accounts are deleted last since transactions/goals don't reference them by name but
 * do by id, and deleting an account first would 23503 on any transaction still pointing at it.
 */
export async function cleanupTestData() {
  const admin = supabaseAdmin();
  const userId = await getTestUserId();

  // Find all E2E test accounts so any transactions referencing them are deleted first
  const { data: e2eAccounts } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .like('name', '[E2E]%');

  if (e2eAccounts && e2eAccounts.length > 0) {
    const accountIds = e2eAccounts.map((a) => a.id);
    await admin.from('transactions').delete().eq('user_id', userId).in('from_account_id', accountIds);
    await admin.from('transactions').delete().eq('user_id', userId).in('to_account_id', accountIds);
    await admin.from('investment_log').delete().eq('user_id', userId).in('linked_account_id', accountIds);
  }

  await admin.from('transactions').delete().eq('user_id', userId).like('notes', '[E2E]%');
  await admin.from('transactions').delete().eq('user_id', userId).like('notes', '%via Investment Log%');
  await admin.from('goals').delete().eq('user_id', userId).like('goal_name', '[E2E]%');
  await admin.from('investment_log').delete().eq('user_id', userId).like('notes', '[E2E]%');
  await admin.from('investment_log').delete().eq('user_id', userId).like('notes', '[INTEGRATION]%');
  await admin.from('insurance_policies').delete().eq('user_id', userId).like('insurer', '[E2E]%');
  // Accounts last — now safe to delete without foreign key constraint violations
  await admin.from('accounts').delete().eq('user_id', userId).like('name', '[E2E]%');
}
