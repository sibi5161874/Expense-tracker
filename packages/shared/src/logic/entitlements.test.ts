import { describe, expect, it } from 'vitest';
import {
  resolveEffectiveTier,
  isUnlimitedTier,
  hasFeatureAccess,
  getTrialDaysRemaining,
  hasUsedTrial,
  isWithinLimit,
  canAddAsset,
  canAddSnapshotThisMonth,
  isReportEnabled,
  startTrial,
  purchaseLifetime,
  type ProfileTierFields,
} from './entitlements';

const NOW = new Date('2026-08-16T00:00:00Z');

function profile(overrides: Partial<ProfileTierFields> = {}): ProfileTierFields {
  return { tier: 'free', trial_started_at: null, trial_ends_at: null, lifetime_purchased_at: null, ...overrides };
}

describe('resolveEffectiveTier', () => {
  it('is free for a null profile (e.g. not yet loaded) rather than throwing', () => {
    expect(resolveEffectiveTier(null, NOW, true)).toBe('free');
  });

  it('is free by default', () => {
    expect(resolveEffectiveTier(profile(), NOW, true)).toBe('free');
  });

  it('is trial while trial_ends_at is in the future', () => {
    const p = profile({ tier: 'trial', trial_ends_at: '2026-08-20T00:00:00Z' });
    expect(resolveEffectiveTier(p, NOW, true)).toBe('trial');
  });

  it('reverts an expired trial to free, even though the DB column still says trial', () => {
    // The DB has no cron flipping this back — resolveEffectiveTier is what
    // makes an expired trial actually stop granting access.
    const p = profile({ tier: 'trial', trial_ends_at: '2026-08-01T00:00:00Z' });
    expect(resolveEffectiveTier(p, NOW, true)).toBe('free');
  });

  it('treats tier=trial with no trial_ends_at as free (malformed state, fail closed)', () => {
    expect(resolveEffectiveTier(profile({ tier: 'trial', trial_ends_at: null }), NOW, true)).toBe('free');
  });

  it('is pro permanently once purchased, regardless of any trial dates', () => {
    const p = profile({ tier: 'pro', trial_ends_at: '2020-01-01T00:00:00Z' });
    expect(resolveEffectiveTier(p, NOW, true)).toBe('pro');
  });

  it('is pro for everyone when the paid tier is switched off, regardless of profile state', () => {
    expect(resolveEffectiveTier(null, NOW, false)).toBe('pro');
    expect(resolveEffectiveTier(profile(), NOW, false)).toBe('pro');
    expect(resolveEffectiveTier(profile({ tier: 'trial', trial_ends_at: '2020-01-01T00:00:00Z' }), NOW, false)).toBe('pro');
  });

  it('defaults to the PAID_TIER_ENABLED config flag when no override is passed (currently off)', () => {
    expect(resolveEffectiveTier(profile(), NOW)).toBe('pro');
  });
});

describe('isUnlimitedTier', () => {
  it('is true for trial and pro, false for free', () => {
    expect(isUnlimitedTier('trial')).toBe(true);
    expect(isUnlimitedTier('pro')).toBe(true);
    expect(isUnlimitedTier('free')).toBe(false);
  });
});

describe('hasFeatureAccess', () => {
  it('grants a pro-gated feature to trial and pro tiers', () => {
    expect(hasFeatureAccess('bankStatementImport', 'trial')).toBe(true);
    expect(hasFeatureAccess('bankStatementImport', 'pro')).toBe(true);
  });

  it('denies a pro-gated feature to the free tier', () => {
    expect(hasFeatureAccess('bankStatementImport', 'free')).toBe(false);
  });

  it('grants a free-gated feature to every tier', () => {
    expect(hasFeatureAccess('recurringTransactions', 'free')).toBe(true);
  });
});

describe('getTrialDaysRemaining', () => {
  it('counts down the days left in an active trial', () => {
    const p = profile({ tier: 'trial', trial_ends_at: '2026-08-19T00:00:00Z' });
    expect(getTrialDaysRemaining(p, NOW, true)).toBe(3);
  });

  it('is null for a free-tier user (never started a trial)', () => {
    expect(getTrialDaysRemaining(profile(), NOW, true)).toBeNull();
  });

  it('is null once the trial has expired', () => {
    const p = profile({ tier: 'trial', trial_ends_at: '2026-08-01T00:00:00Z' });
    expect(getTrialDaysRemaining(p, NOW, true)).toBeNull();
  });

  it('is null for a pro user — no countdown once purchased', () => {
    expect(getTrialDaysRemaining(profile({ tier: 'pro' }), NOW, true)).toBeNull();
  });

  it('is null when the paid tier is switched off — resolves to pro, not trial', () => {
    const p = profile({ tier: 'trial', trial_ends_at: '2026-08-19T00:00:00Z' });
    expect(getTrialDaysRemaining(p, NOW, false)).toBeNull();
  });
});

describe('hasUsedTrial', () => {
  it('is true once a trial has ever been started, even after it expires', () => {
    expect(hasUsedTrial(profile({ trial_started_at: '2020-01-01T00:00:00Z' }))).toBe(true);
  });

  it('is false for a profile that never started one', () => {
    expect(hasUsedTrial(profile())).toBe(false);
    expect(hasUsedTrial(null)).toBe(false);
  });
});

describe('isWithinLimit / canAddAsset / canAddSnapshotThisMonth', () => {
  it('enforces the limit on the free tier', () => {
    expect(isWithinLimit(5, 10, 'free')).toBe(true);
    expect(isWithinLimit(10, 10, 'free')).toBe(false);
  });

  it('ignores the limit entirely for trial/pro', () => {
    expect(isWithinLimit(9999, 10, 'trial')).toBe(true);
    expect(isWithinLimit(9999, 10, 'pro')).toBe(true);
  });

  it('treats a null limit as unlimited even on free', () => {
    expect(isWithinLimit(9999, null, 'free')).toBe(true);
  });

  it('canAddAsset reflects the configured free-tier asset cap', () => {
    expect(canAddAsset(24, 'free')).toBe(true);
    expect(canAddAsset(25, 'free')).toBe(false);
    expect(canAddAsset(999, 'pro')).toBe(true);
  });

  it('canAddSnapshotThisMonth reflects the configured monthly cap', () => {
    expect(canAddSnapshotThisMonth(1, 'free')).toBe(true);
    expect(canAddSnapshotThisMonth(2, 'free')).toBe(false);
    expect(canAddSnapshotThisMonth(50, 'trial')).toBe(true);
  });
});

describe('isReportEnabled', () => {
  it('is true for any slug when ALL_REPORTS_ENABLED is on (current config)', () => {
    expect(isReportEnabled('net-worth')).toBe(true);
    expect(isReportEnabled('anything-not-in-the-list')).toBe(true);
  });
});

describe('startTrial / purchaseLifetime', () => {
  it('starts a trial ending PRICING.trial.days from now', () => {
    const result = startTrial(NOW);
    expect(result.tier).toBe('trial');
    expect(result.trial_started_at).toBe(NOW.toISOString());
    expect(new Date(result.trial_ends_at).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('marks a lifetime purchase as pro, permanently', () => {
    const result = purchaseLifetime(NOW);
    expect(result.tier).toBe('pro');
    expect(result.lifetime_purchased_at).toBe(NOW.toISOString());
  });
});
