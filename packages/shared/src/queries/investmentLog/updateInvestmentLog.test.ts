import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';
import { updateInvestmentLog } from './updateInvestmentLog';

/** Minimal fake of the Supabase fluent builder covering exactly what updateInvestmentLog.ts
 * calls: a before-snapshot select, the investment_log update, a lookup of the existing mirror
 * by `source_investment_log_id`, category find-or-create, and the mirror
 * update/insert/delete. Not a real query engine. */
function createMockSupabase(opts: {
  before: Record<string, unknown>;
  existingMirror?: { id: string } | null;
  categoryExisting?: { id: string } | null;
  mirrorWriteError?: { message: string } | null;
} = { before: {} }) {
  const calls = {
    investmentLogUpdates: [] as Record<string, unknown>[],
    transactionUpdates: [] as { id: string; payload: Record<string, unknown> }[],
    transactionInserts: [] as Record<string, unknown>[],
    transactionDeletes: [] as string[],
  };

  function from(table: string) {
    if (table === 'investment_log') {
      let pendingUpdate: Record<string, unknown> | null = null;
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({ data: opts.before, error: null }),
            }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          pendingUpdate = payload;
          calls.investmentLogUpdates.push(payload);
          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({ data: { ...opts.before, ...pendingUpdate }, error: null }),
                }),
                // The best-effort revert path calls .update(before).eq().eq() with no further
                // chaining — awaited directly.
              }),
            }),
          };
        },
      };
    }
    if (table === 'categories') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.categoryExisting ?? { id: 'cat-existing' }, error: null }),
              }),
            }),
          }),
        }),
        insert: () => ({
          select: () => ({ single: async () => ({ data: { id: 'cat-new' }, error: null }) }),
        }),
      };
    }
    if (table === 'transactions') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: opts.existingMirror ?? null, error: null }),
            }),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (_col: string, id: string) => {
            calls.transactionUpdates.push({ id, payload });
            return { error: opts.mirrorWriteError ?? null };
          },
        }),
        insert: async (payload: Record<string, unknown>) => {
          calls.transactionInserts.push(payload);
          return { error: opts.mirrorWriteError ?? null };
        },
        delete: () => ({
          eq: async (_col: string, id: string) => {
            calls.transactionDeletes.push(id);
            return { error: opts.mirrorWriteError ?? null };
          },
        }),
      };
    }
    throw new Error(`createMockSupabase: unexpected table "${table}"`);
  }

  return { client: { from } as unknown as SupabaseClient<Database>, calls };
}

const userId = 'user-1';
const id = 'inv-1';
const before: InvestmentLogInput & { id: string; user_id: string } = {
  id,
  user_id: userId,
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

describe('updateInvestmentLog', () => {
  it('updates the existing mirror transaction in place when one is linked', async () => {
    const { client, calls } = createMockSupabase({ before, existingMirror: { id: 'txn-1' } });

    await updateInvestmentLog(client, userId, id, { quantity: 20 });

    expect(calls.transactionUpdates).toHaveLength(1);
    expect(calls.transactionUpdates[0]).toMatchObject({
      id: 'txn-1',
      payload: { type: 'Expense', amount: 50020 },
    });
    expect(calls.transactionInserts).toHaveLength(0);
    expect(calls.transactionDeletes).toHaveLength(0);
  });

  it('creates a mirror if none existed yet (e.g. linked_account_id was just added)', async () => {
    const { client, calls } = createMockSupabase({ before, existingMirror: null });

    await updateInvestmentLog(client, userId, id, {});

    expect(calls.transactionInserts).toHaveLength(1);
    expect(calls.transactionInserts[0]).toMatchObject({ source_investment_log_id: id, type: 'Expense' });
  });

  it('deletes the stale mirror when the edit moves the entry to a non-mirroring action', async () => {
    const { client, calls } = createMockSupabase({ before, existingMirror: { id: 'txn-1' } });

    await updateInvestmentLog(client, userId, id, { action: 'BONUS', bonus_split_extra_units: 5 });

    expect(calls.transactionDeletes).toEqual(['txn-1']);
    expect(calls.transactionUpdates).toHaveLength(0);
  });

  it('reverts the investment_log row if the mirror sync fails', async () => {
    const { client, calls } = createMockSupabase({
      before,
      existingMirror: { id: 'txn-1' },
      mirrorWriteError: { message: 'update failed' },
    });

    await expect(updateInvestmentLog(client, userId, id, { quantity: 20 })).rejects.toMatchObject({
      message: 'update failed',
    });
    // The first investment_log update is the real edit; the second is the revert-on-failure
    // (minus id/created_at/updated_at/total_cashflow, which aren't valid Update fields).
    expect(calls.investmentLogUpdates).toHaveLength(2);
    const { id: _id, ...expectedRevert } = before;
    expect(calls.investmentLogUpdates[1]).toEqual(expectedRevert);
  });
});
