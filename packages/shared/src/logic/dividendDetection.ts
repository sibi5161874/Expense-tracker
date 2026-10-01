import {
  DIVIDEND_HIGH_CONFIDENCE_KEYWORDS,
  DIVIDEND_MEDIUM_CONFIDENCE_KEYWORDS,
  DIVIDEND_EXCLUDE_KEYWORDS,
} from '../config/dividendKeywords';

export interface DividendMatch {
  confidence: 'high' | 'medium';
}

/**
 * Flags a bank statement row as a likely dividend credit during import — see
 * BankStatementImportDialog.tsx for the review step this feeds. Keyword-only: identifying the
 * actual stock is left to the user in that review step, so this only needs to decide whether a
 * row is worth asking about.
 *
 * Only ever called for credit rows (`type === 'Income'`) — a debit is never a dividend.
 */
export function detectDividendCandidate(
  description: string,
  type: 'Income' | 'Expense' | 'Transfer'
): DividendMatch | null {
  if (type !== 'Income') return null;

  const normalized = description.toUpperCase();
  if (DIVIDEND_EXCLUDE_KEYWORDS.some((kw) => normalized.includes(kw))) return null;

  if (DIVIDEND_HIGH_CONFIDENCE_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return { confidence: 'high' };
  }
  if (DIVIDEND_MEDIUM_CONFIDENCE_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return { confidence: 'medium' };
  }
  return null;
}
