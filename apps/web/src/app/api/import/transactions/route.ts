import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { importFileTooLarge } from '@/lib/importLimits';
import {
  parseCsv,
  TRANSACTIONS_TEMPLATE_COLUMNS,
  headersMatch,
  rowsToRecords,
  buildNameIndex,
  buildTransactionImportPlan,
} from '@repo/shared';
import { getAccounts, getCategories } from '@repo/shared/queries/config';
import { getTransactionsForDedup, createTransactionsBulk } from '@repo/shared/queries/transactions';
import { importCsvSchema } from '@repo/shared/schemas';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // 500, not 20 — a single large import now commits as many ~200-row chunked requests (see
  // chunkCsv.ts), so this has to bound "how many imports per hour", not "how many requests".
  // A worst-case 10MB file can need several hundred chunk requests on its own.
  const limited = await enforceRateLimit(`import:transactions:${user.id}`, 500, 60 * 60_000);
  if (limited) return limited;

  const parsed = importCsvSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing csv text' }, { status: 400 });
  }
  const body = parsed.data;
  if (importFileTooLarge(Buffer.byteLength(body.csv, 'utf8'))) {
    return NextResponse.json({ error: 'File is too large — the max import size is 10MB.' }, { status: 413 });
  }
  const commit: boolean = body.commit === true;

  try {
    const rows = parseCsv(body.csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }
    if (!headersMatch(rows[0]!, TRANSACTIONS_TEMPLATE_COLUMNS)) {
      return NextResponse.json(
        {
          error: `Column headers don't match the template exactly. Expected: ${TRANSACTIONS_TEMPLATE_COLUMNS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const [accounts, categories, existing] = await Promise.all([
      getAccounts(supabase, user.id),
      getCategories(supabase, user.id),
      getTransactionsForDedup(supabase, user.id),
    ]);
    const accountIndex = buildNameIndex(accounts ?? []);
    const categoryIndex = buildNameIndex(categories ?? []);
    const existingKeys = (existing ?? []).map((t) => `${t.date}|${t.category_id ?? ''}|${Number(t.amount)}`);

    const records = rowsToRecords(rows, TRANSACTIONS_TEMPLATE_COLUMNS);
    const { errors, validRows, duplicateCount } = buildTransactionImportPlan(
      records,
      accountIndex,
      categoryIndex,
      existingKeys
    );

    let committed = 0;
    if (commit && validRows.length > 0) {
      const inserted = await createTransactionsBulk(supabase, user.id, validRows);
      committed = inserted.length;
    }

    return NextResponse.json({
      totalDataRows: records.length,
      validCount: validRows.length,
      duplicateCount,
      errors,
      preview: validRows.slice(0, 10),
      committed,
    });
  } catch (e) {
    logError('import.transactions', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: 'Import failed, please try again.' }, { status: 500 });
  }
}
