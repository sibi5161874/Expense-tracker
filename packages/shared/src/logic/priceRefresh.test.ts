import { describe, expect, it } from 'vitest';
import {
  parseAmfiNavFile,
  buildAmfiIndex,
  lookupMutualFundNav,
  toYahooTicker,
  extractYahooPrice,
  extractYahooQuote,
  extractYahooHistory,
  buildBenchmarkSeries,
  isMutualFund,
  buildRefreshSummary,
} from './priceRefresh';

// Shaped like the real NAVAll.txt: fund-house headers and blank lines between
// data rows, which the parser has to skip without erroring.
const SAMPLE_AMFI = `Scheme Code;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date

Aditya Birla Sun Life Mutual Fund

Open Ended Schemes(Equity Scheme - Large Cap Fund)
119551;INF209K01YM2;INF209K01YN0;Aditya Birla Sun Life Frontline Equity Fund - Growth;512.4500;05-Mar-2026
119552;INF209K01ZZ9;;Aditya Birla Sun Life Focused Fund - Growth;128.7700;05-Mar-2026

HDFC Mutual Fund

100119;INF179K01YV8;INF179K01YW6;HDFC Flexi Cap Fund - Growth;1875.2340;05-Mar-2026
`;

describe('parseAmfiNavFile', () => {
  it('parses only the data rows, skipping headers and fund-house lines', () => {
    const rows = parseAmfiNavFile(SAMPLE_AMFI);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      schemeCode: '119551',
      isinGrowth: 'INF209K01YM2',
      schemeName: 'Aditya Birla Sun Life Frontline Equity Fund - Growth',
      nav: 512.45,
    });
  });

  it('skips rows with an unparseable or non-positive NAV rather than storing 0', () => {
    const rows = parseAmfiNavFile('123;ISIN1;;Some Fund;N.A.;05-Mar-2026\n124;ISIN2;;Other Fund;0;05-Mar-2026');
    expect(rows).toEqual([]);
  });

  it('returns an empty array for an empty file instead of throwing', () => {
    expect(parseAmfiNavFile('')).toEqual([]);
  });
});

describe('lookupMutualFundNav', () => {
  const index = buildAmfiIndex(parseAmfiNavFile(SAMPLE_AMFI));

  it('matches by scheme code', () => {
    expect(lookupMutualFundNav(index, '119551')).toBe(512.45);
  });

  it('matches by growth ISIN, case-insensitively', () => {
    expect(lookupMutualFundNav(index, 'inf179k01yv8')).toBe(1875.234);
  });

  it('matches by dividend-reinvestment ISIN too', () => {
    expect(lookupMutualFundNav(index, 'INF209K01YN0')).toBe(512.45);
  });

  it('matches by scheme name, ignoring punctuation and spacing differences', () => {
    expect(lookupMutualFundNav(index, 'HDFC  Flexi Cap Fund   Growth')).toBe(1875.234);
  });

  it('returns null for an unknown symbol rather than a near match', () => {
    expect(lookupMutualFundNav(index, 'HDFC Something Else')).toBeNull();
  });

  it('returns null for an empty symbol', () => {
    expect(lookupMutualFundNav(index, '   ')).toBeNull();
  });

  // AMFI writes "-" rather than an empty field when a scheme has no ISIN for a
  // variant — >10,000 rows in the live file do this. Indexing it would make "-"
  // resolve to an arbitrary fund's NAV.
  it('never treats AMFI\'s "-" ISIN placeholder as a lookup key', () => {
    const withPlaceholders = buildAmfiIndex(
      parseAmfiNavFile(
        '119552;INF209K01YM2;-;ABSL Banking Fund - DIRECT - MONTHLY IDCW;117.6108;14-Aug-2026\n' +
          '119553;INF209K01YO8;-;ABSL Banking Fund - Direct - Quarterly IDCW;105.2995;14-Aug-2026'
      )
    );
    expect(lookupMutualFundNav(withPlaceholders, '-')).toBeNull();
    // The real ISINs still resolve.
    expect(lookupMutualFundNav(withPlaceholders, 'INF209K01YM2')).toBe(117.6108);
  });

  it('handles the live file\'s header spacing ("ISIN Div Payout/ ISIN Growth")', () => {
    const rows = parseAmfiNavFile(
      'Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date\n' +
        ' \n' +
        'Open Ended Schemes(Debt Scheme - Banking and PSU Fund)\n' +
        ' \n' +
        '119551;INF209KA12Z1;INF209KA13Z9;ABSL Banking & PSU Debt Fund  - DIRECT - IDCW;107.2744;14-Aug-2026'
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ schemeCode: '119551', nav: 107.2744 });
  });
});

describe('toYahooTicker', () => {
  it.each([
    ['RELIANCE', 'NSE', 'RELIANCE.NS'],
    ['RELIANCE', 'BSE', 'RELIANCE.BO'],
    ['reliance', 'NSE', 'RELIANCE.NS'],
    ['TCS.NS', 'NSE', 'TCS.NS'],
    ['AAPL', 'NASDAQ', 'AAPL'],
  ])('maps %s on %s to %s', (symbol, exchange, want) => {
    expect(toYahooTicker(symbol, exchange)).toBe(want);
  });
});

describe('extractYahooPrice', () => {
  it('reads regularMarketPrice from a well-formed response', () => {
    expect(extractYahooPrice({ chart: { result: [{ meta: { regularMarketPrice: 2905.5 } }] } })).toBe(2905.5);
  });

  it.each([
    [{ chart: { result: [] } }],
    [{ chart: {} }],
    [{}],
    [null],
    [{ chart: { result: [{ meta: { regularMarketPrice: 0 } }] } }],
    [{ chart: { result: [{ meta: { regularMarketPrice: 'n/a' } }] } }],
  ])('returns null for a malformed or non-positive response (%#)', (payload) => {
    expect(extractYahooPrice(payload)).toBeNull();
  });
});

describe('isMutualFund', () => {
  it('recognizes the Mutual Fund asset type regardless of casing', () => {
    expect(isMutualFund('Mutual Fund')).toBe(true);
    expect(isMutualFund('mutual fund')).toBe(true);
  });

  it('treats everything else as a quotable listing', () => {
    expect(isMutualFund('Stock')).toBe(false);
    expect(isMutualFund('ETF')).toBe(false);
  });
});

describe('buildRefreshSummary', () => {
  const targets = [
    { symbol: 'RELIANCE', exchange: 'NSE', assetType: 'Stock' },
    { symbol: '119551', exchange: 'NSE', assetType: 'Mutual Fund' },
    { symbol: 'UNKNOWNCO', exchange: 'NSE', assetType: 'Stock' },
  ];

  it('routes mutual funds to AMFI and listings to the quote source', () => {
    const { updated, unmatched } = buildRefreshSummary(
      targets,
      { '119551': 512.45 },
      { RELIANCE: 2905.5, UNKNOWNCO: null }
    );

    expect(updated.find((u) => u.symbol === 'RELIANCE')).toMatchObject({ price: 2905.5, source: 'yahoo' });
    expect(updated.find((u) => u.symbol === '119551')).toMatchObject({ price: 512.45, source: 'amfi' });
    expect(unmatched).toEqual(['UNKNOWNCO']);
  });

  it('marks a symbol unmatched (leaving its stored price untouched) rather than guessing', () => {
    const { updated, unmatched } = buildRefreshSummary(targets, {}, {});
    expect(unmatched).toHaveLength(3);
    expect(updated.every((u) => u.price === null && u.source === 'unmatched')).toBe(true);
  });

  it('never falls back to a quote price for a mutual fund AMFI could not match', () => {
    // A scheme code colliding with an unrelated listed ticker must not price the fund.
    const { updated, unmatched } = buildRefreshSummary(
      [{ symbol: '119551', exchange: 'NSE', assetType: 'Mutual Fund' }],
      {},
      { '119551': 9999 }
    );
    expect(updated[0]).toMatchObject({ price: null, source: 'unmatched' });
    expect(unmatched).toEqual(['119551']);
  });

  it('never uses an AMFI NAV for a listed instrument', () => {
    const { updated } = buildRefreshSummary(
      [{ symbol: 'RELIANCE', exchange: 'NSE', assetType: 'Stock' }],
      { RELIANCE: 1 },
      { RELIANCE: 2905.5 }
    );
    expect(updated[0]).toMatchObject({ price: 2905.5, source: 'yahoo' });
  });
});

describe('extractYahooQuote', () => {
  it('extracts price and currency together', () => {
    const payload = { chart: { result: [{ meta: { regularMarketPrice: 2905.5, currency: 'INR' } }] } };
    expect(extractYahooQuote(payload)).toEqual({ price: 2905.5, currency: 'INR' });
  });

  it('is null when price is missing, zero, or non-finite', () => {
    expect(extractYahooQuote({ chart: { result: [{ meta: { currency: 'INR' } }] } })).toBeNull();
    expect(extractYahooQuote({ chart: { result: [{ meta: { regularMarketPrice: 0, currency: 'INR' } }] } })).toBeNull();
    expect(
      extractYahooQuote({ chart: { result: [{ meta: { regularMarketPrice: Infinity, currency: 'INR' } }] } })
    ).toBeNull();
  });

  it('is null when currency is missing — a bare number is useless without knowing what it means', () => {
    expect(extractYahooQuote({ chart: { result: [{ meta: { regularMarketPrice: 100 } }] } })).toBeNull();
  });

  it('is null for a malformed payload', () => {
    expect(extractYahooQuote({})).toBeNull();
    expect(extractYahooQuote(null)).toBeNull();
  });
});

describe('extractYahooHistory', () => {
  it('pairs timestamps with closes into dated points', () => {
    const payload = {
      chart: {
        result: [
          {
            timestamp: [1700000000, 1700086400],
            indicators: { quote: [{ close: [100.5, 102.25] }] },
          },
        ],
      },
    };
    const points = extractYahooHistory(payload);
    expect(points).toHaveLength(2);
    expect(points[0]!.close).toBe(100.5);
    expect(points[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('skips indices where either the timestamp or the close is a gap', () => {
    const payload = {
      chart: {
        result: [
          {
            timestamp: [1700000000, 1700086400, 1700172800],
            indicators: { quote: [{ close: [100, null, 103] }] },
          },
        ],
      },
    };
    expect(extractYahooHistory(payload)).toHaveLength(2);
  });

  it('is an empty array for a malformed payload, never a throw', () => {
    expect(extractYahooHistory({})).toEqual([]);
    expect(extractYahooHistory(null)).toEqual([]);
  });
});

describe('buildBenchmarkSeries', () => {
  const snapshots = [
    { snapshot_date: '2026-01-01', net_worth: 1_000_000 },
    { snapshot_date: '2026-02-01', net_worth: 1_100_000 },
  ];
  const history = [
    { date: '2025-12-15', close: 20000 }, // before the first snapshot — must be excluded
    { date: '2026-01-01', close: 20000 },
    { date: '2026-01-15', close: 21000 },
    { date: '2026-02-01', close: 22000 },
    { date: '2026-02-15', close: 23000 },
  ];

  it('scales the benchmark so it starts at the same value as the first snapshot', () => {
    const series = buildBenchmarkSeries(snapshots, history);
    expect(series[0]).toMatchObject({ date: '2026-01-01', netWorth: 1_000_000, benchmark: 1_000_000 });
  });

  it('scales every later point by the same factor, not just the first', () => {
    const series = buildBenchmarkSeries(snapshots, history);
    // 21000 / 20000 * 1,000,000
    const jan15 = series.find((p) => p.date === '2026-01-15');
    expect(jan15!.benchmark).toBeCloseTo(1_050_000, 5);
  });

  it('forward-fills net worth across benchmark trading days between snapshots', () => {
    const series = buildBenchmarkSeries(snapshots, history);
    const jan15 = series.find((p) => p.date === '2026-01-15');
    expect(jan15!.netWorth).toBe(1_000_000); // still the Jan 1 snapshot, no Feb snapshot yet
    const feb15 = series.find((p) => p.date === '2026-02-15');
    expect(feb15!.netWorth).toBe(1_100_000); // rolled forward to the Feb 1 snapshot
  });

  it('excludes benchmark history before the first snapshot date', () => {
    const series = buildBenchmarkSeries(snapshots, history);
    expect(series.some((p) => p.date < '2026-01-01')).toBe(false);
  });

  it('is empty when either input is empty', () => {
    expect(buildBenchmarkSeries([], history)).toEqual([]);
    expect(buildBenchmarkSeries(snapshots, [])).toEqual([]);
  });
});
