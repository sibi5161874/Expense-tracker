import { describe, expect, it } from 'vitest';
import {
  calculateAge,
  calculateTermCoverAgeMultiplier,
  calculateRecommendedTermCover,
  calculateHealthCoverBaseByAge,
  calculateRecommendedHealthCover,
  calculateEmergencyFundTarget,
  resolveAverageMonthlyExpense,
  calculatePremiumStatus,
  calculateFinancialEssentialsCheck,
  calculateEssentialsScore,
  type FinancialEssentialItem,
} from './financialEssentials';

describe('calculateAge', () => {
  it('computes age before this year\'s birthday has occurred', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() - 30);
    future.setDate(future.getDate() + 5); // birthday hasn't happened yet this year
    expect(calculateAge(future.toISOString().slice(0, 10))).toBe(29);
  });
});

describe('calculateTermCoverAgeMultiplier', () => {
  it('tapers the multiplier down as age increases', () => {
    expect(calculateTermCoverAgeMultiplier(25)).toBe(20);
    expect(calculateTermCoverAgeMultiplier(35)).toBe(15);
    expect(calculateTermCoverAgeMultiplier(45)).toBe(10);
    expect(calculateTermCoverAgeMultiplier(55)).toBe(5);
    expect(calculateTermCoverAgeMultiplier(65)).toBe(2);
  });
});

describe('calculateRecommendedTermCover', () => {
  it('applies the age multiplier, adds liabilities, subtracts net worth', () => {
    const result = calculateRecommendedTermCover({
      annualIncome: 1_000_000,
      age: 25,
      outstandingLiabilities: 500_000,
      netWorth: 2_000_000,
    });
    expect(result).toBe(1_000_000 * 20 + 500_000 - 2_000_000);
  });

  it('floors at 0 when existing net worth already exceeds the raw recommendation', () => {
    const result = calculateRecommendedTermCover({
      annualIncome: 100_000,
      age: 65,
      outstandingLiabilities: 0,
      netWorth: 10_000_000,
    });
    expect(result).toBe(0);
  });
});

describe('calculateHealthCoverBaseByAge / calculateRecommendedHealthCover', () => {
  it('bands the base by age', () => {
    expect(calculateHealthCoverBaseByAge(25)).toBe(500_000);
    expect(calculateHealthCoverBaseByAge(40)).toBe(1_000_000);
    expect(calculateHealthCoverBaseByAge(50)).toBe(1_500_000);
    expect(calculateHealthCoverBaseByAge(70)).toBe(2_000_000);
  });

  it('adds 5L per dependent on top of the age band', () => {
    expect(calculateRecommendedHealthCover(25, 3)).toBe(500_000 + 3 * 500_000);
  });
});

describe('calculateEmergencyFundTarget', () => {
  it('is 6x average monthly expense', () => {
    expect(calculateEmergencyFundTarget(50_000)).toBe(300_000);
  });
});

describe('resolveAverageMonthlyExpense', () => {
  it('uses the computed average once there are 3+ months of real data', () => {
    const result = resolveAverageMonthlyExpense({
      profileMonthlyExpense: 10_000,
      trailingMonthlyExpenses: [30_000, 40_000, 50_000],
    });
    expect(result).toBe(40_000);
  });

  it('falls back to the profile estimate with under 3 months of data', () => {
    const result = resolveAverageMonthlyExpense({
      profileMonthlyExpense: 25_000,
      trailingMonthlyExpenses: [30_000],
    });
    expect(result).toBe(25_000);
  });

  it('falls back to 0 when neither is available', () => {
    const result = resolveAverageMonthlyExpense({ profileMonthlyExpense: null, trailingMonthlyExpenses: [] });
    expect(result).toBe(0);
  });
});

describe('calculatePremiumStatus', () => {
  it('is Overdue for a past due date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(calculatePremiumStatus(past.toISOString().slice(0, 10))).toBe('Overdue');
  });

  it('is Due Soon within 30 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    expect(calculatePremiumStatus(soon.toISOString().slice(0, 10))).toBe('Due Soon');
  });

  it('is Upcoming beyond 30 days', () => {
    const later = new Date();
    later.setDate(later.getDate() + 90);
    expect(calculatePremiumStatus(later.toISOString().slice(0, 10))).toBe('Upcoming');
  });
});

describe('calculateFinancialEssentialsCheck', () => {
  it('omits term/health items when age is unknown', () => {
    const items = calculateFinancialEssentialsCheck({
      age: null,
      annualIncome: null,
      numberOfDependents: 0,
      outstandingLiabilities: 0,
      netWorth: 0,
      termCoverage: 0,
      healthCoverage: 0,
      emergencyFundSaved: 0,
      averageMonthlyExpense: 20_000,
    });
    expect(items.map((i) => i.key)).toEqual(['emergencyFund']);
  });

  it('returns all 3 items with correct adequacy flags when profile is complete', () => {
    const items = calculateFinancialEssentialsCheck({
      age: 30,
      annualIncome: 1_200_000,
      numberOfDependents: 1,
      outstandingLiabilities: 0,
      netWorth: 0,
      termCoverage: 20_000_000,
      healthCoverage: 2_000_000,
      emergencyFundSaved: 300_000,
      averageMonthlyExpense: 50_000,
    });
    expect(items).toHaveLength(3);
    expect(items.find((i) => i.key === 'term')?.adequate).toBe(true);
    expect(items.find((i) => i.key === 'health')?.adequate).toBe(true);
    expect(items.find((i) => i.key === 'emergencyFund')?.adequate).toBe(true);
  });
});

describe('calculateEssentialsScore', () => {
  function item(adequate: boolean): FinancialEssentialItem {
    return { key: 'emergencyFund', label: 'Emergency Fund', adequate, current: 0, recommended: 0 };
  }

  it('is 10 when every applicable item is adequate', () => {
    expect(calculateEssentialsScore([item(true), item(true), item(true)])).toBe(10);
  });

  it('is 0 when no applicable item is adequate', () => {
    expect(calculateEssentialsScore([item(false), item(false)])).toBe(0);
  });

  it('scales proportionally and rounds to 1 decimal for a partial mix', () => {
    expect(calculateEssentialsScore([item(true), item(false), item(false)])).toBe(3.3);
  });

  it('returns null when there are no applicable items to score', () => {
    expect(calculateEssentialsScore([])).toBeNull();
  });
});
