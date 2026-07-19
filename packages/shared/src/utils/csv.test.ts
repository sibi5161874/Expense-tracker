import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('toCsv / parseCsv round trip', () => {
  it('round-trips plain rows', () => {
    const rows = [
      ['Date', 'Category', 'Amount'],
      ['2026-01-01', 'Groceries', '100'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it('quotes and round-trips a field containing a comma', () => {
    const rows = [['Notes'], ['Milk, Bread, Eggs']];
    const csv = toCsv(rows);
    expect(csv).toContain('"Milk, Bread, Eggs"');
    expect(parseCsv(csv)).toEqual(rows);
  });

  it('quotes and round-trips a field containing an embedded double quote', () => {
    const rows = [['Notes'], ['Said "hello" there']];
    const csv = toCsv(rows);
    expect(csv).toContain('"Said ""hello"" there"');
    expect(parseCsv(csv)).toEqual(rows);
  });

  it('quotes and round-trips a field containing an embedded newline', () => {
    const rows = [['Notes'], ['line one\nline two']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe('parseCsv', () => {
  it('handles CRLF line endings', () => {
    expect(parseCsv('Date,Amount\r\n2026-01-01,100\r\n')).toEqual([
      ['Date', 'Amount'],
      ['2026-01-01', '100'],
    ]);
  });

  it('drops a trailing blank line', () => {
    expect(parseCsv('Date,Amount\n2026-01-01,100\n\n')).toEqual([
      ['Date', 'Amount'],
      ['2026-01-01', '100'],
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
