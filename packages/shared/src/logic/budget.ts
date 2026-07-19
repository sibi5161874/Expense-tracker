export type BudgetStatus = 'ok' | 'warning' | 'over';

/** ok < 75% of limit, warning 75-99%, over >= 100%. No limit set counts as ok. */
export function calculateBudgetStatus(actual: number, limit: number): BudgetStatus {
  if (limit <= 0) return 'ok';
  const pct = actual / limit;
  if (pct >= 1) return 'over';
  if (pct >= 0.75) return 'warning';
  return 'ok';
}
