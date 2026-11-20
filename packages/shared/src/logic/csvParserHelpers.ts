/**
 * Pure helper utilities for robust CSV parsing across Indian brokers and banks.
 * Handles Indian number formatting (lakhs/crores), diverse date conventions,
 * metadata header offset detection, header alias normalization, and transaction direction.
 */

export const BROKER_HEADER_KEYWORDS = [
  'symbol',
  'stock name',
  'scrip',
  'ticker',
  'isin',
  'stock',
  'quantity',
  'qty',
  'units',
  'shares',
  'no. of shares',
  'price',
  'rate',
  'avg price',
  'average price',
  'trade price',
  'buy price',
  'nav',
  'value',
  'total',
  'amount',
  'total value',
  'net amount',
  'exchange',
  'type',
  'action',
  'buy',
  'sell',
  'date',
  'execution date',
  'trade date',
];

export const BANK_HEADER_KEYWORDS = [
  'description',
  'particulars',
  'narration',
  'remarks',
  'details',
  'transaction description',
  'debit',
  'withdrawal',
  'paid out',
  'dr',
  'debit amount',
  'withdrawal amt',
  'credit',
  'deposit',
  'paid in',
  'cr',
  'credit amount',
  'deposit amt',
  'balance',
  'closing balance',
  'running balance',
  'date',
  'transaction date',
  'value date',
  'posting date',
  'ref no',
  'cheque no',
  'chq no',
  'transaction id',
  'utr',
  'reference',
  'type',
  'dr/cr',
];

export const CUSTOM_HEADER_KEYWORDS = [
  'date',
  'amount',
  'category',
  'account',
  'type',
  'description',
  'notes',
  'symbol',
  'quantity',
  'price',
];

export const HEADER_ALIASES: Record<string, string> = {
  // Quantity
  qty: 'quantity',
  units: 'quantity',
  shares: 'quantity',
  'no. of shares': 'quantity',
  'no of shares': 'quantity',
  'share count': 'quantity',

  // Price
  rate: 'price',
  nav: 'price',
  'avg price': 'price',
  'average price': 'price',
  'trade price': 'price',
  'buy price': 'price',
  'purchase price': 'price',
  'unit price': 'price',

  // Total
  value: 'total',
  amount: 'total',
  'total value': 'total',
  'net amount': 'total',
  investment: 'total',
  'trade value': 'total',
  'order value': 'total',

  // Date
  'execution date': 'date',
  'trade date': 'date',
  'transaction date': 'date',
  'value date': 'date',
  'posting date': 'date',
  'txn date': 'date',

  // Symbol
  'stock name': 'symbol',
  ticker: 'symbol',
  scrip: 'symbol',
  isin: 'isin',
  instrument: 'symbol',
  tradingsymbol: 'symbol',

  // Bank Debit
  withdrawal: 'debit',
  'withdrawal amt': 'debit',
  'withdrawal amount': 'debit',
  'paid out': 'debit',
  dr: 'debit',
  'debit amount': 'debit',

  // Bank Credit
  deposit: 'credit',
  'deposit amt': 'credit',
  'deposit amount': 'credit',
  'paid in': 'credit',
  cr: 'credit',
  'credit amount': 'credit',

  // Description
  particulars: 'description',
  narration: 'description',
  remarks: 'description',
  details: 'description',
  'transaction description': 'description',
  'transaction remarks': 'description',

  // Balance
  'closing balance': 'balance',
  'running balance': 'balance',

  // Other
  'chq no': 'cheque_no',
  'cheque no': 'cheque_no',
  'ref no': 'reference',
  'transaction id': 'reference',
  utr: 'reference',
  'trade type': 'type',
  'transaction type': 'type',
  side: 'type',
  action: 'type',
};

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may_: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= daysInMonth;
}

/**
 * Normalizes an amount string.
 * Handles Indian comma notation (1,00,000.50), currency symbols (₹, $, Rs),
 * accounting parenthesized negatives ((500) -> -500), and whitespace.
 * Returns null for unparseable strings, placeholders, or empty cells.
 */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed.toUpperCase() === 'N.A.' || trimmed.toUpperCase() === 'NIL') {
    return null;
  }

  const isParenthesised = /^\(.*\)$/.test(trimmed);

  const cleaned = trimmed
    .replace(/^\(|\)$/g, '')
    .replace(/(?:₹|rs\.?|inr|usd|\$|aed|qar|sgd)/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();

  const num = Number(cleaned);
  if (isNaN(num)) return null;

  return isParenthesised ? -Math.abs(num) : num;
}

/**
 * Parses dates with an ordered fallback chain:
 * 1. ISO: YYYY-MM-DD
 * 2. Day-first: DD-MM-YYYY or DD/MM/YYYY
 * 3. Named month: DD-MMM-YYYY or DD MMM YYYY (e.g. 1-Jan-2024, 01-Jan-2024, 15 Mar 2026)
 * 4. Slash/Dash with 2 or 4 digit year
 * 5. Excel serial date (bare integer 18262-73050)
 * Returns "YYYY-MM-DD" or null.
 */
export function parseDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. ISO: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (isValidDate(y, m, d)) return `${y}-${pad(m)}-${pad(d)}`;
  }

  // 2. Named month: DD-MMM-YYYY, DD/MMM/YYYY, DD MMM YYYY (e.g. 1-Jan-2024 or 01-Jan-2024)
  const monthNameMatch = trimmed.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})(?:[ T].*)?$/);
  if (monthNameMatch) {
    const d = Number(monthNameMatch[1]);
    const monthStr = monthNameMatch[2]!.toLowerCase();
    const m = MONTH_NAMES[monthStr];
    let y = Number(monthNameMatch[3]);
    if (monthNameMatch[3]!.length === 2) y += 2000;

    if (m && isValidDate(y, m, d)) {
      return `${y}-${pad(m)}-${pad(d)}`;
    }
  }

  // 3. DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ T].*)?$/);
  if (dmyMatch) {
    const a = Number(dmyMatch[1]);
    const b = Number(dmyMatch[2]);
    let y = Number(dmyMatch[3]);
    if (dmyMatch[3]!.length === 2) y += 2000;

    // Resolve day vs month: in Indian statements day is first
    let d = a;
    let m = b;
    if (a > 12 && b <= 12) {
      d = a;
      m = b;
    } else if (b > 12 && a <= 12) {
      d = b;
      m = a;
    }

    if (isValidDate(y, m, d)) {
      return `${y}-${pad(m)}-${pad(d)}`;
    }
  }

  // 4. Excel date serial (bare 4-6 digit number)
  if (/^\d{4,6}$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial >= 18262 && serial <= 73050) {
      const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
      const d = new Date(EXCEL_EPOCH_MS + serial * 86_400_000);
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }
  }

  return null;
}

/**
 * Scans the first 25 rows of a spreadsheet to find the true header row.
 * Returns the index of the first row containing >= 2 keyword matches.
 * Returns -1 if none found.
 */
export function findHeaderRow(
  rows: string[][],
  type: 'broker' | 'bank' | 'custom'
): number {
  if (!rows || rows.length === 0) return -1;

  const keywords =
    type === 'broker'
      ? BROKER_HEADER_KEYWORDS
      : type === 'bank'
        ? BANK_HEADER_KEYWORDS
        : CUSTOM_HEADER_KEYWORDS;

  const limit = Math.min(rows.length, 25);

  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const nonEmptyCells = row.filter((c) => c && c.trim().length > 0);
    if (nonEmptyCells.length < 2) continue;

    let hits = 0;
    for (const cell of nonEmptyCells) {
      const clean = cell
        .trim()
        .toLowerCase()
        .replace(/[._()[\]/\\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (keywords.some((kw) => clean === kw || clean.includes(kw))) {
        hits++;
      }
    }

    if (hits >= 2) {
      return i;
    }
  }

  return -1;
}

/**
 * Normalizes an array of header strings into canonical schema keys using aliases.
 */
export function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const clean = (h ?? '')
      .trim()
      .toLowerCase()
      .replace(/[._()[\]/\\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return HEADER_ALIASES[clean] || clean;
  });
}

/**
 * Determines whether a file represents per-share pricing or total trade amounts.
 * If both 'price' and 'total' exist, or only 'total' exists, returns 'total' (e.g. Groww).
 * Otherwise defaults to 'per_share' (e.g. Zerodha).
 */
export function detectPriceFormat(normalizedHeaders: string[]): 'per_share' | 'total' {
  const hasPrice = normalizedHeaders.includes('price');
  const hasTotal = normalizedHeaders.includes('total');
  if (hasPrice && hasTotal) return 'total';
  if (hasTotal) return 'total';
  return 'per_share';
}

/**
 * Parses the transaction type (Income, Expense, Transfer) from a row's fields.
 */
export function parseTransactionType(
  row: Record<string, string>
): 'Income' | 'Expense' | 'Transfer' | null {
  for (const [key, rawVal] of Object.entries(row)) {
    const normKey = key.trim().toLowerCase();
    if (!normKey.includes('type') && !normKey.includes('dr') && !normKey.includes('cr') && !normKey.includes('action')) {
      continue;
    }

    const val = (rawVal ?? '').trim().toLowerCase();
    if (/^(cr|credit|deposit|income|received|subscription)$/.test(val) || /\b(credit|deposit|income)\b/.test(val)) {
      return 'Income';
    }
    if (/^(dr|debit|withdrawal|withdrawl|expense|paid|payment|redemption)$/.test(val) || /\b(debit|withdrawal|expense)\b/.test(val)) {
      return 'Expense';
    }
    if (/^(transfer|contra|xfer)$/.test(val) || /\b(transfer|contra)\b/.test(val)) {
      return 'Transfer';
    }
  }

  return null;
}
