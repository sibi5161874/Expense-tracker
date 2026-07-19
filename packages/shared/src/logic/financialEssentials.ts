/**
 * Financial Essentials Check — DATA_MODEL.md §11. Directional, simplified estimates,
 * not licensed financial advice; the UI says so next to the numbers.
 */

/** Age as of today, from a stored date_of_birth. */
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/** Income-replacement multiplier — more years of income to replace when younger. */
export function calculateTermCoverAgeMultiplier(age: number): number {
  if (age < 30) return 20;
  if (age < 40) return 15;
  if (age < 50) return 10;
  if (age < 60) return 5;
  return 2;
}

/**
 * Simplified Human Life Value method: income-replacement multiplier, plus what you
 * owe, minus what you already have. Floored at 0 — never recommends negative cover.
 */
export function calculateRecommendedTermCover(params: {
  annualIncome: number;
  age: number;
  outstandingLiabilities: number;
  netWorth: number;
}): number {
  const multiplier = calculateTermCoverAgeMultiplier(params.age);
  const recommended = params.annualIncome * multiplier + params.outstandingLiabilities - params.netWorth;
  return Math.max(0, recommended);
}

/** Base health cover by age band — healthcare cost risk rises with age. */
export function calculateHealthCoverBaseByAge(age: number): number {
  if (age < 30) return 500_000;
  if (age < 45) return 1_000_000;
  if (age < 60) return 1_500_000;
  return 2_000_000;
}

const HEALTH_COVER_PER_DEPENDENT = 500_000;

export function calculateRecommendedHealthCover(age: number, numberOfDependents: number): number {
  return calculateHealthCoverBaseByAge(age) + numberOfDependents * HEALTH_COVER_PER_DEPENDENT;
}

/** 6 months of expense is the standard emergency-fund benchmark. */
export function calculateEmergencyFundTarget(averageMonthlyExpense: number): number {
  return 6 * averageMonthlyExpense;
}

/**
 * Resolves the average monthly expense to use: the user's self-reported estimate
 * until there's enough real transaction history to trust instead (DATA_MODEL.md §10).
 */
export function resolveAverageMonthlyExpense(params: {
  profileMonthlyExpense: number | null;
  trailingMonthlyExpenses: number[];
}): number {
  if (params.trailingMonthlyExpenses.length >= 3) {
    const sum = params.trailingMonthlyExpenses.reduce((a, b) => a + b, 0);
    return sum / params.trailingMonthlyExpenses.length;
  }
  return params.profileMonthlyExpense ?? 0;
}

/** A premium due date is a recurring reminder, not a maturity event — different labels from assets' status. */
export type PremiumStatus = 'Overdue' | 'Due Soon' | 'Upcoming';

export function calculatePremiumStatus(premiumDueDate: string): PremiumStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(premiumDueDate);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'Overdue';
  if (daysUntilDue < 30) return 'Due Soon';
  return 'Upcoming';
}

export function calculateDaysUntilDue(premiumDueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(premiumDueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export interface FinancialEssentialItem {
  key: 'term' | 'health' | 'emergencyFund';
  label: string;
  adequate: boolean;
  current: number;
  recommended: number;
}

/**
 * The 3-item checklist. Returns null for an item when there isn't enough profile
 * data to make a recommendation (e.g. no date_of_birth yet) rather than guessing.
 */
export function calculateFinancialEssentialsCheck(params: {
  age: number | null;
  annualIncome: number | null;
  numberOfDependents: number;
  outstandingLiabilities: number;
  netWorth: number;
  termCoverage: number;
  healthCoverage: number;
  emergencyFundSaved: number;
  averageMonthlyExpense: number;
}): FinancialEssentialItem[] {
  const items: FinancialEssentialItem[] = [];

  if (params.age !== null && params.annualIncome !== null) {
    const recommended = calculateRecommendedTermCover({
      annualIncome: params.annualIncome,
      age: params.age,
      outstandingLiabilities: params.outstandingLiabilities,
      netWorth: params.netWorth,
    });
    items.push({
      key: 'term',
      label: 'Term Insurance',
      adequate: params.termCoverage >= recommended,
      current: params.termCoverage,
      recommended,
    });
  }

  if (params.age !== null) {
    const recommended = calculateRecommendedHealthCover(params.age, params.numberOfDependents);
    items.push({
      key: 'health',
      label: 'Health Insurance',
      adequate: params.healthCoverage >= recommended,
      current: params.healthCoverage,
      recommended,
    });
  }

  const emergencyTarget = calculateEmergencyFundTarget(params.averageMonthlyExpense);
  items.push({
    key: 'emergencyFund',
    label: 'Emergency Fund',
    adequate: params.emergencyFundSaved >= emergencyTarget,
    current: params.emergencyFundSaved,
    recommended: emergencyTarget,
  });

  return items;
}
