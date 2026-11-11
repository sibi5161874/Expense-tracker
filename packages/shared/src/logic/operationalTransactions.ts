import { INVESTMENT_EXPENSE_CATEGORY_NAME, INVESTMENT_INCOME_CATEGORY_NAME } from './investmentMirroring';
import { CASHBOOK_EXPENSE_CATEGORY_NAME, CASHBOOK_INCOME_CATEGORY_NAME } from './cashbookMirroring';

/**
 * Category names used only by investment-log/cashbook cash mirrors (see investmentMirroring.ts
 * / cashbookMirroring.ts) — capital moving between an account and a portfolio holding or an
 * IOU, never a living expense or paycheck. Issue #18: because these mirrors are real `Income`/
 * `Expense` rows (so account balances stay correct — RULES.md §13), every plain `SUM(amount)
 * WHERE type = 'Expense'` aggregation double-counted them as operational spend, inflating
 * monthly expenses by the full size of every BUY and distorting net savings. Filtering them out
 * by category name (rather than retagging them `Transfer`) keeps the balance math in
 * netWorth.ts untouched — `Transfer` would need a `to_account_id`, which an investment SELL
 * crediting cash back has no real counterpart account for.
 */
export const CAPITAL_TRANSFER_CATEGORY_NAMES: readonly string[] = [
  INVESTMENT_EXPENSE_CATEGORY_NAME,
  INVESTMENT_INCOME_CATEGORY_NAME,
  CASHBOOK_EXPENSE_CATEGORY_NAME,
  CASHBOOK_INCOME_CATEGORY_NAME,
];

/** True for a transaction that's actual operational income/expense — false for an
 * investment/cashbook mirror, which should never contribute to a spending/income total. A
 * transaction with no category (the vast majority) is always operational. */
export function isOperationalTransaction(t: { category?: { name?: string | null } | null }): boolean {
  const name = t.category?.name;
  return !name || !CAPITAL_TRANSFER_CATEGORY_NAMES.includes(name);
}
