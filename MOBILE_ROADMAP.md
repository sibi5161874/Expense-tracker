# Mobile Feature Roadmap

`apps/mobile` (Expo/Expo Router) trails `apps/web` significantly. This roadmap closes the gap
in dependency order — each phase is independently shippable, grounded in direct inspection of
the current mobile codebase (not assumption). See `CLAUDE.md`'s "Mobile parity" section for
the summary; this file is the detail.

## Phase 0 — Entitlements & paywall infrastructure (do first) — DONE

Shipped: `useEntitlements.ts`, `ProGate.tsx` (`ProGate`/`ProLockedButton`/`ProBlurredPreview`,
using `expo-blur`), a Billing screen (`apps/mobile/app/(app)/billing.tsx`) that opens a
WebView pointed at a new web-side bridge route (`apps/web/src/app/mobile-checkout/page.tsx`,
added to `PUBLIC_PATHS`) which establishes the mobile Supabase session client-side from
tokens passed in the URL hash and then renders the existing `BillingTab` — reusing the real
Razorpay checkout flow rather than reimplementing it natively. `livePriceRefresh` (the one
already-built mobile feature with a `FEATURE_GATES` entry) is gated end-to-end as a worked
example for the phases below. `EXPO_PUBLIC_WEB_APP_URL` added to `apps/mobile/.env.example`.
Currently inert in practice since `PAID_TIER_ENABLED` is `false`, but wired so flipping that
flag actually gates mobile without a follow-up change.

**Why first**: every later phase either *is* a Pro feature or has to decide whether it's one.
Retrofitting gating after 7 more phases of ungated features means re-touching all of them.
Mobile has zero gating today — no `useEntitlements`, `ProGate`, or any import from
`@repo/shared/config`/`entitlements.ts` anywhere in `apps/mobile`.

- `apps/mobile/src/hooks/useEntitlements.ts` — port `apps/web/src/hooks/useEntitlements.ts`
  1:1, same `resolveEffectiveTier`/`hasFeatureAccess` calls against the same shared config.
- `apps/mobile/src/components/shared/ProGate.tsx` — RN equivalent of web's
  `ProLockedButton`/`ProBlurredPreview`. React Native has no CSS blur filter; use
  `expo-blur`'s `BlurView` (or a plain opacity+overlay) for the blurred-preview pattern.
- Settings → Billing screen — none exists on mobile today. Razorpay Checkout has no
  Expo-Go-friendly native SDK path; open the hosted Checkout in an in-app `WebView`
  (`react-native-webview`) and reuse the exact same `create-order`/`verify` API routes web
  already calls — they're plain authenticated REST, framework-agnostic.
- Gate every existing mobile screen/action whose equivalent has a `FEATURE_GATES` entry on
  web today (live price refresh, bank/broker import once Phase 3 lands) — check each key
  against what mobile actually has before gating it.

## Phase 1 — Missing asset classes — DONE

Shipped all five (Real Estate, PPF, Recurring Deposits, NSC, Vehicles) following the exact
steps below: field configs, tab entries, 5 new card components, 5 new `useAssets.ts` hooks,
`assets.tsx` wiring, and `useNetWorth.ts` now passes all 13 asset lists instead of 8. `pnpm
--filter mobile typecheck` clean.

Add Real Estate, PPF, Recurring Deposits, NSC, Vehicles. All five already fully exist in
`packages/shared` (Zod schema, types, CRUD queries) and on web — only mobile UI is missing.
Per type, following the existing `FixedDepositCard.tsx`/`assetFieldConfigs.ts` pattern:

1. `apps/mobile/src/components/assets/assetFieldConfigs.ts` — add a field-config array for the type.
2. `apps/mobile/src/components/assets/assetTabs.ts` — add its tab entry.
3. A new `<Type>Card.tsx` component (one per type — the card itself isn't config-driven, only the form is).
4. `apps/mobile/src/hooks/useAssets.ts` — add a `use<Type>Assets()` hook (same shape as the existing 8).
5. `apps/mobile/app/(app)/assets.tsx` — wire the new tab into the loading-state lookup, the
   card-rendering switch, and the `<AssetForm>` block.
6. `apps/mobile/src/hooks/useNetWorth.ts` — pass the new asset list into `calculateNetWorth`'s
   matching param (the shared function already accepts all 13 — mobile just never populated
   the 5 missing ones).

No cross-dependencies between the five — ship one at a time or all together.

## Phase 2 — Multi-currency (FX conversion) — DONE

Shipped: `apps/mobile/src/hooks/useFxRates.ts` calls the FX provider
(`open.er-api.com`) directly rather than through `/api/fx-rates` — that route exists on web
only to keep the fetch server-side, needs no API key, and CORS doesn't constrain a native
app's fetch the way it does a browser's, so routing through the web deployment would only
add a dependency on it being up for no benefit. `useNetWorth.ts` now runs balances through
`convertAccountBalancesToBase` and returns `unconvertedCurrencies`, surfaced as a warning
banner on `net-worth-report.tsx` (same wording as web's). Also fixed: that report's
category breakdown was missing the 5 Phase 1 asset classes (Real Estate, PPF, Recurring
Deposits, NSC, Vehicles) — added, now matches web's full list. The account currency field in
`config.tsx` was free text; upgraded to a picker over `SUPPORTED_CURRENCIES` (matching web),
since FX conversion is only reachable if the currency code is actually valid. `pnpm --filter
mobile typecheck` clean.

## Phase 3 — Institution-aware import — DONE

Shipped as a second, separate import flow alongside the existing generic `ImportSheet.tsx`
(matching web's own side-by-side "Import CSV" + "Import from Bank/Broker" pattern), running
the shared pure functions client-side rather than calling `/api/import/*` — there's no
Next.js server for mobile to call, same reasoning as the generic import path. New:
`ColumnMapper.tsx`, `ImportConfidenceNotice.tsx`, `ImportResultSummary.tsx` (RN ports of the
web components — the result table became a scrollable stack of per-row cards, since RN has
no HTML table equivalent), `BankStatementImportSheet.tsx`, `BrokerImportSheet.tsx`. Both are
Pro-gated (`bankStatementImport`/`brokerImport` in `FEATURE_GATES`) using the same
lock-icon-swap pattern Phase 0 established for live price refresh, wired into
`transactions.tsx` and `investments.tsx`. `pnpm --filter mobile typecheck` clean.

Mobile's `ImportSheet.tsx` only does exact-header-match generic CSV (used today for
transactions, cashbook, and investment-log entities). Add the confidence-tiered flow: reuse
`resolveBankMapping`/`resolveBrokerMapping`, `checkBalanceReconciliation`,
`findBank`/`findBroker` from `packages/shared/src/logic` — either call web's existing
`/api/import/bank-statement` and `/api/import/broker` routes directly (simplest), or
replicate the flow client-side. The UI needs the same confidence-tier acknowledgement gate
web's `ImportConfidenceNotice` enforces before confirming an unverified-confidence import
(RULES.md §9).

## Phase 4 — Report export (PDF + Excel) — DONE

Shipped exactly as planned below: `exportToPdf.ts` (HTML string → `printToFileAsync` →
renamed via `FileSystem.moveAsync` so the share sheet shows a real filename → `Sharing.
shareAsync`) and `exportToExcel.ts` (`xlsx` → base64 → `FileSystem.writeAsStringAsync` →
`Sharing.shareAsync`), both under `apps/mobile/src/lib/`. `ReportExportBar.tsx` (Excel/PDF
buttons, gated behind `reportExport`) is wired into all 13 report screens — each builds its
own `ExcelSheet[]` from data the screen already computes for its on-screen chart/list, so no
new data-fetching was needed anywhere. The 14th, the combined Overall Report, is Phase 5
below and intentionally not touched here. `pnpm --filter mobile typecheck` clean.

Deliberately different tech from web — `expo-print`, `expo-sharing`, `expo-file-system`, and
`xlsx` are **already installed** in `apps/mobile/package.json`, nothing new to add. PDF via
`expo-print`'s `printToFileAsync` from an HTML string (not `jsPDF` — uncertain Node-API
compatibility in RN's JS engine, and the installed toolchain already points at the native
approach). Excel via the `xlsx` package to build the workbook, `expo-file-system` to save it,
`expo-sharing` to hand it to the OS share sheet. Gate behind `reportExport` (already `'pro'`
in `FEATURE_GATES`).

## Phase 5 — Combined "Overall Report" screen — DONE

Shipped as `apps/mobile/app/(app)/overall-report.tsx`, reached from a highlighted card at
the top of `reports.tsx` (matching web's own reports hub layout). Deliberately not a literal
port of web's `ReportEmbedContext` — that pattern exists on web because each report is a
separate `<XReport/>` component that registers its sheets into a shared ref as its own async
data resolves; mobile's report screens are full-screen routes, not embeddable components, so
there's nothing to register into. Instead this screen calls the same hooks and recomputes
the same sheet-building logic each of the 13 individual report screens already has, once,
directly — same combined PDF, no registry needed since everything resolves in one render.
On-screen it shows a compact one-line summary per report (not full duplicated charts) that
link out to the full screen; the single "PDF" button (Pro-gated, `reportExport`) is the
"everything, in full" artifact — PDF-only, no Excel, matching web's own scope decision that
combining 14 tabular sheets into one spreadsheet isn't meaningful. `pnpm --filter mobile
typecheck` clean.

## Phase 6 — Account & data management — DONE

Turned out not to be quite the "thin wrapper, no web-specific code" the plan assumed:
`/api/account/export` and `/api/account/delete` both used `@/lib/supabase/server`'s
cookie-only client, and mobile has no cookies — same architectural gap Phase 0 hit with
Razorpay checkout, but this time solvable without a WebView, since these are plain JSON
in/out endpoints a bearer token handles natively. Added
`apps/web/src/lib/supabase/bearer.ts` (`resolveRequestUser`): checks for an `Authorization:
Bearer` header first (constructs a client that carries the token on every request, so RLS
still applies exactly as it does for the cookie-authenticated path), falls back to the
existing cookie client for ordinary browser requests. Both routes now use it; both added to
`PUBLIC_PATHS` (same bug class as the webhook/cron entries — a bearer-authenticated request
has no cookie, so the middleware would 307 it to `/login` before the route ever saw the
header). Mobile: `DataManagementCard.tsx` (export → save via `expo-file-system` → share via
`expo-sharing`; delete → retype-email confirm, matching web) wired into `settings.tsx`.
`pnpm --filter mobile typecheck`, `pnpm --filter web typecheck/lint/build` all clean.

## Phase 7 — Port the Phase 1–5 web-only features — DONE

Shipped all 8, in the suggested order. Turned out **not** to be "UI-only, no new backend
work" as planned — three live-data routes (`/api/stock/fundamentals`, `/api/live-price/
universal`, `/api/live-price/history`) used the same cookie-only client Phase 6 already hit
with account export/delete. Extended the same fix rather than inventing a new one:
`resolveRequestUser` on all three, all three added to `PUBLIC_PATHS`. Added
`apps/mobile/src/lib/webApi.ts` (`fetchWebApi`) as the one shared bearer-fetch helper every
live-data hook below calls, instead of repeating the fetch-plus-Authorization-header
boilerplate five times.

- **Calculators** (`calculators.tsx`) — Basic/SIP/Stock Averaging/Lumpsum/P&L, pure
  client-side math, no API dependency. Reached from More.
- **Coffee-spend insight** (`DashboardInsightCard.tsx`) — needed a new mobile hook,
  `useRecentExpensesForInsight` (added to `useTransactions.ts`); dropped into the dashboard.
- **Historical net worth chart + snapshots** — turned out to be two features, not one: mobile
  had zero snapshot-taking UI at all before this (`useNetWorthSnapshots.ts` new hook,
  `NetWorthSnapshotHistory.tsx` on the Net Worth report, free-tier monthly limit respected
  via `canAddSnapshotThisMonth`), *and* the Pro-gated longer-range dashboard widget
  (`HistoricalNetWorthChart.tsx`). Both share a new `NetWorthSparkline.tsx` — a hand-built bar
  chart from plain Views (matching `CashFlowBars.tsx`'s existing convention), since Recharts
  doesn't run on React Native and this app has never used `react-native-svg` path-drawing for
  a smooth line/area chart.
- **Portfolio vs Nifty 50 benchmark** (`PortfolioBenchmarkChart.tsx`) — same bar-chart
  approach, downsampled to ≤20 bars (a year of daily closes doesn't fit individually on a
  phone width); dropped into the dashboard next to the historical chart.
- **Passive income tracker** (`usePassiveIncome.ts`, `PassiveIncomeWidget.tsx`) — gated
  behind `livePriceRefresh` (not a calculator-suite gate), matching web; dropped into the
  dashboard, needs `holdings` computed there (dashboard didn't fetch investments before this).
- **Stock fundamentals + per-holding detail + universal ticker lookup**
  (`useStockFundamentals.ts`, `FundamentalCard.tsx`, `stock-detail.tsx`) — not a nested
  `portfolio/[symbol]` route: Expo Router would need `portfolio.tsx` restructured into
  `portfolio/index.tsx` to coexist with a dynamic child, risking the Tabs navigator's existing
  registration of "portfolio" as a flat screen. Used a flat route with a `?symbol=` param
  instead — same result, no restructuring. `HoldingsList.tsx` rows are now pressable into it.
- **Tax-loss harvesting card** (`TaxLossHarvestingCard.tsx`) — pure client-side math over
  existing holdings, dropped into the Portfolio page.
- **Transactions calendar view** (`TransactionsCalendarView.tsx`, `transactions-date.tsx`) —
  needed a new hook (`useTransactionsForDate`); List/Calendar toggle added to
  `transactions.tsx` via the existing `SegmentedControl`. Same flat-route-with-param
  reasoning as stock-detail for the date-detail screen (`?date=` instead of a nested
  `transactions/date/[date]` segment).

`pnpm --filter mobile typecheck` and `pnpm --filter web typecheck/lint/build` all clean
throughout. This closes out the mobile roadmap — every phase (0 through 7) is now done.

## Post-audit fixes — DONE

A fresh, independent parity/architecture audit (not this roadmap's own claims) surfaced a
few real gaps this roadmap's phases had missed. All closed:

- **4 dashboard widgets** ported to mobile: `BudgetHealthCard.tsx`, `GoalsProgressCard.tsx`,
  `QuickStatsCard.tsx`, `FinancialEssentialsCard.tsx` (the last needed a new
  `useFinancialEssentials.ts` hook — mirrors web's exactly, every dependency it composes
  already existed on mobile). Wired into `dashboard.tsx`.
- **Portfolio Summary report export** — `portfolio.tsx` now has a `ReportExportBar`, closing
  the one report that was viewable but not exportable on mobile.
- **Recurring-transaction generation UI** — new `useRecurringTransactions.ts` and the "lazy
  cron" `useGenerateRecurringTransactions.ts` (mirrors web's exactly, wired into `(app)/
  _layout.tsx`), a `RecurringTransactionSheet.tsx` form, and a 4th "Recurring" tab in
  `config.tsx`.
- **Password reset** — was missing on *both* apps, not just mobile. Added
  `forgot-password`/`reset-password` pages to web (new `resetPasswordForEmail`/
  `updatePassword` on `AuthContext`, two new schemas, both paths added to `PUBLIC_PATHS`).
  Mobile's login/signup screens link out to the web flow via `Linking.openURL` rather than
  building a second native recovery flow — the emailed link has to land in a browser to
  complete the exchange either way.
- **Google OAuth on mobile** — added `expo-auth-session` + `expo-web-browser`, a
  `signInWithGoogle` on mobile's `AuthContext` (opens the provider URL in the OS auth
  browser via `openAuthSessionAsync`, then hands the redirect's tokens to `setSession`),
  wired into both login and signup screens. **Needs one dashboard-side step the code can't
  do itself**: the app's URL scheme (`moneymanager`, from `app.json`) must be added to
  Supabase's allowed redirect URLs (Authentication → URL Configuration) before this works
  end-to-end.

`pnpm --filter mobile typecheck`, `pnpm --filter web typecheck/lint/build`, and
`pnpm --filter shared test` (404 tests) all clean.

## Verification per phase

`pnpm --filter mobile typecheck` (mobile's only automated gate today — no lint/build/test
script exists) plus a manual Expo Go smoke test of the new screen/flow. Phase 0 additionally
needs `PAID_TIER_ENABLED` flipped on temporarily in a dev build to confirm gating actually
blocks free-tier access, not just that it compiles.
