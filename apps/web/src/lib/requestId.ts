export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Every request gets a correlation ID, set by middleware.ts before the route handler ever
 * runs (see there for why: it needs to exist even for requests that error before reaching
 * a route body, and it needs to be the same value on both the response header and whatever
 * a route logs). Route handlers read it back out of the request they already have — no new
 * plumbing needed beyond passing `req` into `logError`'s `meta`.
 */
export function getRequestId(req: Request): string | undefined {
  return req.headers.get(REQUEST_ID_HEADER) ?? undefined;
}
