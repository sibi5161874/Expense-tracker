import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { kvGet, kvSet } from '@/lib/kvStore';
import { FX_RATES_URL } from '@repo/shared/config';

/**
 * Live FX rates, base INR. Free, no API key (see packages/shared/src/logic/fx.ts
 * for how these are used — this route only fetches and reshapes).
 *
 * No auth check: exchange rates aren't user data, and gating them behind a
 * session would only add a round trip for something anyone could fetch anyway.
 * Rate-limited by IP instead, since with no session there's no user.id to key on —
 * this is the one route that proxies a third-party API to anyone unauthenticated,
 * so it needs its own throttle rather than none at all.
 */
const REQUEST_TIMEOUT_MS = 10_000;

const CACHE_KEY = 'fx:rates';
const CACHE_TTL_SECONDS = 6 * 60 * 60;

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: string;
}

/** In-memory last-known-good, same fallback role as quoteCache.ts's own Map when Redis isn't
 * configured — reset on cold start, but still real fallback within one instance's lifetime. */
let memoryCache: CachedRates | null = null;

async function readCache(): Promise<CachedRates | null> {
  return (await kvGet<CachedRates>(CACHE_KEY)) ?? memoryCache;
}

async function writeCache(entry: CachedRates): Promise<void> {
  memoryCache = entry;
  await kvSet(CACHE_KEY, entry, CACHE_TTL_SECONDS);
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limited = await enforceRateLimit(`fx-rates:${ip}`, 30, 10 * 60_000);
  if (limited) return limited;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(FX_RATES_URL, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`FX provider returned HTTP ${res.status}`);

    const body = await res.json();
    if (body.result !== 'success' || !body.rates || typeof body.rates !== 'object') {
      throw new Error('FX provider returned an unexpected response shape');
    }

    const entry: CachedRates = { rates: body.rates as Record<string, number>, fetchedAt: new Date().toISOString() };
    await writeCache(entry);

    return NextResponse.json({ base: 'INR', ...entry, stale: false });
  } catch (e) {
    // FX being unreachable must not break the dashboard — first fall back to the last
    // successfully fetched rates (still useful for a same-day conversion), and only return a
    // hard error if there's genuinely nothing cached yet. Either way, useFxRates's own
    // fallback (treat only INR as convertible) is the last line of defense.
    const cached = await readCache();
    if (cached) {
      return NextResponse.json({ base: 'INR', ...cached, stale: true });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch FX rates' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
