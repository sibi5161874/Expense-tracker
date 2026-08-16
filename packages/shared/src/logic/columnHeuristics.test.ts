import { describe, expect, it } from 'vitest';
import { detectBankMapping, detectBrokerMapping } from './columnHeuristics';

describe('detectBankMapping', () => {
  // Each case is a real-world layout shape. The point of these is that NONE of
  // them need a hardcoded per-bank column list — they resolve by meaning.
  it.each([
    {
      name: 'HDFC style',
      headers: ['Date', 'Narration', 'Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
      expect: { date: 'Date', description: 'Narration', debit: 'Withdrawal Amt.', credit: 'Deposit Amt.' },
    },
    {
      name: 'SBI style',
      headers: ['Txn Date', 'Value Date', 'Description', 'Ref No./Cheque No.', 'Debit', 'Credit', 'Balance'],
      expect: { date: 'Txn Date', description: 'Description', debit: 'Debit', credit: 'Credit' },
    },
    {
      name: 'ICICI style with units in the header',
      headers: [
        'Transaction Date',
        'Value Date',
        'Cheque Number',
        'Transaction Remarks',
        'Withdrawal Amount (INR )',
        'Deposit Amount (INR )',
        'Balance (INR )',
      ],
      expect: {
        date: 'Transaction Date',
        description: 'Transaction Remarks',
        debit: 'Withdrawal Amount (INR )',
        credit: 'Deposit Amount (INR )',
      },
    },
    {
      name: 'Axis style',
      headers: ['Tran Date', 'Chq No', 'Particulars', 'Debit', 'Credit', 'Balance'],
      expect: { date: 'Tran Date', description: 'Particulars', debit: 'Debit', credit: 'Credit' },
    },
    {
      name: 'Kotak style',
      headers: ['Date', 'Description', 'Chq / Ref No', 'Debit', 'Credit', 'Balance'],
      expect: { date: 'Date', description: 'Description', debit: 'Debit', credit: 'Credit' },
    },
    {
      name: 'IDFC style',
      headers: ['Transaction Date', 'Value Date', 'Narration', 'Debit', 'Credit', 'Balance'],
      expect: { date: 'Transaction Date', description: 'Narration', debit: 'Debit', credit: 'Credit' },
    },
    {
      name: 'generic Gulf/international style (Doha/CBQ shape)',
      headers: ['Posting Date', 'Value Date', 'Details', 'Debit', 'Credit', 'Running Balance'],
      expect: { date: 'Posting Date', description: 'Details', debit: 'Debit', credit: 'Credit' },
    },
  ])('resolves $name without a hardcoded column list', ({ headers, expect: want }) => {
    const { mapping, unresolved } = detectBankMapping(headers);
    expect(unresolved).toEqual([]);
    expect(mapping).toMatchObject(want);
  });

  it('prefers a transaction date over a value date when both exist', () => {
    const { mapping } = detectBankMapping(['Value Date', 'Txn Date', 'Narration', 'Debit', 'Credit']);
    expect(mapping.date).toBe('Txn Date');
  });

  it('falls back to value date when no transaction date column exists', () => {
    const { mapping, unresolved } = detectBankMapping(['Value Date', 'Narration', 'Debit', 'Credit']);
    expect(mapping.date).toBe('Value Date');
    expect(unresolved).toEqual([]);
  });

  it('handles the single-amount + DR/CR-flag layout', () => {
    const { mapping, unresolved } = detectBankMapping(['Tran Date', 'Particulars', 'Amount(INR)', 'DR/CR', 'Balance']);
    expect(unresolved).toEqual([]);
    expect(mapping.amount).toBe('Amount(INR)');
    expect(mapping.drCrIndicator).toBe('DR/CR');
  });

  it('reports unresolved fields instead of guessing when the file is not a statement', () => {
    const { unresolved } = detectBankMapping(['Foo', 'Bar', 'Baz']);
    expect(unresolved.length).toBeGreaterThan(0);
  });

  it('does not mistake a balance column for a debit or credit column, and maps it separately', () => {
    const { mapping } = detectBankMapping(['Date', 'Narration', 'Debit', 'Credit', 'Closing Balance']);
    expect(mapping.debit).toBe('Debit');
    expect(mapping.credit).toBe('Credit');
    expect(mapping.balance).toBe('Closing Balance');
  });
});

describe('detectBrokerMapping', () => {
  it.each([
    {
      name: 'Zerodha style (snake_case)',
      headers: ['symbol', 'isin', 'trade_date', 'exchange', 'trade_type', 'quantity', 'price', 'trade_id'],
      expect: {
        date: 'trade_date',
        symbol: 'symbol',
        tradeType: 'trade_type',
        quantity: 'quantity',
        price: 'price',
      },
    },
    {
      name: 'Upstox style',
      headers: ['trading_symbol', 'exchange', 'transaction_type', 'quantity', 'average_price', 'trade_date'],
      expect: {
        date: 'trade_date',
        symbol: 'trading_symbol',
        tradeType: 'transaction_type',
        quantity: 'quantity',
        price: 'average_price',
      },
    },
    {
      name: 'Title Case style (Angel One / 5paisa shape)',
      headers: ['Trade Date', 'Symbol', 'Exchange', 'Buy/Sell', 'Quantity', 'Rate'],
      expect: { date: 'Trade Date', symbol: 'Symbol', tradeType: 'Buy/Sell', quantity: 'Quantity', price: 'Rate' },
    },
    {
      name: 'mutual-fund CAS style (no exchange column)',
      headers: ['Date', 'Scheme Name', 'Transaction Type', 'Units', 'NAV'],
      expect: { date: 'Date', symbol: 'Scheme Name', tradeType: 'Transaction Type', quantity: 'Units', price: 'NAV' },
    },
    {
      name: 'Interactive Brokers style',
      headers: ['TradeDate', 'Symbol', 'Exchange', 'Side', 'Quantity', 'Price'],
      expect: { date: 'TradeDate', symbol: 'Symbol', tradeType: 'Side', quantity: 'Quantity', price: 'Price' },
    },
  ])('resolves $name without a hardcoded column list', ({ headers, expect: want }) => {
    const { mapping, unresolved } = detectBrokerMapping(headers);
    expect(unresolved).toEqual([]);
    expect(mapping).toMatchObject(want);
  });

  it('reports unresolved fields instead of guessing when the file is not a tradebook', () => {
    const { unresolved } = detectBrokerMapping(['Foo', 'Bar']);
    expect(unresolved.length).toBeGreaterThan(0);
  });
});
