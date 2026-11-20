import { describe, expect, it } from 'vitest';
import {
  parseAmount,
  parseDate,
  findHeaderRow,
  normalizeHeaders,
  detectPriceFormat,
  parseTransactionType,
} from './csvParserHelpers';

describe('csvParserHelpers', () => {
  describe('parseAmount', () => {
    it('parses Indian rupee format with commas', () => {
      expect(parseAmount('₹1,00,000.50')).toBe(100000.5);
      expect(parseAmount('1,50,000')).toBe(150000);
      expect(parseAmount('Rs. 500.00')).toBe(500);
    });

    it('parses parenthesised negatives in accounting format', () => {
      expect(parseAmount('(500)')).toBe(-500);
      expect(parseAmount('(₹1,250.75)')).toBe(-1250.75);
    });

    it('parses standard negative and positive numbers', () => {
      expect(parseAmount('-500')).toBe(-500);
      expect(parseAmount('500.00')).toBe(500);
      expect(parseAmount('+250')).toBe(250);
    });

    it('returns null for non-numeric or empty input', () => {
      expect(parseAmount('abc')).toBeNull();
      expect(parseAmount('')).toBeNull();
      expect(parseAmount('-')).toBeNull();
      expect(parseAmount('N.A.')).toBeNull();
      expect(parseAmount('NIL')).toBeNull();
    });
  });

  describe('parseDate', () => {
    it('parses DD-MM-YYYY and DD/MM/YYYY formats', () => {
      expect(parseDate('01-01-2024')).toBe('2024-01-01');
      expect(parseDate('01/01/2024')).toBe('2024-01-01');
      expect(parseDate('25/12/2025')).toBe('2025-12-25');
    });

    it('parses named month format (DD-MMM-YYYY, DD MMM YYYY)', () => {
      expect(parseDate('1-Jan-2024')).toBe('2024-01-01');
      expect(parseDate('01-Jan-2024')).toBe('2024-01-01');
      expect(parseDate('15 Mar 2026')).toBe('2026-03-15');
      expect(parseDate('31-Dec-2025')).toBe('2025-12-31');
    });

    it('parses ISO format YYYY-MM-DD', () => {
      expect(parseDate('2024-05-20')).toBe('2024-05-20');
      expect(parseDate('2026-03-15 14:30:00')).toBe('2026-03-15');
    });

    it('returns null for invalid strings', () => {
      expect(parseDate('garbage')).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate('32-01-2024')).toBeNull();
    });
  });

  describe('findHeaderRow', () => {
    it('locates the header row after metadata lines in a broker file', () => {
      const sample = [
        ['Username: nandha'],
        ['Client ID: 3.44E+13'],
        ['Tradebook Report'],
        [],
        ['Trade Date', 'Stock Name', 'Exchange', 'Buy/Sell', 'Quantity', 'Price'],
        ['2026-03-05', 'RELIANCE', 'NSE', 'buy', '10', '2900'],
      ];
      expect(findHeaderRow(sample, 'broker')).toBe(4);
    });

    it('locates the header row in a bank file', () => {
      const sample = [
        ['HDFC BANK STATEMENT'],
        ['Account: 12345678'],
        ['Txn Date', 'Narration', 'Chq No', 'Withdrawal Amt', 'Deposit Amt', 'Balance'],
        ['01/01/2026', 'Salary', '', '', '100000', '150000'],
      ];
      expect(findHeaderRow(sample, 'bank')).toBe(2);
    });

    it('returns -1 when no valid header row is found', () => {
      const sample = [['Foo'], ['Bar']];
      expect(findHeaderRow(sample, 'broker')).toBe(-1);
    });
  });

  describe('normalizeHeaders', () => {
    it('maps known aliases to canonical keys', () => {
      const headers = ['Stock name', 'Qty', 'Rate', 'Trade date'];
      expect(normalizeHeaders(headers)).toEqual(['symbol', 'quantity', 'price', 'date']);
    });

    it('normalizes bank statement columns', () => {
      const headers = ['Particulars', 'Withdrawal amt', 'Deposit amt', 'Closing balance'];
      expect(normalizeHeaders(headers)).toEqual(['description', 'debit', 'credit', 'balance']);
    });
  });

  describe('detectPriceFormat', () => {
    it('returns per_share when only price exists', () => {
      expect(detectPriceFormat(['price', 'quantity'])).toBe('per_share');
    });

    it('returns total when total exists', () => {
      expect(detectPriceFormat(['price', 'total'])).toBe('total');
      expect(detectPriceFormat(['total', 'quantity'])).toBe('total');
    });
  });

  describe('parseTransactionType', () => {
    it('identifies Income from credit indicators', () => {
      expect(parseTransactionType({ type: 'CR' })).toBe('Income');
      expect(parseTransactionType({ 'dr/cr': 'credit' })).toBe('Income');
    });

    it('identifies Expense from debit indicators', () => {
      expect(parseTransactionType({ type: 'DR' })).toBe('Expense');
      expect(parseTransactionType({ 'dr/cr': 'debit' })).toBe('Expense');
    });
  });
});
