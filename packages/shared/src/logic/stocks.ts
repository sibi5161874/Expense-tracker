/**
 * Standalone weighted-average-cost math for the Stock Averaging calculator — deliberately
 * separate from calculateAvgBuyPrice in investment.ts, which does the same Σ(qty×price)/Σqty
 * arithmetic but over real BUY/SIP investment_log rows (skipping SELL/BONUS/SPLIT). This one
 * takes bare qty/price pairs with no transaction semantics, for a "what would my average be
 * if I bought X more at Y" what-if tool that has no investment_log rows to read at all.
 */
import type { SymbolHolding } from './investment';
import type { FilterState } from '../types/portfolio.types';

export interface WacLot {
  qty: number;
  price: number;
}

export function calculateWAC(lots: WacLot[]): number {
  const totalQty = lots.reduce((sum, lot) => sum + lot.qty, 0);
  if (totalQty === 0) return 0;
  const totalCost = lots.reduce((sum, lot) => sum + lot.qty * lot.price, 0);
  return totalCost / totalQty;
}

/**
 * Pure filter and sort utility for portfolio holdings.
 * Supports filtering by asset class, profit/loss status, text search (symbol/exchange),
 * and sorting by value, invested, or return %.
 */
export function filterAndSortHoldings(
  holdings: SymbolHolding[],
  options: FilterState = {}
): SymbolHolding[] {
  if (!holdings || holdings.length === 0) return [];

  const { assetType, filter = 'all', sortBy = 'currentValue_desc', searchQuery } = options;

  let result = [...holdings];

  // 1. Filter by Asset Type (e.g. Stock, Mutual Fund, ETF, etc.)
  if (assetType && assetType.trim() !== '' && assetType.trim().toLowerCase() !== 'all') {
    const targetType = assetType.trim().toLowerCase();
    result = result.filter((h) => (h.assetType ?? '').trim().toLowerCase() === targetType);
  }

  // 2. Filter by Profit/Loss status
  if (filter === 'profit') {
    result = result.filter((h) => h.returnPct > 0 || h.unrealisedPnl > 0);
  } else if (filter === 'loss') {
    result = result.filter((h) => h.returnPct < 0 || h.unrealisedPnl < 0);
  }

  // 3. Filter by Search Query
  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.trim().toLowerCase();
    result = result.filter(
      (h) =>
        h.symbol.toLowerCase().includes(query) ||
        (h.exchange && h.exchange.toLowerCase().includes(query)) ||
        (h.assetType && h.assetType.toLowerCase().includes(query))
    );
  }

  // 4. Sort
  result.sort((a, b) => {
    switch (sortBy) {
      case 'returnPct_desc':
        return b.returnPct - a.returnPct;
      case 'returnPct_asc':
        return a.returnPct - b.returnPct;
      case 'invested_desc':
        return b.invested - a.invested;
      case 'currentValue_desc':
      default:
        return b.currentValue - a.currentValue;
    }
  });

  return result;
}
