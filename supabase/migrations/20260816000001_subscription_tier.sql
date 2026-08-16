-- Paid tier state — Free / Trial / Pro (lifetime). Lives on user_profiles
-- rather than a new table since it's the same "one row per user" shape as the
-- rest of that table, and every entitlement check already needs to join
-- against it (age, income) for other features.
--
-- Deliberately minimal: no monthly/yearly recurring billing state (subscription
-- period, renewal date, payment gateway customer id) — the actual product plan
-- is Free -> 30-day trial -> Lifetime, a one-way ratchet with no recurring
-- charge to track. A subscription tier can be added later without touching
-- this migration; see packages/shared/src/config/tierConfig.ts.

create type public.subscription_tier as enum ('free', 'trial', 'pro');

alter table public.user_profiles
  add column tier public.subscription_tier not null default 'free',
  add column trial_started_at timestamptz,
  add column trial_ends_at timestamptz,
  add column lifetime_purchased_at timestamptz;

-- Trial and lifetime are mutually exclusive with being tier='free' in spirit,
-- but not enforced by a CHECK here — resolveEffectiveTier() in
-- packages/shared/src/logic/entitlements.ts is the single source of truth for
-- "what can this user actually do right now", including expired-trial handling.
-- A CHECK constraint would duplicate that logic in SQL and the two would drift.
