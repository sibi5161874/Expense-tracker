/**
 * Calculate days left for fixed deposit
 * Business rule from DATA_MODEL.md section 6
 */
export function calculateDaysLeft(maturityDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maturity = new Date(maturityDate);
  maturity.setHours(0, 0, 0, 0);
  
  const diffTime = maturity.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Calculate fixed deposit status
 * Business rule from DATA_MODEL.md section 6
 */
export type FixedDepositStatus = 'Withdrawn' | 'Matured' | 'Maturing Soon' | 'Active';

export function calculateFixedDepositStatus(
  maturityDate: string,
  withdrawn: boolean
): FixedDepositStatus {
  if (withdrawn) {
    return 'Withdrawn';
  }
  
  const daysLeft = calculateDaysLeft(maturityDate);
  
  if (daysLeft === 0) {
    return 'Matured';
  }
  
  if (daysLeft < 30) {
    return 'Maturing Soon';
  }
  
  return 'Active';
}

/**
 * Calculate gold current value and P&L
 * Business rule from DATA_MODEL.md section 6
 */
export interface GoldMetrics {
  currentValue: number;
  pnl: number;
}

export function calculateGoldMetrics(
  grams: number,
  ratePerGram: number,
  purchaseValue: number
): GoldMetrics {
  const currentValue = grams * ratePerGram;
  const pnl = currentValue - purchaseValue;
  
  return {
    currentValue,
    pnl,
  };
}
