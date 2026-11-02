import type { InvestmentLogInput } from '../schemas';

export const INVESTMENT_EXPENSE_CATEGORY_NAME = 'Investments';
export const INVESTMENT_INCOME_CATEGORY_NAME = 'Investment Returns';

export interface InvestmentLogMirrorTransaction {
  date: string;
  type: 'Income' | 'Expense';
  amount: number;
  from_account_id: string;
  notes: string;
  /** Resolved to a real category id by the caller (find-or-create against the DB) — this pure
   * layer only decides which category name and type to use, since it has no DB access. */
  categoryName: string;
  categoryType: 'Income' | 'Expense';
}

/**
 * Decides the cash-side transaction (if any) that should mirror an investment_log entry. A
 * BUY/SELL/SIP/DIVIDEND genuinely moves money in or out of the linked account — without this,
 * net worth double-counts: portfolio value goes up on a BUY while the account's cash balance
 * stays put, as if the money was never spent. BONUS/SPLIT just issue new units with no cash
 * changing hands, so they never mirror.
 *
 * Returns null when there's nothing to record: no linked account, a non-cash action, or a
 * computed amount that isn't a real positive number (the `amount > 0` check constraint on
 * `transactions` would reject it anyway — e.g. a SELL/DIVIDEND whose fees exceed the proceeds).
 */
export function buildInvestmentLogMirrorTransaction(
  data: Pick<InvestmentLogInput, 'date' | 'symbol' | 'action' | 'quantity' | 'price' | 'fees' | 'linked_account_id'>
): InvestmentLogMirrorTransaction | null {
  if (!data.linked_account_id) return null;

  const gross = data.quantity * data.price;

  switch (data.action) {
    case 'BUY':
    case 'SIP': {
      const amount = gross + data.fees;
      if (!(amount > 0)) return null;
      return {
        date: data.date,
        type: 'Expense',
        amount,
        from_account_id: data.linked_account_id,
        notes: `Bought ${data.quantity} ${data.symbol} @ ₹${data.price} via Investment Log`,
        categoryName: INVESTMENT_EXPENSE_CATEGORY_NAME,
        categoryType: 'Expense',
      };
    }
    case 'SELL':
    case 'DIVIDEND': {
      const amount = gross - data.fees;
      if (!(amount > 0)) return null;
      return {
        date: data.date,
        type: 'Income',
        amount,
        from_account_id: data.linked_account_id,
        notes: `${data.action === 'SELL' ? 'Sold' : 'Received dividend on'} ${data.quantity} ${data.symbol} @ ₹${data.price} via Investment Log`,
        categoryName: INVESTMENT_INCOME_CATEGORY_NAME,
        categoryType: 'Income',
      };
    }
    case 'BONUS':
    case 'SPLIT':
      return null;
    default:
      return null;
  }
}
