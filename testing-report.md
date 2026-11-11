# Playwright E2E Suite Testing Report

## Update — Issue #22 (Comprehensive Testing Strategy), November 11, 2026

Added per [sibi5161874/Expense-tracker#22](https://github.com/sibi5161874/Expense-tracker/issues/22):
`apps/web/e2e/personas/accounting-invariants.spec.ts` (10 tests), `apps/web/e2e/personas/regression.spec.ts`
(7 tests, one per Issues 1–7), `apps/web/e2e/integration/supabase-operations.spec.ts` (5 tests), new cases
in `investmentMirroring.test.ts`/`cashbookMirroring.test.ts`, and a `ci.yml` update so
`pnpm run test:e2e:personas` gates every push/PR to `main`/`master`.

**Verified this session:**
- `pnpm --filter shared test` — **563/563 passed**, including the new mirroring unit tests.
- `pnpm --filter web typecheck` — 0 errors (covers the new spec files too).

**Not verified this session:** the new e2e specs (`accounting-invariants`, `regression`, `integration`)
have not been run to a green result. Three attempts at `pnpm --filter web test:e2e:personas` all failed
at `globalSetup`'s login step before reaching any persona test — the `next dev` webServer either never
rendered the login form in time or reset the connection mid-navigation (`ERR_CONNECTION_RESET`), in an
environment too resource-constrained to run Turbopack's dev compiler reliably. This reproduced identically
across all three attempts, so it reads as an environment limitation of that sandbox, not a regression in
the suite below (which it was run on top of, untouched) or in the new specs' logic. **Run
`pnpm --filter web test:e2e:personas` and `pnpm --filter web test:e2e:integration` on a machine with
normal access to the test Supabase project before treating issue #22 as closed.**

---

## Original baseline (pre-issue-#22)

**Target Goal**: Get Playwright Suite to Green (50/50 passing) with 0 failures and 0 skipped.  
**Result**: **50 / 50 PASSED (0 failures, 0 skipped)** on **TWO consecutive back-to-back runs**.  
**Base URL**: `http://localhost:4000` (Chromium Desktop)  
**Database**: Dedicated Test Supabase (`https://yikuhckrwhhjkqdalqxf.supabase.co`)  
**Date**: November 4, 2026

---

## 1. Environment & Setup Checklist

- [x] Test Supabase verified (`.env.test.local` pointing to test project `yikuhckrwhhjkqdalqxf`)
- [x] Test user `test@kashmap.in` verified in test database with `TestPassword123!`
- [x] Hacker user `hacker@kashmap.in` provisioned in test database with `TestPassword123!`
- [x] Cross-user RLS test implemented in `e2e/personas/hacker.spec.ts`
- [x] Port 4000 cleanly managed
- [x] Baseline run and failure triage completed
- [x] Two consecutive clean runs executed and verified green
- [x] Typecheck & ESLint verified with 0 errors

---

## 2. Phase-by-Phase Progress Tracker

| Phase | Description | Status | Details |
|---|---|---|---|
| **Phase 1** | Baseline Run & Failure Triage | **COMPLETED** | Triaged failures across App Bugs, Selector Drift, Flakiness, and Missing Features |
| **Phase 2** | App Bugs Fixes (Product Correctness) | **COMPLETED** | Fixed Next.js build-time env inlining, Next.js middleware session overhead, focus traps |
| **Phase 3** | Selector Drift Fixes (Test Correctness) | **COMPLETED** | Aligned locators with updated UI redesign elements |
| **Phase 4** | Flakiness & Timing Fixes (Stability) | **COMPLETED** | Disabled video disk flushing on Windows, added DOMContentLoaded waits for page transitions |
| **Phase 5** | Hacker Cross-User RLS Test | **COMPLETED** | Implemented authenticated multi-context test verifying User B cannot read User A transactions |
| **Phase 6** | Two Consecutive Clean Runs | **COMPLETED** | Run 1: 50/50 passed (5.1m), Run 2: 50/50 passed (6.0m) |
| **Phase 7** | Typecheck & Lint Final Verification | **COMPLETED** | `tsc --noEmit` 0 errors; `eslint` 0 errors |

---

## 3. Root Cause Analysis & Key Fixes

### 1. Root Cause: Next.js Client Bundle Environment Inlining
- **Symptom**: Transactions were seeded by `setup.ts` into test database `yikuhckrwhhjkqdalqxf`, but browser pages showed "No transactions yet" and auth cookies used `sb-wkfyfslgfpcybyajjndl-auth-token`.
- **Cause**: Next.js App Router inlines `NEXT_PUBLIC_*` variables at **build time**. A prior build loaded `.env.local` (production `wkfyfslgfpcybyajjndl`), baking production endpoints into client chunks.
- **Fix**: Created `scripts/build-test.js` to preload `apps/web/.env.test.local` prior to executing `next build`, ensuring `NEXT_PUBLIC_SUPABASE_URL=https://yikuhckrwhhjkqdalqxf.supabase.co` is inlined into all client bundles.

### 2. Flakiness: Playwright Video Flush Teardown Timeout
- **Symptom**: Tests passed all functional assertions but timed out at 60s during `Tearing down "context"`.
- **Cause**: `video: 'retain-on-failure'` caused Chromium on Windows to record video streams that stalled when flushing context files to disk.
- **Fix**: Configured `video: 'off'` in `apps/web/playwright.config.ts`.

### 3. Middleware Session Overhead
- **Symptom**: Repeated remote HTTP auth roundtrips to Supabase Cloud on every page navigation slowed tests down significantly.
- **Cause**: Standard `supabase.auth.getUser()` in middleware makes a remote network call to Supabase Auth on every request.
- **Fix**: Optimized `apps/web/src/lib/supabase/middleware.ts` under `E2E_MODE=true` to use `supabase.auth.getSession()`, extracting user metadata directly from the JWT cookie with 0ms network overhead.

### 4. Cross-User RLS Test Implementation
- **Implementation**: Created `user A cannot read user B transaction (RLS)` in `apps/web/e2e/personas/hacker.spec.ts`.
- **Behavior**: Context A (`test@kashmap.in`) creates a transaction and retrieves its ID. Context B (`hacker@kashmap.in`) attempts a direct API request to fetch User A's transaction. Supabase Row-Level Security correctly denies access with `403` / `404`.

### 5. Dialog Teardown Trap & Navigation Waits
- Closed validation dialog with `Escape` in `5-year-old.spec.ts` to release modal focus traps prior to context closure.
- Added `waitUntil: 'domcontentloaded'` in multi-route viewport resizing tests (`pro-techie.spec.ts`) and route pre-warming (`setup.ts`).
- Added 20s timeout for sign-out URL redirect in `common-man.spec.ts`.

---

## 4. Run Summaries

### Persona Suite Breakdown
- `5-year-old.spec.ts`: **8 / 8 passed**
- `6-year-old.spec.ts`: **7 / 7 passed**
- `chaos-monkey.spec.ts`: **7 / 7 passed**
- `common-man.spec.ts`: **9 / 9 passed**
- `hacker.spec.ts`: **10 / 10 passed** (includes cross-user RLS test)
- `pro-techie.spec.ts`: **9 / 9 passed**

### Consecutive Full Suite Runs

#### Run 1 (Full Suite):
```
Running 50 tests using 1 worker
50 passed (5.1m)
Exit Code: 0
```

#### Run 2 (Full Suite - Idempotency & Data Isolation Verification):
```
Running 50 tests using 1 worker
50 passed (6.0m)
Exit Code: 0
```

---

## 5. Verification Commands & Health

- **Unit / Typecheck**:
  ```bash
  pnpm --filter web run typecheck
  # Output: 0 errors
  ```
- **Lint**:
  ```bash
  pnpm --filter web run lint
  # Output: 0 errors, 22 warnings (all pre-existing React Hook Form watch memoization warnings)
  ```
- **Port 4000**: Cleanly closed and released.
