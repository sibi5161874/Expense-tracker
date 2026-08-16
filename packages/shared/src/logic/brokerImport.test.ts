import { describe, expect, it } from 'vitest';
import {
  detectBrokerFormat,
  resolveBrokerMapping,
  matchesKnownBrokerColumns,
  normalizeTradeType,
  buildBrokerImportPlan,
  type BrokerColumnMapping,
} from './brokerImport';
import { BROKERS, findBroker } from './institutions';
import type { ImportRecord } from './csvImport';

const accountId = '44444444-4444-4444-8444-444444444444';
const DOCUMENTED_BROKERS = BROKERS.filter((b) => b.columns);

describe('broker institution registry', () => {
  it('exposes all 18 brokers from the target list', () => {
    const ids = BROKERS.map((b) => b.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'ZERODHA',
        'GROWW',
        'INDMONEY',
        'UPSTOX',
        'ICICI_DIRECT',
        'CDSL',
        'ANGEL_ONE',
        'AIONION',
        'CHOLA',
        'MSTOCK',
        'FIVEPAISA',
        'VESTED',
        'TICKERTAPE',
        'STOCKAL',
        'IBKR',
        'KUVERA',
        'MFCENTRAL',
        'KOTAK_NEO',
      ])
    );
  });

  it('never ships a columns list for a heuristic-only broker', () => {
    for (const broker of BROKERS) {
      if (broker.confidence === 'heuristic') expect(broker.columns).toBeUndefined();
    }
  });
});

describe('detectBrokerFormat / matchesKnownBrokerColumns', () => {
  it.each(DOCUMENTED_BROKERS.map((b) => b.id))('detects %s from its documented header row', (id) => {
    const columns = [...findBroker(id)!.columns!];
    expect(detectBrokerFormat(columns)).toBe(id);
    expect(matchesKnownBrokerColumns(columns, id)).toBe(true);
  });

  it('matches regardless of column order and casing', () => {
    const shuffled = [...findBroker('ZERODHA')!.columns!].reverse().map((c) => c.toUpperCase());
    expect(matchesKnownBrokerColumns(shuffled, 'ZERODHA')).toBe(true);
  });

  it('returns null for a header row matching no documented broker', () => {
    expect(detectBrokerFormat(['Foo', 'Bar'])).toBeNull();
  });
});

describe('resolveBrokerMapping', () => {
  it.each(DOCUMENTED_BROKERS.map((b) => b.id))('resolves a full mapping for %s', (id) => {
    const { mapping, unresolved } = resolveBrokerMapping([...findBroker(id)!.columns!], id);
    expect(unresolved).toEqual([]);
    expect(mapping?.date).toBeTruthy();
    expect(mapping?.symbol).toBeTruthy();
    expect(mapping?.tradeType).toBeTruthy();
  });

  it('resolves an undocumented broker via heuristics alone', () => {
    // Groww/Angel One/etc. have no published spec — this is the path they take.
    const { mapping, unresolved, source } = resolveBrokerMapping(
      ['Trade Date', 'Stock Name', 'Exchange', 'Buy/Sell', 'Quantity', 'Price'],
      'GROWW'
    );
    expect(unresolved).toEqual([]);
    expect(source).toBe('heuristic');
    expect(mapping?.symbol).toBe('Stock Name');
  });

  it('returns a null mapping with unresolved fields rather than guessing', () => {
    const { mapping, unresolved } = resolveBrokerMapping(['Foo', 'Bar'], 'GROWW');
    expect(mapping).toBeNull();
    expect(unresolved.length).toBeGreaterThan(0);
  });
});

describe('normalizeTradeType', () => {
  it.each(['buy', 'BUY', 'B', 'Purchase', 'bought', 'SIP'])('reads %s as BUY', (input) => {
    expect(normalizeTradeType(input)).toBe('BUY');
  });

  it.each(['sell', 'SELL', 'S', 'Sale', 'sold', 'Redemption'])('reads %s as SELL', (input) => {
    expect(normalizeTradeType(input)).toBe('SELL');
  });

  it.each(['bonus', 'split', '', 'xyz'])('rejects %s rather than defaulting a side', (input) => {
    expect(normalizeTradeType(input)).toBeNull();
  });
});

describe('buildBrokerImportPlan', () => {
  const mapping: BrokerColumnMapping = {
    date: 'trade_date',
    symbol: 'symbol',
    exchange: 'exchange',
    tradeType: 'trade_type',
    quantity: 'quantity',
    price: 'price',
  };

  function record(fields: Partial<Record<string, string>>): ImportRecord {
    return {
      row: 2,
      record: {
        symbol: 'RELIANCE',
        trade_date: '2026-03-05',
        exchange: 'NSE',
        trade_type: 'buy',
        quantity: '10',
        price: '2900',
        ...fields,
      },
    };
  }

  it('maps a buy row to a BUY investment_log entry', () => {
    const { validRows, errors } = buildBrokerImportPlan(mapping, [record({})], accountId, []);
    expect(errors).toEqual([]);
    expect(validRows[0]).toMatchObject({
      date: '2026-03-05',
      symbol: 'RELIANCE',
      exchange: 'NSE',
      action: 'BUY',
      quantity: 10,
      price: 2900,
      fees: 0,
      linked_account_id: accountId,
      asset_type: 'Stock',
    });
  });

  it('maps a sell row to a SELL entry', () => {
    const { validRows } = buildBrokerImportPlan(mapping, [record({ trade_type: 'sell' })], accountId, []);
    expect(validRows[0]?.action).toBe('SELL');
  });

  it('accepts a DD/MM/YYYY trade date', () => {
    const { validRows } = buildBrokerImportPlan(mapping, [record({ trade_date: '05/03/2026' })], accountId, []);
    expect(validRows[0]?.date).toBe('2026-03-05');
  });

  it('defaults the exchange when the export has no exchange column (MF CAS statements)', () => {
    const noExchange: BrokerColumnMapping = { ...mapping, exchange: undefined };
    const { validRows } = buildBrokerImportPlan(noExchange, [record({})], accountId, []);
    expect(validRows[0]?.exchange).toBe('NSE');
  });

  it('rejects an unrecognized trade type', () => {
    const { errors, validRows } = buildBrokerImportPlan(mapping, [record({ trade_type: 'bonus' })], accountId, []);
    expect(validRows).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('reports an error for an unparseable trade date', () => {
    const { errors, validRows } = buildBrokerImportPlan(mapping, [record({ trade_date: 'garbage' })], accountId, []);
    expect(validRows).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it('dedups against existing investment log keys', () => {
    const { validRows, duplicateCount } = buildBrokerImportPlan(
      mapping,
      [record({})],
      accountId,
      ['2026-03-05|RELIANCE|10|2900']
    );
    expect(validRows).toEqual([]);
    expect(duplicateCount).toBe(1);
  });
});
