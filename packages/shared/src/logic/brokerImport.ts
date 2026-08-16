import { investmentLogSchema, type InvestmentLogInput } from '../schemas/investmentLog.schema';
import { parseAmount, createDedupChecker, type ImportPlan, type ImportRowError, type ImportRecord } from './csvImport';
import { parseBankDate } from './bankStatementImport';
import { detectBrokerMapping } from './columnHeuristics';
import { BROKERS, findBroker } from './institutions';

export { BROKERS, findBroker };

/**
 * Broker tradebook import — mirrors the bank statement importer: columns are
 * resolved to a mapping first (exact match → semantic detection → user-confirmed
 * manual mapping), then a single per-broker-agnostic parser reads the rows.
 *
 * Supporting a new broker is a registry entry, not new parsing code.
 */
export interface BrokerColumnMapping {
  date: string;
  symbol: string;
  tradeType: string;
  quantity: string;
  price: string;
  /** Optional — falls back to a sensible default when the export omits it. */
  exchange?: string;
}

export interface BrokerMappingResolution {
  mapping: BrokerColumnMapping | null;
  unresolved: string[];
  source: 'exact' | 'heuristic' | 'manual';
}

export function matchesKnownBrokerColumns(headers: string[], brokerId: string): boolean {
  const broker = findBroker(brokerId);
  if (!broker?.columns) return false;
  if (headers.length !== broker.columns.length) return false;
  const actual = new Set(headers.map((h) => h.trim().toLowerCase()));
  return broker.columns.every((c) => actual.has(c.toLowerCase()));
}

export function resolveBrokerMapping(headers: string[], brokerId?: string): BrokerMappingResolution {
  const detected = detectBrokerMapping(headers);
  const usedExact = !!brokerId && matchesKnownBrokerColumns(headers, brokerId);

  if (detected.unresolved.length > 0) {
    return { mapping: null, unresolved: detected.unresolved, source: usedExact ? 'exact' : 'heuristic' };
  }

  return {
    mapping: detected.mapping as unknown as BrokerColumnMapping,
    unresolved: [],
    source: usedExact ? 'exact' : 'heuristic',
  };
}

export function detectBrokerFormat(headers: string[]): string | null {
  return BROKERS.find((b) => b.columns && matchesKnownBrokerColumns(headers, b.id))?.id ?? null;
}

function readField(record: Record<string, string>, column: string | undefined): string {
  if (!column) return '';
  const direct = record[column];
  if (direct !== undefined) return direct;
  const wanted = column.trim().toLowerCase();
  const hit = Object.keys(record).find((k) => k.trim().toLowerCase() === wanted);
  return hit ? (record[hit] ?? '') : '';
}

/**
 * Brokers spell buy/sell inconsistently — Zerodha uses buy/sell, Upstox BUY/SELL,
 * some exports use B/S, and CAS-style statements use Purchase/Redemption.
 * Anything not recognizable as one of the two directions is rejected rather than
 * defaulted, since guessing the wrong side would invert a position.
 */
export function normalizeTradeType(raw: string): 'BUY' | 'SELL' | null {
  const value = raw.trim().toLowerCase();
  if (/^(buy|b|purchase|bought|subscription|sip)$/.test(value)) return 'BUY';
  if (/^(sell|s|sale|sold|redemption|redeem)$/.test(value)) return 'SELL';
  return null;
}

/**
 * Validates and dedups a broker tradebook into `investment_log` rows.
 *
 * Every row is attributed to one linked account chosen before upload (tradebooks
 * don't name a demat account), and defaults to asset type "Stock" — no broker's
 * tradebook reliably distinguishes ETFs from equity delivery. Brokerage and
 * charges live in a separate contract note/P&L statement, so fees default to 0
 * rather than being invented.
 */
export function buildBrokerImportPlan(
  mapping: BrokerColumnMapping,
  records: ImportRecord[],
  linkedAccountId: string,
  existingKeys: string[],
  brokerLabel = 'broker'
): ImportPlan<InvestmentLogInput> {
  const errors: ImportRowError[] = [];
  const validRows: InvestmentLogInput[] = [];
  let duplicateCount = 0;
  const isDuplicate = createDedupChecker(existingKeys);

  for (const { row, record } of records) {
    const rawDate = readField(record, mapping.date);
    const date = parseBankDate(rawDate);
    if (!date) {
      errors.push({ row, reason: `Invalid or unrecognized trade date "${rawDate}"` });
      continue;
    }

    const symbol = readField(record, mapping.symbol).trim();
    if (!symbol) {
      errors.push({ row, reason: 'Symbol is required' });
      continue;
    }

    const rawTradeType = readField(record, mapping.tradeType);
    const action = normalizeTradeType(rawTradeType);
    if (!action) {
      errors.push({ row, reason: `Unrecognized trade type "${rawTradeType}" (expected buy/sell)` });
      continue;
    }

    const rawQuantity = readField(record, mapping.quantity);
    const rawPrice = readField(record, mapping.price);
    const quantity = parseAmount(rawQuantity);
    const price = parseAmount(rawPrice);
    if (quantity === null || quantity < 0) {
      errors.push({ row, reason: `Invalid Quantity "${rawQuantity}"` });
      continue;
    }
    if (price === null || price < 0) {
      errors.push({ row, reason: `Invalid Price "${rawPrice}"` });
      continue;
    }

    // Exchange is missing from several exports (mutual-fund CAS statements have
    // no exchange at all) — default rather than reject an otherwise valid trade.
    const exchange = readField(record, mapping.exchange).trim() || 'NSE';

    const parsed = investmentLogSchema.safeParse({
      date,
      symbol,
      exchange,
      action,
      quantity,
      price,
      fees: 0,
      linked_account_id: linkedAccountId,
      asset_type: 'Stock',
      notes: `Imported from ${brokerLabel}`,
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
