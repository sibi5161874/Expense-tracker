/**
 * Calculate total cashflow for an investment log entry
 * Business rule from DATA_MODEL.md section 2
 */
export function calculateTotalCashflow(
  action: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT',
  quantity: number,
  price: number,
  fees: number
): number {
  if (action === 'BONUS' || action === 'SPLIT') {
    return 0;
  }
  
  if (action === 'SELL') {
    return quantity * price - fees;
  }
  
  if (action === 'DIVIDEND') {
    return price; // price field holds dividend amount
  }
  
  // BUY or SIP
  return -(quantity * price + fees);
}

/**
 * Calculate units held for a symbol from investment log entries
 * Business rule from DATA_MODEL.md section 3
 */
export function calculateUnitsHeld(entries: Array<{
  action: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
  quantity: number;
}>): number {
  let units = 0;
  
  for (const entry of entries) {
    if (entry.action === 'BUY' || entry.action === 'SIP' || entry.action === 'BONUS' || entry.action === 'SPLIT') {
      units += entry.quantity;
    } else if (entry.action === 'SELL') {
      units -= entry.quantity;
    }
    // DIVIDEND doesn't affect units
  }
  
  return units;
}

/**
 * Calculate average buy price (weighted average of BUY/SIP, excluding BONUS/SPLIT)
 * Business rule from DATA_MODEL.md section 3
 */
export function calculateAvgBuyPrice(entries: Array<{
  action: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
  quantity: number;
  price: number;
}>): number {
  let totalCost = 0;
  let totalUnits = 0;
  
  for (const entry of entries) {
    if (entry.action === 'BUY' || entry.action === 'SIP') {
      totalCost += entry.quantity * entry.price;
      totalUnits += entry.quantity;
    }
    // BONUS/SPLIT are free units, excluded from avg cost
  }
  
  if (totalUnits === 0) return 0;
  return totalCost / totalUnits;
}

/**
 * Calculate portfolio holding metrics
 * Business rule from DATA_MODEL.md section 3
 */
export interface PortfolioHolding {
  unitsHeld: number;
  avgBuyPrice: number;
  livePrice: number;
  currentValue: number;
  unrealisedPnl: number;
  returnPct: number;
  allocationPct: number;
}

export function calculatePortfolioHolding(
  entries: Array<{
    action: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
    quantity: number;
    price: number;
  }>,
  livePrice: number,
  totalPortfolioValue: number
): PortfolioHolding {
  const unitsHeld = calculateUnitsHeld(entries);
  const avgBuyPrice = calculateAvgBuyPrice(entries);
  const currentValue = unitsHeld * livePrice;
  const costBasis = unitsHeld * avgBuyPrice;
  const unrealisedPnl = currentValue - costBasis;
  const returnPct = costBasis > 0 ? unrealisedPnl / costBasis : 0;
  const allocationPct = totalPortfolioValue > 0 ? currentValue / totalPortfolioValue : 0;
  
  return {
    unitsHeld,
    avgBuyPrice,
    livePrice,
    currentValue,
    unrealisedPnl,
    returnPct,
    allocationPct,
  };
}

/**
 * Groups investment_log entries by symbol into per-symbol holdings, per the
 * DATA_MODEL.md §3 formulas (units_held, avg_buy_price, current_value, unrealised_pnl).
 *
 * `livePriceOverrides` is the `holdings.live_price` manual/refreshed field (Stage 4,
 * refresh-prices Edge Function) — when a symbol has one, it wins. Otherwise the most
 * recent trade price stands in, same interim approximation as before Stage 4.
 */
export interface SymbolHolding {
  symbol: string;
  exchange: string;
  assetType: string;
  unitsHeld: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  invested: number;
  unrealisedPnl: number;
  returnPct: number;
  /** Count of BUY/SIP entries that fed avgBuyPrice — >1 means it's a weighted average across multiple purchases, not a single buy price. */
  lotCount: number;
  /** True only when `livePriceOverrides` actually had an entry for this symbol — false means
   * `currentPrice` fell back to the most recent trade price (or `avgBuyPrice` with no trades
   * at all), which is a real number but not a live market price. Lets the UI show "Est." for
   * a holding that has never received a live price, distinct from one that has but is now
   * stale from a failed refresh — two different situations a single price figure can't tell
   * apart on its own. */
  hasLivePrice: boolean;
}

export function groupInvestmentsBySymbol(
  investments: Array<{
    symbol: string;
    exchange: string;
    asset_type: string;
    date: string;
    action: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
    quantity: number;
    price: number;
  }>,
  livePriceOverrides: Record<string, number> = {}
): SymbolHolding[] {
  const bySymbol = new Map<string, typeof investments>();
  for (const inv of investments) {
    const list = bySymbol.get(inv.symbol) ?? [];
    list.push(inv);
    bySymbol.set(inv.symbol, list);
  }

  const holdings: SymbolHolding[] = [];
  for (const [symbol, entries] of bySymbol) {
    const unitsHeld = calculateUnitsHeld(entries);
    if (unitsHeld <= 0) continue;

    const avgBuyPrice = calculateAvgBuyPrice(entries);
    const mostRecent = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
    const hasLivePrice = livePriceOverrides[symbol] !== undefined;
    const currentPrice = livePriceOverrides[symbol] ?? mostRecent?.price ?? avgBuyPrice;
    const currentValue = unitsHeld * currentPrice;
    const invested = unitsHeld * avgBuyPrice;
    const unrealisedPnl = currentValue - invested;
    const returnPct = invested > 0 ? unrealisedPnl / invested : 0;
    const lotCount = entries.filter((e) => e.action === 'BUY' || e.action === 'SIP').length;

    holdings.push({
      symbol,
      exchange: entries[0]!.exchange,
      assetType: entries[0]!.asset_type,
      unitsHeld,
      avgBuyPrice,
      currentPrice,
      currentValue,
      invested,
      unrealisedPnl,
      returnPct,
      lotCount,
      hasLivePrice,
    });
  }

  return holdings;
}

/** Aggregates total invested, current value, and P&L across all holdings. */
export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  pnlPercentage: number;
}

export function calculatePortfolioSummary(
  investments: Array<{
    symbol: string;
    exchange: string;
    asset_type: string;
    date: string;
    action: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
    quantity: number;
    price: number;
  }>
): PortfolioSummary {
  return summarizeHoldings(groupInvestmentsBySymbol(investments));
}

/**
 * Aggregates totals from an already-computed holdings array — use this instead
 * of calculatePortfolioSummary when the caller also needs groupInvestmentsBySymbol's
 * output directly, so the grouping only runs once.
 */
export function summarizeHoldings(holdings: SymbolHolding[]): PortfolioSummary {
  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnl = currentValue - totalInvested;
  const pnlPercentage = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return { totalInvested, currentValue, totalPnl, pnlPercentage };
}
