# Playwright E2E Testing Runbook

A 6-persona suite (`e2e/personas/`) that drives the real app in a browser against a **dedicated
test Supabase project** — never production. Every external API (Groq, Yahoo Finance, Razorpay,
AMFI) is mocked under `E2E_MODE=true`; nothing here ever makes a real network call to any of
them.

## One-time setup

1. Create a test Supabase project at supabase.com (separate from your production one).
2. In its Auth > Users tab, manually add a test user — e.g. `test@kashmap.in` /
   `TestPassword123!`.
3. Create `apps/web/.env.test.local` (already gitignored) with that project's URL, anon key,
   and service_role key, plus `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` matching the user you
   just created. See the keys this file needs in `playwright.config.ts` and
   `e2e/helpers/supabaseAdmin.ts`.
4. Apply this repo's migrations to the test project the same way you would to any fresh
   Supabase project (`supabase/migrations/*` — read-only from this suite's point of view, never
   edit them for testing purposes).

## Run tests

**Free port 4000 first** — `playwright.config.ts` always starts its own dev server bound to
`.env.test.local` (`reuseExistingServer: false`, deliberately) rather than reusing whatever's
already running there, since that's very often a dev server pointed at **production**'s
`.env.local`. If port 4000 is in use, the run fails fast with "port in use" instead of silently
testing against prod — stop whatever's on that port first.

```bash
pnpm --filter web test:e2e:personas
```

## Run one persona

```bash
pnpm --filter web test:e2e:hacker
```

## View the report

```bash
npx playwright show-report
```

(run from `apps/web`)

## How cleanup works

Every row this suite writes — accounts, transactions, goals, and anything else seeded by
`e2e/helpers/setup.ts` — gets an `[E2E]` prefix on its name/notes field. `cleanupTestData()` in
`e2e/helpers/cleanup.ts` deletes everything matching that prefix; wire it into an `afterEach` /
`afterAll` in any spec that creates data beyond what `seedTestData()` already provides.

Manual cleanup, if you ever need it, from the test project's own SQL editor or via `psql`:

```sql
DELETE FROM transactions WHERE notes LIKE '[E2E]%';
DELETE FROM goals WHERE goal_name LIKE '[E2E]%';
DELETE FROM accounts WHERE name LIKE '[E2E]%';
```

## What's mocked, and what isn't

| Route / module | E2E_MODE behavior |
| --- | --- |
| `POST /api/ai-chat` | Returns a fixed mock SSE stream (matches the real event shape) |
| `GET /api/live-price/universal` | Fixed mock quote |
| `GET /api/live-price/history` | 30 fake daily bars |
| `GET /api/stock/fundamentals` | Fixed mock fundamentals |
| `lib/amfiCache.ts` (`getAmfiSchemes`) | 2 fake mutual fund NAVs |
| `lib/razorpay.ts` (`getRazorpayClient`) | Fakes only `orders.create` — the real reservation/DB logic in `/api/payments/create-order` still runs and is still under test |
| `lib/rateLimit.ts` / `lib/globalRateLimit.ts` | Every rate limit is bypassed |

Two routes the original plan for this suite assumed needed mocking turned out not to:

- **`/api/import/dividends`** doesn't call any external API — it only writes already-confirmed
  dividend rows to this app's own database, so there's nothing to mock and no risk in letting it
  run for real against the test project.
- **`/api/cron/monthly-summary`** has no UI entry point at all (it's invoked by a scheduler, not
  a button) — nothing in this suite can reach it, so it's untouched.

## Known gap

The hacker persona doesn't yet cover true cross-user RLS isolation (sign in as user A, try to
read user B's row) — that needs a second provisioned test user, which this suite doesn't set up.
Add one the same way as the first (Auth > Users in the test project) and a
`TEST_USER_B_EMAIL`/`TEST_USER_B_PASSWORD` pair in `.env.test.local` if you want that covered.

## Delete the test project

Nothing here deletes the Supabase project itself — do that from the Supabase dashboard when
you're done with it.
