import { useMemo } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInsurancePolicies } from '@/hooks/useInsurancePolicies';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useGoals } from '@/hooks/useGoals';
import { useMonthlyTrend } from '@/hooks/useMonthlyTrend';
import {
  calculateAge,
  calculateFinancialEssentialsCheck,
  calculateEssentialsScore,
  resolveAverageMonthlyExpense,
  type FinancialEssentialItem,
} from '@repo/shared/logic';

/** Composes profile + insurance + net worth + goals + trend into the 3-item checklist (DATA_MODEL.md §11). */
export function useFinancialEssentials() {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: policies, isLoading: policiesLoading } = useInsurancePolicies();
  const { data: netWorth, isLoading: netWorthLoading } = useNetWorth();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: trend, isLoading: trendLoading } = useMonthlyTrend(6);

  const isLoading = profileLoading || policiesLoading || netWorthLoading || goalsLoading || trendLoading;

  const items: FinancialEssentialItem[] = useMemo(() => {
    const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;
    const annualIncome = profile?.monthly_income ? profile.monthly_income * 12 : null;
    const numberOfDependents = profile?.number_of_dependents ?? 0;

    const termCoverage = (policies ?? [])
      .filter((p) => p.policy_type === 'Term')
      .reduce((sum, p) => sum + p.coverage_amount, 0);
    const healthCoverage = (policies ?? [])
      .filter((p) => p.policy_type === 'Health')
      .reduce((sum, p) => sum + p.coverage_amount, 0);

    const emergencyGoal = (goals ?? []).find((g) => g.goal_name.toLowerCase().includes('emergency fund'));

    const averageMonthlyExpense = resolveAverageMonthlyExpense({
      profileMonthlyExpense: profile?.monthly_expense ?? null,
      trailingMonthlyExpenses: (trend ?? []).map((t) => t.expense).filter((e) => e > 0),
    });

    return calculateFinancialEssentialsCheck({
      age,
      annualIncome,
      numberOfDependents,
      outstandingLiabilities: netWorth?.liabilitiesTotal ?? 0,
      netWorth: netWorth?.netWorth ?? 0,
      termCoverage,
      healthCoverage,
      emergencyFundSaved: emergencyGoal?.saved_amount ?? 0,
      averageMonthlyExpense,
    });
  }, [profile, policies, netWorth, goals, trend]);

  const hasProfileData = !!profile?.date_of_birth && !!profile?.monthly_income;
  const score = useMemo(() => calculateEssentialsScore(items), [items]);

  return { items, isLoading, hasProfileData, profile, score };
}
