import { kvGet, kvSet } from '@/lib/kvStore';

const DEFAULT_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

/** A failure of this class means "try again might help" — a dropped connection, a timeout, or
 * the server itself erroring. A 4xx (bad input, malformed request) means the request itself is
 * wrong, so retrying it would just fail identically. */
export class TransientFetchError extends Error {}

function isTransientStatus(status: number): boolean {
  return status >= 500;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

interface ResilientFetcherOptions {
  /** Used in thrown error messages, e.g. "Yahoo Finance", "AMFI". */
  label: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  /** Circuit trips after this many consecutive failures. */
  circuitFailureThreshold?: number;
  circuitCooldownMs?: number;
}

interface CircuitState {
  failures: number;
  openUntil: number;
}

/**
 * Builds an independent retry + circuit-breaker `fetch` wrapper for one external data source.
 * Each call to this factory owns its own breaker state — two unrelated sources (Yahoo, AMFI)
 * must not trip each other's circuit, since one being down says nothing about the other.
 * Extracted from what was yahooFinance.ts-only logic so AMFI's NAV fetch in
 * prices/refresh/route.ts can get the same timeout/retry/circuit-breaker protection instead of
 * a plain fetchWithTimeout with no retry.
 *
 * Backed by Redis (via kvStore.ts) when configured — same pattern as rateLimit.ts and
 * quoteCache.ts — so the breaker is genuinely shared across every serverless instance: five
 * consecutive failures on instance A actually stop instance B from hammering a source that's
 * down, instead of each instance running its own blind counter. Falls back to the in-memory
 * vars below when Redis isn't configured, exactly as before.
 */
export function createResilientFetcher({
  label,
  timeoutMs = 10_000,
  maxRetries = 2,
  retryBaseDelayMs = 300,
  circuitFailureThreshold = 5,
  circuitCooldownMs = 60_000,
}: ResilientFetcherOptions) {
  let consecutiveFailures = 0;
  let circuitOpenUntil = 0;
  const stateKey = `circuit:${label}`;
  // A stale "open" entry must still expire on its own even if nothing ever calls
  // recordSuccess to clear it — cooldown plus a margin, not the cooldown itself.
  const stateTtlSeconds = Math.ceil(circuitCooldownMs / 1000) + 60;

  async function loadState(): Promise<void> {
    const remote = await kvGet<CircuitState>(stateKey);
    if (remote) {
      consecutiveFailures = remote.failures;
      circuitOpenUntil = remote.openUntil;
    }
  }
  async function saveState(): Promise<void> {
    await kvSet(stateKey, { failures: consecutiveFailures, openUntil: circuitOpenUntil }, stateTtlSeconds);
  }

  async function isCircuitOpen(): Promise<boolean> {
    await loadState();
    return Date.now() < circuitOpenUntil;
  }
  async function recordFailure() {
    consecutiveFailures += 1;
    if (consecutiveFailures >= circuitFailureThreshold) {
      circuitOpenUntil = Date.now() + circuitCooldownMs;
    }
    await saveState();
  }
  async function recordSuccess() {
    consecutiveFailures = 0;
    circuitOpenUntil = 0;
    await saveState();
  }

  async function fetchOnce(url: string, context: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal, cache: 'no-store' });
      if (!res.ok) {
        const message = `${label} returned HTTP ${res.status} for ${context}`;
        if (isTransientStatus(res.status)) throw new TransientFetchError(message);
        throw new Error(message);
      }
      return res;
    } catch (e) {
      // AbortError (our own timeout) and a raw network failure (fetch throwing before any
      // response exists) are exactly the "might succeed on retry" case a 4xx is not.
      if (e instanceof TransientFetchError) throw e;
      if (e instanceof Error && (e.name === 'AbortError' || e instanceof TypeError)) {
        throw new TransientFetchError(e.message);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Fetches `url` with a hard per-attempt timeout, retrying transient failures (timeout,
   * network error, 5xx) up to `maxRetries` times with exponential backoff and jitter, and
   * short-circuiting entirely once too many consecutive failures suggest the source itself is
   * down. `context` is only used to make error messages identify which request failed (e.g. a
   * ticker symbol) — pass anything stable and readable.
   */
  return async function fetchResilient(url: string, context: string): Promise<Response> {
    if (await isCircuitOpen()) {
      throw new Error(`${label} is temporarily unavailable — too many recent failures, retrying shortly.`);
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetchOnce(url, context);
        await recordSuccess();
        return res;
      } catch (e) {
        lastError = e;
        if (!(e instanceof TransientFetchError) || attempt === maxRetries) {
          await recordFailure();
          throw e;
        }
        const backoff = retryBaseDelayMs * 2 ** attempt;
        const jitter = Math.random() * backoff * 0.3;
        await sleep(backoff + jitter);
      }
    }
    // Unreachable — the loop always returns or throws — but keeps TS satisfied.
    throw lastError;
  };
}
