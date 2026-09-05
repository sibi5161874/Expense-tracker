import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { importFileTooLarge } from '@/lib/importLimits';
import { parseCsv } from '@repo/shared';
import {
  resolveBrokerMapping,
  buildBrokerImportPlan,
  rowsToRecords,
  findBroker,
  type BrokerColumnMapping,
} from '@repo/shared/logic';
import { getAccounts } from '@repo/shared/queries/config';
import { getInvestmentLogForDedup, createInvestmentLogsBulk } from '@repo/shared/queries/investmentLog';
import { brokerImportSchema } from '@repo/shared/schemas';

const REQUIRED = ['date', 'symbol', 'tradeType', 'quantity', 'price'] as const;

function validateManualMapping(mapping: unknown, headers: string[]): BrokerColumnMapping | null {
  if (!mapping || typeof mapping !== 'object') return null;
  const m = mapping as Record<string, unknown>;
  const has = (v: unknown) => typeof v === 'string' && headers.includes(v);
  if (!REQUIRED.every((f) => has(m[f]))) return null;

  return {
    date: m.date as string,
    symbol: m.symbol as string,
    tradeType: m.tradeType as string,
    quantity: m.quantity as string,
    price: m.price as string,
    exchange: has(m.exchange) ? (m.exchange as string) : undefined,
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // 500, not 20 — a single large import now commits as many ~200-row chunked requests (see
  // chunkCsv.ts), so this has to bound "how many imports per hour", not "how many requests".
  const limited = await enforceRateLimit(`import:broker:${user.id}`, 500, 60 * 60_000);
  if (limited) return limited;

  const parsed = brokerImportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing csv text or linked_account_id' }, { status: 400 });
  }
  const body = parsed.data;
  if (importFileTooLarge(Buffer.byteLength(body.csv, 'utf8'))) {
    return NextResponse.json({ error: 'File is too large — the max import size is 10MB.' }, { status: 413 });
  }
  const commit: boolean = body.commit === true;
  const brokerId: string | undefined = body.broker;
  const matchedBroker = brokerId ? findBroker(brokerId) : undefined;
  const brokerLabel = matchedBroker?.label ?? brokerId ?? 'broker';

  try {
    const rows = parseCsv(body.csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }
    const headers = rows[0]!.map((h) => h.trim());

    const manual = validateManualMapping(body.mapping, headers);
    const auto = manual ? null : resolveBrokerMapping(headers, brokerId);
    const mapping = manual ?? auto?.mapping ?? null;

    if (!mapping) {
      return NextResponse.json(
        {
          needsMapping: true,
          headers,
          unresolved: auto?.unresolved ?? [],
          error: "Couldn't work out which columns to use — please map them below.",
        },
        { status: 422 }
      );
    }

    const [accounts, existing] = await Promise.all([
      getAccounts(supabase, user.id),
      getInvestmentLogForDedup(supabase, user.id),
    ]);
    if (!(accounts ?? []).some((a) => a.id === body.linked_account_id)) {
      return NextResponse.json({ error: 'Selected account not found' }, { status: 400 });
    }
    const existingKeys = (existing ?? []).map((i) => `${i.date}|${i.symbol}|${Number(i.quantity)}|${Number(i.price)}`);

    const records = rowsToRecords(rows, headers);
    const { errors, validRows, duplicateCount } = buildBrokerImportPlan(
      mapping,
      records,
      body.linked_account_id,
      existingKeys,
      brokerLabel
    );

    let committed = 0;
    if (commit && validRows.length > 0) {
      const inserted = await createInvestmentLogsBulk(supabase, user.id, validRows);
      committed = inserted.length;
    }

    return NextResponse.json({
      broker: brokerLabel,
      mappingSource: manual ? 'manual' : (auto?.source ?? 'heuristic'),
      institutionConfidence: matchedBroker?.confidence ?? null,
      mapping,
      headers,
      totalDataRows: records.length,
      validCount: validRows.length,
      duplicateCount,
      errors,
      preview: validRows.slice(0, 10),
      committed,
    });
  } catch (e) {
    logError('import.broker', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: 'Import failed, please try again.' }, { status: 500 });
  }
}
