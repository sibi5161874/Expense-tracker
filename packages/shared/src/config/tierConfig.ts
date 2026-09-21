/**
 * ============================================================================
 *  MONEY MANAGER — APP & PRICING CONFIG
 * ============================================================================
 * Edit this file to change branding, pricing, free-tier limits, or which
 * features/reports are Pro-only. Every other file reads FROM here — nothing
 * else hardcodes a price, a limit, or a feature gate. Change a number here,
 * redeploy, done.
 *
 * This is deliberately a code file, not a database table or an admin UI: at
 * solo-dev, pre-launch scale, a runtime-editable admin panel is a second
 * system to keep in sync with the code for no benefit — you ARE the admin,
 * and you already edit code. Move this to a database-backed config only once
 * someone other than you needs to change it without a deploy.
 * ============================================================================
 */

export const APP_BRANDING = {
  name: "KashMap",
  tagline:
    "Privacy-first net worth tracking, built for how Indians actually invest.",
  /** Path under /public, or a full URL. */
  logoUrl: "/logo.svg",
  faviconUrl: "/icon.svg",
} as const;

/**
 * Canonical production URL for the web app. Auth redirects (signup confirmation, Google
 * OAuth, password reset — see apps/web/src/lib/siteUrl.ts) are pinned to this exact value
 * so they always match Supabase's Auth "Site URL" / "Redirect URLs" allow-list
 * (Authentication > URL Configuration in the dashboard) instead of whatever domain/alias
 * happened to serve the request — Vercel's auto-generated preview aliases otherwise produce
 * a different redirect target per deployment that Supabase would reject.
 *
 * Update this the moment a custom domain is attached, AND add the new domain to that same
 * Supabase allow-list — changing only one of the two leaves auth redirects broken.
 */
export const PRODUCTION_SITE_URL = "https://web-six-beta-34.vercel.app";

/**
 * Master switch for the entire paid-tier system.
 *
 * `false` (current) — the app runs 100% free for every user. No trial, no
 * lifetime purchase, no Razorpay checkout is ever triggered, every feature
 * gate and usage limit is unlocked for everyone. Use this while Razorpay
 * isn't connected yet.
 *
 * `true` — Free/Trial/Pro all apply as configured below, and the Billing tab
 * drives real Razorpay checkout.
 *
 * This is the ONLY flag that needs to change to flip between the two modes —
 * every entitlement check funnels through resolveEffectiveTier() in
 * entitlements.ts, which reads this directly.
 */
export const PAID_TIER_ENABLED = false;

export const PRICING = {
  currency: "INR",

  trial: {
    enabled: true,
    days: 30,
    /** The refundable Razorpay charge used to start a trial, in paise (100 = ₹1). Collected via /api/payments/create-order + Razorpay Checkout, refunded automatically in applyPaymentCapture.ts. */
    verificationChargePaise: 100,
    label: "30-Day Free Trial",
  },

  lifetime: {
    enabled: true,
    priceRupees: 850,
    label: "Lifetime",
  },

  /**
   * Off by default — your actual plan is Free -> Trial -> Lifetime, no
   * recurring subscription. Flip `enabled: true` and fill in prices if you
   * ever want a monthly/yearly option alongside lifetime; nothing else in the
   * codebase needs to change to support it appearing on the pricing page.
   */
  subscription: {
    enabled: false,
    monthly: { priceRupees: 99, label: "Monthly" },
    yearly: { priceRupees: 499, label: "Yearly" },
  },
} as const;

/**
 * Limits that apply only on the Free tier (no cap once trial/pro). Trial and
 * Pro both mean "unlimited" everywhere these are read — see
 * entitlements.ts's isUnlimitedTier().
 */
export const FREE_TIER_LIMITS = {
  /** Total across ALL 13 asset tables combined, not per class — see DATA_MODEL note in entitlements.ts. */
  maxAssets: 25,
  maxNetWorthSnapshotsPerMonth: 2,
  maxGoals: 3,
  maxLiabilities: 5,
  /** AI chat questions per calendar month — unlimited on Trial/Pro (see isUnlimitedTier()). Cheap enough per-query (Haiku-tier model, small tool results) that this stays a usage cap rather than a Pro-only feature gate. */
  maxAiChatQueriesPerMonth: 20,
} as const;

/**
 * One flag per Pro-gated capability. Setting a value to `'free'` unlocks that
 * feature for everyone — the fastest way to A/B a paywall position without
 * touching the component that renders the upsell.
 */
export type FeatureTier = "free" | "pro";

export const FEATURE_GATES: Record<string, FeatureTier> = {
  bankStatementImport: "pro",
  brokerImport: "pro",
  livePriceRefresh: "pro",
  multiCurrency: "pro",
  recurringTransactions: "free",
  reportExport: "pro",
  fullEssentialsScore: "free",
  financialCalculators: "pro",
  historicalCharts: "pro",
  taxLossHarvesting: "pro",
};

export type FeatureKey = keyof typeof FEATURE_GATES;

/**
 * Which of the 16 report slugs (see apps/web/src/lib/reportsRegistry.ts) are
 * actually offered in the product. Trim this list to launch with fewer
 * reports without deleting any report code — an empty array here would hide
 * all reports, not show all of them, so it's never left empty by accident:
 * ALL_REPORTS_ENABLED below is the explicit "show everything" escape hatch.
 */
export const ALL_REPORTS_ENABLED = true;

export const ENABLED_REPORT_SLUGS: string[] = [
  "monthly-summary",
  "budget-vs-actual",
  "category-breakdown",
  "net-worth",
  "portfolio-summary",
  "goal-progress",
];
