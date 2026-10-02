import { createResilientFetcher } from '@/lib/fetchWithRetry';
import { parseAmfiNavFile, type AmfiNavRow } from '@repo/shared/logic';
import { MF_NAV_TTL_SECONDS } from '@/lib/cacheTtls';

// Live host as of Aug 2026. www.amfiindia.com now 302s here; using the final URL
// directly avoids relying on redirect-following.
const AMFI_NAV_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';

/** Same retry/circuit-breaker mechanics as yahooFinance.ts, own independent instance — AMFI is a
 * single request per load, so a transient timeout used to fail every mutual fund with no retry. */
const fetchAmfiResilient = createResilientFetcher({ label: 'AMFI', maxRetries: 3 });

let memory: { rows: AmfiNavRow[]; loadedAt: number } | null = null;
let inflight: Promise<AmfiNavRow[]> | null = null;

/**
 * Every scheme in AMFI's daily NAV file (~14,000), downloaded and parsed at most once per
 * MF_NAV_TTL_SECONDS per server instance and shared by the price refresh and the fund search. The
 * file is ~1.5 MB — too big to store in Redis's free tier (1 MB request limit), so the parsed list
 * lives in module memory, and the per-fund NAVs the refresh actually needs are cached in Redis
 * separately (see prices/refresh/route.ts). If AMFI is down, the last good copy is served.
 */
export async function getAmfiSchemes(): Promise<AmfiNavRow[]> {
  if (memory && Date.now() - memory.loadedAt < MF_NAV_TTL_SECONDS * 1000) return memory.rows;

  inflight ??= (async () => {
    const res = await fetchAmfiResilient(AMFI_NAV_URL, 'NAV file');
    const rows = parseAmfiNavFile(await res.text());
    // The live file has ~14,000 schemes; zero means AMFI changed the layout (it did once, adding
    // Plan/Option columns), not that every fund is missing — say so instead of blaming each symbol.
    if (rows.length === 0) throw new Error('AMFI NAV file parsed to 0 schemes — its layout has probably changed.');
    memory = { rows, loadedAt: Date.now() };
    return rows;
  })().finally(() => {
    inflight = null;
  });

  try {
    return await inflight;
  } catch (e) {
    if (memory) return memory.rows;
    throw e;
  }
}
