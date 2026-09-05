# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm workspace + Turborepo monorepo. Run from the repo root unless noted.

```bash
pnpm install                    # once, at the root — before running either app

pnpm dev                        # turbo run dev — fans out to every workspace with a dev/start script
pnpm build                      # turbo run build
pnpm lint                       # turbo run lint (web only today — mobile/shared have no lint script)
pnpm test                       # turbo run test (packages/shared only — vitest)
pnpm typecheck                  # turbo run typecheck — all three workspaces

pnpm --filter web dev           # web app only, http://localhost:3000
pnpm --filter web build         # production build — the authoritative check, see RULES.md §8
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web verify:rls    # RLS cross-user isolation smoke test — needs RLS_TEST_SUPABASE_*
                                 # env vars pointed at a DEDICATED TEST project, never prod

pnpm --filter shared test                        # full shared test suite (vitest run)
pnpm --filter shared test -- <pattern>            # run only test files matching <pattern>
pnpm --filter shared typecheck

pnpm --filter mobile start      # Expo dev server / QR code
pnpm --filter mobile android    # Android emulator/device
pnpm --filter mobile ios        # iOS simulator (macOS only)
pnpm --filter mobile web        # Expo app in a browser tab
pnpm --filter mobile typecheck  # mobile's only automated gate — no lint/build/test script exists
```

Migrations:
```bash
npx supabase link --project-ref <ref> --password <db password>
npx supabase migration list     # check local vs remote before ever pushing
npx supabase db push
```

## Architecture

**Monorepo layout**: `apps/web` (Next.js 16, App Router, Turbopack), `apps/mobile` (Expo
Router — significantly behind web, see "Mobile parity" below), `packages/shared` (types,
Zod schemas, Supabase query functions, pure business logic — consumed by both apps).

**`packages/shared` exports**: wildcard subpath exports per folder
(`./queries/*` → `src/queries/*/index.ts`, `./logic/*` → `src/logic/*.ts`, etc — see its
`package.json`). A new query module needs an `index.ts` barrel in its folder; the package's
own `package.json` never needs editing for a new module.

**Entitlements / paid tier**: `packages/shared/src/config/tierConfig.ts` (`FEATURE_GATES`,
`PAID_TIER_ENABLED`, `PRICING`, `APP_BRANDING`) is the single source of truth for
branding, pricing, and which features are Pro-gated — a deliberate plain config file, not a
database-backed admin panel, since at solo-dev scale a second system to keep in sync buys
nothing. `packages/shared/src/logic/entitlements.ts`'s `resolveEffectiveTier` recomputes tier
live from trial/lifetime dates on every check. See RULES.md §5.

**Payments**: Razorpay. `create-order` (user session) and `webhook` (service_role, no
session) both funnel through `apps/web/src/lib/applyPaymentCapture.ts` so a payment can never
be applied twice regardless of which path completes first.

**Import pipeline**: `packages/shared/src/logic/institutions.ts` registers supported
banks/brokers with a confidence tier (`verified`/`partial`/`heuristic`); column mapping
resolution and balance self-reconciliation (bank statements verify against the file's own
running balance) live in `packages/shared/src/logic/{columnHeuristics,bankStatementImport,brokerImport}.ts`.

**PDF export**: table-driven via `jsPDF` + `jspdf-autotable`, never a DOM screenshot. See
RULES.md §4 for why.

**Design system**: `UI_SPEC.md` at the repo root is the literal, section-by-section spec
this web UI was built from (exact Tailwind classes, spacing, per-screen layout rules,
including amendments that supersede earlier sections — read §11 first, it lists what
changed). Read the relevant section before styling a new web screen rather than improvising
new patterns.

**Conventions**: see `RULES.md` for enforced rules (RLS policy shape, `service_role` scoping,
logic/test co-location, rate limiting + error logging shape, the auth-middleware public-path
bypass list, the verification gate order).

## Mobile parity

`apps/mobile` closed its feature-parity gap with `apps/web` via the phased plan in
`MOBILE_ROADMAP.md` — all 8 phases (entitlements/paywall, the 5 previously-missing asset
classes, multi-currency FX conversion, institution-aware import, PDF/Excel report export, the
combined Overall Report, account/data management, and the remaining web-only feature ports)
plus a post-audit fix pass are done. Don't assume mobile still lacks any of these — check
`MOBILE_ROADMAP.md` for what shipped and how, since the mechanism sometimes differs from web
(e.g. mobile's entitlement-gated checkout opens a WebView bridge to web's own Razorpay flow
rather than a native SDK; report export uses `expo-print`/`xlsx`, not `jsPDF`). Still genuinely
mobile-only gaps, if any, would need to be found by checking the actual code — this file
previously listed a set of "missing" features that had already been shipped, so treat any
parity claim (including this section) as a starting point to verify, not a fact to cite.
