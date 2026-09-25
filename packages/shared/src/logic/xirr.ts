/**
 * Extended Internal Rate of Return (XIRR) Engine
 * Uses Newton-Raphson numerical method with adaptive dampening
 * to solve for annualized returns on irregular cash flows.
 */

export interface XirrCashFlow {
  date: string;
  amount: number;
}

export interface HoldingXirrResult {
  symbol: string;
  totalInvested: number;
  totalRealized: number;
  currentValue: number;
  totalDividends: number;
  xirrPct: number | null;
  firstDate: string | null;
}

export interface PortfolioXirrReportResult {
  portfolioXirrPct: number | null;
  totalInvested: number;
  currentPortfolioValue: number;
  totalRealizedAndDividends: number;
  holdings: HoldingXirrResult[];
}

/**
 * Calculates XIRR for an array of dated cash flows.
 * Negative amount = investment / outflow from wallet (e.g., BUY, SIP, fees).
 * Positive amount = returns / inflow to wallet (e.g., SELL, DIVIDEND, terminal holding value).
 * Returns annualized return percentage (e.g., 14.25 for 14.25%) or null if impossible to compute.
 */
export function calculateXirr(
  cashFlows: XirrCashFlow[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 1e-7
): number | null {
  if (!cashFlows || cashFlows.length < 2) return null;

  // Filter zero amounts
  const validFlows = cashFlows.filter((cf) => Math.abs(cf.amount) > 0.00000001);
  if (validFlows.length < 2) return null;

  // Verify at least one positive and one negative flow
  let hasPositive = false;
  let hasNegative = false;
  for (const cf of validFlows) {
    if (cf.amount > 0) hasPositive = true;
    if (cf.amount < 0) hasNegative = true;
  }
  if (!hasPositive || !hasNegative) return null;

  // Sort ascending by date
  const sorted = [...validFlows].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  if (!first) return null;
  const t0 = new Date(first.date.slice(0, 10)).getTime();

  // Normalize time in fractional years from start
  const times: number[] = [];
  const amounts: number[] = [];

  for (const cf of sorted) {
    const t = (new Date(cf.date.slice(0, 10)).getTime() - t0) / (1000 * 60 * 60 * 24 * 365.25);
    times.push(t);
    amounts.push(cf.amount);
  }

  // All flows cannot be on day 0
  if (times[times.length - 1] === 0) return null;

  let r = guess;

  for (let i = 0; i < maxIterations; i++) {
    // Prevent (1 + r) <= 0
    if (r <= -0.99999) {
      r = -0.99;
    }

    let fValue = 0;
    let fDerivative = 0;

    for (let j = 0; j < amounts.length; j++) {
      const c = amounts[j]!;
      const t = times[j]!;
      const base = 1 + r;

      if (t === 0) {
        fValue += c;
      } else {
        const factor = Math.pow(base, -t);
        fValue += c * factor;
        fDerivative += -t * c * Math.pow(base, -t - 1);
      }
    }

    if (Math.abs(fValue) < tolerance) {
      const resultPct = Math.round(r * 10000) / 100;
      // Sanity check extreme bounds
      if (resultPct < -99.99 || resultPct > 100000) return null;
      return resultPct;
    }

    if (Math.abs(fDerivative) < 1e-12) {
      // Derivative too flat; shift rate slightly
      r += 0.05;
      continue;
    }

    const step = fValue / fDerivative;
    r = r - step;

    // Dampen extreme jumps
    if (r < -0.99) r = -0.9;
    if (r > 100) r = 10;
  }

  return null;
}

/**
 * Builds standard cash flows for an individual holding from transaction log + terminal current value.
 */
export function buildHoldingCashFlows(
  logs: Array<{ date: string; action: string; quantity: number; price: number; fees?: number }>,
  currentValue: number,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): XirrCashFlow[] {
  const flows: XirrCashFlow[] = [];

  for (const log of logs) {
    const action = log.action.toUpperCase();
    const fees = log.fees ?? 0;

    if (action === 'BUY' || action === 'SIP') {
      const totalOutflow = log.quantity * log.price + fees;
      flows.push({ date: log.date, amount: -totalOutflow });
    } else if (action === 'SELL') {
      const totalInflow = log.quantity * log.price - fees;
      flows.push({ date: log.date, amount: totalInflow });
    } else if (action === 'DIVIDEND') {
      flows.push({ date: log.date, amount: log.price > 0 ? log.price : log.quantity });
    }
  }

  if (currentValue > 0) {
    flows.push({ date: asOfDate, amount: currentValue });
  }

  return flows;
}

/**
 * Computes portfolio-wide and per-holding XIRR analysis from investment logs and holdings.
 */
export function computePortfolioXirr(
  logs: Array<{
    date: string;
    symbol: string;
    action: string;
    quantity: number;
    price: number;
    fees?: number;
  }>,
  holdings: Array<{
    symbol: string;
    current_value?: number;
    shares?: number;
    current_price?: number;
  }>,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): PortfolioXirrReportResult {
  const logsBySymbol = new Map<string, typeof logs>();
  const allPortfolioFlows: XirrCashFlow[] = [];

  let totalInvested = 0;
  let totalRealizedAndDividends = 0;
  let currentPortfolioValue = 0;

  for (const log of logs) {
    const sym = log.symbol.toUpperCase().trim();
    const list = logsBySymbol.get(sym) ?? [];
    list.push(log);
    logsBySymbol.set(sym, list);

    const action = log.action.toUpperCase();
    const fees = log.fees ?? 0;

    if (action === 'BUY' || action === 'SIP') {
      const outflow = log.quantity * log.price + fees;
      totalInvested += outflow;
      allPortfolioFlows.push({ date: log.date, amount: -outflow });
    } else if (action === 'SELL') {
      const inflow = log.quantity * log.price - fees;
      totalRealizedAndDividends += inflow;
      allPortfolioFlows.push({ date: log.date, amount: inflow });
    } else if (action === 'DIVIDEND') {
      const divAmount = log.price > 0 ? log.price : log.quantity;
      totalRealizedAndDividends += divAmount;
      allPortfolioFlows.push({ date: log.date, amount: divAmount });
    }
  }

  const holdingsValueBySymbol = new Map<string, number>();
  for (const h of holdings) {
    const sym = h.symbol.toUpperCase().trim();
    const val = h.current_value ?? (h.shares ?? 0) * (h.current_price ?? 0);
    holdingsValueBySymbol.set(sym, val);
    currentPortfolioValue += val;
  }

  if (currentPortfolioValue > 0) {
    allPortfolioFlows.push({ date: asOfDate, amount: currentPortfolioValue });
  }

  const portfolioXirrPct = calculateXirr(allPortfolioFlows);

  // Per holding analysis
  const holdingResults: HoldingXirrResult[] = [];
  const allSymbols = new Set([...logsBySymbol.keys(), ...holdingsValueBySymbol.keys()]);

  for (const sym of allSymbols) {
    const symLogs = logsBySymbol.get(sym) ?? [];
    const symVal = holdingsValueBySymbol.get(sym) ?? 0;

    let symInvested = 0;
    let symRealized = 0;
    let symDividends = 0;
    let firstDate: string | null = null;

    for (const log of symLogs) {
      if (!firstDate || log.date < firstDate) firstDate = log.date;
      const action = log.action.toUpperCase();
      const fees = log.fees ?? 0;

      if (action === 'BUY' || action === 'SIP') {
        symInvested += log.quantity * log.price + fees;
      } else if (action === 'SELL') {
        symRealized += log.quantity * log.price - fees;
      } else if (action === 'DIVIDEND') {
        symDividends += log.price > 0 ? log.price : log.quantity;
      }
    }

    const holdingFlows = buildHoldingCashFlows(symLogs, symVal, asOfDate);
    const xirrPct = calculateXirr(holdingFlows);

    holdingResults.push({
      symbol: sym,
      totalInvested: Math.round(symInvested * 100) / 100,
      totalRealized: Math.round(symRealized * 100) / 100,
      currentValue: Math.round(symVal * 100) / 100,
      totalDividends: Math.round(symDividends * 100) / 100,
      xirrPct,
      firstDate,
    });
  }

  holdingResults.sort((a, b) => (b.xirrPct ?? -999) - (a.xirrPct ?? -999));

  return {
    portfolioXirrPct,
    totalInvested: Math.round(totalInvested * 100) / 100,
    currentPortfolioValue: Math.round(currentPortfolioValue * 100) / 100,
    totalRealizedAndDividends: Math.round(totalRealizedAndDividends * 100) / 100,
    holdings: holdingResults,
  };
}
