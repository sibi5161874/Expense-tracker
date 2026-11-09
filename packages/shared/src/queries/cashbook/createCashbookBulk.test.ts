import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { CashbookInput } from '../../schemas';
import { createCashbookBulk } from './createCashbookBulk';

function createMockSupabase(opts: {
  transactionInsertError?: { message: string } | null;
} = {}) {
  const calls = {
    cashbookInserts: [] as Record<string, unknown>[][],
    cashbookDeletes: [] as string[][],
    transactionInserts: [] as Record<string, unknown>[][],
  };

  function from(table: string) {
    if (table === 'cashbook') {
      return {
        insert: (payload: Record<string, unknown>[]) => {
          calls.cashbookInserts.push(payload);
          return {
            select: async () => ({
              data: payload.map((row, idx) => ({ id: `cb-${idx + 1}`, ...row })),
              error: null,
            }),
          };
        },
        delete: () => ({
          in: async (_col: string, ids: string[]) => {
            calls.cashbookDeletes.push(ids);
            return { error: null };
          },
        }),
      };
    }
    if (table === 'transactions') {
      return {
        insert: async (payload: Record<string, unknown>[]) => {
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
const gaveRow: CashbookInput = {
  date: '2026-01-05',
  counterparty: 'Ravi',
  flow: 'Gave',
  amount: 5000,
  account_used_id: '11111111-1111-1111-1111-111111111111',
};
const receivedRow: CashbookInput = {
  date: '2026-01-06',
  counterparty: 'Anita',
  flow: 'Received',
  amount: 2500,
  account_used_id: '11111111-1111-1111-1111-111111111111',
};
const unlinkedRow: CashbookInput = {
  date: '2026-01-07',
  counterparty: 'Suresh',
  flow: 'Gave',
  amount: 1000,
  account_used_id: null,
};

describe('createCashbookBulk', () => {
  it('returns empty array when rows array is empty', async () => {
    const { client, calls } = createMockSupabase();
    const result = await createCashbookBulk(client, userId, []);
    expect(result).toEqual([]);
    expect(calls.cashbookInserts).toHaveLength(0);
    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('mirrors Gave and Received transactions in bulk', async () => {
    const { client, calls } = createMockSupabase();

    const result = await createCashbookBulk(client, userId, [gaveRow, receivedRow, unlinkedRow]);

    expect(result).toHaveLength(3);
    expect(calls.cashbookInserts[0]).toHaveLength(3);

    // 2 transactions inserted in 1 batch (unlinkedRow is skipped)
    expect(calls.transactionInserts).toHaveLength(1);
    const txs = calls.transactionInserts[0]!;
    expect(txs).toHaveLength(2);

    expect(txs[0]).toMatchObject({
      user_id: userId,
      type: 'Expense',
      amount: 5000,
      from_account_id: gaveRow.account_used_id,
      notes: 'Lent to Ravi via Cashbook',
    });
    expect(txs[1]).toMatchObject({
      user_id: userId,
      type: 'Income',
      amount: 2500,
      from_account_id: receivedRow.account_used_id,
      notes: 'Borrowed from Anita via Cashbook',
    });
  });

  it('rolls back all inserted cashbook rows when transaction insert fails', async () => {
    const { client, calls } = createMockSupabase({
      transactionInsertError: { message: 'db error inserting transactions' },
    });

    await expect(createCashbookBulk(client, userId, [gaveRow, receivedRow])).rejects.toMatchObject({
      message: 'db error inserting transactions',
    });

    expect(calls.cashbookDeletes).toHaveLength(1);
    expect(calls.cashbookDeletes[0]).toEqual(['cb-1', 'cb-2']);
  });
});

