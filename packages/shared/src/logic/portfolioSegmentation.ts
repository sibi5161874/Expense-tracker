/**
 * ============================================================================
 * PORTFOLIO ASSET-CLASS SEGMENTATION LOGIC
 * ============================================================================
 * Groups portfolio holdings by asset class (Stock, Mutual Fund, ETF, Gold, etc.)
 * and computes aggregated financial metrics per asset segment:
 * - Total Invested (Cost basis)
 * - Total Current Value
 * - Total Unrealized P&L
 * - Average Return % (weighted by current market value of each holding)
 *
 * This provides high-level visibility into which asset classes are driving or
 * dragging overall portfolio performance.
 * ============================================================================
 */

import type { SymbolHolding } from './investment';
import type { HoldingSegment } from '../types/portfolio.types';

/**
 * Segments an array of symbol holdings by asset class and computes aggregated
 * metrics for each segment.
 *
 * @param holdings - Array of per-symbol holdings from groupInvestmentsBySymbol()
 * @returns Array of HoldingSegment with aggregates and weighted average returns
 */
export function segmentHoldingsByAssetClass(holdings: SymbolHolding[]): HoldingSegment[] {
  if (!holdings || holdings.length === 0) {
    return [];
  }

  const segmentMap = new Map<string, SymbolHolding[]>();

  for (const holding of holdings) {
    const rawType = holding.assetType || 'Other';
    const normalizedType = rawType.trim() || 'Other';
    const list = segmentMap.get(normalizedType) ?? [];
    list.push(holding);
    segmentMap.set(normalizedType, list);
  }

  const segments: HoldingSegment[] = [];

  for (const [assetType, segmentHoldings] of segmentMap) {
    const totalInvested = segmentHoldings.reduce((sum, h) => sum + h.invested, 0);
    const totalCurrent = segmentHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalPnl = segmentHoldings.reduce((sum, h) => sum + h.unrealisedPnl, 0);

    // Weighted average return % by current market value: sum(returnPct * currentValue) / totalCurrent
    // If totalCurrent is 0, fall back to totalPnl / totalInvested if invested > 0, otherwise 0
    let avgReturnPct = 0;
    if (totalCurrent > 0) {
      avgReturnPct =
        segmentHoldings.reduce((sum, h) => sum + h.returnPct * h.currentValue, 0) / totalCurrent;
    } else if (totalInvested > 0) {
      avgReturnPct = totalPnl / totalInvested;
    }

    segments.push({
      assetType,
      holdings: segmentHoldings,
      totalInvested,
      totalCurrent,
      totalPnl,
      avgReturnPct,
    });
  }

  return segments;
}
