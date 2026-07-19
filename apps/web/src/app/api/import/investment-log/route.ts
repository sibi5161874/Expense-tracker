import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  parseCsv,
  investmentLogSchema,
  INVESTMENT_LOG_TEMPLATE_COLUMNS,
  headersMatch,
  rowsToRecords,
  buildNameIndex,
  resolveNameToId,
  parseAmount,
  normalizeDate,
  type ImportRowError,
} from '@repo/shared';
import { getAccounts } from '@repo/shared/queries/config';
import { getInvestmentLogForDedup, createInvestmentLogsBulk } from '@repo/shared/queries/investmentLog';

const ACTIONS = ['BUY', 'SELL', 'SIP', 'DIVIDEND', 'BONUS', 'SPLIT'];
const ASSET_TYPES = ['Stock', 'ETF', 'Mutual Fund', 'Crypto', 'Bond', 'Other'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.csv !== 'string') {
    return NextResponse.json({ error: 'Missing csv text' }, { status: 400 });
  }
  const commit: boolean = body.commit === true;

  const rows = parseCsv(body.csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (!headersMatch(rows[0]!, INVESTMENT_LOG_TEMPLATE_COLUMNS)) {
    return NextResponse.json(
      {
        error: `Column headers don't match the template exactly. Expected: ${INVESTMENT_LOG_TEMPLATE_COLUMNS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const [accounts, existing] = await Promise.all([
    getAccounts(supabase, user.id),
    getInvestmentLogForDedup(supabase, user.id),
  ]);
  const accountIndex = buildNameIndex(accounts ?? []);
  const existingKeys = new Set(
    (existing ?? []).map((i) => `${i.date}|${i.symbol}|${Number(i.quantity)}|${Number(i.price)}`)
  );

  const records = rowsToRecords(rows, INVESTMENT_LOG_TEMPLATE_COLUMNS);
  const errors: ImportRowError[] = [];
  const validRows: { data: ReturnType<typeof investmentLogSchema.parse>; key: string }[] = [];
  let duplicateCount = 0;

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
    if (!ACTIONS.includes(action ?? '')) {
      errors.push({ row, reason: `Invalid Action "${action}" (expected ${ACTIONS.join('/')})` });
      continue;
    }

    const assetType = record['Asset Type'];
    if (!ASSET_TYPES.includes(assetType ?? '')) {
      errors.push({ row, reason: `Invalid Asset Type "${assetType}" (expected ${ASSET_TYPES.join('/')})` });
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
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }

    validRows.push({ data: parsed.data, key });
  }

  let committed = 0;
  if (commit && validRows.length > 0) {
    const inserted = await createInvestmentLogsBulk(
      supabase,
      user.id,
      validRows.map((v) => v.data)
    );
    committed = inserted.length;
  }

  return NextResponse.json({
    totalDataRows: records.length,
    validCount: validRows.length,
    duplicateCount,
    errors,
    preview: validRows.slice(0, 10).map((v) => v.data),
    committed,
  });
}
