/** Pure grouping/grid math behind the transactions calendar view — the day-of-week offset arithmetic is exactly the kind of thing that's easy to get subtly wrong at a month boundary, so it's kept out of the component and tested here. */

export function groupTransactionsByDate<T extends { date: string }>(transactions: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const t of transactions) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return map;
}

export interface CalendarDayCell {
  /** Null for a leading blank cell before the 1st — the grid always starts on Sunday, so a month not starting on Sunday needs filler cells to align the first real day under the right weekday column. */
  date: string | null;
  hasIncome: boolean;
  hasExpense: boolean;
  hasTransfer: boolean;
}

/** Builds a 7-column (Sun–Sat) grid of cells for `month` ('YYYY-MM'), flagging which transaction types occurred on each day. Uses UTC dates throughout so the grid can't shift by a day depending on the server's local timezone. */
export function buildCalendarGrid(month: string, transactionsByDate: Map<string, { type: string }[]>): CalendarDayCell[] {
  const [year, mo] = month.split('-').map(Number) as [number, number];
  const firstOfMonth = new Date(Date.UTC(year, mo - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ date: null, hasIncome: false, hasExpense: false, hasTransfer: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const dayTxns = transactionsByDate.get(date) ?? [];
    cells.push({
      date,
      hasIncome: dayTxns.some((t) => t.type === 'Income'),
      hasExpense: dayTxns.some((t) => t.type === 'Expense'),
      hasTransfer: dayTxns.some((t) => t.type === 'Transfer'),
    });
  }
  return cells;
}
