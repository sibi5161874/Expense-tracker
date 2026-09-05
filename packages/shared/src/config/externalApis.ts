/**
 * URLs for third-party APIs this app calls, shared across web (cron + the /api/fx-rates route)
 * and mobile (its own client-side FX fetch) so there's exactly one place to update if a
 * provider's endpoint ever changes — previously each caller hardcoded its own copy.
 */

/** Free, no API key. Base currency is INR — see packages/shared/src/logic/fx.ts. */
export const FX_RATES_URL = 'https://open.er-api.com/v6/latest/INR';
