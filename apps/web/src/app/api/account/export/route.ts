import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';

/**
 * Full data export — every row this user owns, across every table, as one JSON
 * document. Runs server-side so the whole export is a single round trip and the
 * table list lives in one place; RLS still scopes every read to the caller, so
 * an authenticated request can only ever export its own rows.
 */
const EXPORTED_TABLES = [
  'accounts',
  'categories',
  'budget_limits',
  'transactions',
  'recurring_transactions',
  'investment_log',
  'holdings',
  'goals',
  'cashbook',
  'insurance_policies',
  'user_profiles',
  'net_worth_snapshots',
  'assets_fixed_deposits',
  'assets_gold',
  'assets_loans_liabilities',
  'assets_epf',
  'assets_nps',
  'assets_ssy',
  'assets_sgb',
  'assets_ulip',
  'assets_real_estate',
  'assets_ppf',
  'assets_recurring_deposits',
  'assets_nsc',
  'assets_vehicles',
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(`account:export:${user.id}`, 5, 60 * 60_000);
  if (limited) return limited;

  try {
    const results = await Promise.all(
      EXPORTED_TABLES.map(async (table) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table name is a runtime string from a fixed allowlist; Supabase's generated types can't narrow it here.
        const { data, error } = await (supabase.from(table as any) as any).select('*').eq('user_id', user.id);
        if (error) throw error;
        return [table, data ?? []] as const;
      })
    );

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      data: Object.fromEntries(results),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="money-manager-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    logError('account.export', e, { userId: user.id });
    return NextResponse.json({ error: "Couldn't export your data, try again." }, { status: 500 });
  }
}
