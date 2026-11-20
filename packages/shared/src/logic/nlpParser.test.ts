import { describe, it, expect } from 'vitest';
import { parseTransactionText } from './nlpParser';

describe('parseTransactionText (deterministic multi-domain parser)', () => {
  it('parses typical daily expense with amount and category', () => {
    const result = parseTransactionText('Spent 30 on coffee today');
    expect(result.intent).toBe('transaction');
    expect(result.confidence).toBe('high');
    expect(result.transaction?.type).toBe('Expense');
    expect(result.transaction?.amount).toBe(30);
    expect(result.transaction?.category).toBe('Food & Dining');
  });

  it('parses income transaction correctly', () => {
    const result = parseTransactionText('salary credited 2000');
    expect(result.intent).toBe('transaction');
    expect(result.confidence).toBe('high');
    expect(result.transaction?.type).toBe('Income');
    expect(result.transaction?.amount).toBe(2000);
    expect(result.transaction?.category).toBe('Salary & Income');
  });

  it('handles relative date "yesterday"', () => {
    const result = parseTransactionText('Spent 500 on uber yesterday');
    expect(result.intent).toBe('transaction');
    expect(result.transaction?.amount).toBe(500);
    expect(result.transaction?.category).toBe('Transportation');

    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - 1);
    const expectedIso = expectedDate.toISOString().split('T')[0];
    expect(result.transaction?.date).toBe(expectedIso);
  });

  it('parses amounts with "rs" suffix', () => {
    const result = parseTransactionText('i ate coffee today for 30 rs');
    expect(result.transaction?.amount).toBe(30);
    expect(result.transaction?.category).toBe('Food & Dining');
    expect(result.transaction?.type).toBe('Expense');
  });

  it('parses utility bills', () => {
    const result = parseTransactionText('paid 1500 electricity bill');
    expect(result.transaction?.amount).toBe(1500);
    expect(result.transaction?.category).toBe('Bills & Utilities');
  });

  it('parses brand names like Swiggy and Zomato', () => {
    const result = parseTransactionText('swiggy dinner 450');
    expect(result.transaction?.amount).toBe(450);
    expect(result.transaction?.category).toBe('Food & Dining');
  });

  it('detects cashbook "Gave" flow with counterparty', () => {
    const result = parseTransactionText('gave 500 to rahul');
    expect(result.intent).toBe('cashbook');
    expect(result.cashbook?.flow).toBe('Gave');
    expect(result.cashbook?.amount).toBe(500);
    expect(result.cashbook?.counterparty).toBe('Rahul');
  });

  it('detects cashbook "Got" flow with counterparty', () => {
    const result = parseTransactionText('got 1200 from priya');
    expect(result.intent).toBe('cashbook');
    expect(result.cashbook?.flow).toBe('Received');
    expect(result.cashbook?.amount).toBe(1200);
    expect(result.cashbook?.counterparty).toBe('Priya');
  });

  it('detects investment intent for stock purchases with quantity, symbol and price', () => {
    const result = parseTransactionText('bought 10 shares of RELIANCE at 2500');
    expect(result.intent).toBe('investment');
    expect(result.investment?.action).toBe('BUY');
    expect(result.investment?.asset_type).toBe('Stock');
    expect(result.investment?.quantity).toBe(10);
    expect(result.investment?.symbol).toBe('RELIANCE');
    expect(result.investment?.price).toBe(2500);
  });

  it('detects investment intent for selling stocks', () => {
    const result = parseTransactionText('sold 5 AAPL at 180');
    expect(result.intent).toBe('investment');
    expect(result.investment?.action).toBe('SELL');
    expect(result.investment?.quantity).toBe(5);
    expect(result.investment?.symbol).toBe('AAPL');
    expect(result.investment?.price).toBe(180);
  });

  it('detects mutual fund investments', () => {
    const result = parseTransactionText('invested 5000 in parag parikh mutual fund');
    expect(result.intent).toBe('investment');
    expect(result.investment?.action).toBe('BUY');
    expect(result.investment?.asset_type).toBe('Mutual Fund');
    expect(result.investment?.amount).toBe(5000);
  });

  it('marks low confidence on gibberish without crashing', () => {
    const result = parseTransactionText('random words with no numbers or keywords');
    expect(result.confidence).toBe('low');
    expect(result.intent).toBe('transaction');
    expect(result.transaction?.amount).toBeUndefined();
  });
});
