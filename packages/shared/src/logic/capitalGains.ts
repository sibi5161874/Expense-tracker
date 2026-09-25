/**
 * Indian Capital Gains (STCG / LTCG) Calculation Engine
 * Implements FIFO matching on investment_log entries (BUY / SIP / SELL)
 * with holding period classification and Indian Financial Year grouping.
 */

export type CapitalGainsTaxType = 'STCG' | 'LTCG';

export interface InvestmentLogLike {
  date: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  fees?: number;
  asset_type?: string;
}

export interface MatchedTrade {
  symbol: string;
  assetType: string;
  buyDate: string;
  sellDate: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  buyCost: number;
  sellProceeds: number;
  gain: number;
  gainPct: number;
  holdingDays: number;
  taxType: CapitalGainsTaxType;
  financialYear: string;
}

export interface CapitalGainsSummary {
  financialYear: string;
  totalSellProceeds: number;
  totalCostBasis: number;
  stcgGains: number;
  stcgLosses: number;
  netStcg: number;
  ltcgGains: number;
  ltcgLosses: number;
  netLtcg: number;
  totalNetGains: number;
  trades: MatchedTrade[];
}

export interface CapitalGainsReportResult {
  summariesByFY: Record<string, CapitalGainsSummary>;
  allTrades: MatchedTrade[];
  availableFYs: string[];
}

/**
 * Returns the Indian Financial Year string for a given date (YYYY-MM-DD).
 * e.g., '2024-05-15' -> 'FY 2024-25', '2025-02-10' -> 'FY 2024-25'
 */
export function getFinancialYear(dateStr: string): string {
  const parts = dateStr.slice(0, 10).split('-');
  const year = parseInt(parts[0] ?? '2000', 10);
  const month = parseInt(parts[1] ?? '1', 10);

  if (month >= 4) {
    const nextYearShort = String((year + 1) % 100).padStart(2, '0');
    return `FY ${year}-${nextYearShort}`;
  } else {
    const yearShort = String(year % 100).padStart(2, '0');
    return `FY ${year - 1}-${yearShort}`;
  }
}

/**
 * Calculates holding period in days between buy date and sell date.
 */
export function calculateHoldingDays(buyDateStr: string, sellDateStr: string): number {
  const buy = new Date(buyDateStr.slice(0, 10)).getTime();
  const sell = new Date(sellDateStr.slice(0, 10)).getTime();
  const diffMs = sell - buy;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Classifies holding as STCG vs LTCG based on Indian Tax regulations.
 * Equity (Stocks, ETFs, Equity MFs): <= 365 days = STCG, > 365 days = LTCG
 * Debt / Other: <= 1095 days (36 months) = STCG, > 1095 days = LTCG
 */
export function classifyTaxType(assetType: string | undefined, holdingDays: number): CapitalGainsTaxType {
  const isEquity = !assetType || ['Stock', 'ETF', 'Mutual Fund', 'Crypto'].includes(assetType);
  const thresholdDays = isEquity ? 365 : 1095;
  return holdingDays > thresholdDays ? 'LTCG' : 'STCG';
}

interface BuyLot {
  date: string;
  quantityRemaining: number;
  originalQuantity: number;
  price: number;
  fees: number;
  assetType: string;
}

/**
 * Computes FIFO matched realized capital gains across all investment transactions.
 */
export function computeCapitalGains(logs: InvestmentLogLike[]): CapitalGainsReportResult {
  // Sort chronologically ascending
  const sorted = [...logs].sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    // Process BUYs before SELLs if on the exact same date
    if ((a.action === 'BUY' || a.action === 'SIP') && b.action === 'SELL') return -1;
    if (a.action === 'SELL' && (b.action === 'BUY' || b.action === 'SIP')) return 1;
    return 0;
  });

  const buyLotsBySymbol = new Map<string, BuyLot[]>();
  const allTrades: MatchedTrade[] = [];

  for (const entry of sorted) {
    const sym = entry.symbol.toUpperCase().trim();
    const action = entry.action.toUpperCase();

    if (action === 'BUY' || action === 'SIP') {
      const lots = buyLotsBySymbol.get(sym) ?? [];
      lots.push({
        date: entry.date,
        quantityRemaining: entry.quantity,
        originalQuantity: entry.quantity,
        price: entry.price,
        fees: entry.fees ?? 0,
        assetType: entry.asset_type ?? 'Stock',
      });
      buyLotsBySymbol.set(sym, lots);
    } else if (action === 'SELL') {
      let sellQtyToMatch = entry.quantity;
      const lots = buyLotsBySymbol.get(sym) ?? [];
      const totalSellFees = entry.fees ?? 0;

      while (sellQtyToMatch > 0 && lots.length > 0) {
        const oldestLot = lots[0];
        if (!oldestLot) break;
        const matchQty = Math.min(sellQtyToMatch, oldestLot.quantityRemaining);

        // Allocate buy fee pro-rata
        const allocatedBuyFee =
          oldestLot.originalQuantity > 0 ? (matchQty / oldestLot.originalQuantity) * oldestLot.fees : 0;

        // Allocate sell fee pro-rata
        const allocatedSellFee = entry.quantity > 0 ? (matchQty / entry.quantity) * totalSellFees : 0;

        const buyCost = matchQty * oldestLot.price + allocatedBuyFee;
        const sellProceeds = matchQty * entry.price - allocatedSellFee;
        const gain = sellProceeds - buyCost;
        const gainPct = buyCost > 0 ? (gain / buyCost) * 100 : 0;

        const holdingDays = calculateHoldingDays(oldestLot.date, entry.date);
        const taxType = classifyTaxType(entry.asset_type ?? oldestLot.assetType, holdingDays);
        const fy = getFinancialYear(entry.date);

        allTrades.push({
          symbol: sym,
          assetType: entry.asset_type ?? oldestLot.assetType,
          buyDate: oldestLot.date,
          sellDate: entry.date,
          quantity: matchQty,
          buyPrice: oldestLot.price,
          sellPrice: entry.price,
          buyCost: Math.round(buyCost * 100) / 100,
          sellProceeds: Math.round(sellProceeds * 100) / 100,
          gain: Math.round(gain * 100) / 100,
          gainPct: Math.round(gainPct * 100) / 100,
          holdingDays,
          taxType,
          financialYear: fy,
        });

        oldestLot.quantityRemaining -= matchQty;
        sellQtyToMatch -= matchQty;

        if (oldestLot.quantityRemaining <= 0.00000001) {
          lots.shift();
        }
      }
    }
  }

  // Group by Financial Year
  const summariesByFY: Record<string, CapitalGainsSummary> = {};

  for (const trade of allTrades) {
    const fy = trade.financialYear;
    if (!summariesByFY[fy]) {
      summariesByFY[fy] = {
        financialYear: fy,
        totalSellProceeds: 0,
        totalCostBasis: 0,
        stcgGains: 0,
        stcgLosses: 0,
        netStcg: 0,
        ltcgGains: 0,
        ltcgLosses: 0,
        netLtcg: 0,
        totalNetGains: 0,
        trades: [],
      };
    }

    const s = summariesByFY[fy];
    s.trades.push(trade);
    s.totalSellProceeds += trade.sellProceeds;
    s.totalCostBasis += trade.buyCost;

    if (trade.taxType === 'STCG') {
      if (trade.gain >= 0) {
        s.stcgGains += trade.gain;
      } else {
        s.stcgLosses += Math.abs(trade.gain);
      }
    } else {
      if (trade.gain >= 0) {
        s.ltcgGains += trade.gain;
      } else {
        s.ltcgLosses += Math.abs(trade.gain);
      }
    }
  }

  const availableFYs = Object.keys(summariesByFY).sort().reverse();

  for (const fy of availableFYs) {
    const s = summariesByFY[fy];
    if (!s) continue;
    s.netStcg = Math.round((s.stcgGains - s.stcgLosses) * 100) / 100;
    s.netLtcg = Math.round((s.ltcgGains - s.ltcgLosses) * 100) / 100;
    s.totalNetGains = Math.round((s.netStcg + s.netLtcg) * 100) / 100;
    s.totalSellProceeds = Math.round(s.totalSellProceeds * 100) / 100;
    s.totalCostBasis = Math.round(s.totalCostBasis * 100) / 100;
    s.stcgGains = Math.round(s.stcgGains * 100) / 100;
    s.stcgLosses = Math.round(s.stcgLosses * 100) / 100;
    s.ltcgGains = Math.round(s.ltcgGains * 100) / 100;
    s.ltcgLosses = Math.round(s.ltcgLosses * 100) / 100;
  }

  return {
    summariesByFY,
    allTrades,
    availableFYs,
  };
}
