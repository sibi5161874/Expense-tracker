import type { SymbolHolding } from './investment';

export interface UnrealizedLossSummary {
  totalLoss: number;
  /** Losing positions only, worst first — sliced to `limit`. */
  topLosers: SymbolHolding[];
}

/** Total unrealized loss across every holding currently underwater, plus its worst offenders — the data behind the Tax-Loss Harvesting card. Gains are ignored entirely, not netted against losses: this card is specifically about loss-harvesting opportunity, not overall P&L (that's the portfolio summary's job). */
export function calculateUnrealizedLosses(holdings: SymbolHolding[], limit = 5): UnrealizedLossSummary {
  const losers = holdings.filter((h) => h.unrealisedPnl < 0).sort((a, b) => a.unrealisedPnl - b.unrealisedPnl);
  const totalLoss = losers.reduce((sum, h) => sum + Math.abs(h.unrealisedPnl), 0);
  return { totalLoss, topLosers: losers.slice(0, limit) };
}

/**
 * Estimates potential tax savings from harvesting unrealized capital losses.
 * Assumes a 15% Short-Term Capital Gains (STCG) tax offset rate per Indian tax rules (Section 111A).
 * In practice, unrealized losses can be realized before financial year end to offset taxable capital gains.
 *
 * @param totalUnrealizedLoss - Absolute positive number representing total unrealized loss
 * @returns Estimated tax savings rounded to 2 decimal places (or 0 if loss <= 0)
 */
export function estimateTaxSavings(totalUnrealizedLoss: number): number {
  if (totalUnrealizedLoss <= 0) return 0;
  return Math.round(totalUnrealizedLoss * 0.15 * 100) / 100;
}
