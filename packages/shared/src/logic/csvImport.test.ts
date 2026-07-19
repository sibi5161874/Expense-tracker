import { describe, expect, it } from 'vitest';
import {
  headersMatch,
  rowsToRecords,
  buildNameIndex,
  resolveNameToId,
  parseAmount,
  normalizeDate,
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
