/**
 * Named React Query staleTime tiers — before this, the same handful of durations were spelled
 * out as literals (`30_000`, `5 * 60 * 1000`, `5 * 60_000`, `6 * 60 * 60 * 1000`) independently
 * across ~30 hooks, including four separate local `SIX_HOURS_MS` redeclarations. One definition
 * per duration; which tier a hook uses is still that hook's own call, this just gives the
 * durations names instead of repeating the arithmetic.
 */
export const STALE_TIME_SHORT = 30_000;
export const STALE_TIME_MEDIUM = 60_000;
export const STALE_TIME_LONG = 5 * 60_000;
export const STALE_TIME_SIX_HOURS = 6 * 60 * 60 * 1000;
