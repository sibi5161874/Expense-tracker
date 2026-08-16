import { describe, expect, it } from 'vitest';
import { calculateRealEstatePnl } from './assets';

describe('calculateRealEstatePnl', () => {
  it('is positive when current value exceeds purchase value', () => {
    expect(calculateRealEstatePnl(5_000_000, 6_500_000)).toBe(1_500_000);
  });

  it('is negative when current value has dropped below purchase value', () => {
    expect(calculateRealEstatePnl(5_000_000, 4_200_000)).toBe(-800_000);
  });

  it('is zero when current value equals purchase value', () => {
    expect(calculateRealEstatePnl(5_000_000, 5_000_000)).toBe(0);
  });
});
