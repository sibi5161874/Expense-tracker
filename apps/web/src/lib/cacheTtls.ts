/**
 * Server-side cache lifetimes for public market data, in seconds. One place for the numbers so
 * the routes that cache (prices/refresh, live-price/*, fx-rates) agree on how fresh is fresh
 * enough. Distinct from queryStaleTimes.ts, which is how long the *browser* trusts a response.
 */
/** Stock/ETF/index/crypto quotes. */
export const QUOTE_TTL_SECONDS = 6 * 60 * 60;
/** Mutual fund NAVs — AMFI publishes once a day, so half a day loses nothing. */
export const MF_NAV_TTL_SECONDS = 12 * 60 * 60;
/** FX rates — the provider updates daily. */
export const FX_TTL_SECONDS = 24 * 60 * 60;
