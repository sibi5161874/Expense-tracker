function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/** Strict `YYYY-MM-DD`, optionally followed by a time component (" HH:MM:SS" or "THH:MM:SS"). */
export function parseIsoDate(value: string): string | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return isValidCalendarDate(Number(y), Number(m), Number(d)) ? `${y}-${m}-${d}` : null;
}

/**
 * Parses a `D/M/Y` or `D-M-Y` date (slash or dash separated, 2- or 4-digit year).
 *
 * Day vs. month is resolved without guessing whenever one of the two leading components is
 * `>12` — only one reading is a valid calendar date, regardless of which locale produced the
 * file. When both are `<=12` the format is genuinely ambiguous (`03/04/2025` could be either
 * calendar date depending on the source spreadsheet's locale), and `ambiguous` decides what
 * happens: `'day-first'` resolves it as DD/MM (the documented convention every bank export in
 * this app's registry uses), `'reject'` returns null rather than guess — used for user-typed
 * template CSVs, where the source spreadsheet's locale is unknown and a wrong guess would
 * silently corrupt the date instead of surfacing an error.
 */
export function parseDayMonthYearDate(value: string, ambiguous: 'day-first' | 'reject'): string | null {
  // 4-digit year is tried BEFORE 2-digit: the pattern is unanchored at the end (so a trailing
  // timestamp is tolerated), which means a `\d{2}` branch listed first would match "20" out of
  // "2026" and silently yield the year 2020.
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})(?!\d)/);
  if (!match) return null;

  const a = Number(match[1]);
  const b = Number(match[2]);
  const yearPart = match[3]!;
  const year = yearPart.length === 2 ? 2000 + Number(yearPart) : Number(yearPart);

  let day: number;
  let month: number;
  if (a > 12 && b <= 12) {
    day = a;
    month = b;
  } else if (b > 12 && a <= 12) {
    day = b;
    month = a;
  } else if (a <= 12 && b <= 12) {
    if (ambiguous === 'reject') return null;
    day = a;
    month = b;
  } else {
    return null; // both > 12 — not a valid date under either reading
  }

  return isValidCalendarDate(year, month, day) ? `${year}-${pad(month)}-${pad(day)}` : null;
}

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;
// Roughly 1950-01-01 to 2099-12-31 — wide enough for any real transaction, narrow enough that
// an unrelated numeric ID/quantity sitting in a misaligned Date column isn't mistaken for one.
const MIN_SERIAL = 18_262;
const MAX_SERIAL = 73_050;

/**
 * Treats a bare 4-6 digit number as an Excel/Sheets date serial (days since 1899-12-30) and
 * converts it to an ISO date. Covers the case where a date cell got exported as its raw
 * numeric value instead of a formatted date string — e.g. the column's number format was
 * "General" rather than "Date" when the row was typed or pasted.
 */
export function parseExcelSerialDate(value: string): string | null {
  if (!/^\d{4,6}$/.test(value)) return null;
  const serial = Number(value);
  if (serial < MIN_SERIAL || serial > MAX_SERIAL) return null;
  const d = new Date(EXCEL_EPOCH_MS + serial * MS_PER_DAY);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
