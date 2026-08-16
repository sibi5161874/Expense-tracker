import {
  PAID_TIER_ENABLED,
  FREE_TIER_LIMITS,
  FEATURE_GATES,
  ALL_REPORTS_ENABLED,
  ENABLED_REPORT_SLUGS,
  PRICING,
  type FeatureKey,
} from '../config/tierConfig';
import type { SubscriptionTier } from '../types';

/**
 * Entitlement resolution — pure functions over `user_profiles`' tier columns
 * and packages/shared/config/tierConfig.ts. No network, no Supabase — every
 * "can this user do X" question funnels through here so there's exactly one
 * place that answers it, not one check per component.
 *
 * NOT built here (explicitly out of scope for this pass): actual payment
 * collection. `startTrial`/`purchaseLifetime` below compute the DB fields to
 * write, but nothing calls a payment gateway or verifies a charge — wiring a
 * real GPay charge-and-refund or a lifetime purchase flow is a separate task.
 * What exists today lets you flip your own account to Pro to test gating, and
 * gives the UI a real trial/purchase action to call once payment exists.
 */

export interface ProfileTierFields {
  tier: SubscriptionTier;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  lifetime_purchased_at: string | null;
}

/**
 * The DB's `tier` column is written once when a trial starts or a lifetime
 * purchase completes — nothing flips it back to 'free' when a trial expires,
 * because there's no cron job for it (see tierConfig.ts's note on why this
 * app has no recurring-billing state to reconcile). So `tier` alone is not
 * trustworthy; this recomputes the REAL current tier from the dates every
 * time, the same way a JWT's expiry is checked at use, not at issue time.
 */
export function resolveEffectiveTier(
  profile: ProfileTierFields | null,
  now: Date = new Date(),
  paidTierEnabled: boolean = PAID_TIER_ENABLED
): SubscriptionTier {
  // Paid tier switched off in tierConfig.ts — everyone gets full access, no
  // gating anywhere, regardless of what's stored on the profile. The
  // parameter (rather than reading the import directly) is what lets tests
  // exercise the real trial/pro logic below while it's off by default.
  if (!paidTierEnabled) return 'pro';
  if (!profile) return 'free';
  if (profile.tier === 'pro') return 'pro'; // lifetime purchases never expire
  if (profile.tier === 'trial' && profile.trial_ends_at) {
    return new Date(profile.trial_ends_at) > now ? 'trial' : 'free';
  }
  return 'free';
}

export function isUnlimitedTier(tier: SubscriptionTier): boolean {
  return tier === 'trial' || tier === 'pro';
}

export function hasFeatureAccess(feature: FeatureKey, tier: SubscriptionTier): boolean {
  if (isUnlimitedTier(tier)) return true;
  return FEATURE_GATES[feature] === 'free';
}

/** Null when there's no active trial (never started, expired, or already Pro) — the UI shows a countdown only for a real trial. */
export function getTrialDaysRemaining(
  profile: ProfileTierFields | null,
  now: Date = new Date(),
  paidTierEnabled: boolean = PAID_TIER_ENABLED
): number | null {
  if (resolveEffectiveTier(profile, now, paidTierEnabled) !== 'trial' || !profile?.trial_ends_at) return null;
  const msRemaining = new Date(profile.trial_ends_at).getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
}

/** True once a trial has been used before — even after it expires — so "start trial" can't be replayed to reset the clock. */
export function hasUsedTrial(profile: ProfileTierFields | null): boolean {
  return !!profile?.trial_started_at;
}

/** A quota with no limit (null) is always fine — used for the goals/liabilities caps that are currently unset. */
export function isWithinLimit(currentCount: number, limit: number | null, tier: SubscriptionTier): boolean {
  if (isUnlimitedTier(tier)) return true;
  if (limit === null) return true;
  return currentCount < limit;
}

export function canAddAsset(currentAssetCount: number, tier: SubscriptionTier): boolean {
  return isWithinLimit(currentAssetCount, FREE_TIER_LIMITS.maxAssets, tier);
}

export function canAddSnapshotThisMonth(snapshotsThisMonth: number, tier: SubscriptionTier): boolean {
  return isWithinLimit(snapshotsThisMonth, FREE_TIER_LIMITS.maxNetWorthSnapshotsPerMonth, tier);
}

export function canAddGoal(currentGoalCount: number, tier: SubscriptionTier): boolean {
  return isWithinLimit(currentGoalCount, FREE_TIER_LIMITS.maxGoals, tier);
}

export function canAddLiability(currentLiabilityCount: number, tier: SubscriptionTier): boolean {
  return isWithinLimit(currentLiabilityCount, FREE_TIER_LIMITS.maxLiabilities, tier);
}

/** Whether a given report slug is offered at all (independent of tier — reports are a product-scope toggle, not a paywall). */
export function isReportEnabled(slug: string): boolean {
  return ALL_REPORTS_ENABLED || ENABLED_REPORT_SLUGS.includes(slug);
}

/**
 * Fields to write when starting a trial. Caller is responsible for not calling this if
 * hasUsedTrial() is already true.
 *
 * Return type is spelled out rather than `Pick<ProfileTierFields, ...>` because that would
 * inherit `trial_started_at`/`trial_ends_at` as `string | null` from the DB-shaped
 * ProfileTierFields — accurate for data read back from Supabase, but this function always
 * produces real timestamps, never null, and callers (and their tests) shouldn't have to
 * narrow that away themselves.
 */
export function startTrial(now: Date = new Date()): {
  tier: ProfileTierFields['tier'];
  trial_started_at: string;
  trial_ends_at: string;
} {
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + PRICING.trial.days);
  return { tier: 'trial', trial_started_at: now.toISOString(), trial_ends_at: endsAt.toISOString() };
}

/** Fields to write on a completed lifetime purchase. */
export function purchaseLifetime(now: Date = new Date()): Pick<ProfileTierFields, 'tier' | 'lifetime_purchased_at'> {
  return { tier: 'pro', lifetime_purchased_at: now.toISOString() };
}
