import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { kvGet, kvSet } from '@/lib/kvStore';
import { FX_RATES_URL } from '@repo/shared/config';
import { FX_TTL_SECONDS } from '@/lib/cacheTtls';

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
/** How long a copy is kept in Redis. Longer than the 24h freshness window on purpose: freshness is
 * judged from fetchedAt, so an older copy is still there to serve as the last-known-good fallback when
 * the provider is down. */
const CACHE_RETENTION_SECONDS = 7 * 24 * 60 * 60;

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: string;
}

/** In-memory last-known-good, same fallback role as quoteCache.ts's own Map when Redis isn't
 * configured — reset on cold start, but still real fallback within one instance's lifetime. */
let memoryCache: CachedRates | null = null;

async function readCache(): Promise<CachedRates | null> {
  try {
    return (await kvGet<CachedRates>(CACHE_KEY)) ?? memoryCache;
  } catch {
    return memoryCache;
  }
}

/** A cached copy younger than FX_TTL_SECONDS, served without calling the provider at all. Before
 * this the cache was only read after a provider failure, so every request re-fetched. */
async function readFreshCache(): Promise<CachedRates | null> {
  const cached = await readCache();
  if (!cached) return null;
  return Date.now() - Date.parse(cached.fetchedAt) < FX_TTL_SECONDS * 1000 ? cached : null;
}

async function writeCache(entry: CachedRates): Promise<void> {
  memoryCache = entry;
  try {
    await kvSet(CACHE_KEY, entry, CACHE_RETENTION_SECONDS);
  } catch {
    // best-effort — the in-memory copy above still holds
  }
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limited = await enforceRateLimit(`fx-rates:${ip}`, 30, 10 * 60_000);
  if (limited) return limited;

  const fresh = await readFreshCache();
  if (fresh) return NextResponse.json({ base: 'INR', ...fresh, stale: false });

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
