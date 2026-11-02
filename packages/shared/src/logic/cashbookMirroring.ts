import type { CashbookInput } from '../schemas';

export interface CashbookMirrorTransaction {
  date: string;
  type: 'Income' | 'Expense';
  amount: number;
  from_account_id: string;
  notes: string;
}

/**
 * Decides the cash-side transaction (if any) that should mirror a cashbook entry. Lending
 * money out ("Gave") is cash leaving the account it was paid from; getting repaid or
 * borrowing ("Received") is cash coming into it — without this, cashbook lending/borrowing
 * never touches the account balance it actually moved through.
 *
 * Returns null when there's nothing to record: `account_used_id` is optional (a purely
 * informal IOU with no real account behind it) or the amount isn't a real positive number.
 */
export function buildCashbookMirrorTransaction(
  data: Pick<CashbookInput, 'date' | 'counterparty' | 'flow' | 'amount' | 'account_used_id'>
): CashbookMirrorTransaction | null {
  if (!data.account_used_id) return null;
  if (!(data.amount > 0)) return null;

  return {
    date: data.date,
    type: data.flow === 'Gave' ? 'Expense' : 'Income',
    amount: data.amount,
    from_account_id: data.account_used_id,
    notes:
      data.flow === 'Gave'
        ? `Lent to ${data.counterparty} via Cashbook`
        : `Borrowed from ${data.counterparty} via Cashbook`,
  };
}
