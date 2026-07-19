import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  parseCsv,
  transactionSchema,
  TRANSACTIONS_TEMPLATE_COLUMNS,
  headersMatch,
  rowsToRecords,
  buildNameIndex,
  resolveNameToId,
  parseAmount,
  normalizeDate,
  type ImportRowError,
} from '@repo/shared';
import { getAccounts, getCategories } from '@repo/shared/queries/config';
import { getTransactionsForDedup, createTransactionsBulk } from '@repo/shared/queries/transactions';

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
  const existingKeys = new Set(
    (existing ?? []).map((t) => `${t.date}|${t.category_id ?? ''}|${Number(t.amount)}`)
  );

  const records = rowsToRecords(rows, TRANSACTIONS_TEMPLATE_COLUMNS);
  const errors: ImportRowError[] = [];
  const validRows: { data: ReturnType<typeof transactionSchema.parse>; key: string }[] = [];
  let duplicateCount = 0;

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
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }

    validRows.push({ data: parsed.data, key });
  }

  let committed = 0;
  if (commit && validRows.length > 0) {
    const inserted = await createTransactionsBulk(
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
