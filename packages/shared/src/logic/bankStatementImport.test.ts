import { describe, expect, it } from 'vitest';
import {
  detectBankFormat,
  resolveBankMapping,
  matchesKnownBankColumns,
  parseBankDate,
  categorizeDescription,
  buildBankStatementImportPlan,
  checkBalanceReconciliation,
  type BankColumnMapping,
} from './bankStatementImport';
import { BANKS, findBank } from './institutions';
import type { ImportRecord } from './csvImport';

const DOCUMENTED_BANKS = BANKS.filter((b) => b.columns);

describe('bank institution registry', () => {
  it('exposes every India bank plus both Qatar banks', () => {
    const ids = BANKS.map((b) => b.id);
    expect(ids).toEqual(
      expect.arrayContaining(['HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'IDFC', 'DOHA', 'CBQ'])
    );
  });

  it('never ships a columns list for a heuristic-only bank (a guessed list would misparse)', () => {
    for (const bank of BANKS) {
      if (bank.confidence === 'heuristic') expect(bank.columns).toBeUndefined();
    }
  });
});

describe('detectBankFormat / matchesKnownBankColumns', () => {
  it.each(DOCUMENTED_BANKS.map((b) => b.id))('detects %s from its documented header row', (id) => {
    const columns = [...findBank(id)!.columns!];
    expect(detectBankFormat(columns)).toBe(id);
    expect(matchesKnownBankColumns(columns, id)).toBe(true);
  });

  it('matches a documented bank regardless of column order', () => {
    const reversed = [...findBank('HDFC')!.columns!].reverse();
    expect(matchesKnownBankColumns(reversed, 'HDFC')).toBe(true);
  });

  it('returns null for a header row that matches no documented bank', () => {
    expect(detectBankFormat(['Foo', 'Bar'])).toBeNull();
  });
});

describe('resolveBankMapping', () => {
  it.each(DOCUMENTED_BANKS.map((b) => b.id))('resolves a full mapping for %s', (id) => {
    const { mapping, unresolved } = resolveBankMapping([...findBank(id)!.columns!], id);
    expect(unresolved).toEqual([]);
    expect(mapping?.date).toBeTruthy();
    expect(mapping?.description).toBeTruthy();
    expect(mapping?.debit || mapping?.credit || mapping?.amount).toBeTruthy();
  });

  it('resolves an undocumented bank via heuristics alone', () => {
    // Doha/CBQ have no published spec — this is the path they take.
    const { mapping, unresolved, source } = resolveBankMapping(
      ['Posting Date', 'Details', 'Debit', 'Credit', 'Balance'],
      'DOHA'
    );
    expect(unresolved).toEqual([]);
    expect(source).toBe('heuristic');
    expect(mapping?.description).toBe('Details');
  });

  it('returns a null mapping with unresolved fields rather than guessing', () => {
    const { mapping, unresolved } = resolveBankMapping(['Foo', 'Bar'], 'DOHA');
    expect(mapping).toBeNull();
    expect(unresolved.length).toBeGreaterThan(0);
  });
});

describe('parseBankDate', () => {
  it.each([
    ['05/03/2026', '2026-03-05'],
    ['05/03/26', '2026-03-05'],
    ['05-03-2026', '2026-03-05'],
    ['2026-03-05', '2026-03-05'],
    ['2026-03-05 09:20:00', '2026-03-05'],
  ])('parses %s', (input, want) => {
    expect(parseBankDate(input)).toBe(want);
  });

  it.each(['40/13/2026', 'not a date', ''])('rejects %s', (input) => {
    expect(parseBankDate(input)).toBeNull();
  });
});

describe('categorizeDescription', () => {
  it('matches a food-delivery keyword', () => {
    expect(categorizeDescription('SWIGGY ORDER 123456')).toEqual({ categoryName: 'Food', type: 'Expense' });
  });

  it('matches salary credits as income', () => {
    expect(categorizeDescription('NEFT SALARY CREDIT ACME CORP')).toEqual({
      categoryName: 'Salary',
      type: 'Income',
    });
  });

  it('returns null for an unrecognized description', () => {
    expect(categorizeDescription('SOME RANDOM MERCHANT XYZ')).toBeNull();
  });
});

describe('buildBankStatementImportPlan', () => {
  const accountId = '11111111-1111-4111-8111-111111111111';
  const foodCategoryId = '22222222-2222-4222-8222-222222222222';
  const salaryCategoryId = '33333333-3333-4333-8333-333333333333';
  const categoryIndex = new Map([
    ['food', foodCategoryId],
    ['salary', salaryCategoryId],
  ]);

  const debitCreditMapping: BankColumnMapping = {
    date: 'Date',
    description: 'Narration',
    debit: 'Withdrawal',
    credit: 'Deposit',
  };

  function record(fields: Partial<Record<string, string>>): ImportRecord {
    return {
      row: 2,
      record: { Date: '05/03/2026', Narration: 'SWIGGY ORDER 123', Withdrawal: '500', Deposit: '', ...fields },
    };
  }

  it('maps a withdrawal row to an Expense with the auto-categorized category', () => {
    const { validRows, errors } = buildBankStatementImportPlan(
      debitCreditMapping,
      [record({})],
      accountId,
      categoryIndex,
      []
    );
    expect(errors).toEqual([]);
    expect(validRows).toEqual([
      {
        date: '2026-03-05',
        type: 'Expense',
        category_id: foodCategoryId,
        amount: 500,
        from_account_id: accountId,
        notes: 'SWIGGY ORDER 123',
      },
    ]);
  });

  it('maps a deposit row to an Income', () => {
    const { validRows } = buildBankStatementImportPlan(
      debitCreditMapping,
      [record({ Narration: 'NEFT SALARY CREDIT', Withdrawal: '', Deposit: '50000' })],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows[0]).toMatchObject({ type: 'Income', amount: 50000, category_id: salaryCategoryId });
  });

  it('leaves category null when nothing matches the user\'s own categories', () => {
    const { validRows } = buildBankStatementImportPlan(
      debitCreditMapping,
      [record({ Narration: 'UNKNOWN MERCHANT PAYMENT' })],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows[0]?.category_id).toBeNull();
  });

  it('skips a zero-amount row (opening balance / summary) without an error', () => {
    const { validRows, errors } = buildBankStatementImportPlan(
      debitCreditMapping,
      [record({ Withdrawal: '', Deposit: '' })],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows).toEqual([]);
    expect(errors).toEqual([]);
  });

  it('reports an error for an unparseable date', () => {
    const { errors, validRows } = buildBankStatementImportPlan(
      debitCreditMapping,
      [record({ Date: 'garbage' })],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('dedups against existing transaction keys', () => {
    const { validRows, duplicateCount } = buildBankStatementImportPlan(
      debitCreditMapping,
      [record({})],
      accountId,
      categoryIndex,
      [`2026-03-05|${foodCategoryId}|500`]
    );
    expect(validRows).toEqual([]);
    expect(duplicateCount).toBe(1);
  });

  // Single-amount layouts: direction comes from a DR/CR flag, or from the sign
  // when no flag column exists.
  it('reads a single-amount column with a DR flag as an Expense', () => {
    const mapping: BankColumnMapping = {
      date: 'Date',
      description: 'Narration',
      amount: 'Amount',
      drCrIndicator: 'DR/CR',
    };
    const { validRows } = buildBankStatementImportPlan(
      mapping,
      [{ row: 2, record: { Date: '05/03/2026', Narration: 'SWIGGY', Amount: '500', 'DR/CR': 'DR' } }],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows[0]).toMatchObject({ type: 'Expense', amount: 500 });
  });

  it('reads a single-amount column with a CR flag as Income', () => {
    const mapping: BankColumnMapping = {
      date: 'Date',
      description: 'Narration',
      amount: 'Amount',
      drCrIndicator: 'DR/CR',
    };
    const { validRows } = buildBankStatementImportPlan(
      mapping,
      [{ row: 2, record: { Date: '05/03/2026', Narration: 'SALARY', Amount: '50000', 'DR/CR': 'CR' } }],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows[0]).toMatchObject({ type: 'Income', amount: 50000 });
  });

  it('falls back to the sign when a single-amount layout has no DR/CR flag', () => {
    const mapping: BankColumnMapping = { date: 'Date', description: 'Narration', amount: 'Amount' };
    const { validRows } = buildBankStatementImportPlan(
      mapping,
      [{ row: 2, record: { Date: '05/03/2026', Narration: 'SWIGGY', Amount: '-500' } }],
      accountId,
      categoryIndex,
      []
    );
    expect(validRows[0]).toMatchObject({ type: 'Expense', amount: 500 });
  });
});

describe('checkBalanceReconciliation', () => {
  const mapping: BankColumnMapping = {
    date: 'Date',
    description: 'Narration',
    debit: 'Withdrawal',
    credit: 'Deposit',
    balance: 'Balance',
  };

  function statement(rows: Array<{ withdrawal?: string; deposit?: string; balance: string }>): ImportRecord[] {
    return rows.map((r, i) => ({
      row: i + 2,
      record: {
        Date: '05/03/2026',
        Narration: 'TXN',
        Withdrawal: r.withdrawal ?? '',
        Deposit: r.deposit ?? '',
        Balance: r.balance,
      },
    }));
  }

  it('reports not checkable when no balance column was mapped', () => {
    const noBalance: BankColumnMapping = { date: 'Date', description: 'Narration', debit: 'D', credit: 'C' };
    const result = checkBalanceReconciliation(noBalance, statement([{ balance: '1000' }]));
    expect(result.checkable).toBe(false);
  });

  it('passes a statement whose balance column is internally consistent', () => {
    // 1000 -> withdraw 200 -> 800 -> deposit 500 -> 1300
    const records = statement([
      { balance: '1000' },
      { withdrawal: '200', balance: '800' },
      { deposit: '500', balance: '1300' },
    ]);
    const result = checkBalanceReconciliation(mapping, records);
    expect(result.checkable).toBe(true);
    expect(result.totalChecked).toBe(2);
    expect(result.mismatches).toBe(0);
  });

  // This is the case that matters: the mapping "succeeds" (every row parses,
  // no thrown error) but produced numbers that are simply wrong. Reconciliation
  // is the only thing in this pipeline that would ever catch it.
  it('catches a debit/credit column swap even though every row still parses individually', () => {
    const swapped: BankColumnMapping = { ...mapping, debit: 'Deposit', credit: 'Withdrawal' };
    const records = statement([
      { balance: '1000' },
      { withdrawal: '200', balance: '800' },
      { deposit: '500', balance: '1300' },
    ]);
    const result = checkBalanceReconciliation(swapped, records);
    expect(result.mismatches).toBeGreaterThan(0);
  });

  it('catches a mismatched amount (e.g. a comma-parsing failure that silently zeroed a row)', () => {
    const records = statement([{ balance: '1000' }, { withdrawal: '', balance: '850' }]);
    const result = checkBalanceReconciliation(mapping, records);
    expect(result.mismatches).toBe(1);
    expect(result.firstMismatchRow).toBe(3);
  });

  it('tolerates sub-paisa rounding noise without flagging a false mismatch', () => {
    const records = statement([{ balance: '1000.00' }, { withdrawal: '200.005', balance: '799.995' }]);
    expect(checkBalanceReconciliation(mapping, records).mismatches).toBe(0);
  });

  it('resyncs after a row whose balance does not parse (e.g. a subtotal line) instead of cascading', () => {
    const records = statement([
      { balance: '1000' },
      { withdrawal: '200', balance: 'CARRIED FORWARD' }, // unparseable — breaks the chain once
      { deposit: '500', balance: '1300' }, // compared against nothing, not against the pre-gap balance
    ]);
    const result = checkBalanceReconciliation(mapping, records);
    // Only one comparable pair exists after the gap resets the chain.
    expect(result.totalChecked).toBe(0);
    expect(result.mismatches).toBe(0);
  });

  it('reports zero checked rows for a single-row statement (nothing to compare against)', () => {
    const result = checkBalanceReconciliation(mapping, statement([{ balance: '1000' }]));
    expect(result.totalChecked).toBe(0);
    expect(result.mismatches).toBe(0);
  });
});
