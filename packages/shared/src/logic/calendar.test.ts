import { describe, expect, it } from 'vitest';
import { groupTransactionsByDate, buildCalendarGrid } from './calendar';

describe('groupTransactionsByDate', () => {
  it('groups multiple transactions on the same date together', () => {
    const grouped = groupTransactionsByDate([
      { date: '2026-08-01', id: 1 },
      { date: '2026-08-01', id: 2 },
      { date: '2026-08-02', id: 3 },
    ]);
    expect(grouped.get('2026-08-01')).toHaveLength(2);
    expect(grouped.get('2026-08-02')).toHaveLength(1);
  });

  it('is empty for no transactions', () => {
    expect(groupTransactionsByDate([]).size).toBe(0);
  });
});

describe('buildCalendarGrid', () => {
  it('pads leading blank cells so the 1st lands under the correct weekday', () => {
    // 2026-08-01 is a Saturday (day-of-week 6) — 6 leading blanks expected.
    const cells = buildCalendarGrid('2026-08', new Map());
    const leadingBlanks = cells.findIndex((c) => c.date !== null);
    expect(leadingBlanks).toBe(6);
    expect(cells[6]!.date).toBe('2026-08-01');
  });

  it('includes every day of the month, none more or less', () => {
    const cells = buildCalendarGrid('2026-08', new Map());
    const realDays = cells.filter((c) => c.date !== null);
    expect(realDays).toHaveLength(31);
    expect(realDays[realDays.length - 1]!.date).toBe('2026-08-31');
  });

  it('handles February in a leap year correctly', () => {
    const cells = buildCalendarGrid('2028-02', new Map());
    expect(cells.filter((c) => c.date !== null)).toHaveLength(29);
  });

  it('flags which transaction types occurred on each day', () => {
    const byDate = new Map([
      ['2026-08-05', [{ type: 'Income' }, { type: 'Expense' }]],
      ['2026-08-06', [{ type: 'Transfer' }]],
    ]);
    const cells = buildCalendarGrid('2026-08', byDate);
    const day5 = cells.find((c) => c.date === '2026-08-05')!;
    const day6 = cells.find((c) => c.date === '2026-08-06')!;
    const day7 = cells.find((c) => c.date === '2026-08-07')!;
    expect(day5).toMatchObject({ hasIncome: true, hasExpense: true, hasTransfer: false });
    expect(day6).toMatchObject({ hasIncome: false, hasExpense: false, hasTransfer: true });
    expect(day7).toMatchObject({ hasIncome: false, hasExpense: false, hasTransfer: false });
  });
});
