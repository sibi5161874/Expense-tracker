import { useEffect } from 'react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
import { useHoldings } from '@/hooks/useHoldings';
import { useRefreshPrices } from '@/hooks/useRefreshPrices';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const SESSION_FLAG = 'kashmap:prices-auto-refreshed';

/**
 * Quietly refreshes live prices when they're more than a day old, so nobody has to remember to
 * press Refresh Prices. Mounted on the dashboard and portfolio, the two places prices drive a
 * visible number.
 *
 * At most once per browser session (a session flag), and silent on success — the existing
 * invalidation in useRefreshPrices updates every number — so a failure just leaves the previous
 * prices in place, which is also what the manual button does. The server shares one cached price
 * per symbol across all users (prices/refresh/route.ts) and rate-limits each user to one refresh
 * a minute, so this can't hammer Yahoo or AMFI.
 */
export function useAutoRefreshPrices() {
  const { data: investments, isSuccess: investmentsLoaded } = useAllInvestmentLog();
  const { data: holdingRows, isSuccess: holdingsLoaded } = useHoldings();
  const { refresh } = useRefreshPrices();

  useEffect(() => {
    if (!investmentsLoaded || !holdingsLoaded) return;
    if (!investments || investments.length === 0) return;

    const newest = (holdingRows ?? []).reduce((latest, h) => Math.max(latest, Date.parse(h.updated_at)), 0);
    const isStale = newest === 0 || Date.now() - newest > STALE_AFTER_MS;
    if (!isStale) return;

    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
      sessionStorage.setItem(SESSION_FLAG, '1');
    } catch {
      // sessionStorage unavailable (private mode) — the server's 1/min limit still bounds this.
    }

    refresh().catch(() => undefined);
  }, [investmentsLoaded, holdingsLoaded, investments, holdingRows, refresh]);
}
