# Session state — "where I left off"

Update this at the end of every work session. Keep it short — this is a
pointer, not a diary. Old entries can be trimmed once they're no longer useful.

## Current state (Updated 2026-11-11)

- **Branch:** `master`.
- **Active Task:** Issue #22 — Comprehensive Testing Strategy (invariants, unit, integration, CI gates).
  The 50/50 Playwright baseline from the 2026-11-03/04 session (see `testing-report.md`'s "Original
  baseline" section) is done; this task builds the 5 missing layers on top of it.
- **Implementation status:** all 5 tasks from the issue are written and sitting uncommitted in the
  working tree:
  - `apps/web/e2e/personas/accounting-invariants.spec.ts` — 10 invariant tests.
  - `apps/web/e2e/personas/regression.spec.ts` — 7 tests, one per Issues 1–7.
  - `apps/web/e2e/integration/supabase-operations.spec.ts` (new folder) — 5 DB/RLS integration tests.
  - New cases in `packages/shared/src/logic/investmentMirroring.test.ts` and `cashbookMirroring.test.ts`.
  - `.github/workflows/ci.yml` updated to run `pnpm run test:e2e:personas` on push/PR to `main`/`master`.
  - Supporting: `playwright.config.ts` (`testDir` widened to `./e2e`), `apps/web/package.json` (new
    `test:e2e:invariants`/`regression`/`integration` scripts), `e2e/helpers/{setup,cleanup,assertions}.ts`.
- **Verified:** `pnpm --filter shared test` (563/563 passed) and `pnpm --filter web typecheck` (0 errors).
- **Not verified:** the new e2e specs haven't passed in CI or locally yet — three attempts in this
  session's sandbox failed at `globalSetup` login before reaching any test, looking like an
  environment/resource limitation rather than a bug in the new specs. See `testing-report.md`'s
  "Update — Issue #22" section for the exact failure signature.

## Next action

On a machine with reliable access to the dedicated test Supabase project, run:
`pnpm --filter web test:e2e:personas` then `pnpm --filter web test:e2e:integration`
Get both green, update `testing-report.md` with the real counts, then close issue #22.

## Open questions / blockers

- e2e verification for issue #22's new specs is blocked in this sandbox (see above) — needs a run
  elsewhere before the issue can be called done.
