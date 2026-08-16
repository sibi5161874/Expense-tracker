/**
 * Semantic column detection for imported statements/tradebooks.
 *
 * Institutions do not publish CSV schemas, and the ones that are documented
 * change their export layout without notice. Hardcoding an exact column list
 * per institution therefore fails in two ways: files from undocumented
 * institutions can't be imported at all, and a documented institution silently
 * breaks the day it renames a column.
 *
 * Instead, columns are matched by MEANING: each candidate header is scored
 * against a vocabulary of known synonyms ("narration"/"particulars"/
 * "description" all mean the same thing). This handles any institution whose
 * export uses recognizable financial column names — which in practice is all of
 * them — and degrades to an explicit user-confirmed mapping when it can't.
 *
 * Nothing here guesses silently: `detectBankMapping` returns a confidence
 * signal, and callers surface a manual mapping step whenever a required field
 * is unresolved.
 */

/** Ordered patterns; earlier entries win ties, so put the most specific first. */
interface FieldPatterns {
  /** Matched against the lowercased, punctuation-stripped header. */
  patterns: RegExp[];
  /** Headers matching these are never used for this field, even if a pattern hits. */
  exclude?: RegExp[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[._()[\]/\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const BANK_FIELD_PATTERNS: Record<string, FieldPatterns> = {
  date: {
    patterns: [/^(txn|tran|transaction|trade|posting|book)\s*(date|dt)$/, /^date$/, /\bdate\b/, /\bdt\b/],
    // "value date" is the settlement date, not the transaction date — only fall
    // back to it if nothing else matched (handled by ordering, excluded here).
    exclude: [/value\s*(date|dt)/],
  },
  description: {
    patterns: [
      /^(narration|particulars|description|remarks|details)$/,
      /transaction\s*(remarks|details|particulars)/,
      /\b(narration|particular|description|remark|detail)\b/,
    ],
  },
  debit: {
    patterns: [/^(debit|withdrawal|withdrawl|dr)$/, /\b(withdrawal|withdrawl|debit)\b/, /\bdr\s*amount\b/],
    exclude: [/credit|deposit/],
  },
  credit: {
    patterns: [/^(credit|deposit|cr)$/, /\b(deposit|credit)\b/, /\bcr\s*amount\b/],
    exclude: [/debit|withdrawal|withdrawl/],
  },
  /** Single-amount layouts (e.g. one Axis variant) pair this with drCrIndicator. */
  amount: {
    patterns: [/^amount$/, /^amount\s*inr$/, /^(txn|transaction)\s*amount$/],
    exclude: [/debit|credit|withdrawal|deposit|balance/],
  },
  drCrIndicator: {
    patterns: [/^(dr\s*cr|cr\s*dr|type|txn\s*type|transaction\s*type|indicator)$/, /\bdr\s*cr\b/],
  },
  /**
   * Optional — not a required field, so its absence never blocks an import.
   * When present, it lets the importer self-check: every real statement's
   * balance column must satisfy balance[n] = balance[n-1] + this row's signed
   * amount. That identity holds regardless of institution, so it validates a
   * column mapping without needing a real sample file from that bank.
   */
  balance: {
    patterns: [
      /^(closing|running|available|ledger)\s*balance$/,
      /^balance$/,
      /\bbalance\b/,
    ],
  },
};

const BROKER_FIELD_PATTERNS: Record<string, FieldPatterns> = {
  date: {
    patterns: [/^(trade|txn|transaction|order|execution)\s*(date|dt)$/, /^date$/, /\bdate\b/],
    exclude: [/settlement|value/],
  },
  symbol: {
    patterns: [
      /^(symbol|scrip|instrument|ticker)$/,
      /^(trading|tradingsymbol|trading symbol)$/,
      /\b(symbol|scrip|instrument|stock name|company|security|ticker|fund name|scheme name)\b/,
      /\bname\b/,
    ],
    exclude: [/exchange|segment|broker/],
  },
  exchange: {
    patterns: [/^exchange$/, /\bexchange\b/],
  },
  tradeType: {
    patterns: [
      /^(trade|transaction|order)\s*type$/,
      /^(type|side|buy sell|buy\/sell|action)$/,
      /\b(trade type|transaction type|buy sell|side|action)\b/,
    ],
    exclude: [/asset|instrument|product|order\s*type$/],
  },
  quantity: {
    patterns: [/^(quantity|qty|units|shares)$/, /\b(quantity|qty|units|shares)\b/],
  },
  price: {
    patterns: [
      /^(price|rate|nav)$/,
      /^(average|avg)\s*price$/,
      /\b(average price|avg price|trade price|unit price|price|rate|nav)\b/,
    ],
    exclude: [/total|value|amount/],
  },
};

export interface DetectedMapping {
  /** field name -> the actual header string in the uploaded file */
  mapping: Record<string, string>;
  /** Required fields that could not be resolved — callers must ask the user. */
  unresolved: string[];
}

function matchField(headers: string[], spec: FieldPatterns, alreadyUsed: Set<string>): string | null {
  for (const pattern of spec.patterns) {
    for (const header of headers) {
      if (alreadyUsed.has(header)) continue;
      const normalized = normalizeHeader(header);
      if (spec.exclude?.some((ex) => ex.test(normalized))) continue;
      if (pattern.test(normalized)) return header;
    }
  }
  return null;
}

function detect(
  headers: string[],
  patterns: Record<string, FieldPatterns>,
  requiredFields: string[]
): DetectedMapping {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();

  // Resolve in declaration order so more specific fields claim their column
  // before a looser pattern can steal it.
  for (const [field, spec] of Object.entries(patterns)) {
    const hit = matchField(headers, spec, used);
    if (hit) {
      mapping[field] = hit;
      used.add(hit);
    }
  }

  const unresolved = requiredFields.filter((f) => !mapping[f]);
  return { mapping, unresolved };
}

export const BANK_REQUIRED_FIELDS = ['date', 'description'] as const;
export const BROKER_REQUIRED_FIELDS = ['date', 'symbol', 'tradeType', 'quantity', 'price'] as const;

/**
 * Detects a bank statement's column mapping. A statement is usable if it has a
 * date, a description, and EITHER separate debit/credit columns OR a single
 * amount column — so the amount requirement is checked as that either/or rather
 * than as a fixed field list.
 */
export function detectBankMapping(headers: string[]): DetectedMapping {
  const result = detect(headers, BANK_FIELD_PATTERNS, [...BANK_REQUIRED_FIELDS]);

  const hasDebitCredit = !!result.mapping.debit || !!result.mapping.credit;
  const hasSingleAmount = !!result.mapping.amount;
  if (!hasDebitCredit && !hasSingleAmount) {
    result.unresolved.push('debit');
  }

  // A "value date" fallback: if no transaction date matched, a value-date column
  // is better than failing outright — it's the same day for the vast majority of
  // retail transactions.
  if (!result.mapping.date) {
    const valueDate = headers.find((h) => /value\s*(date|dt)/.test(normalizeHeader(h)));
    if (valueDate) {
      result.mapping.date = valueDate;
      result.unresolved = result.unresolved.filter((f) => f !== 'date');
    }
  }

  return result;
}

export function detectBrokerMapping(headers: string[]): DetectedMapping {
  return detect(headers, BROKER_FIELD_PATTERNS, [...BROKER_REQUIRED_FIELDS]);
}
