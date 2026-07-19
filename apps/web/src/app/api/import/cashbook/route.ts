import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  parseCsv,
  cashbookSchema,
  CASHBOOK_TEMPLATE_COLUMNS,
  headersMatch,
  rowsToRecords,
  buildNameIndex,
  resolveNameToId,
  parseAmount,
  normalizeDate,
  type ImportRowError,
} from '@repo/shared';
import { getAccounts } from '@repo/shared/queries/config';
import { getCashbookForDedup, createCashbookBulk } from '@repo/shared/queries/cashbook';

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
  if (!headersMatch(rows[0]!, CASHBOOK_TEMPLATE_COLUMNS)) {
    return NextResponse.json(
      {
        error: `Column headers don't match the template exactly. Expected: ${CASHBOOK_TEMPLATE_COLUMNS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const [accounts, existing] = await Promise.all([
    getAccounts(supabase, user.id),
    getCashbookForDedup(supabase, user.id),
  ]);
  const accountIndex = buildNameIndex(accounts ?? []);
  const existingKeys = new Set(
    (existing ?? []).map((c) => `${c.date}|${c.counterparty.toLowerCase()}|${Number(c.amount)}|${c.flow}`)
  );

  const records = rowsToRecords(rows, CASHBOOK_TEMPLATE_COLUMNS);
  const errors: ImportRowError[] = [];
  const validRows: { data: ReturnType<typeof cashbookSchema.parse>; key: string }[] = [];
  let duplicateCount = 0;

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
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }

    validRows.push({ data: parsed.data, key });
  }

  let committed = 0;
  if (commit && validRows.length > 0) {
    const inserted = await createCashbookBulk(
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
