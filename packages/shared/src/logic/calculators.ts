/** Pure math behind the Financial Calculator Suite — no data fetching, so every formula here is a plain, independently testable function. */

/** FV = P × [((1+r)^n - 1) / r] × (1+r), r = monthly rate, n = months. Falls back to simple multiplication at 0% so a free-of-interest SIP doesn't divide by zero. */
export function calculateSipFutureValue(monthlyAmount: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

/** FV = P × (1 + r)^n, r = annual rate, n = years. */
export function calculateLumpsumFutureValue(amount: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100;
  return amount * Math.pow(1 + r, years);
}

export interface PnLResult {
  totalPnl: number;
  pctReturn: number;
  breakEvenPrice: number;
}

/** No fees/tax modeled — breakEvenPrice is simply the buy price, returned explicitly rather than left for the caller to notice that themselves. */
export function calculatePnL(buyPrice: number, qty: number, currentPrice: number): PnLResult {
  const totalPnl = (currentPrice - buyPrice) * qty;
  const pctReturn = buyPrice !== 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;
  return { totalPnl, pctReturn, breakEvenPrice: buyPrice };
}
