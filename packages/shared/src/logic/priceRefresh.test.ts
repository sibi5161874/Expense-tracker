import { describe, expect, it } from 'vitest';
import {
  parseAmfiNavFile,
  buildAmfiIndex,
  lookupMutualFundNav,
  toYahooTicker,
  extractYahooPrice,
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
