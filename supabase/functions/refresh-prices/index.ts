// SUPERSEDED — no longer called by the app. Kept only so an already-deployed
// copy stays readable; safe to delete once it is removed from your Supabase
// project (`supabase functions delete refresh-prices`).
//
// Replaced by apps/web/src/app/api/prices/refresh/route.ts, which:
//   - also prices Mutual Fund holdings from AMFI's official NAV file (this
//     function covers Stock/ETF only — see the asset_type filter below), and
//   - reuses the unit-tested matching logic in
//     packages/shared/src/logic/priceRefresh.ts, which the Deno Edge runtime
//     cannot import from the workspace package.
//
// Refreshes `holdings.live_price` for the caller's Stock/ETF symbols via Yahoo
// Finance's unofficial quote endpoint (no API key — the reason this runs server-side
// is CORS, not secret-hiding: Yahoo's endpoint doesn't allow direct browser fetches).
//
// Rate limiting: RULES.md §7 doesn't actually specify a rate-limit number for this —
// this is a reasonable default I'm applying, not a spec'd requirement. Adjust if needed.
const RATE_LIMIT_SECONDS = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

interface InvestmentLogRow {
  symbol: string;
  exchange: string;
  asset_type: string;
}

interface HoldingRow {
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing authorization' }, 401);
  }

  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('[refresh-prices] auth failed:', userError?.message);
    return json({ error: 'Not authenticated' }, 401);
  }

  // Rate limit: reject if the most recent holdings.updated_at for this user is too fresh.
  const { data: recentHolding } = await supabase
    .from('holdings')
    .select('updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<HoldingRow>();

  if (recentHolding) {
    const secondsSinceLastRefresh = (Date.now() - new Date(recentHolding.updated_at).getTime()) / 1000;
    if (secondsSinceLastRefresh < RATE_LIMIT_SECONDS) {
      return json(
        { error: `Please wait ${Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastRefresh)}s before refreshing again.` },
        429
      );
    }
  }

  // Only Stock/ETF holdings get live prices — mutual funds/bonds/gold stay manual (DATA_MODEL.md §3).
  const { data: investments, error: invError } = await supabase
    .from('investment_log')
    .select('symbol, exchange, asset_type')
    .eq('user_id', user.id)
    .in('asset_type', ['Stock', 'ETF'])
    .returns<InvestmentLogRow[]>();

  if (invError) {
    console.error('[refresh-prices] investment_log query failed:', invError.message);
    return json({ error: invError.message }, 500);
  }

  const uniqueSymbols = new Map<string, { symbol: string; exchange: string }>();
  for (const inv of investments ?? []) {
    uniqueSymbols.set(inv.symbol, { symbol: inv.symbol, exchange: inv.exchange });
  }

  console.log(
    `[refresh-prices] user=${user.id} eligible symbols=${Array.from(uniqueSymbols.keys()).join(', ') || '(none)'}`
  );

  if (uniqueSymbols.size === 0) {
    return json({ updated: [], failed: [], failedReasons: {}, message: 'No Stock/ETF holdings found to refresh.' });
  }

  const updated: string[] = [];
  const failed: string[] = [];
  const failedReasons: Record<string, string> = {};

  await Promise.all(
    Array.from(uniqueSymbols.values()).map(async ({ symbol, exchange }) => {
      // NSE is the default; BSE gets the .BO suffix. Adjust here if you trade on other exchanges.
      const yahooSymbol = `${symbol}${exchange?.toUpperCase() === 'BSE' ? '.BO' : '.NS'}`;

      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${yahooSymbol}`);

        const body = await res.json();
        const chartError = body?.chart?.error;
        if (chartError) throw new Error(`Yahoo error for ${yahooSymbol}: ${JSON.stringify(chartError)}`);

        const price = body?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (typeof price !== 'number' || price <= 0) {
          throw new Error(`No regularMarketPrice in response for ${yahooSymbol}: ${JSON.stringify(body).slice(0, 300)}`);
        }

        // Failed symbols simply aren't upserted — their existing live_price is left untouched.
        const { error: upsertError } = await supabase
          .from('holdings')
          .upsert({ user_id: user.id, symbol, live_price: price }, { onConflict: 'user_id,symbol' });

        if (upsertError) throw new Error(`DB upsert failed for ${symbol}: ${upsertError.message}`);

        updated.push(symbol);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`[refresh-prices] ${symbol} (${yahooSymbol}) failed:`, message);
        failed.push(symbol);
        failedReasons[symbol] = message;
      }
    })
  );

  return json({ updated, failed, failedReasons });
});
