import { investmentLogSchema, type InvestmentLogInput } from '../schemas/investmentLog.schema';
import { parseAmount, createDedupChecker, type ImportPlan, type ImportRowError, type ImportRecord } from './csvImport';
import { parseBankDate } from './bankStatementImport';
import { detectBrokerMapping } from './columnHeuristics';
import { BROKERS, findBroker } from './institutions';
import {
  findHeaderRow,
  normalizeHeaders,
  detectPriceFormat,
  parseDate,
} from './csvParserHelpers';

export { BROKERS, findBroker };

export interface ParsedTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  perSharePrice: number;
  totalAmount: number;
  date: string;
  fees: number;
  exchange?: string;
}

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
 * Also handles statuses like "Executed", "Completed", "Buy Executed", etc.
 * Any casing (small letters, ALL CAPS, Capitalized) and compound phrases are parsed flexibly.
 */
export function normalizeTradeType(raw: string, record?: Record<string, string>): 'BUY' | 'SELL' | null {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return null;

  // 1. Direct exact tokens (handles any casing, leading/trailing whitespace)
  if (/^(buy|b|purchase|purchased|bought|subscription|sip|received|credit|cr|long)$/.test(value)) {
    return 'BUY';
  }
  if (/^(sell|s|sale|sold|redemption|redeem|outward|debit|dr|short)$/.test(value)) {
    return 'SELL';
  }

  // 2. Substring & compound tokens (e.g. "BUY - EXECUTED", "EXECUTED (BUY)", "BUY EXECUTED", "DELIVERY BUY", "SELL EXECUTED")
  if (/\b(buy|bought|purchase|subscription|sip)\b/.test(value)) {
    return 'BUY';
  }
  if (/\b(sell|sold|sale|redemption|redeem)\b/.test(value)) {
    return 'SELL';
  }

  // 3. Status terms (e.g. "Executed", "Complete", "Completed", "Filled", "Traded", "Success")
  if (/^(executed|complete|completed|filled|traded|success|successful|done|ok)$/.test(value)) {
    // If the full record is available, check other columns for trade direction
    if (record) {
      for (const [col, val] of Object.entries(record)) {
        const colNorm = col.trim().toLowerCase();
        // Skip status column itself and standard numerical/date columns
        if (
          colNorm.includes('status') ||
          colNorm === 'date' ||
          colNorm === 'symbol' ||
          colNorm === 'price' ||
          colNorm === 'quantity'
        ) {
          continue;
        }
        const valNorm = (val ?? '').trim().toLowerCase();
        if (/\b(buy|bought|purchase|subscription|sip)\b/.test(valNorm)) {
          return 'BUY';
        }
        if (/\b(sell|sold|sale|redemption|redeem)\b/.test(valNorm)) {
          return 'SELL';
        }
      }
    }
    // If no other column specifies sell, an executed trade entry in an orderbook is an execution (default BUY)
    return 'BUY';
  }

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
    const action = normalizeTradeType(rawTradeType, record);
    if (!action) {
      errors.push({
        row,
        reason: `Unrecognized trade type "${rawTradeType}". Expected BUY or SELL (e.g. Buy, Sell, Purchase, Executed)`,
      });
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

/**
 * Parses raw CSV/spreadsheet rows from any Indian broker file with metadata
 * detection and Zerodha (per-share) vs Groww (total) automatic price resolution.
 */
export function parseBrokerFile(rawRows: string[][]): {
  trades: ParsedTrade[];
  meta: { headerIndex: number; priceFormat: 'per_share' | 'total'; skipped: number };
  errors: string[];
} {
  const headerIndex = findHeaderRow(rawRows, 'broker');
  if (headerIndex === -1) {
    return {
      trades: [],
      meta: { headerIndex: -1, priceFormat: 'per_share', skipped: 0 },
      errors: ['Could not detect header row. Expected Symbol, Qty, Price columns.'],
    };
  }

  const rawHeaders = rawRows[headerIndex] ?? [];
  const normalized = normalizeHeaders(rawHeaders);
  const priceFormat = detectPriceFormat(normalized);

  const symbolIdx = normalized.indexOf('symbol');
  const actionIdx =
    normalized.indexOf('action') !== -1
      ? normalized.indexOf('action')
      : normalized.indexOf('trade_type') !== -1
        ? normalized.indexOf('trade_type')
        : normalized.indexOf('type');
  const qtyIdx = normalized.indexOf('quantity');
  const priceIdx = normalized.indexOf('price');
  const totalIdx = normalized.indexOf('total');
  const dateIdx = normalized.indexOf('date');
  const feesIdx = normalized.indexOf('fees');
  const exchangeIdx = normalized.indexOf('exchange');

  const trades: ParsedTrade[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every((c) => !c.trim())) {
      skipped++;
      continue;
    }

    const rowObj: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      rowObj[rawHeaders[c] ?? `col_${c}`] = row[c] ?? '';
    }

    const symbol = (symbolIdx !== -1 ? row[symbolIdx] : '')?.trim() || '';
    if (!symbol) {
      skipped++;
      continue;
    }

    const rawDate = (dateIdx !== -1 ? row[dateIdx] : '')?.trim() || '';
    const date = parseDate(rawDate);
    if (!date) {
      errors.push(`Row ${i + 1}: Invalid date "${rawDate}"`);
      continue;
    }

    const rawAction = (actionIdx !== -1 ? row[actionIdx] : '')?.trim() || '';
    const action = normalizeTradeType(rawAction, rowObj);
    if (!action) {
      errors.push(`Row ${i + 1}: Unrecognized trade type "${rawAction}"`);
      continue;
    }

    const rawQty = (qtyIdx !== -1 ? row[qtyIdx] : '')?.trim() || '';
    const quantity = parseAmount(rawQty);
    if (quantity === null || quantity <= 0) {
      errors.push(`Row ${i + 1}: Invalid quantity "${rawQty}"`);
      continue;
    }

    let perSharePrice = 0;
    let totalAmount = 0;

    if (priceFormat === 'total' && totalIdx !== -1 && row[totalIdx]) {
      const rawTot = row[totalIdx]!.trim();
      const parsedTot = parseAmount(rawTot);
      if (parsedTot === null || parsedTot < 0) {
        errors.push(`Row ${i + 1}: Invalid total amount "${rawTot}"`);
        continue;
      }
      totalAmount = parsedTot;
      perSharePrice = Number((totalAmount / quantity).toFixed(4));
    } else {
      const rawPr = (priceIdx !== -1 ? row[priceIdx] : '')?.trim() || '';
      const parsedPr = parseAmount(rawPr);
      if (parsedPr === null || parsedPr < 0) {
        errors.push(`Row ${i + 1}: Invalid price "${rawPr}"`);
        continue;
      }
      perSharePrice = parsedPr;
      totalAmount = Number((quantity * perSharePrice).toFixed(2));
    }

    const rawFees = (feesIdx !== -1 ? row[feesIdx] : '')?.trim() || '';
    const fees = parseAmount(rawFees) ?? 0;
    const exchange = (exchangeIdx !== -1 ? row[exchangeIdx] : '')?.trim() || 'NSE';

    trades.push({
      symbol,
      action,
      quantity,
      perSharePrice,
      totalAmount,
      date,
      fees,
      exchange,
    });
  }

  return {
    trades,
    meta: {
      headerIndex,
      priceFormat,
      skipped,
    },
    errors,
  };
}
