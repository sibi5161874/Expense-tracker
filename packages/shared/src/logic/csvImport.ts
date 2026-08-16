import { EXAMPLE_ROW_MARKER } from '../importTemplates';
import { transactionSchema, type TransactionInput } from '../schemas/transaction.schema';
import { investmentLogSchema, type InvestmentLogInput } from '../schemas/investmentLog.schema';
import { cashbookSchema, type CashbookInput } from '../schemas/cashbook.schema';

export interface ImportRowError {
  row: number;
  reason: string;
}

export interface ImportPlan<T> {
  errors: ImportRowError[];
  validRows: T[];
  duplicateCount: number;
}

/** Exact header match only — no fuzzy/partial matching, per the import spec. */
export function headersMatch(actual: string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length) return false;
  return expected.every((col, i) => (actual[i] ?? '').trim() === col);
}

/**
 * Maps CSV data rows (everything after the header row) to column-name-keyed records.
 * Rows whose first cell starts with the "EXAMPLE" marker are skipped (not errors).
 * `row` in each entry is the 1-indexed line number in the original file (header = row 1).
 */
export function rowsToRecords(
  rows: string[][],
  columns: readonly string[]
): { row: number; record: Record<string, string> }[] {
  const dataRows = rows.slice(1);
  const result: { row: number; record: Record<string, string> }[] = [];

  dataRows.forEach((cells, i) => {
    const rowNumber = i + 2;
    if ((cells[0] ?? '').trim().toUpperCase().startsWith(EXAMPLE_ROW_MARKER)) return;
    if (cells.every((c) => c.trim() === '')) return;

    const record: Record<string, string> = {};
    columns.forEach((col, idx) => {
      record[col] = (cells[idx] ?? '').trim();
    });
    result.push({ row: rowNumber, record });
  });

  return result;
}

/** Case-insensitive name -> id lookup map, for resolving human-readable account/category names. */
export function buildNameIndex(items: { id: string; name: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    map.set(item.name.trim().toLowerCase(), item.id);
  }
  return map;
}

export function resolveNameToId(index: Map<string, string>, name: string): { id: string } | { error: string } {
  if (!name) return { error: 'not provided' };
  const id = index.get(name.trim().toLowerCase());
  if (!id) return { error: `no match found for "${name}"` };
  return { id };
}

/**
 * Parses a monetary value out of a CSV cell.
 *
 * Bare `Number()` is not enough: Indian statements group digits as
 * "1,50,000.00" (lakh/crore, not thousands), and exports variously prefix a
 * currency symbol or code. Every one of those returns NaN from `Number()`,
 * which previously meant any amount above ₹999 silently failed to import.
 *
 * Accounting-style negatives — "(500)" — are also normalized, since several
 * statement and tradebook exports use parentheses rather than a minus sign.
 *
 * Deliberately still rejected: empty cells and placeholder tokens ("-", "N.A.",
 * "NIL"). Those mean "no value", and coercing them to 0 would fabricate a
 * transaction amount.
 */
export function parseAmount(value: string): number | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed === '') return null;

  // Parenthesised values are negative in accounting notation: (500) === -500.
  const isParenthesisedNegative = /^\(.*\)$/.test(trimmed);

  const cleaned = trimmed
    .replace(/^\(|\)$/g, '')
    // Currency symbols and ISO codes that appear inline in real exports.
    .replace(/(?:₹|rs\.?|inr|usd|\$|aed|qar|sgd)/gi, '')
    // Digit-group separators. Safe to drop wholesale because a decimal point is
    // the only separator that carries meaning here.
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();

  // Guard against strings that survive cleaning but aren't numbers ("-", "N.A.",
  // "NIL", "abc"). Number('') is 0 and Number('-') is NaN, so an explicit
  // numeric-shape check is clearer than relying on those quirks.
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  return isParenthesisedNegative ? -Math.abs(n) : n;
}

export function normalizeDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  return value.trim();
}

/**
 * Multiset-based duplicate check: a row is only flagged as a duplicate up to the
 * number of matching rows that already exist in the DB. Using a plain Set here would
 * wrongly drop a *new*, legitimately distinct row whose (date, category, amount) key
 * happens to collide with an existing row — e.g. a second ₹500 lunch on the same day
 * in the same category. Each call to `isDuplicate` consumes one occurrence of the key.
 */
export function createDedupChecker(existingKeys: string[]): (key: string) => boolean {
  const counts = new Map<string, number>();
  for (const key of existingKeys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return (key: string) => {
    const remaining = counts.get(key) ?? 0;
    if (remaining <= 0) return false;
    counts.set(key, remaining - 1);
    return true;
  };
}

export interface ImportRecord {
  row: number;
  record: Record<string, string>;
}

/**
 * Validates and dedups parsed transaction CSV rows. Pulled out of the import Route
 * Handler so it's a pure function that can be unit tested without a Next.js request
 * or a Supabase client — the actual validation/dedup logic is the most complex code
 * in the import pipeline and previously had zero test coverage.
 */
export function buildTransactionImportPlan(
  records: ImportRecord[],
  accountIndex: Map<string, string>,
  categoryIndex: Map<string, string>,
  existingKeys: string[]
): ImportPlan<TransactionInput> {
  const errors: ImportRowError[] = [];
  const validRows: TransactionInput[] = [];
  let duplicateCount = 0;
  const isDuplicate = createDedupChecker(existingKeys);

  for (const { row, record } of records) {
    const date = normalizeDate(record['Date'] ?? '');
    if (!date) {
      errors.push({ row, reason: 'Invalid or missing Date (expected YYYY-MM-DD)' });
      continue;
    }

    const type = record['Type'];
    if (type !== 'Income' && type !== 'Expense' && type !== 'Transfer') {
      errors.push({ row, reason: `Invalid Type "${type}" (expected Income/Expense/Transfer)` });
      continue;
    }

    let categoryId: string | null = null;
    if (record['Category']) {
      const resolved = resolveNameToId(categoryIndex, record['Category']!);
      if ('error' in resolved) {
        errors.push({ row, reason: `Category ${resolved.error}` });
        continue;
      }
      categoryId = resolved.id;
    }

    const fromResolved = resolveNameToId(accountIndex, record['From Account'] ?? '');
    if ('error' in fromResolved) {
      errors.push({ row, reason: `From Account ${fromResolved.error}` });
      continue;
    }

    let toAccountId: string | null = null;
    if (record['To Account']) {
      const toResolved = resolveNameToId(accountIndex, record['To Account']!);
      if ('error' in toResolved) {
        errors.push({ row, reason: `To Account ${toResolved.error}` });
        continue;
      }
      toAccountId = toResolved.id;
    }

    const amount = parseAmount(record['Amount'] ?? '');
    if (amount === null || amount <= 0) {
      errors.push({ row, reason: `Invalid Amount "${record['Amount']}"` });
      continue;
    }

    const parsed = transactionSchema.safeParse({
      date,
      type,
      category_id: categoryId,
      sub_category: record['Sub-Category'] || undefined,
      amount,
      from_account_id: fromResolved.id,
      to_account_id: toAccountId,
      notes: record['Notes'] || undefined,
    });
    if (!parsed.success) {
      errors.push({ row, reason: parsed.error.issues[0]?.message ?? 'Validation failed' });
      continue;
    }

    const key = `${date}|${categoryId ?? ''}|${amount}`;
    if (isDuplicate(key)) {
      duplicateCount++;
      continue;
    }

    validRows.push(parsed.data);
  }

  return { errors, validRows, duplicateCount };
}

const INVESTMENT_ACTIONS = ['BUY', 'SELL', 'SIP', 'DIVIDEND', 'BONUS', 'SPLIT'] as const;
const INVESTMENT_ASSET_TYPES = ['Stock', 'ETF', 'Mutual Fund', 'Crypto', 'Bond', 'Other'] as const;

export function buildInvestmentLogImportPlan(
  records: ImportRecord[],
  accountIndex: Map<string, string>,
  existingKeys: string[]
): ImportPlan<InvestmentLogInput> {
  const errors: ImportRowError[] = [];
  const validRows: InvestmentLogInput[] = [];
  let duplicateCount = 0;
  const isDuplicate = createDedupChecker(existingKeys);

  for (const { row, record } of records) {
    const date = normalizeDate(record['Date'] ?? '');
    if (!date) {
      errors.push({ row, reason: 'Invalid or missing Date (expected YYYY-MM-DD)' });
      continue;
    }

    const symbol = record['Symbol'];
    if (!symbol) {
      errors.push({ row, reason: 'Symbol is required' });
      continue;
    }

    const exchange = record['Exchange'];
    if (!exchange) {
      errors.push({ row, reason: 'Exchange is required' });
      continue;
    }

    const action = record['Action'];
    if (!INVESTMENT_ACTIONS.includes(action as (typeof INVESTMENT_ACTIONS)[number])) {
      errors.push({ row, reason: `Invalid Action "${action}" (expected ${INVESTMENT_ACTIONS.join('/')})` });
      continue;
    }

    const assetType = record['Asset Type'];
    if (!INVESTMENT_ASSET_TYPES.includes(assetType as (typeof INVESTMENT_ASSET_TYPES)[number])) {
      errors.push({
        row,
        reason: `Invalid Asset Type "${assetType}" (expected ${INVESTMENT_ASSET_TYPES.join('/')})`,
      });
      continue;
    }

    const quantity = parseAmount(record['Quantity'] ?? '');
    const price = parseAmount(record['Price'] ?? '');
    const fees = parseAmount(record['Fees'] ?? '') ?? 0;
    if (quantity === null || quantity < 0) {
      errors.push({ row, reason: `Invalid Quantity "${record['Quantity']}"` });
      continue;
    }
    if (price === null || price < 0) {
      errors.push({ row, reason: `Invalid Price "${record['Price']}"` });
      continue;
    }

    let bonusSplitExtraUnits: number | undefined;
    if (record['Bonus/Split Extra Units']) {
      const parsedExtra = parseAmount(record['Bonus/Split Extra Units']!);
      if (parsedExtra === null) {
        errors.push({ row, reason: `Invalid Bonus/Split Extra Units "${record['Bonus/Split Extra Units']}"` });
        continue;
      }
      bonusSplitExtraUnits = parsedExtra;
    }

    const linkedResolved = resolveNameToId(accountIndex, record['Linked Account'] ?? '');
    if ('error' in linkedResolved) {
      errors.push({ row, reason: `Linked Account ${linkedResolved.error}` });
      continue;
    }

    const parsed = investmentLogSchema.safeParse({
      date,
      symbol,
      exchange,
      action,
      quantity,
      price,
      fees,
      bonus_split_extra_units: bonusSplitExtraUnits,
      linked_account_id: linkedResolved.id,
      asset_type: assetType,
      notes: record['Notes'] || undefined,
    });
    if (!parsed.success) {
      errors.push({ row, reason: parsed.error.issues[0]?.message ?? 'Validation failed' });
      continue;
    }

    const key = `${date}|${symbol}|${quantity}|${price}`;
    if (isDuplicate(key)) {
      duplicateCount++;
      continue;
    }

    validRows.push(parsed.data);
  }

  return { errors, validRows, duplicateCount };
}

export function buildCashbookImportPlan(
  records: ImportRecord[],
  accountIndex: Map<string, string>,
  existingKeys: string[]
): ImportPlan<CashbookInput> {
  const errors: ImportRowError[] = [];
  const validRows: CashbookInput[] = [];
  let duplicateCount = 0;
  const isDuplicate = createDedupChecker(existingKeys);

  for (const { row, record } of records) {
    const date = normalizeDate(record['Date'] ?? '');
    if (!date) {
      errors.push({ row, reason: 'Invalid or missing Date (expected YYYY-MM-DD)' });
      continue;
    }

    const counterparty = record['Counterparty'];
    if (!counterparty) {
      errors.push({ row, reason: 'Counterparty is required' });
      continue;
    }

    const flow = record['Flow'];
    if (flow !== 'Gave' && flow !== 'Received') {
      errors.push({ row, reason: `Invalid Flow "${flow}" (expected Gave/Received)` });
      continue;
    }

    const amount = parseAmount(record['Amount'] ?? '');
    if (amount === null || amount <= 0) {
      errors.push({ row, reason: `Invalid Amount "${record['Amount']}"` });
      continue;
    }

    let dueDate: string | null = null;
    if (record['Due Date']) {
      const normalized = normalizeDate(record['Due Date']!);
      if (!normalized) {
        errors.push({ row, reason: `Invalid Due Date "${record['Due Date']}" (expected YYYY-MM-DD)` });
        continue;
      }
      dueDate = normalized;
    }

    let accountUsedId: string | null = null;
    if (record['Account Used']) {
      const resolved = resolveNameToId(accountIndex, record['Account Used']!);
      if ('error' in resolved) {
        errors.push({ row, reason: `Account Used ${resolved.error}` });
        continue;
      }
      accountUsedId = resolved.id;
    }

    const parsed = cashbookSchema.safeParse({
      date,
      counterparty,
      flow,
      amount,
      due_date: dueDate,
      account_used_id: accountUsedId,
      loan_id: record['Loan ID'] || undefined,
      notes: record['Notes'] || undefined,
    });
    if (!parsed.success) {
      errors.push({ row, reason: parsed.error.issues[0]?.message ?? 'Validation failed' });
      continue;
    }

    const key = `${date}|${counterparty.toLowerCase()}|${amount}|${flow}`;
    if (isDuplicate(key)) {
      duplicateCount++;
      continue;
    }

    validRows.push(parsed.data);
  }

  return { errors, validRows, duplicateCount };
}
