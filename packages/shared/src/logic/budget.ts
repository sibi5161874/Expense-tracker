export type BudgetStatus = 'ok' | 'warning' | 'over';

/** ok < 75% of limit, warning 75-99%, over >= 100%. No limit set counts as ok. */
export function calculateBudgetStatus(actual: number, limit: number): BudgetStatus {
  if (limit <= 0) return 'ok';
  const pct = actual / limit;
  if (pct >= 1) return 'over';
  if (pct >= 0.75) return 'warning';
  return 'ok';
}

export interface SpendTransaction {
  category_id: string | null;
  type: string;
  amount: number;
  date: string;
}

/**
 * Suggests a monthly budget for a category by averaging actual Expense spend
 * over the completed calendar months in [asOf - monthsBack, asOf) — the
 * in-progress current month is excluded so partial spend doesn't skew it.
 * Averages only over months that actually had spend in that category, so a
 * quiet month doesn't drag the suggestion toward zero. Returns null when
 * there's no expense history for that category in the window.
 */
export function suggestBudgetAmount(
  transactions: SpendTransaction[],
  categoryId: string,
  monthsBack = 3,
  asOf: Date = new Date()
): number | null {
  const currentMonthStart = new Date(asOf.getFullYear(), asOf.getMonth(), 1);
  const windowStart = new Date(asOf.getFullYear(), asOf.getMonth() - monthsBack, 1);

  const relevant = transactions.filter((t) => {
    if (t.category_id !== categoryId || t.type !== 'Expense') return false;
    const d = new Date(t.date);
    return d >= windowStart && d < currentMonthStart;
  });

  if (relevant.length === 0) return null;

  const monthsWithData = new Set(
    relevant.map((t) => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })
  ).size;

  const total = relevant.reduce((sum, t) => sum + t.amount, 0);
  return Math.round((total / monthsWithData) * 100) / 100;
}
