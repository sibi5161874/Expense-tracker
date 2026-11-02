import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';
import { createInvestmentLog } from './createInvestmentLog';

/** Minimal fake of the Supabase fluent builder — just enough of `.from().insert().select()
 * .single()`, `.select().eq().eq().eq().maybeSingle()`, and `.delete().eq()` for the three
 * tables createInvestmentLog touches (investment_log, categories, transactions). Not a real
 * query engine: each table's shape is hand-wired to the exact chain createInvestmentLog calls. */
function createMockSupabase(opts: {
  categoryExisting?: { id: string } | null;
  transactionInsertError?: { message: string } | null;
} = {}) {
  const calls = {
    transactionInserts: [] as Record<string, unknown>[],
    investmentLogDeletes: [] as string[],
    categoryInserts: [] as Record<string, unknown>[],
  };

  function from(table: string) {
    if (table === 'investment_log') {
      return {
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => ({ data: { id: 'inv-1', ...payload }, error: null }),
          }),
        }),
        delete: () => ({
          eq: async (_col: string, id: string) => {
            calls.investmentLogDeletes.push(id);
            return { error: null };
          },
        }),
      };
    }
    if (table === 'categories') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.categoryExisting ?? null, error: null }),
              }),
            }),
          }),
        }),
        insert: (payload: Record<string, unknown>) => {
          calls.categoryInserts.push(payload);
          return {
            select: () => ({
              single: async () => ({ data: { id: 'cat-new' }, error: null }),
            }),
          };
        },
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
const baseInput: InvestmentLogInput = {
  date: '2026-01-05',
  symbol: 'RELIANCE',
  exchange: 'NSE',
  action: 'BUY',
  quantity: 10,
  price: 2500,
  fees: 20,
  linked_account_id: '11111111-1111-1111-1111-111111111111',
  asset_type: 'Stock',
};

describe('createInvestmentLog', () => {
  it('creates a matching Expense transaction when linked_account_id is provided (BUY)', async () => {
    const { client, calls } = createMockSupabase({ categoryExisting: { id: 'cat-existing' } });

    const result = await createInvestmentLog(client, userId, baseInput);

    expect(result.id).toBe('inv-1');
    expect(calls.transactionInserts).toHaveLength(1);
    expect(calls.transactionInserts[0]).toMatchObject({
      user_id: userId,
      type: 'Expense',
      amount: 25020,
      from_account_id: baseInput.linked_account_id,
      category_id: 'cat-existing',
    });
  });

  it('creates the "Investments" category on first use when none exists yet', async () => {
    const { client, calls } = createMockSupabase({ categoryExisting: null });

    await createInvestmentLog(client, userId, baseInput);

    expect(calls.categoryInserts).toHaveLength(1);
    expect(calls.categoryInserts[0]).toMatchObject({ user_id: userId, name: 'Investments', type: 'Expense' });
    expect(calls.transactionInserts[0]).toMatchObject({ category_id: 'cat-new' });
  });

  it('creates a matching Income transaction for a SELL', async () => {
    const { client, calls } = createMockSupabase({ categoryExisting: { id: 'cat-existing' } });

    await createInvestmentLog(client, userId, { ...baseInput, action: 'SELL' });

    expect(calls.transactionInserts[0]).toMatchObject({ type: 'Income', amount: 24980 });
  });

  it('never creates a transaction for BONUS — no cash changes hands', async () => {
    const { client, calls } = createMockSupabase();

    await createInvestmentLog(client, userId, { ...baseInput, action: 'BONUS', bonus_split_extra_units: 5 });

    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('never creates a transaction for SPLIT — no cash changes hands', async () => {
    const { client, calls } = createMockSupabase();

    await createInvestmentLog(client, userId, { ...baseInput, action: 'SPLIT', bonus_split_extra_units: 5 });

    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('never creates a transaction when no account is linked', async () => {
    const { client, calls } = createMockSupabase();

    // Bypasses the form/schema's "linked account is required" rule on purpose — this is the
    // query layer's own defensive guard for any caller (e.g. a future import path) that
    // doesn't go through the zod-validated form.
    await createInvestmentLog(client, userId, { ...baseInput, linked_account_id: '' as InvestmentLogInput['linked_account_id'] });

    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('rolls back the investment_log row if the mirrored transaction insert fails', async () => {
    const { client, calls } = createMockSupabase({
      categoryExisting: { id: 'cat-existing' },
      transactionInsertError: { message: 'insert failed' },
    });

    await expect(createInvestmentLog(client, userId, baseInput)).rejects.toMatchObject({ message: 'insert failed' });
    expect(calls.investmentLogDeletes).toEqual(['inv-1']);
  });
});
