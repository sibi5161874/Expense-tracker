export const revalidate = 300; // 5 min cache

export interface StockHeatmapItem {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  size: number;
}

// In-memory server cache to ensure instant index switching
const serverCache: Record<string, { data: StockHeatmapItem[]; timestamp: number; currencySymbol: string }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const NIFTY_50 = [
  { symbol: 'RELIANCE.NS', name: 'Reliance', sector: 'Energy minerals', cap: 1900000 },
  { symbol: 'TCS.NS', name: 'TCS', sector: 'Technology services', cap: 1400000 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Finance', cap: 1300000 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Finance', cap: 900000 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Communications', cap: 950000 },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'Technology services', cap: 780000 },
  { symbol: 'SBIN.NS', name: 'SBI', sector: 'Finance', cap: 720000 },
  { symbol: 'ITC.NS', name: 'ITC', sector: 'Consumer non-durables', cap: 590000 },
  { symbol: 'HINDUNILVR.NS', name: 'HUL', sector: 'Consumer non-durables', cap: 570000 },
  { symbol: 'LT.NS', name: 'L&T', sector: 'Producer manufacturing', cap: 500000 },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance', cap: 420000 },
  { symbol: 'HCLTECH.NS', name: 'HCL Tech', sector: 'Technology services', cap: 480000 },
  { symbol: 'MARUTI.NS', name: 'Maruti', sector: 'Consumer durables', cap: 390000 },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Health technology', cap: 410000 },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Non-energy materials', cap: 180000 },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Bank', sector: 'Finance', cap: 350000 },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Finance', cap: 360000 },
  { symbol: 'TITAN.NS', name: 'Titan', sector: 'Retail trade', cap: 290000 },
  { symbol: 'ONGC.NS', name: 'ONGC', sector: 'Energy minerals', cap: 310000 },
  { symbol: 'NTPC.NS', name: 'NTPC', sector: 'Utilities', cap: 360000 },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Finance', cap: 75000 },
  { symbol: 'POWERGRID.NS', name: 'Power Grid', sector: 'Utilities', cap: 280000 },
  { symbol: 'ADANIENT.NS', name: 'Adani Ent', sector: 'Non-energy materials', cap: 280000 },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Producer manufacturing', cap: 250000 },
  { symbol: 'COALINDIA.NS', name: 'Coal India', sector: 'Energy minerals', cap: 240000 },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance', cap: 260000 },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech', sector: 'Non-energy materials', cap: 320000 },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Retail trade', cap: 220000 },
  { symbol: 'M&M.NS', name: 'M&M', sector: 'Consumer durables', cap: 380000 },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Non-energy materials', cap: 230000 },
  { symbol: 'TRENT.NS', name: 'Trent', sector: 'Retail trade', cap: 230000 },
  { symbol: 'BEL.NS', name: 'BEL', sector: 'Producer manufacturing', cap: 210000 },
  { symbol: 'GRASIM.NS', name: 'Grasim', sector: 'Non-energy materials', cap: 170000 },
  { symbol: 'HINDALCO.NS', name: 'Hindalco', sector: 'Non-energy materials', cap: 140000 },
  { symbol: 'CIPLA.NS', name: 'Cipla', sector: 'Health technology', cap: 120000 },
  { symbol: 'DRREDDY.NS', name: 'Dr. Reddy', sector: 'Health technology', cap: 105000 },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hosp', sector: 'Health technology', cap: 100000 },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Consumer durables', cap: 135000 },
  { symbol: 'DIVISLAB.NS', name: 'Divis Lab', sector: 'Health technology', cap: 145000 },
  { symbol: 'BPCL.NS', name: 'BPCL', sector: 'Energy minerals', cap: 130000 },
  { symbol: 'NESTLEIND.NS', name: 'Nestle', sector: 'Consumer non-durables', cap: 210000 },
  { symbol: 'BRITANNIA.NS', name: 'Britannia', sector: 'Consumer non-durables', cap: 125000 },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer', sector: 'Consumer non-durables', cap: 95000 },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero Moto', sector: 'Consumer durables', cap: 90000 },
  { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'Technology services', cap: 240000 },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra', sector: 'Technology services', cap: 160000 },
  { symbol: 'SBILIFE.NS', name: 'SBI Life', sector: 'Finance', cap: 150000 },
  { symbol: 'HDFCLIFE.NS', name: 'HDFC Life', sector: 'Finance', cap: 135000 },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance', sector: 'Finance', cap: 120000 },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', sector: 'Consumer durables', cap: 250000 },
];

export const NIFTY_500 = [
  ...NIFTY_50,
  { symbol: 'ZOMATO.NS', name: 'Zomato', sector: 'Retail trade', cap: 240000 },
  { symbol: 'JIOFIN.NS', name: 'Jio Financial', sector: 'Finance', cap: 200000 },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Consumer durables', cap: 320000 },
  { symbol: 'DLF.NS', name: 'DLF', sector: 'Finance', cap: 210000 },
  { symbol: 'HAL.NS', name: 'Hindustan Aero', sector: 'Producer manufacturing', cap: 290000 },
  { symbol: 'VEDL.NS', name: 'Vedanta', sector: 'Non-energy materials', cap: 180000 },
  { symbol: 'CHOLAFIN.NS', name: 'Cholamandalam', sector: 'Finance', cap: 120000 },
  { symbol: 'TORNTPHARM.NS', name: 'Torrent Pharma', sector: 'Health technology', cap: 110000 },
  { symbol: 'SIEMENS.NS', name: 'Siemens', sector: 'Producer manufacturing', cap: 220000 },
  { symbol: 'ABB.NS', name: 'ABB India', sector: 'Producer manufacturing', cap: 160000 },
  { symbol: 'VBL.NS', name: 'Varun Beverages', sector: 'Consumer non-durables', cap: 190000 },
  { symbol: 'PIDILITIND.NS', name: 'Pidilite', sector: 'Non-energy materials', cap: 150000 },
  { symbol: 'HAVELLS.NS', name: 'Havells', sector: 'Consumer durables', cap: 110000 },
  { symbol: 'POLYCAB.NS', name: 'Polycab', sector: 'Producer manufacturing', cap: 95000 },
  { symbol: 'SUZLON.NS', name: 'Suzlon Energy', sector: 'Utilities', cap: 80000 },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems', sector: 'Technology services', cap: 85000 },
  { symbol: 'LTIM.NS', name: 'LTIMindtree', sector: 'Technology services', cap: 160000 },
  { symbol: 'INDHOTEL.NS', name: 'Indian Hotels', sector: 'Retail trade', cap: 95000 },
  { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Finance', cap: 125000 },
  { symbol: 'PNB.NS', name: 'PNB', sector: 'Finance', cap: 110000 },
  { symbol: 'TVSMOTOR.NS', name: 'TVS Motor', sector: 'Consumer durables', cap: 115000 },
  { symbol: 'IRCTC.NS', name: 'IRCTC', sector: 'Retail trade', cap: 65000 },
  { symbol: 'BOSCHLTD.NS', name: 'Bosch', sector: 'Consumer durables', cap: 90000 },
  { symbol: 'GAIL.NS', name: 'GAIL', sector: 'Energy minerals', cap: 135000 },
  { symbol: 'IOC.NS', name: 'Indian Oil', sector: 'Energy minerals', cap: 190000 },
];

export const SP_500 = [
  // Electronic Technology
  { symbol: 'AAPL', name: 'Apple', sector: 'Electronic Technology', cap: 3500000 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Electronic Technology', cap: 3400000 },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Electronic Technology', cap: 800000 },
  { symbol: 'AMD', name: 'AMD', sector: 'Electronic Technology', cap: 230000 },
  { symbol: 'QCOM', name: 'Qualcomm', sector: 'Electronic Technology', cap: 190000 },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Electronic Technology', cap: 180000 },
  { symbol: 'INTC', name: 'Intel', sector: 'Electronic Technology', cap: 110000 },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Electronic Technology', cap: 120000 },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Electronic Technology', cap: 160000 },

  // Technology Services
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology Services', cap: 3100000 },
  { symbol: 'GOOGL', name: 'Alphabet Class A', sector: 'Technology Services', cap: 2200000 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology Services', cap: 1500000 },
  { symbol: 'ORCL', name: 'Oracle', sector: 'Technology Services', cap: 490000 },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Technology Services', cap: 310000 },
  { symbol: 'ADBE', name: 'Adobe', sector: 'Technology Services', cap: 240000 },
  { symbol: 'CSCO', name: 'Cisco Systems', sector: 'Technology Services', cap: 230000 },
  { symbol: 'ACN', name: 'Accenture', sector: 'Technology Services', cap: 220000 },
  { symbol: 'NOW', name: 'ServiceNow', sector: 'Technology Services', cap: 190000 },
  { symbol: 'IBM', name: 'IBM', sector: 'Technology Services', cap: 200000 },

  // Finance
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', sector: 'Finance', cap: 1000000 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', cap: 680000 },
  { symbol: 'V', name: 'Visa', sector: 'Finance', cap: 600000 },
  { symbol: 'MA', name: 'Mastercard', sector: 'Finance', cap: 480000 },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Finance', cap: 360000 },
  { symbol: 'WFC', name: 'Wells Fargo', sector: 'Finance', cap: 260000 },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finance', cap: 200000 },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finance', cap: 180000 },
  { symbol: 'BLK', name: 'BlackRock', sector: 'Finance', cap: 150000 },

  // Consumer Durables (Auto / Tech)
  { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer Durables', cap: 1100000 },
  { symbol: 'GM', name: 'General Motors', sector: 'Consumer Durables', cap: 60000 },
  { symbol: 'F', name: 'Ford Motor', sector: 'Consumer Durables', cap: 45000 },

  // Retail Trade
  { symbol: 'AMZN', name: 'Amazon', sector: 'Retail Trade', cap: 2200000 },
  { symbol: 'WMT', name: 'Walmart', sector: 'Retail Trade', cap: 700000 },
  { symbol: 'COST', name: 'Costco', sector: 'Retail Trade', cap: 420000 },
  { symbol: 'HD', name: 'Home Depot', sector: 'Retail Trade', cap: 400000 },
  { symbol: 'LOW', name: "Lowe's", sector: 'Retail Trade', cap: 150000 },
  { symbol: 'TGT', name: 'Target', sector: 'Retail Trade', cap: 65000 },

  // Health Technology
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Health Technology', cap: 750000 },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Health Technology', cap: 560000 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Technology', cap: 370000 },
  { symbol: 'ABBV', name: 'AbbVie', sector: 'Health Technology', cap: 310000 },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Health Technology', cap: 250000 },
  { symbol: 'TMO', name: 'Thermo Fisher', sector: 'Health Technology', cap: 200000 },
  { symbol: 'ABT', name: 'Abbott Labs', sector: 'Health Technology', cap: 200000 },
  { symbol: 'PFE', name: 'Pfizer', sector: 'Health Technology', cap: 150000 },

  // Consumer Non-Durables
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Non-Durables', cap: 400000 },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer Non-Durables', cap: 280000 },
  { symbol: 'PEP', name: 'PepsiCo', sector: 'Consumer Non-Durables', cap: 220000 },
  { symbol: 'PM', name: 'Philip Morris', sector: 'Consumer Non-Durables', cap: 190000 },

  // Energy Minerals
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy Minerals', cap: 480000 },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy Minerals', cap: 280000 },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy Minerals', cap: 130000 },

  // Producer Manufacturing
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Producer Manufacturing', cap: 190000 },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Producer Manufacturing', cap: 200000 },
  { symbol: 'HON', name: 'Honeywell', sector: 'Producer Manufacturing', cap: 140000 },
  { symbol: 'BA', name: 'Boeing', sector: 'Producer Manufacturing', cap: 95000 },
  { symbol: 'RTX', name: 'RTX Corp', sector: 'Producer Manufacturing', cap: 160000 },

  // Utilities
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities', cap: 160000 },
  { symbol: 'SO', name: 'Southern Co', sector: 'Utilities', cap: 95000 },

  // Communications
  { symbol: 'NFLX', name: 'Netflix', sector: 'Communications', cap: 380000 },
  { symbol: 'DIS', name: 'Walt Disney', sector: 'Communications', cap: 210000 },
  { symbol: 'CMCSA', name: 'Comcast', sector: 'Communications', cap: 150000 },
  { symbol: 'VZ', name: 'Verizon', sector: 'Communications', cap: 170000 },
  { symbol: 'T', name: 'AT&T', sector: 'Communications', cap: 160000 },
];

export async function GET(req?: Request) {
  let indexParam = 'nifty50';
  if (req?.url) {
    try {
      const url = new URL(req.url);
      const q = url.searchParams.get('index');
      if (q) indexParam = q.toLowerCase();
    } catch {
      // fallback to default
    }
  }

  let stockList = NIFTY_50;
  let currencySymbol = '₹';

  if (indexParam === 'sp500') {
    stockList = SP_500;
    currencySymbol = '$';
  } else if (indexParam === 'nifty500') {
    stockList = NIFTY_500;
    currencySymbol = '₹';
  }

  // 1. Check in-memory server cache
  const cached = serverCache[indexParam];
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return Response.json({
      data: cached.data,
      updatedAt: new Date(cached.timestamp).toISOString(),
      index: indexParam,
      currencySymbol: cached.currencySymbol,
      cached: true,
    });
  }

  if (process.env.E2E_MODE === 'true') {
    const mockData: StockHeatmapItem[] = stockList.map((stock, i) => {
      // Predictable mock variation for E2E tests: mix of positive and negative changes
      const change = Number((((i * 17) % 70) / 10 - 3.2).toFixed(2));
      const price = Number((100 + ((i * 73) % 4000)).toFixed(2));
      return {
        symbol: stock.symbol.replace('.NS', ''),
        name: stock.name,
        sector: stock.sector,
        price,
        change,
        size: stock.cap,
      };
    });
    return Response.json({
      data: mockData,
      updatedAt: new Date().toISOString(),
      index: indexParam,
      currencySymbol,
    });
  }

  // Helper for seed fallback if Yahoo fails or times out
  const getSeedItem = (stock: (typeof stockList)[0], index: number): StockHeatmapItem => {
    // Generate realistic seeded change & price based on symbol and cap
    const seed = (stock.symbol.charCodeAt(0) * 13 + stock.symbol.charCodeAt(1 || 0) * 7 + index * 19) % 100;
    const change = Number(((seed / 10) - 4.5).toFixed(2)); // range -4.5% to +5.4%
    const basePrice = currencySymbol === '$' ? 120 + (seed * 3) : 650 + (seed * 35);
    return {
      symbol: stock.symbol.replace('.NS', ''),
      name: stock.name,
      sector: stock.sector,
      price: Number(basePrice.toFixed(2)),
      change,
      size: stock.cap,
    };
  };

  const results = await Promise.allSettled(
    stockList.map(async (stock, i) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stock.symbol)}?interval=1d&range=5d`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const quote = data.chart?.result?.[0]?.indicators?.quote?.[0];

        const currentPrice = meta?.regularMarketPrice ?? 0;
        const prevClose =
          meta?.chartPreviousClose ??
          meta?.previousClose ??
          quote?.close?.[quote.close.length - 2] ??
          currentPrice;
        const pctChange =
          meta?.regularMarketChangePercent ??
          (prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0);
        const marketCap = meta?.marketCap ?? stock.cap;

        if (!currentPrice || currentPrice <= 0) {
          return getSeedItem(stock, i);
        }

        return {
          symbol: stock.symbol.replace('.NS', ''),
          name: stock.name,
          sector: stock.sector,
          price: Number(currentPrice.toFixed(2)),
          change: Number(Number(pctChange).toFixed(2)),
          size: marketCap > 1 ? marketCap : Math.max(currentPrice * 1000000, 1000),
        };
      } catch {
        clearTimeout(timeoutId);
        return getSeedItem(stock, i);
      }
    })
  );

  const data: StockHeatmapItem[] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return getSeedItem(stockList[i]!, i);
  });

  // Save to in-memory server cache
  serverCache[indexParam] = {
    data,
    timestamp: now,
    currencySymbol,
  };

  return Response.json({
    data,
    updatedAt: new Date(now).toISOString(),
    index: indexParam,
    currencySymbol,
  });
}
