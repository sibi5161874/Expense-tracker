import { describe, expect, it } from 'vitest';
import {
  headersMatch,
  rowsToRecords,
  buildNameIndex,
  resolveNameToId,
  parseAmount,
  normalizeDate,
  createDedupChecker,
  buildTransactionImportPlan,
  buildInvestmentLogImportPlan,
  buildCashbookImportPlan,
} from './csvImport';

describe('headersMatch', () => {
  const expected = ['Date', 'Type', 'Amount'] as const;

  it('matches identical headers', () => {
    expect(headersMatch(['Date', 'Type', 'Amount'], expected)).toBe(true);
  });

  it('rejects a different length', () => {
    expect(headersMatch(['Date', 'Type'], expected)).toBe(false);
  });

  it('rejects reordered or renamed columns — no fuzzy matching', () => {
    expect(headersMatch(['Type', 'Date', 'Amount'], expected)).toBe(false);
    expect(headersMatch(['date', 'Type', 'Amount'], expected)).toBe(false);
  });

  it('trims whitespace on each header cell before comparing', () => {
    expect(headersMatch([' Date ', 'Type', 'Amount'], expected)).toBe(true);
  });
});

describe('rowsToRecords', () => {
  const columns = ['Date', 'Category', 'Amount'] as const;

  it('maps data rows to column-keyed records, numbering from the header as row 1', () => {
    const rows = [
      ['Date', 'Category', 'Amount'],
      ['2026-01-01', 'Groceries', '100'],
      ['2026-01-02', 'Rent', '200'],
    ];
    const result = rowsToRecords(rows, columns);
    expect(result).toEqual([
      { row: 2, record: { Date: '2026-01-01', Category: 'Groceries', Amount: '100' } },
      { row: 3, record: { Date: '2026-01-02', Category: 'Rent', Amount: '200' } },
    ]);
  });

  it('skips a row whose first cell starts with the EXAMPLE marker, without emitting an error', () => {
    const rows = [
      ['Date', 'Category', 'Amount'],
      ['2026-01-01', 'Groceries', '100', 'EXAMPLE — delete this row'],
      ['EXAMPLE — delete this row', 'x', 'x'],
      ['2026-01-02', 'Rent', '200'],
    ];
    // Only the row whose FIRST cell is the marker gets skipped.
    const result = rowsToRecords(rows, columns);
    expect(result).toHaveLength(2);
    expect(result[0]!.record.Date).toBe('2026-01-01');
    expect(result[1]!.record.Date).toBe('2026-01-02');
  });

  it('skips fully blank rows', () => {
    const rows = [
      ['Date', 'Category', 'Amount'],
      ['', '', ''],
      ['2026-01-02', 'Rent', '200'],
    ];
    expect(rowsToRecords(rows, columns)).toHaveLength(1);
  });

  it('trims each cell value', () => {
    const rows = [
      ['Date', 'Category', 'Amount'],
      [' 2026-01-01 ', ' Groceries ', ' 100 '],
    ];
    expect(rowsToRecords(rows, columns)[0]!.record).toEqual({
      Date: '2026-01-01',
      Category: 'Groceries',
      Amount: '100',
    });
  });
});

describe('buildNameIndex / resolveNameToId', () => {
  const items = [
    { id: 'acc-1', name: 'HDFC Bank' },
    { id: 'acc-2', name: 'Cash' },
  ];

  it('resolves a case-insensitive, whitespace-tolerant match', () => {
    const index = buildNameIndex(items);
    expect(resolveNameToId(index, 'hdfc bank')).toEqual({ id: 'acc-1' });
    expect(resolveNameToId(index, '  Cash  ')).toEqual({ id: 'acc-2' });
  });

  it('reports an error for an unmatched name', () => {
    const index = buildNameIndex(items);
    expect(resolveNameToId(index, 'ICICI Bank')).toEqual({ error: 'no match found for "ICICI Bank"' });
  });

  it('reports an error for an empty name rather than silently matching anything', () => {
    const index = buildNameIndex(items);
    expect(resolveNameToId(index, '')).toEqual({ error: 'not provided' });
  });
});

describe('parseAmount', () => {
  it('parses a valid numeric string', () => {
    expect(parseAmount('1500')).toBe(1500);
    expect(parseAmount('1500.50')).toBe(1500.5);
  });

  it('returns null for empty or non-numeric input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
});

describe('normalizeDate', () => {
  it('accepts a strict YYYY-MM-DD date', () => {
    expect(normalizeDate('2026-07-19')).toBe('2026-07-19');
  });

  it('rejects any other format', () => {
    expect(normalizeDate('19-07-2026')).toBeNull();
    expect(normalizeDate('2026/07/19')).toBeNull();
    expect(normalizeDate('not a date')).toBeNull();
  });
});

describe('createDedupChecker', () => {
  it('flags a key as duplicate only up to the number of existing matches', () => {
    const isDuplicate = createDedupChecker(['2026-01-01|cat-1|500']);
    // A DB row already exists with this key — a re-import of it should be caught.
    expect(isDuplicate('2026-01-01|cat-1|500')).toBe(true);
    // A SECOND, distinct transaction with the same key (e.g. two identical ₹500
    // lunches on the same day) must NOT be dropped — only one match existed.
    expect(isDuplicate('2026-01-01|cat-1|500')).toBe(false);
  });

  it('never flags a key with no existing matches', () => {
    const isDuplicate = createDedupChecker([]);
    expect(isDuplicate('2026-01-01|cat-1|500')).toBe(false);
  });

  it('tracks each distinct key independently', () => {
    const isDuplicate = createDedupChecker(['2026-01-01|cat-1|500', '2026-01-02|cat-2|900']);
    expect(isDuplicate('2026-01-02|cat-2|900')).toBe(true);
    expect(isDuplicate('2026-01-01|cat-1|500')).toBe(true);
    expect(isDuplicate('2026-01-01|cat-1|500')).toBe(false);
  });
});

describe('buildTransactionImportPlan', () => {
  const accounts = buildNameIndex([{ id: '11111111-1111-4111-8111-111111111111', name: 'Cash' }]);
  const categories = buildNameIndex([{ id: '22222222-2222-4222-8222-222222222222', name: 'Food' }]);

  function row(overrides: Partial<Record<string, string>> = {}, rowNum = 2) {
    return {
      row: rowNum,
      record: {
        Date: '2026-01-01',
        Type: 'Expense',
        Category: 'Food',
        'Sub-Category': '',
        Amount: '500',
        'From Account': 'Cash',
        'To Account': '',
        Notes: '',
        ...overrides,
      },
    };
  }

  it('accepts a valid row', () => {
    const plan = buildTransactionImportPlan([row()], accounts, categories, []);
    expect(plan.errors).toEqual([]);
    expect(plan.duplicateCount).toBe(0);
    expect(plan.validRows).toHaveLength(1);
    expect(plan.validRows[0]).toMatchObject({
      date: '2026-01-01',
      amount: 500,
      category_id: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('reports a row-numbered error for an invalid date instead of throwing', () => {
    const plan = buildTransactionImportPlan([row({ Date: 'bad' })], accounts, categories, []);
    expect(plan.validRows).toHaveLength(0);
    expect(plan.errors).toEqual([{ row: 2, reason: 'Invalid or missing Date (expected YYYY-MM-DD)' }]);
  });

  it('reports an error when the account name does not resolve', () => {
    const plan = buildTransactionImportPlan([row({ 'From Account': 'Unknown Bank' })], accounts, categories, []);
    expect(plan.errors).toEqual([{ row: 2, reason: 'From Account no match found for "Unknown Bank"' }]);
  });

  it('drops a row that exactly re-imports an existing DB row', () => {
    const plan = buildTransactionImportPlan([row()], accounts, categories, [
      '2026-01-01|22222222-2222-4222-8222-222222222222|500',
    ]);
    expect(plan.validRows).toHaveLength(0);
    expect(plan.duplicateCount).toBe(1);
  });

  it('keeps a second distinct row even when it shares a key with one existing DB row', () => {
    // Regression: previously a Set-based check would silently drop this row even
    // though only ONE matching row exists in the DB and TWO are being imported.
    const plan = buildTransactionImportPlan([row({}, 2), row({}, 3)], accounts, categories, [
      '2026-01-01|22222222-2222-4222-8222-222222222222|500',
    ]);
    expect(plan.duplicateCount).toBe(1);
    expect(plan.validRows).toHaveLength(1);
  });
});

describe('buildInvestmentLogImportPlan', () => {
  const accounts = buildNameIndex([{ id: '33333333-3333-4333-8333-333333333333', name: 'Zerodha' }]);

  function row(overrides: Partial<Record<string, string>> = {}, rowNum = 2) {
    return {
      row: rowNum,
      record: {
        Date: '2026-01-01',
        Symbol: 'INFY',
        Exchange: 'NSE',
        Action: 'BUY',
        'Asset Type': 'Stock',
        Quantity: '10',
        Price: '1500',
        Fees: '20',
        'Bonus/Split Extra Units': '',
        'Linked Account': 'Zerodha',
        Notes: '',
        ...overrides,
      },
    };
  }

  it('accepts a valid row', () => {
    const plan = buildInvestmentLogImportPlan([row()], accounts, []);
    expect(plan.errors).toEqual([]);
    expect(plan.validRows).toHaveLength(1);
    expect(plan.validRows[0]).toMatchObject({ symbol: 'INFY', quantity: 10, price: 1500 });
  });

  it('rejects an invalid Action', () => {
    const plan = buildInvestmentLogImportPlan([row({ Action: 'HOLD' })], accounts, []);
    expect(plan.validRows).toHaveLength(0);
    expect(plan.errors[0]?.reason).toContain('Invalid Action');
  });

  it('dedups by date|symbol|quantity|price, allowing one legitimate repeat beyond existing matches', () => {
    const existingKeys = ['2026-01-01|INFY|10|1500'];
    const plan = buildInvestmentLogImportPlan([row({}, 2), row({}, 3)], accounts, existingKeys);
    expect(plan.duplicateCount).toBe(1);
    expect(plan.validRows).toHaveLength(1);
  });
});

describe('buildCashbookImportPlan', () => {
  const accounts = buildNameIndex([{ id: '44444444-4444-4444-8444-444444444444', name: 'Cash' }]);

  function row(overrides: Partial<Record<string, string>> = {}, rowNum = 2) {
    return {
      row: rowNum,
      record: {
        Date: '2026-01-01',
        Counterparty: 'Rahul',
        Flow: 'Gave',
        Amount: '1000',
        'Due Date': '',
        'Account Used': 'Cash',
        'Loan ID': '',
        Notes: '',
        ...overrides,
      },
    };
  }

  it('accepts a valid row', () => {
    const plan = buildCashbookImportPlan([row()], accounts, []);
    expect(plan.errors).toEqual([]);
    expect(plan.validRows).toHaveLength(1);
    expect(plan.validRows[0]).toMatchObject({ counterparty: 'Rahul', amount: 1000, flow: 'Gave' });
  });

  it('rejects an invalid Flow', () => {
    const plan = buildCashbookImportPlan([row({ Flow: 'Owed' })], accounts, []);
    expect(plan.validRows).toHaveLength(0);
    expect(plan.errors[0]?.reason).toContain('Invalid Flow');
  });

  it('matches counterparty case-insensitively for dedup', () => {
    const existingKeys = ['2026-01-01|rahul|1000|Gave'];
    const plan = buildCashbookImportPlan([row({ Counterparty: 'RAHUL' })], accounts, existingKeys);
    expect(plan.duplicateCount).toBe(1);
    expect(plan.validRows).toHaveLength(0);
  });
});
