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
  /** Local image asset path when bundled. */
  logo?: string;
}

export const BANKS: readonly Institution[] = [
  {
    id: 'HDFC',
    label: 'HDFC Bank',
    region: 'India',
    confidence: 'verified',
    columns: ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
    domain: 'hdfcbank.com',
    logo: '/images/institutions/HDFC_back.jpg',
  },
  {
    id: 'SBI',
    label: 'State Bank of India',
    region: 'India',
    confidence: 'verified',
    columns: ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'],
    domain: 'sbi.co.in',
    logo: '/images/institutions/State_Bank_Of_india.png',
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
    logo: '/images/institutions/ICIC_bank.jpg',
  },
  {
    id: 'AXIS',
    label: 'Axis Bank',
    region: 'India',
    confidence: 'partial',
    columns: ['Tran Date', 'Chq No', 'Particulars', 'Debit', 'Credit', 'Balance'],
    domain: 'axisbank.com',
    logo: '/images/institutions/Axis_bank.png',
  },
  {
    id: 'KOTAK',
    label: 'Kotak Mahindra Bank',
    region: 'India',
    confidence: 'partial',
    columns: ['Date', 'Description', 'Chq / Ref No', 'Debit', 'Credit', 'Balance'],
    domain: 'kotak.com',
    logo: '/images/institutions/Kotack_bank.png',
  },
  {
    id: 'IDFC',
    label: 'IDFC FIRST Bank',
    region: 'India',
    confidence: 'partial',
    columns: ['Transaction Date', 'Value Date', 'Narration', 'Debit', 'Credit', 'Balance'],
    domain: 'idfcfirstbank.com',
    logo: '/images/institutions/IDFC.png',
  },
  // Qatar — no published CSV column spec found for either; both rely on
  // heuristic detection plus manual mapping.
  { id: 'DOHA', label: 'Doha Bank', region: 'Qatar', confidence: 'heuristic', domain: 'dohabank.com', logo: '/images/institutions/Doha_bank.png' },
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
    logo: '/images/institutions/Zerodha.png',
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
    logo: '/images/institutions/Upstocks.png',
  },
  // No published column spec found for any of the following — all heuristic.
  { id: 'GROWW', label: 'Groww', confidence: 'heuristic', domain: 'groww.in', logo: '/images/institutions/Groww.jpg' },
  { id: 'INDMONEY', label: 'INDmoney', confidence: 'heuristic', domain: 'indmoney.com', logo: '/images/institutions/Ind_money.png' },
  { id: 'ICICI_DIRECT', label: 'ICICI Direct', confidence: 'heuristic', domain: 'icicidirect.com', logo: '/images/institutions/ICIC_direct.jpg' },
  { id: 'CDSL', label: 'CDSL', confidence: 'heuristic', domain: 'cdslindia.com', logo: '/images/institutions/CDSL.png' },
  { id: 'ANGEL_ONE', label: 'Angel One', confidence: 'heuristic', domain: 'angelone.in', logo: '/images/institutions/Angelone.png' },
  { id: 'AIONION', label: 'Aionion', confidence: 'heuristic' },
  { id: 'CHOLA', label: 'Chola Securities', confidence: 'heuristic' },
  { id: 'MSTOCK', label: 'mstock', confidence: 'heuristic', domain: 'mstock.com', logo: '/images/institutions/M_Stocks.png' },
  { id: 'FIVEPAISA', label: '5paisa', confidence: 'heuristic', domain: '5paisa.com', logo: '/images/institutions/5_Paisa.jpg' },
  { id: 'VESTED', label: 'Vested', confidence: 'heuristic', domain: 'vestedfinance.com' },
  { id: 'TICKERTAPE', label: 'Tickertape', confidence: 'heuristic', domain: 'tickertape.in', logo: '/images/institutions/Ticker_tape.jpg' },
  { id: 'STOCKAL', label: 'Stockal', confidence: 'heuristic', domain: 'stockal.com' },
  { id: 'IBKR', label: 'Interactive Brokers', confidence: 'heuristic', domain: 'interactivebrokers.com' },
  { id: 'KUVERA', label: 'Kuvera', confidence: 'heuristic', domain: 'kuvera.in' },
  { id: 'MFCENTRAL', label: 'MFCentral CAS', confidence: 'heuristic', domain: 'mfcentral.com', logo: '/images/institutions/MF_central.jpg' },
  { id: 'KOTAK_NEO', label: 'Kotak Neo', confidence: 'heuristic', domain: 'kotak.com', logo: '/images/institutions/Kotak_Neo.png' },
  { id: 'OTHER_BROKER', label: 'Other / not listed', confidence: 'heuristic' },
];

export function findBank(id: string): Institution | undefined {
  return BANKS.find((b) => b.id === id);
}

export function findBroker(id: string): Institution | undefined {
  return BROKERS.find((b) => b.id === id);
}

export function getInstitutionLogo(identifier?: string): string | undefined {
  if (!identifier) return undefined;
  const lower = identifier.trim().toLowerCase();
  const allInstitutions = [...BANKS, ...BROKERS];

  // Exact ID / Label match
  const matched = allInstitutions.find(
    (i) => i.id.toLowerCase() === lower || i.label.toLowerCase() === lower || i.domain?.toLowerCase() === lower
  );
  if (matched?.logo) return matched.logo;

  // Substring keyword fallback
  if (lower.includes('zerodha')) return '/images/institutions/Zerodha.png';
  if (lower.includes('groww')) return '/images/institutions/Groww.jpg';
  if (lower.includes('upstox') || lower.includes('upstocks')) return '/images/institutions/Upstocks.png';
  if (lower.includes('angel') || lower.includes('angelone')) return '/images/institutions/Angelone.png';
  if (lower.includes('indmoney') || lower.includes('ind money')) return '/images/institutions/Ind_money.png';
  if (lower.includes('icici direct') || lower.includes('icicidirect')) return '/images/institutions/ICIC_direct.jpg';
  if (lower.includes('hdfc')) return '/images/institutions/HDFC_back.jpg';
  if (lower.includes('sbi') || lower.includes('state bank')) return '/images/institutions/State_Bank_Of_india.png';
  if (lower.includes('icici')) return '/images/institutions/ICIC_bank.jpg';
  if (lower.includes('axis')) return '/images/institutions/Axis_bank.png';
  if (lower.includes('kotak neo')) return '/images/institutions/Kotak_Neo.png';
  if (lower.includes('kotak')) return '/images/institutions/Kotack_bank.png';
  if (lower.includes('idfc')) return '/images/institutions/IDFC.png';
  if (lower.includes('doha')) return '/images/institutions/Doha_bank.png';
  if (lower.includes('5paisa') || lower.includes('fivepaisa')) return '/images/institutions/5_Paisa.jpg';
  if (lower.includes('tickertape')) return '/images/institutions/Ticker_tape.jpg';
  if (lower.includes('mfcentral') || lower.includes('mf central')) return '/images/institutions/MF_central.jpg';
  if (lower.includes('mstock') || lower.includes('m.stock') || lower.includes('m_stock')) return '/images/institutions/M_Stocks.png';
  if (lower.includes('cdsl')) return '/images/institutions/CDSL.png';

  return undefined;
}

