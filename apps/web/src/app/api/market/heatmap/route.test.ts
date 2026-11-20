import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, NIFTY_50, NIFTY_500, SP_500 } from './route';

describe('GET /api/market/heatmap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.E2E_MODE;
  });

  it('contains 50 constituent stocks in NIFTY_50 constant', () => {
    expect(NIFTY_50).toHaveLength(50);
    const symbols = new Set(NIFTY_50.map((s) => s.symbol));
    expect(symbols.size).toBe(50);
  });

  it('contains constituents for NIFTY_500 and SP_500', () => {
    expect(NIFTY_500.length).toBeGreaterThan(50);
    expect(SP_500.length).toBeGreaterThanOrEqual(50);
  });

  it('returns mock data with 50 stocks when E2E_MODE is true for default index', async () => {
    process.env.E2E_MODE = 'true';
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(50);
    expect(json.currencySymbol).toBe('₹');
    expect(json.updatedAt).toBeDefined();

    const first = json.data[0];
    expect(first).toMatchObject({
      symbol: expect.any(String),
      name: expect.any(String),
      sector: expect.any(String),
      price: expect.any(Number),
      change: expect.any(Number),
      size: expect.any(Number),
    });
  });

  it('returns S&P 500 stocks with $ currency when index=sp500', async () => {
    process.env.E2E_MODE = 'true';
    const req = new Request('http://localhost:3000/api/market/heatmap?index=sp500');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.index).toBe('sp500');
    expect(json.currencySymbol).toBe('$');
    expect(json.data.length).toBe(SP_500.length);
    expect(json.data.some((s: { symbol: string }) => s.symbol === 'AAPL')).toBe(true);
  });

  it('fetches live quotes and returns calculated change and size in normal mode', async () => {
    const fakeChartData = {
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: 2500,
              chartPreviousClose: 2450,
              marketCap: 1500000,
            },
            indicators: {
              quote: [{ close: [2400, 2450, 2500] }],
            },
          },
        ],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(fakeChartData), { status: 200 }))
    );

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(50);
    expect(json.data[0]).toMatchObject({
      price: 2500,
      change: 2.04, // ((2500 - 2450) / 2450) * 100
      size: 1500000,
    });
  });
});
