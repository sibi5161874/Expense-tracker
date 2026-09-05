/**
 * Standalone weighted-average-cost math for the Stock Averaging calculator — deliberately
 * separate from calculateAvgBuyPrice in investment.ts, which does the same Σ(qty×price)/Σqty
 * arithmetic but over real BUY/SIP investment_log rows (skipping SELL/BONUS/SPLIT). This one
 * takes bare qty/price pairs with no transaction semantics, for a "what would my average be
 * if I bought X more at Y" what-if tool that has no investment_log rows to read at all.
 */
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
