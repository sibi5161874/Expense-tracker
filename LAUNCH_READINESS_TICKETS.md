# 🚀 KashMap Pre-Launch Readiness Roadmap & Ticket Tracker
**Target:** Elevate Launch Score from **6.5 / 10 ➔ 9.4 / 10**  
**Compliance Target:** RBI / Razorpay Merchant Guidelines & India DPDP Act 2023  
**Status:** ✅ Completed / Production Ready

---

## 📋 Ticket Summary Board

| Ticket ID | Category | Severity | Title | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TCK-01** | Database Security | 🚨 CRITICAL | Lock down `archive_old_records` & `get_database_stats` RPCs | ✅ Resolved |
| **TCK-02** | Billing Security | 🚨 CRITICAL | Prevent Client-Side Subscription Tier Escalation on `user_profiles` | ✅ Resolved |
| **TCK-03** | Payment Integrity | 🚨 CRITICAL | Revoke Client Insert/Update Policies on `payment_events` Table | ✅ Resolved |
| **TCK-04** | Legal & Compliance | 🚨 CRITICAL | Publish Compliant Privacy Policy, Terms, and 30-Day Refund Policy | ✅ Resolved |
| **TCK-05** | Observability | 🚨 CRITICAL | Production Structured Logging & Error Boundary Architecture | ✅ Resolved |
| **TCK-06** | API Security | ⚠️ HIGH | Return JSON 401 Unauthorized for Protected `/api/*` Routes | ✅ Resolved |
| **TCK-07** | Auth Security | ⚠️ HIGH | Mitigate User Email Enumeration on Signup Flow | ✅ Resolved |
| **TCK-08** | Client Privacy | ⚠️ HIGH | Remove `NEXT_PUBLIC_ADMIN_EMAIL` Leak from Client Bundle | ✅ Resolved |
| **TCK-09** | SEO & Discovery | ⚠️ HIGH | Add `sitemap.ts`, `robots.ts`, and OpenGraph Metadata Shells | ✅ Resolved |
| **TCK-10** | UX & Performance | ⚠️ HIGH | Add Themed `loading.tsx` Skeletons for Core App Routes | ✅ Resolved |
| **TCK-11** | DevOps & Monitoring | 💡 MEDIUM | Synthetic `/api/health` Endpoint for External Uptime Checkers | ✅ Resolved |
| **TCK-12** | Onboarding UX | 💡 MEDIUM | Dual-Action Onboarding Sandbox for First-Time Indian Users | ✅ Resolved |

---

## 🚨 TIER 1: CRITICAL LAUNCH BLOCKERS

### TCK-01: Lock Down `archive_old_records` & `get_database_stats` RPCs
- **Category:** Database Security
- **Severity:** 🚨 CRITICAL (Risk: 10/10)
- **Files Affected:** `supabase/migrations/20261123000001_lock_down_admin_rpcs.sql`
- **Problem Statement:**  
  `public.archive_old_records` in migration `20260926000004_archive_functions.sql` is declared with `SECURITY DEFINER` without revoking execute privileges from `PUBLIC`. By default in PostgreSQL, any authenticated or anonymous user with access to PostgREST can execute `supabase.rpc('archive_old_records', { p_table_name: 'transactions', p_cutoff_date: '2099-01-01' })`, permanently purging every transaction, investment log, and cashbook entry across all users in the system.
- **Resolution Plan:**
  Create a migration that revokes execute privileges from `public`, `anon`, and `authenticated`, granting access exclusively to `service_role`.
  ```sql
  -- supabase/migrations/20261123000001_lock_down_admin_rpcs.sql
  revoke execute on function public.archive_old_records(text, date) from public, anon, authenticated;
  grant execute on function public.archive_old_records(text, date) to service_role;

  revoke execute on function public.get_database_stats() from public, anon, authenticated;
  grant execute on function public.get_database_stats() to service_role;
  ```

---

### TCK-02: Prevent Client-Side Subscription Tier Escalation on `user_profiles`
- **Category:** Billing Security
- **Severity:** 🚨 CRITICAL (Risk: 9/10)
- **Files Affected:** `supabase/migrations/20261123000002_protect_user_profiles_tier.sql`
- **Problem Statement:**  
  Policy `user_profiles_update_own` allows authenticated users to update their own row in `public.user_profiles`. Because `tier`, `trial_started_at`, `trial_ends_at`, and `lifetime_purchased_at` reside directly on `user_profiles`, any user can send a PATCH request via Supabase PostgREST setting `{"tier": "pro", "lifetime_purchased_at": "2026-11-23"}` and bypass the Razorpay payment gateway entirely.
- **Resolution Plan:**
  Add a PostgreSQL `BEFORE UPDATE` trigger on `public.user_profiles` that prevents any non-`service_role` caller from altering billing/subscription columns.
  ```sql
  -- supabase/migrations/20261123000002_protect_user_profiles_tier.sql
  create or replace function public.protect_user_profile_tier_columns()
  returns trigger
  language plpgsql
  security definer
  as $$
  begin
    if (
      old.tier is distinct from new.tier or
      old.trial_started_at is distinct from new.trial_started_at or
      old.trial_ends_at is distinct from new.trial_ends_at or
      old.lifetime_purchased_at is distinct from new.lifetime_purchased_at
    ) then
      if current_user not in ('service_role', 'postgres', 'supabase_admin') and
         coalesce(auth.role(), '') != 'service_role' then
        raise exception 'Permission denied: subscription tier columns can only be modified by the billing service.';
      end if;
    end if;
    return new;
  end;
  $$;

  drop trigger if exists trg_protect_user_profile_tier on public.user_profiles;
  create trigger trg_protect_user_profile_tier
    before update on public.user_profiles
    for each row execute function public.protect_user_profile_tier_columns();
  ```

---

### TCK-03: Revoke Client Insert/Update Policies on `payment_events` Table
- **Category:** Payment Integrity
- **Severity:** 🚨 CRITICAL (Risk: 9/10)
- **Files Affected:** `supabase/migrations/20261123000003_secure_payment_events_table.sql`
- **Problem Statement:**  
  Migration `20260816000002_payment_events.sql` created policies `payment_events_insert_own` and `payment_events_update_own`, allowing client tokens to insert and update rows in `payment_events`. An attacker can forge 'captured' payment rows directly. All payment records must be written exclusively by server-side RPC (`reserve_payment_order`) or `service_role` (webhook handlers).
- **Resolution Plan:**
  Drop the client write policies so `payment_events` becomes strictly read-only for client tokens.
  ```sql
  -- supabase/migrations/20261123000003_secure_payment_events_table.sql
  drop policy if exists "payment_events_insert_own" on public.payment_events;
  drop policy if exists "payment_events_update_own" on public.payment_events;

  -- Users can only inspect their own verified payment records
  drop policy if exists "payment_events_select_own" on public.payment_events;
  create policy "payment_events_select_own" on public.payment_events
    for select using (auth.uid() = user_id);
  ```

---

### TCK-04: Publish Compliant Legal Pages (Privacy Policy, Terms, 30-Day Refund Policy)
- **Category:** Legal & Compliance
- **Severity:** 🚨 CRITICAL (Risk: 8/10)
- **Files Affected:** 
  - `apps/web/src/app/privacy/page.tsx`
  - `apps/web/src/app/terms/page.tsx`
  - `apps/web/src/app/refund-policy/page.tsx`
  - `apps/web/src/components/landing/LandingFooter.tsx`
- **Problem Statement:**  
  `apps/web/src/app/privacy/page.tsx` and `apps/web/src/app/terms/page.tsx` currently render placeholder text ("We're finalizing the full privacy policy before general launch..."). Furthermore, `pricing/page.tsx` advertises a "30-day money-back guarantee", but no Refund & Cancellation Policy exists. This directly violates Razorpay merchant onboarding guidelines, the RBI Master Direction on payment aggregation, and India's Digital Personal Data Protection Act 2023.
- **Resolution Plan:**
  1. Replace `privacy/page.tsx` with formal DPDP Act 2023 clauses (Data Fiduciary identity, user rights to access/erasure, data retention, grievance officer email, purpose limitation).
  2. Replace `terms/page.tsx` with production SaaS terms (usage license, disclaimers on financial advice, limitation of liability, governing law in India).
  3. Create `refund-policy/page.tsx` clearly specifying the 30-day money-back refund process, eligibility, and turnaround time (5–7 business days via original payment method).
  4. Link the Refund Policy in `LandingFooter.tsx`.

---

### TCK-05: Production Error Monitoring & APM Setup (@sentry/nextjs)
- **Category:** Observability & Reliability
- **Severity:** 🚨 CRITICAL (Risk: 8/10)
- **Files Affected:** `apps/web/src/lib/logger.ts`, `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`
- **Problem Statement:**  
  The application currently relies entirely on `console.error`. If a client-side crash occurs during transaction entry, or if Razorpay webhook processing drops an order verification, developers have zero visibility until users submit a complaint.
- **Resolution Plan:**
  1. Install `@sentry/nextjs`.
  2. Configure Sentry client and server configurations conditioned on `NEXT_PUBLIC_SENTRY_DSN`.
  3. Forward `logError` calls in `apps/web/src/lib/logger.ts` to Sentry when DSN is present, with sensitive financial figures sanitized.

---

## ⚠️ TIER 2: HIGH PRIORITY (SCORE BOOST TO 9.0+)

### TCK-06: Return JSON 401 Unauthorized for Protected `/api/*` Routes
- **Category:** API Architecture & Security
- **Severity:** ⚠️ HIGH (Risk: 7/10)
- **Files Affected:** `apps/web/src/lib/supabase/middleware.ts`
- **Problem Statement:**  
  In `apps/web/src/lib/supabase/middleware.ts` lines 112–118, unauthenticated requests to protected endpoints return a 307 HTML redirect to `/login`. When mobile apps, curl, or programmatic clients call protected API endpoints (`/api/accounts`, `/api/transactions`), they receive an HTML body instead of JSON, resulting in JSON parse syntax errors.
- **Resolution Plan:**
  Update middleware to check if `request.nextUrl.pathname.startsWith('/api/')` and return `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.

---

### TCK-07: Mitigate User Account Email Enumeration on Signup Flow
- **Category:** Auth Security
- **Severity:** ⚠️ HIGH (Risk: 6/10)
- **Files Affected:** `apps/web/src/components/shared/AuthForm.tsx`
- **Problem Statement:**  
  In `AuthForm.tsx` lines 85–88, checking `user.identities?.length === 0` displays "An account with this email already exists — try logging in instead." This defeats Supabase's anti-enumeration mitigation and allows malicious scrapers to enumerate registered user email addresses.
- **Resolution Plan:**
  Display a generic, secure notification on signup: "If an account does not yet exist for this email, a confirmation link has been sent. Otherwise, you can log in."

---

### TCK-08: Eliminate Client Bundle Admin Email Leakage
- **Category:** Security & Privacy
- **Severity:** ⚠️ HIGH (Risk: 6/10)
- **Files Affected:** `apps/web/src/app/(app)/settings/admin/database-health/page.tsx`, `apps/web/src/app/api/admin/db-stats/route.ts`
- **Problem Statement:**  
  `NEXT_PUBLIC_ADMIN_EMAIL` is baked into the browser bundle at compile-time to check if the current user should view `/settings/admin/database-health`. Anyone inspecting JavaScript source maps or runtime strings can view the administrator's email.
- **Resolution Plan:**
  Remove `NEXT_PUBLIC_ADMIN_EMAIL` from client code. Perform admin authorization server-side in `/api/admin/db-stats/route.ts` using a private `ADMIN_EMAILS` server environment variable. The client page will redirect to `/dashboard` upon receiving a 403 Forbidden.

---

### TCK-09: Complete SEO Infrastructure & Metadata (`sitemap.ts`, `robots.ts`, OpenGraph)
- **Category:** SEO & Growth
- **Severity:** ⚠️ HIGH (Risk: 6/10)
- **Files Affected:** `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts`, `apps/web/src/app/features/page.tsx`, `apps/web/src/app/pricing/page.tsx`
- **Problem Statement:**  
  No `sitemap.ts` or `robots.ts` exists in `apps/web/src/app`. Key landing pages (`/features`, `/pricing`) are declared `'use client'` without metadata exports, leaving links shared on WhatsApp, Twitter, and LinkedIn with blank preview cards.
- **Resolution Plan:**
  1. Add `apps/web/src/app/sitemap.ts` indexing all public routes (`/`, `/features`, `/pricing`, `/how-it-works`, `/privacy`, `/terms`, `/refund-policy`).
  2. Add `apps/web/src/app/robots.ts` disallowing authenticated directories (`/(app)/*`, `/api/*`) and allowing marketing pages.
  3. Export OpenGraph and Twitter card metadata with rich titles and descriptions.

---

### TCK-10: Route Loading Skeletons for Zero CLS Navigation
- **Category:** UX & Performance
- **Severity:** ⚠️ HIGH (Risk: 5/10)
- **Files Affected:** 
  - `apps/web/src/app/(app)/dashboard/loading.tsx`
  - `apps/web/src/app/(app)/investments/loading.tsx`
  - `apps/web/src/app/(app)/cashbook/loading.tsx`
  - `apps/web/src/app/(app)/goals/loading.tsx`
- **Problem Statement:**  
  Navigating between core tabs causes brief white flashes or layout jumps because loading skeletons only exist for assets and reports.
- **Resolution Plan:**
  Implement `loading.tsx` files across core routes using themed shimmering card and table skeletons that match the exact final rendered layout.

---

## 💡 TIER 3: RELIABILITY & ONBOARDING POLISH

### TCK-11: Synthetic Health Check Endpoint (`/api/health`)
- **Category:** DevOps & Monitoring
- **Severity:** 💡 MEDIUM (Risk: 4/10)
- **Files Affected:** `apps/web/src/app/api/health/route.ts`
- **Problem Statement:**  
  There is no lightweight automated endpoint to ping database and cache responsiveness for external uptime monitors (BetterStack, UptimeRobot).
- **Resolution Plan:**
  Create `/api/health` that performs a lightweight `SELECT 1` ping on Supabase and checks Redis connectivity, returning `{ status: 'healthy', timestamp, uptime }` with HTTP 200.

---

### TCK-12: First-Time User "Explore with Demo Data" Sandbox
- **Category:** User Onboarding & Conversion
- **Severity:** 💡 MEDIUM (Risk: 4/10)
- **Files Affected:** `apps/web/src/app/(app)/dashboard/page.tsx`
- **Problem Statement:**  
  New users without immediate access to bank CSVs land on an empty dashboard showing 0 Net Worth, leading to high initial bounce rates ("The Blank Canvas Wall").
- **Resolution Plan:**
  Add a button/banner on the dashboard empty state: "Explore Demo Indian Portfolio" that populates an in-memory sample portfolio (EPF, Nifty 50 Index, SGB, Emergency Fund) so users can experience the charts and tax reports instantly.
