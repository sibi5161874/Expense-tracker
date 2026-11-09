import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types';
import type { InvestmentLogInput } from '../../schemas';
import { createInvestmentLogsBulk } from './createInvestmentLogsBulk';

function createMockSupabase(opts: {
  categoryExisting?: Record<string, string>; // `${name}:${type}` -> id
  transactionInsertError?: { message: string } | null;
} = {}) {
  const calls = {
    investmentLogInserts: [] as Record<string, unknown>[][],
    investmentLogDeletes: [] as string[][],
    categorySelects: [] as Record<string, unknown>[],
    categoryInserts: [] as Record<string, unknown>[],
    transactionInserts: [] as Record<string, unknown>[][],
  };

  function from(table: string) {
    if (table === 'investment_log') {
      return {
        insert: (payload: Record<string, unknown>[]) => {
          calls.investmentLogInserts.push(payload);
          return {
            select: async () => ({
              data: payload.map((row, idx) => ({ id: `inv-${idx + 1}`, ...row })),
              error: null,
            }),
          };
        },
        delete: () => ({
          in: async (_col: string, ids: string[]) => {
            calls.investmentLogDeletes.push(ids);
            return { error: null };
          },
        }),
      };
    }
    if (table === 'categories') {
      return {
        select: () => ({
          eq: (_uCol: string, userId: string) => ({
            eq: (_nCol: string, name: string) => ({
              eq: (_tCol: string, type: string) => ({
                maybeSingle: async () => {
                  calls.categorySelects.push({ userId, name, type });
                  const key = `${name}:${type}`;
                  const existingId = opts.categoryExisting?.[key];
                  return { data: existingId ? { id: existingId } : null, error: null };
                },
              }),
            }),
          }),
        }),
        insert: (payload: Record<string, unknown>) => {
          calls.categoryInserts.push(payload);
          return {
            select: () => ({
              single: async () => ({ data: { id: `cat-${payload.name}` }, error: null }),
            }),
          };
        },
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
const buyRow1: InvestmentLogInput = {
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
const buyRow2: InvestmentLogInput = {
  date: '2026-01-06',
  symbol: 'TCS',
  exchange: 'NSE',
  action: 'BUY',
  quantity: 5,
  price: 3500,
  fees: 15,
  linked_account_id: '11111111-1111-1111-1111-111111111111',
  asset_type: 'Stock',
};
const sellRow: InvestmentLogInput = {
  date: '2026-01-07',
  symbol: 'INFY',
  exchange: 'NSE',
  action: 'SELL',
  quantity: 4,
  price: 1500,
  fees: 10,
  linked_account_id: '11111111-1111-1111-1111-111111111111',
  asset_type: 'Stock',
};

describe('createInvestmentLogsBulk', () => {
  it('returns empty array when rows array is empty', async () => {
    const { client, calls } = createMockSupabase();
    const result = await createInvestmentLogsBulk(client, userId, []);
    expect(result).toEqual([]);
    expect(calls.investmentLogInserts).toHaveLength(0);
    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('mirrors BUY and SELL transactions in bulk, caching category lookups', async () => {
    const { client, calls } = createMockSupabase({
      categoryExisting: { 'Investments:Expense': 'cat-inv' },
    });

    const result = await createInvestmentLogsBulk(client, userId, [buyRow1, buyRow2, sellRow]);

    expect(result).toHaveLength(3);
    expect(calls.investmentLogInserts[0]).toHaveLength(3);

    // Categories: 'Investments' existed ('cat-inv'), 'Investment Returns' created ('cat-Investment Returns')
    expect(calls.categoryInserts).toHaveLength(1);
    expect(calls.categoryInserts[0]).toMatchObject({ name: 'Investment Returns', type: 'Income' });

    // 3 transactions inserted in 1 batch
    expect(calls.transactionInserts).toHaveLength(1);
    const txs = calls.transactionInserts[0]!;
    expect(txs).toHaveLength(3);

    expect(txs[0]).toMatchObject({
      user_id: userId,
      type: 'Expense',
      amount: 25020,
      from_account_id: buyRow1.linked_account_id,
      category_id: 'cat-inv',
    });
    expect(txs[1]).toMatchObject({
      user_id: userId,
      type: 'Expense',
      amount: 17515,
      from_account_id: buyRow2.linked_account_id,
      category_id: 'cat-inv',
    });
    expect(txs[2]).toMatchObject({
      user_id: userId,
      type: 'Income',
      amount: 5990,
      from_account_id: sellRow.linked_account_id,
      category_id: 'cat-Investment Returns',
    });
  });

  it('skips BONUS, SPLIT, and unlinked rows when creating mirror transactions', async () => {
    const { client, calls } = createMockSupabase();

    const bonusRow: InvestmentLogInput = {
      ...buyRow1,
      action: 'BONUS',
      bonus_split_extra_units: 5,
    };
    const unlinkedRow: InvestmentLogInput = {
      ...buyRow1,
      linked_account_id: '' as unknown as string,
    };

    const result = await createInvestmentLogsBulk(client, userId, [bonusRow, unlinkedRow]);

    expect(result).toHaveLength(2);
    expect(calls.transactionInserts).toHaveLength(0);
  });

  it('rolls back all inserted investment_log rows when transaction insert fails', async () => {
    const { client, calls } = createMockSupabase({
      transactionInsertError: { message: 'db error inserting transactions' },
    });

    await expect(createInvestmentLogsBulk(client, userId, [buyRow1, buyRow2])).rejects.toMatchObject({
      message: 'db error inserting transactions',
    });

    expect(calls.investmentLogDeletes).toHaveLength(1);
    expect(calls.investmentLogDeletes[0]).toEqual(['inv-1', 'inv-2']);
  });
});

