/**
 * Institution registry — every bank and broker offered in the import UI.
 *
 * `confidence` records how well the column layout is actually known, and drives
 * how the importer behaves rather than being documentation:
 *
 *  - 'verified'  — column set corroborated by multiple independent sources.
 *                  Exact header match is attempted first.
 *  - 'partial'   — layout described by a single source, or known to vary between
 *                  account types. Exact match attempted, heuristics as fallback.
 *  - 'heuristic' — no published column list exists. Detection is entirely by
 *                  semantic column matching, with manual mapping as the backstop.
 *
 * Deliberately NOT done: inventing a `columns` list for 'heuristic' institutions.
 * A wrong list is worse than none — it either rejects a valid file or, far worse,
 * matches partially and writes amounts into the wrong field. Every institution
 * without a published spec relies on columnHeuristics.ts, which resolves columns
 * by meaning and escalates to a user-confirmed mapping when unsure.
 */

export type ColumnConfidence = 'verified' | 'partial' | 'heuristic';

export interface Institution {
  id: string;
  label: string;
  confidence: ColumnConfidence;
  /** Known header set, when one is actually documented. Used for exact-match detection. */
  columns?: readonly string[];
  /** Grouping shown in the picker. */
  region?: string;
  /** Institution's own web domain, when confidently known — the import picker renders its
   * favicon next to the name for quick visual recognition (via Google's public favicon
   * service, so no logo assets are bundled/hosted here). Left undefined rather than guessed
   * for anything not confidently identified; the picker falls back to a generic icon. */
  domain?: string;
}

export const BANKS: readonly Institution[] = [
  {
    id: 'HDFC',
    label: 'HDFC Bank',
    region: 'India',
    confidence: 'verified',
    columns: ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
    domain: 'hdfcbank.com',
  },
  {
    id: 'SBI',
    label: 'State Bank of India',
    region: 'India',
    confidence: 'verified',
    columns: ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'],
    domain: 'sbi.co.in',
  },
  {
    id: 'ICICI',
    label: 'ICICI Bank',
    region: 'India',
    confidence: 'partial',
    columns: [
      'Transaction Date',
      'Value Date',
      'Cheque Number',
      'Transaction Remarks',
      'Withdrawal Amount (INR )',
      'Deposit Amount (INR )',
      'Balance (INR )',
    ],
    domain: 'icicibank.com',
  },
  {
    id: 'AXIS',
    label: 'Axis Bank',
    region: 'India',
    confidence: 'partial',
    columns: ['Tran Date', 'Chq No', 'Particulars', 'Debit', 'Credit', 'Balance'],
    domain: 'axisbank.com',
  },
  {
    id: 'KOTAK',
    label: 'Kotak Mahindra Bank',
    region: 'India',
    confidence: 'partial',
    columns: ['Date', 'Description', 'Chq / Ref No', 'Debit', 'Credit', 'Balance'],
    domain: 'kotak.com',
  },
  {
    id: 'IDFC',
    label: 'IDFC FIRST Bank',
    region: 'India',
    confidence: 'partial',
    columns: ['Transaction Date', 'Value Date', 'Narration', 'Debit', 'Credit', 'Balance'],
    domain: 'idfcfirstbank.com',
  },
  // Qatar — no published CSV column spec found for either; both rely on
  // heuristic detection plus manual mapping.
  { id: 'DOHA', label: 'Doha Bank', region: 'Qatar', confidence: 'heuristic', domain: 'dohabank.com' },
  { id: 'CBQ', label: 'Commercial Bank of Qatar', region: 'Qatar', confidence: 'heuristic', domain: 'cbq.qa' },
  { id: 'OTHER_BANK', label: 'Other / not listed', region: 'Any', confidence: 'heuristic' },
];

export const BROKERS: readonly Institution[] = [
  {
    id: 'ZERODHA',
    label: 'Zerodha',
    confidence: 'verified',
    columns: [
      'symbol',
      'isin',
      'trade_date',
      'exchange',
      'segment',
      'series',
      'trade_type',
      'auction',
      'quantity',
      'price',
      'trade_id',
      'order_id',
      'order_execution_time',
    ],
    domain: 'zerodha.com',
  },
  {
    id: 'UPSTOX',
    label: 'Upstox',
    confidence: 'partial',
    columns: [
      'trading_symbol',
      'exchange',
      'segment',
      'product',
      'transaction_type',
      'quantity',
      'average_price',
      'trade_id',
      'order_id',
      'trade_date',
      'order_timestamp',
    ],
    domain: 'upstox.com',
  },
  // No published column spec found for any of the following — all heuristic.
  { id: 'GROWW', label: 'Groww', confidence: 'heuristic', domain: 'groww.in' },
  { id: 'INDMONEY', label: 'INDmoney', confidence: 'heuristic', domain: 'indmoney.com' },
  { id: 'ICICI_DIRECT', label: 'ICICI Direct', confidence: 'heuristic', domain: 'icicidirect.com' },
  { id: 'CDSL', label: 'CDSL', confidence: 'heuristic', domain: 'cdslindia.com' },
  { id: 'ANGEL_ONE', label: 'Angel One', confidence: 'heuristic', domain: 'angelone.in' },
  { id: 'AIONION', label: 'Aionion', confidence: 'heuristic' },
  { id: 'CHOLA', label: 'Chola Securities', confidence: 'heuristic' },
  { id: 'MSTOCK', label: 'mstock', confidence: 'heuristic', domain: 'mstock.com' },
  { id: 'FIVEPAISA', label: '5paisa', confidence: 'heuristic', domain: '5paisa.com' },
  { id: 'VESTED', label: 'Vested', confidence: 'heuristic', domain: 'vestedfinance.com' },
  { id: 'TICKERTAPE', label: 'Tickertape', confidence: 'heuristic', domain: 'tickertape.in' },
  { id: 'STOCKAL', label: 'Stockal', confidence: 'heuristic', domain: 'stockal.com' },
  { id: 'IBKR', label: 'Interactive Brokers', confidence: 'heuristic', domain: 'interactivebrokers.com' },
  { id: 'KUVERA', label: 'Kuvera', confidence: 'heuristic', domain: 'kuvera.in' },
  { id: 'MFCENTRAL', label: 'MFCentral CAS', confidence: 'heuristic', domain: 'mfcentral.com' },
  { id: 'KOTAK_NEO', label: 'Kotak Neo', confidence: 'heuristic', domain: 'kotak.com' },
  { id: 'OTHER_BROKER', label: 'Other / not listed', confidence: 'heuristic' },
];

export function findBank(id: string): Institution | undefined {
  return BANKS.find((b) => b.id === id);
}

export function findBroker(id: string): Institution | undefined {
  return BROKERS.find((b) => b.id === id);
}
