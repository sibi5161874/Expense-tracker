# STATUS.md — What's Shipped, What's Open

Snapshot as of 2026-10-18. Update this when something material changes
— a feature ships, a flag flips, parity shifts. Keep `.agents/_session.md`
for session-to-session detail; keep this for the slower-moving picture.

## Shipped

- **Web** is the primary, most complete surface: dashboard, cashbook,
  transactions, assets (13 classes), investments/portfolio, goals,
  insurance, reports, calculators, settings, AI chat.
- **Mobile parity** — all 8 phases in `MOBILE_ROADMAP.md` are DONE,
  plus a post-audit fix pass: entitlements/paywall, the 5 previously-missing
  asset classes, multi-currency FX conversion, institution-aware import,
  PDF/Excel report export, the combined Overall Report, account/data
  management, and the remaining web-only feature ports.
  **Do not assume mobile is behind on anything without checking
  `MOBILE_ROADMAP.md` first** — it previously listed features as
  "missing" that had already shipped, so treat any parity claim,
  including this one, as a starting point to verify.
- **Payments infrastructure** (Razorpay create-order/verify/webhook,
  idempotent capture via `applyPaymentCapture.ts`) is built and working,
  but dormant: `PAID_TIER_ENABLED = false` in `tierConfig.ts` means the
  app is currently free for every user. Flipping that one flag is the
  only step needed to turn on real billing.
- **Report registry** has more report slugs defined in code than are
  currently exposed — `ENABLED_REPORT_SLUGS` in `tierConfig.ts` controls
  what's actually shown; `ALL_REPORTS_ENABLED` is the escape hatch to show everything.
- **Recent work** (see `.agents/_session.md` for the exact commit list):
  locale-ambiguous date parsing in CSV import, AI chatbot UI redesign,
  live price auto-refresh + fund picker + rate limiting, mutual fund NAV
  refresh fixes, dividend detection, crypto assets + capital gains (STCG/LTCG)
  + XIRR, DB optimization (LZ4 compression, archival, admin monitoring).

## Known soft spots (not bugs, just things to be aware of)

- `easter-egg-334354` is a hidden/unlisted route in `apps/web/src/app`
  — intentional, not a leftover to "clean up" without checking first.
- Pricing/limits/gates are plain code (`tierConfig.ts`), not a
  database-backed admin panel — deliberate at solo-dev scale (see root
  `CLAUDE.md`). Don't "fix" this by adding an admin UI unless asked.

## Next

_(Nothing specific queued at the time this was written — check
`.agents/_session.md` for the current "Next action" before starting work.)_
