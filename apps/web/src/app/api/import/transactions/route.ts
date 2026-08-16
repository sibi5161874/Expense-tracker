import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
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

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(`import:transactions:${user.id}`, 20, 60 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.csv !== 'string') {
    return NextResponse.json({ error: 'Missing csv text' }, { status: 400 });
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
    logError('import.transactions', e, { userId: user.id });
    return NextResponse.json({ error: 'Import failed, please try again.' }, { status: 500 });
  }
}
