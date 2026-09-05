import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { importFileTooLarge } from '@/lib/importLimits';
import { parseCsv } from '@repo/shared';
import {
  resolveBankMapping,
  buildBankStatementImportPlan,
  checkBalanceReconciliation,
  rowsToRecords,
  buildNameIndex,
  findBank,
  type BankColumnMapping,
} from '@repo/shared/logic';
import { getAccounts, getCategories } from '@repo/shared/queries/config';
import { getTransactionsForDedup, createTransactionsBulk } from '@repo/shared/queries/transactions';
import { bankStatementImportSchema } from '@repo/shared/schemas';

/** A client-supplied mapping is trusted only after checking every column it names exists in the file. */
function validateManualMapping(mapping: unknown, headers: string[]): BankColumnMapping | null {
  if (!mapping || typeof mapping !== 'object') return null;
  const m = mapping as Record<string, unknown>;
  const has = (v: unknown) => typeof v === 'string' && headers.includes(v);

  if (!has(m.date) || !has(m.description)) return null;
  const hasDebitCredit = has(m.debit) || has(m.credit);
  const hasAmount = has(m.amount);
  if (!hasDebitCredit && !hasAmount) return null;

  return {
    date: m.date as string,
    description: m.description as string,
    debit: has(m.debit) ? (m.debit as string) : undefined,
    credit: has(m.credit) ? (m.credit as string) : undefined,
    amount: has(m.amount) ? (m.amount as string) : undefined,
    drCrIndicator: has(m.drCrIndicator) ? (m.drCrIndicator as string) : undefined,
    balance: has(m.balance) ? (m.balance as string) : undefined,
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
  const limited = await enforceRateLimit(`import:bank-statement:${user.id}`, 500, 60 * 60_000);
  if (limited) return limited;

  const parsed = bankStatementImportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing csv text or account_id' }, { status: 400 });
  }
  const body = parsed.data;
  if (importFileTooLarge(Buffer.byteLength(body.csv, 'utf8'))) {
    return NextResponse.json({ error: 'File is too large — the max import size is 10MB.' }, { status: 413 });
  }
  const commit: boolean = body.commit === true;
  const bankId: string | undefined = body.bank;

  try {
    const rows = parseCsv(body.csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }
    const headers = rows[0]!.map((h) => h.trim());

    // A user-confirmed mapping always wins; otherwise resolve it automatically.
    const manual = validateManualMapping(body.mapping, headers);
    const auto = manual ? null : resolveBankMapping(headers, bankId);
    const mapping = manual ?? auto?.mapping ?? null;

    if (!mapping) {
      // Not an error the user can't act on — hand back the headers so the UI can
      // show a mapping step instead of a dead end.
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

    const [accounts, categories, existing] = await Promise.all([
      getAccounts(supabase, user.id),
      getCategories(supabase, user.id),
      getTransactionsForDedup(supabase, user.id),
    ]);
    if (!(accounts ?? []).some((a) => a.id === body.account_id)) {
      return NextResponse.json({ error: 'Selected account not found' }, { status: 400 });
    }
    const categoryIndex = buildNameIndex(categories ?? []);
    const existingKeys = (existing ?? []).map((t) => `${t.date}|${t.category_id ?? ''}|${Number(t.amount)}`);

    // Key records by the file's own header row so column order never matters.
    const records = rowsToRecords(rows, headers);
    const { errors, validRows, duplicateCount } = buildBankStatementImportPlan(
      mapping,
      records,
      body.account_id,
      categoryIndex,
      existingKeys
    );

    // Self-check against the file's own running balance, when one is mapped —
    // catches a mapping that "parses fine" but produced wrong numbers (a swapped
    // debit/credit column, a broken amount parse) for THIS specific file, without
    // needing a verified reference format for the institution.
    const reconciliation = checkBalanceReconciliation(mapping, records, body.previous_balance ?? null);

    let committed = 0;
    if (commit && validRows.length > 0) {
      const inserted = await createTransactionsBulk(supabase, user.id, validRows);
      committed = inserted.length;
    }

    const matchedBank = bankId ? findBank(bankId) : undefined;

    return NextResponse.json({
      bank: matchedBank?.label ?? bankId ?? null,
      mappingSource: manual ? 'manual' : (auto?.source ?? 'heuristic'),
      // Null when nothing in the registry describes this file (e.g. an
      // undocumented bank matched purely by heuristics with no institution
      // picked) — the UI treats null the same as 'heuristic': unverified.
      institutionConfidence: matchedBank?.confidence ?? null,
      mapping,
      headers,
      totalDataRows: records.length,
      validCount: validRows.length,
      duplicateCount,
      errors,
      reconciliation,
      preview: validRows.slice(0, 10),
      committed,
    });
  } catch (e) {
    logError('import.bank-statement', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: 'Import failed, please try again.' }, { status: 500 });
  }
}
