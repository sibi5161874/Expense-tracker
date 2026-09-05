import { describe, expect, it } from 'vitest';
import { calculateWAC } from './stocks';

describe('calculateWAC', () => {
  it('averages two lots weighted by quantity', () => {
    // (10*100 + 10*200) / 20 = 150
    expect(calculateWAC([{ qty: 10, price: 100 }, { qty: 10, price: 200 }])).toBe(150);
  });

  it('weights toward the larger lot', () => {
    // (90*100 + 10*200) / 100 = 110
    expect(calculateWAC([{ qty: 90, price: 100 }, { qty: 10, price: 200 }])).toBe(110);
  });

  it('is 0 for no lots or zero total quantity', () => {
    expect(calculateWAC([])).toBe(0);
    expect(calculateWAC([{ qty: 0, price: 100 }])).toBe(0);
  });
});
