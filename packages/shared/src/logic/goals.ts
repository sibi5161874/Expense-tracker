/**
 * Calculate goal progress percentage
 * Business rule from DATA_MODEL.md section 4
 */
export function calculateProgressPct(savedAmount: number, targetAmount: number): number {
  if (targetAmount === 0) return 0;
  return savedAmount / targetAmount;
}

/**
 * Calculate required monthly SIP to reach goal
 * Business rule from DATA_MODEL.md section 4
 */
export function calculateSipNeededPerMonth(
  targetAmount: number,
  savedAmount: number,
  targetDate: string
): number {
  const today = new Date();
  const target = new Date(targetDate);
  
  const monthsRemaining = Math.max(1, (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const remaining = targetAmount - savedAmount;
  
  return Math.max(0, remaining / monthsRemaining);
}

/**
 * Calculate goal status
 * Business rule from DATA_MODEL.md section 4
 */
export type GoalStatus = 'Achieved' | 'Overdue' | 'On Track' | 'Behind';

export function calculateGoalStatus(
  savedAmount: number,
  targetAmount: number,
  targetDate: string
): GoalStatus {
  const today = new Date();
  const target = new Date(targetDate);
  const progressPct = calculateProgressPct(savedAmount, targetAmount);
  
  if (savedAmount >= targetAmount) {
    return 'Achieved';
  }
  
  if (today > target) {
    return 'Overdue';
  }
  
  if (progressPct >= 0.75) {
    return 'On Track';
  }
  
  return 'Behind';
}
