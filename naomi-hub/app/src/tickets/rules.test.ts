import { describe, expect, it } from 'vitest';
import { canAfford, DEFAULT_SETTINGS as S, earn, rollDay, sheetReward, spend } from './rules';

describe('tickets', () => {
  it('starts each day with the free ticket plus at most one carried over', () => {
    expect(rollDay({ balance: 0, day: '' }, S, '2026-10-29')).toEqual({ balance: 1, day: '2026-10-29' });
    expect(rollDay({ balance: 3, day: '2026-10-28' }, S, '2026-10-29')).toEqual({ balance: 2, day: '2026-10-29' });
    expect(rollDay({ balance: 3, day: '2026-10-29' }, S, '2026-10-29').balance).toBe(3);
  });

  it('never goes above the cap', () => {
    expect(earn({ balance: 2, day: 'd' }, S, 2)).toEqual({ state: { balance: 3, day: 'd' }, added: 1 });
    expect(earn({ balance: 3, day: 'd' }, S, 1).added).toBe(0);
  });

  it('spends only what she has, and nothing when the gate is off', () => {
    expect(spend({ balance: 1, day: 'd' }, S, 1)).toEqual({ balance: 0, day: 'd' });
    expect(spend({ balance: 0, day: 'd' }, S, 1)).toBeNull();
    expect(canAfford({ balance: 0, day: 'd' }, { ...S, enabled: false }, 1)).toBe(true);
    expect(spend({ balance: 0, day: 'd' }, { ...S, enabled: false }, 1)).toEqual({ balance: 0, day: 'd' });
  });

  it('Brain-buster sheets earn two', () => {
    expect(sheetReward('hard')).toBe(2);
    expect(sheetReward('medium')).toBe(1);
    expect(sheetReward('chess')).toBe(1);
  });
});
