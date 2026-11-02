import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';
import { createCashbook } from './createCashbook';

/** Minimal fake of the Supabase fluent builder — just enough of `.from().insert().select()
 * .single()` and `.delete().eq()` for the two tables createCashbook touches (cashbook,
 * transactions). Not a real query engine: hand-wired to the exact chain createCashbook calls. */
function createMockSupabase(opts: { transactionInsertError?: { message: string } | null } = {}) {
  const calls = {
    transactionInserts: [] as Record<string, unknown>[],
    cashbookDeletes: [] as string[],
  };

  function from(table: string) {
    if (table === 'cashbook') {
      return {
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => ({ data: { id: 'cb-1', ...payload }, error: null }),
          }),
        }),
        delete: () => ({
          eq: async (_col: string, id: string) => {
            calls.cashbookDeletes.push(id);
            return { error: null };
          },
        }),
      };
    }
    if (table === 'transactions') {
      return {
        insert: async (payload: Record<string, unknown>) => {
          calls.transactionInserts.push(payload);
          return { error: opts.transactionInsertError ?? null };
        },
      };
    }
    throw new Error(`createMockSupabase: unexpected table "${table}"`);
  }

  return { client: { from } as unknown as SupabaseClient<Database>, calls };
}

const userId = 'user-1';
const baseInput: CashbookInput = {
  date: '2026-01-05',
  counterparty: 'Ravi',
  flow: 'Gave',
  amount: 5000,
  account_used_id: '11111111-1111-1111-1111-111111111111',
};

describe('createCashbook', () => {
  it('creates a matching Expense transaction for "Gave" when an account is used', async () => {
    const { client, calls } = createMockSupabase();

    const result = await createCashbook(client, userId, baseInput);

    expect(result.id).toBe('cb-1');
    expect(calls.transactionInserts).toHaveLength(1);
    expect(calls.transactionInserts[0]).toMatchObject({
      user_id: userId,
      type: 'Expense',
      amount: 5000,
      from_account_id: baseInput.account_used_id,
    });
  });

  it('creates a matching Income transaction for "Received"', async () => {
    const { client, calls } = createMockSupabase();

    await createCashbook(client, userId, { ...baseInput, flow: 'Received' });

    expect(calls.transactionInserts[0]).toMatchObject({ type: 'Income', amount: 5000 });
  });

  it('never creates a transaction when no account was used', async () => {
    const { client, calls } = createMockSupabase();

    await createCashbook(client, userId, { ...baseInput, account_used_id: null });

    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('rolls back the cashbook row if the mirrored transaction insert fails', async () => {
    const { client, calls } = createMockSupabase({ transactionInsertError: { message: 'insert failed' } });

    await expect(createCashbook(client, userId, baseInput)).rejects.toMatchObject({ message: 'insert failed' });
    expect(calls.cashbookDeletes).toEqual(['cb-1']);
  });
});
