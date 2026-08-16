import { transactionSchema, type TransactionInput } from '../schemas/transaction.schema';
import type { TransactionType } from '../types';
import {
  resolveNameToId,
  parseAmount,
  createDedupChecker,
  type ImportPlan,
  type ImportRowError,
  type ImportRecord,
} from './csvImport';
import { detectBankMapping, type DetectedMapping } from './columnHeuristics';
import { BANKS, findBank } from './institutions';

export { BANKS, findBank };

/**
 * Native bank statement import — parses a bank's own NetBanking export as-is,
 * rather than requiring our CSV template.
 *
 * Columns are resolved to a `BankColumnMapping` before any row is read. That
 * mapping comes from one of three places, in order:
 *   1. an exact match against a documented column set for the chosen bank,
 *   2. semantic detection (columnHeuristics.ts) for banks with no published spec,
 *   3. an explicit mapping supplied by the user after confirming it in the UI.
 *
 * Because every path produces the same mapping shape, the row parser below has
 * no per-bank branching at all — supporting another bank is a registry entry,
 * not new parsing code.
 */
export interface BankColumnMapping {
  date: string;
  description: string;
  /** Separate debit/credit columns (most banks). */
  debit?: string;
  credit?: string;
  /** Single signed/flagged amount column (some Axis and Gulf-bank layouts). */
  amount?: string;
  drCrIndicator?: string;
  /** Optional running balance — enables buildBalanceReconciliation's self-check. */
  balance?: string;
}

export interface BankMappingResolution {
  mapping: BankColumnMapping | null;
  /** Required fields the caller must have the user map manually. */
  unresolved: string[];
  /** How the mapping was arrived at — surfaced in the UI so the user knows to check. */
  source: 'exact' | 'heuristic' | 'manual';
}

function normalize(header: string): string {
  return header.trim();
}

/** True when the file's headers are exactly the documented set for `bankId` (order-independent). */
export function matchesKnownBankColumns(headers: string[], bankId: string): boolean {
  const bank = findBank(bankId);
  if (!bank?.columns) return false;
  if (headers.length !== bank.columns.length) return false;
  const actual = new Set(headers.map(normalize));
  return bank.columns.every((c) => actual.has(c));
}

/**
 * Resolves the column mapping for an uploaded statement. Never guesses past the
 * point of confidence: if a required field can't be resolved, `mapping` is null
 * and `unresolved` tells the caller which fields to ask the user about.
 */
export function resolveBankMapping(headers: string[], bankId?: string): BankMappingResolution {
  const detected: DetectedMapping = detectBankMapping(headers);
  const usedExact = !!bankId && matchesKnownBankColumns(headers, bankId);

  if (detected.unresolved.length > 0) {
    return { mapping: null, unresolved: detected.unresolved, source: usedExact ? 'exact' : 'heuristic' };
  }

  return {
    mapping: detected.mapping as unknown as BankColumnMapping,
    unresolved: [],
    source: usedExact ? 'exact' : 'heuristic',
  };
}

/** Identifies which listed bank an unknown file most likely came from, if any. */
export function detectBankFormat(headers: string[]): string | null {
  return BANKS.find((b) => b.columns && matchesKnownBankColumns(headers, b.id))?.id ?? null;
}

/** Bank exports use DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY, or ISO — normalize to YYYY-MM-DD. */
export function parseBankDate(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const isoWithTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T]/);
  if (isoWithTime) return isoWithTime[1]!;

  // 4-digit year is tried BEFORE 2-digit: the pattern is unanchored at the end
  // (so a trailing timestamp is tolerated), which means a `\d{2}` branch listed
  // first would match "20" out of "2026" and silently yield the year 2020.
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})(?!\d)/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const yearPart = match[3]!;
  const year = yearPart.length === 2 ? 2000 + Number(yearPart) : Number(yearPart);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface CategoryGuess {
  categoryName: string;
  type: TransactionType;
}

/** Ordered keyword -> category guesses, checked in order (first match wins). Best-effort only. */
const CATEGORY_KEYWORDS: { pattern: RegExp; categoryName: string; type: TransactionType }[] = [
  { pattern: /swiggy|zomato|dominos|mcdonald/i, categoryName: 'Food', type: 'Expense' },
  { pattern: /uber|\bola\b|rapido|irctc|redbus/i, categoryName: 'Transport', type: 'Expense' },
  { pattern: /amazon|flipkart|myntra|ajio|nykaa/i, categoryName: 'Shopping', type: 'Expense' },
  { pattern: /electricity|bescom|mseb|tneb|water bill|gas bill/i, categoryName: 'Utilities', type: 'Expense' },
  { pattern: /airtel|jio|vodafone|\bvi\b|bsnl|broadband/i, categoryName: 'Utilities', type: 'Expense' },
  { pattern: /\batm\b|cash wdl|cash withdrawal/i, categoryName: 'Cash Withdrawal', type: 'Expense' },
  { pattern: /salary|sal cr|payroll/i, categoryName: 'Salary', type: 'Income' },
  { pattern: /\brent\b/i, categoryName: 'Rent', type: 'Expense' },
  { pattern: /netflix|hotstar|prime video|spotify|youtube premium/i, categoryName: 'Entertainment', type: 'Expense' },
  { pattern: /\bemi\b|loan repay/i, categoryName: 'Loan EMI', type: 'Expense' },
  { pattern: /bigbasket|dmart|grofers|blinkit|zepto|grocery/i, categoryName: 'Groceries', type: 'Expense' },
  { pattern: /apollo|pharmeasy|1mg|hospital|clinic|medical/i, categoryName: 'Healthcare', type: 'Expense' },
  { pattern: /\bsip\b|mutual fund|zerodha|groww|upstox/i, categoryName: 'Investment', type: 'Expense' },
  { pattern: /interest credit|int\.?\s*cr/i, categoryName: 'Interest Income', type: 'Income' },
];

export function categorizeDescription(description: string): CategoryGuess | null {
  const match = CATEGORY_KEYWORDS.find(({ pattern }) => pattern.test(description));
  return match ? { categoryName: match.categoryName, type: match.type } : null;
}

/** Case-insensitive field read, so header casing differences don't break the mapping. */
function readField(record: Record<string, string>, column: string | undefined): string {
  if (!column) return '';
  const direct = record[column];
  if (direct !== undefined) return direct;
  const wanted = column.trim().toLowerCase();
  const hit = Object.keys(record).find((k) => k.trim().toLowerCase() === wanted);
  return hit ? (record[hit] ?? '') : '';
}

/**
 * Reads the debit/credit pair off a row, supporting both layouts:
 * separate Debit/Credit columns, or one Amount column plus a DR/CR flag.
 * Returns absolute values; direction is decided by the caller.
 */
function readAmounts(record: Record<string, string>, mapping: BankColumnMapping): { debit: number; credit: number } {
  if (mapping.amount) {
    const raw = parseAmount(readField(record, mapping.amount)) ?? 0;
    const indicator = readField(record, mapping.drCrIndicator).trim().toLowerCase();
    // Prefer an explicit DR/CR flag; otherwise fall back to the sign, which is
    // how single-column exports without a flag encode direction.
    const isDebit = indicator ? /^(dr|debit|d|w)/.test(indicator) : raw < 0;
    const magnitude = Math.abs(raw);
    return isDebit ? { debit: magnitude, credit: 0 } : { debit: 0, credit: magnitude };
  }

  return {
    debit: Math.abs(parseAmount(readField(record, mapping.debit)) ?? 0),
    credit: Math.abs(parseAmount(readField(record, mapping.credit)) ?? 0),
  };
}

const RECONCILIATION_TOLERANCE = 0.01;

export interface BalanceReconciliation {
  /** False when no balance column was mapped — the file simply can't be self-checked. */
  checkable: boolean;
  /** Adjacent row pairs actually compared (one fewer than the row count, minus any gaps). */
  totalChecked: number;
  mismatches: number;
  /** The first row number that failed, for pointing the user at where to look. */
  firstMismatchRow: number | null;
}

/**
 * Self-checks a parsed statement against its own running balance column,
 * without needing a real sample file from the institution.
 *
 * Every real bank statement satisfies one identity, in file order:
 *   balance[row n] = balance[row n-1] + (credit - debit) of row n
 * That holds regardless of institution, so verifying it validates the debit/
 * credit/amount mapping actually chosen for THIS file — catching a swapped
 * debit/credit column, a wrong sign, or a broken amount parse — the same class
 * of bug a synthetic "realistic" fixture would not have caught, because this
 * checks arithmetic the file itself commits to, not a shape I assumed.
 *
 * A gap where the balance column doesn't parse (a subtotal row, a blank line)
 * breaks the chain for one comparison and resumes from the next valid balance,
 * rather than treating everything after it as one giant mismatch.
 */
export function checkBalanceReconciliation(
  mapping: BankColumnMapping,
  records: ImportRecord[]
): BalanceReconciliation {
  if (!mapping.balance) {
    return { checkable: false, totalChecked: 0, mismatches: 0, firstMismatchRow: null };
  }

  let totalChecked = 0;
  let mismatches = 0;
  let firstMismatchRow: number | null = null;
  let previousBalance: number | null = null;

  for (const { row, record } of records) {
    const balance = parseAmount(readField(record, mapping.balance));
    if (balance === null) {
      previousBalance = null; // resync from the next row with a usable balance
      continue;
    }

    if (previousBalance !== null) {
      const { debit, credit } = readAmounts(record, mapping);
      const expectedDelta = credit - debit;
      const actualDelta = balance - previousBalance;
      totalChecked++;
      if (Math.abs(actualDelta - expectedDelta) > RECONCILIATION_TOLERANCE) {
        mismatches++;
        firstMismatchRow ??= row;
      }
    }

    previousBalance = balance;
  }

  return { checkable: true, totalChecked, mismatches, firstMismatchRow };
}

/**
 * Validates and dedups a bank statement into the same shape the standard
 * Transactions import produces, so it reuses `createTransactionsBulk` and the
 * existing dedup key. Every row belongs to one account, chosen by the user
 * before upload — statements don't name the account they belong to.
 */
export function buildBankStatementImportPlan(
  mapping: BankColumnMapping,
  records: ImportRecord[],
  fromAccountId: string,
  categoryIndex: Map<string, string>,
  existingKeys: string[]
): ImportPlan<TransactionInput> {
  const errors: ImportRowError[] = [];
  const validRows: TransactionInput[] = [];
  let duplicateCount = 0;
  const isDuplicate = createDedupChecker(existingKeys);

  for (const { row, record } of records) {
    const rawDate = readField(record, mapping.date);
    const date = parseBankDate(rawDate);
    if (!date) {
      errors.push({ row, reason: `Invalid or unrecognized date "${rawDate}"` });
      continue;
    }

    const { debit, credit } = readAmounts(record, mapping);
    if (debit <= 0 && credit <= 0) continue; // opening-balance / summary row, not an error

    const type: TransactionType = credit > debit ? 'Income' : 'Expense';
    const amount = type === 'Income' ? credit : debit;
    const description = readField(record, mapping.description);

    const guess = categorizeDescription(description);
    let categoryId: string | null = null;
    if (guess && guess.type === type) {
      const resolved = resolveNameToId(categoryIndex, guess.categoryName);
      if (!('error' in resolved)) categoryId = resolved.id;
    }

    const parsed = transactionSchema.safeParse({
      date,
      type,
      category_id: categoryId,
      amount,
      from_account_id: fromAccountId,
      notes: description || undefined,
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
