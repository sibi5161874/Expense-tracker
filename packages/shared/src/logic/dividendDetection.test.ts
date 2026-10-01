import { describe, it, expect } from 'vitest';
import { detectDividendCandidate } from './dividendDetection';

describe('detectDividendCandidate', () => {
  it('flags a high-confidence dividend credit', () => {
    expect(detectDividendCandidate('DIVIDEND CREDIT - HDFC BANK', 'Income')).toEqual({ confidence: 'high' });
  });

  it('does not flag bank interest credit', () => {
    expect(detectDividendCandidate('INTEREST CREDIT - SAVINGS ACCOUNT', 'Income')).toBeNull();
  });

  it('does not flag debits even with a dividend keyword', () => {
    expect(detectDividendCandidate('DIVIDEND REINVESTMENT CHARGE', 'Expense')).toBeNull();
  });

  it('flags a mutual fund dividend payout as high confidence', () => {
    expect(detectDividendCandidate('MF DIVIDEND PAYOUT', 'Income')).toEqual({ confidence: 'high' });
  });

  it('flags IDCW as medium confidence', () => {
    expect(detectDividendCandidate('IDCW PAYOUT', 'Income')).toEqual({ confidence: 'medium' });
  });

  it('prefers the exclude keyword when both a dividend and an exclude keyword are present', () => {
    expect(detectDividendCandidate('FD INTEREST / DIVIDEND ADJUSTMENT', 'Income')).toBeNull();
  });

  it('returns null for an ordinary, unrelated credit', () => {
    expect(detectDividendCandidate('SALARY CREDIT', 'Income')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectDividendCandidate('dividend received', 'Income')).toEqual({ confidence: 'high' });
  });
});
