import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { getInvestmentLogForDedup, createInvestmentLogsBulk } from '@repo/shared/queries/investmentLog';
import { dividendImportSchema } from '@repo/shared/schemas';
import type { InvestmentLogInput } from '@repo/shared/schemas';

/**
 * Saves dividends confirmed in the bank-statement import review step (see
 * DividendReviewList.tsx) straight to the investment log — these never pass through
 * /api/import/bank-statement at all, since a detected dividend row is excluded from that
 * route's own validRows (see buildBankStatementImportPlan). Every entry becomes a `DIVIDEND`
 * investment_log row: quantity 0, fees 0, price = the dividend amount (calculateTotalCashflow's
 * existing DIVIDEND semantics).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`import:dividends:${user.id}`, 500, 60 * 60_000);
  if (limited) return limited;

  const parsed = dividendImportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid dividend entries' }, { status: 400 });
  }

  try {
    const existing = await getInvestmentLogForDedup(supabase, user.id);
    const existingKeys = new Set(
      (existing ?? []).map((i) => `${i.date}|${i.symbol}|${Number(i.quantity)}|${Number(i.price)}`)
    );

    const rows: InvestmentLogInput[] = [];
    let duplicateCount = 0;
    for (const entry of parsed.data.entries) {
      const key = `${entry.date}|${entry.symbol}|0|${entry.amount}`;
      if (existingKeys.has(key)) {
        duplicateCount++;
        continue;
      }
      rows.push({
        date: entry.date,
        symbol: entry.symbol,
        exchange: entry.exchange,
        action: 'DIVIDEND',
        quantity: 0,
        price: entry.amount,
        fees: 0,
        linked_account_id: entry.linked_account_id,
        asset_type: entry.asset_type,
        notes: entry.notes,
      });
    }

    const inserted = rows.length > 0 ? await createInvestmentLogsBulk(supabase, user.id, rows) : [];
    return NextResponse.json({ committed: inserted.length, duplicateCount });
  } catch (e) {
    logError('import.dividends', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: 'Failed to save dividends, please try again.' }, { status: 500 });
  }
}
