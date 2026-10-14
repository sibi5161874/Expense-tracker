import { describe, expect, it } from 'vitest';
import { parseIsoDate, parseDayMonthYearDate, parseExcelSerialDate } from './dateParsing';

describe('parseIsoDate', () => {
  it('accepts a strict YYYY-MM-DD date', () => {
    expect(parseIsoDate('2026-07-19')).toBe('2026-07-19');
  });

  it('accepts a date with a trailing time component', () => {
    expect(parseIsoDate('2026-03-05 09:20:00')).toBe('2026-03-05');
    expect(parseIsoDate('2026-03-05T09:20:00Z')).toBe('2026-03-05');
  });

  it('rejects an invalid calendar date', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
  });

  it('rejects other formats', () => {
    expect(parseIsoDate('19-07-2026')).toBeNull();
    expect(parseIsoDate('not a date')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });
});

describe('parseDayMonthYearDate', () => {
  it('resolves an unambiguous date (one component > 12) the same way regardless of policy', () => {
    expect(parseDayMonthYearDate('19-07-2026', 'reject')).toBe('2026-07-19');
    expect(parseDayMonthYearDate('19-07-2026', 'day-first')).toBe('2026-07-19');
    expect(parseDayMonthYearDate('07/19/2026', 'reject')).toBe('2026-07-19');
  });

  it('supports slash and dash separators with a 2- or 4-digit year', () => {
    expect(parseDayMonthYearDate('05/03/2026', 'day-first')).toBe('2026-03-05');
    expect(parseDayMonthYearDate('05/03/26', 'day-first')).toBe('2026-03-05');
    expect(parseDayMonthYearDate('05-03-2026', 'day-first')).toBe('2026-03-05');
  });

  it('under "reject", returns null for a genuinely ambiguous date (both components <=12)', () => {
    expect(parseDayMonthYearDate('03/04/2025', 'reject')).toBeNull();
  });

  it('under "day-first", resolves an ambiguous date as DD/MM', () => {
    expect(parseDayMonthYearDate('03/04/2025', 'day-first')).toBe('2025-04-03');
  });

  it('rejects an invalid calendar date and unparseable input', () => {
    expect(parseDayMonthYearDate('40/13/2026', 'day-first')).toBeNull();
    expect(parseDayMonthYearDate('not a date', 'day-first')).toBeNull();
    expect(parseDayMonthYearDate('', 'reject')).toBeNull();
  });
});

describe('parseExcelSerialDate', () => {
  it('converts a known Excel serial number to its ISO date', () => {
    // 45658 = 2025-01-01 (45292 = 2024-01-01, a commonly-cited reference value, plus 366 days
    // for 2024 being a leap year).
    expect(parseExcelSerialDate('45658')).toBe('2025-01-01');
    expect(parseExcelSerialDate('45941')).toBe('2025-10-11');
  });

  it('rejects numbers outside the plausible date range', () => {
    expect(parseExcelSerialDate('1')).toBeNull();
    expect(parseExcelSerialDate('999999')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(parseExcelSerialDate('45941.5')).toBeNull();
    expect(parseExcelSerialDate('not a number')).toBeNull();
    expect(parseExcelSerialDate('')).toBeNull();
  });
});
