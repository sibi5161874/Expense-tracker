import { NextResponse } from 'next/server';

/**
 * Live FX rates, base INR. Free, no API key (see packages/shared/src/logic/fx.ts
 * for how these are used — this route only fetches and reshapes).
 *
 * No auth check: exchange rates aren't user data, and gating them behind a
 * session would only add a round trip for something anyone could fetch anyway.
 */
const FX_RATES_URL = 'https://open.er-api.com/v6/latest/INR';
const REQUEST_TIMEOUT_MS = 10_000;

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(FX_RATES_URL, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`FX provider returned HTTP ${res.status}`);

    const body = await res.json();
    if (body.result !== 'success' || !body.rates || typeof body.rates !== 'object') {
      throw new Error('FX provider returned an unexpected response shape');
    }

    return NextResponse.json({
      base: 'INR',
      rates: body.rates as Record<string, number>,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    // FX being unreachable must not break the dashboard — the caller (useFxRates)
    // falls back to treating only INR as convertible, which is exactly correct
    // for the majority of users who hold nothing but INR anyway.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch FX rates' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
