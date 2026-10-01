/**
 * Keyword lists for flagging a bank statement credit row as a likely stock/mutual-fund
 * dividend during import — see dividendDetection.ts. Deliberately keyword-only (no
 * bank-specific regex, no fuzzy company matching): the user confirms the actual symbol by
 * hand in the import review step, so detection only needs to decide "is this worth asking
 * about", not identify the stock itself.
 */

export const DIVIDEND_HIGH_CONFIDENCE_KEYWORDS = [
  'DIVIDEND',
  'DIV CR',
  'DIV PAYOUT',
  'DIVIDEND PAYOUT',
  'INTERIM DIVIDEND',
  'FINAL DIVIDEND',
  'SPECIAL DIVIDEND',
  'MF DIVIDEND',
  'MUTUAL FUND DIVIDEND',
  'QUALIFIED DIVIDEND',
  'ORDINARY DIVIDEND',
  'DIVIDEND RECEIVED',
  'DIV RECEIVED',
] as const;

export const DIVIDEND_MEDIUM_CONFIDENCE_KEYWORDS = [
  'PAYOUT',
  'DISTRIBUTION',
  'IDCW',
  'INCOME DISTRIBUTION',
  'INCOME PAYOUT',
  'ANNUAL PAYOUT',
] as const;

/** Credits that can superficially resemble a dividend keyword but aren't one — always wins
 * over a match above, since these describe a fundamentally different kind of credit. */
export const DIVIDEND_EXCLUDE_KEYWORDS = [
  'INTEREST CREDIT',
  'INT CREDIT',
  'FD INTEREST',
  'SAVINGS INTEREST',
  'REVERSAL',
  'REFUND',
  'MATURITY',
  'REDEMPTION',
  'BONUS SHARES',
  'STOCK SPLIT',
] as const;
