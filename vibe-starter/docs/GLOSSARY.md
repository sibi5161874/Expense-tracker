# GLOSSARY.md — App-Specific Terms

| Term | Meaning |
| :--- | :--- |
| Incognito mode | App-wide display toggle (`queries/incognito`) that masks amounts/values in the UI — not an auth or privacy/encryption feature. |
| Solo mode | App-wide display toggle (`queries/soloMode`) — distinct from incognito; check `packages/shared/src/queries/soloMode` before assuming its effect. |
| Lifetime (tier) | One-time paid unlock, no recurring billing (`PRICING.lifetime` in `tierConfig.ts`). The product's actual monetization path — subscription exists in code but is `enabled: false`. |
| Trial | 30-day full-feature trial, started via a refundable ₹1 Razorpay verification charge, auto-refunded (`PRICING.trial`). |
| `FEATURE_GATES` | Map of feature key → `"free" | "pro"` in `tierConfig.ts`. The fastest way to A/B a paywall position is flipping one value here, not touching the component that renders the upsell. |
| `ENABLED_REPORT_SLUGS` / `ALL_REPORTS_ENABLED` | Which of the defined report slugs are actually shown to users; built-ahead-of-exposed pattern — more reports exist in code than are turned on. |
| XIRR | Extended Internal Rate of Return — the return metric used for irregular-cashflow investments (`logic/xirr.ts`), as opposed to simple CAGR. |
| Essentials score | `financialEssentials.ts` — a computed score; `fullEssentialsScore` is a `FEATURE_GATES` entry (currently free). |
| Confidence tier (import) | `verified` / `partial` / `heuristic` — how sure `institutions.ts` is about a bank/broker's column mapping during statement import. |
| Self-reconciliation (import) | A bank statement import verifies itself against the file's own running balance rather than trusting the parse blindly. |
| Archive tables | Cold-storage tables (see recent "DB optimization" work) that keep hot tables small — not a soft-delete/trash mechanism for user-facing undo. |
