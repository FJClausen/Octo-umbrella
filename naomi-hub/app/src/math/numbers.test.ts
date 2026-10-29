import { describe, expect, it } from 'vitest';
import { formatMixed, frac, mul, parseNumber, percentOff, within } from './numbers';

describe('parseNumber', () => {
  it('reads the ways kids write numbers', () => {
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber(' 12.5 ')).toBe(12.5);
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber('2 1/4')).toBe(2.25);
    expect(parseNumber('9/4')).toBe(2.25);
    expect(parseNumber('1½')).toBe(1.5);
    expect(parseNumber('¾')).toBe(0.75);
    expect(parseNumber('7 cm')).toBe(7);
    expect(parseNumber('180cm')).toBe(180);
    expect(parseNumber('50%')).toBe(50);
    expect(parseNumber('.5')).toBe(0.5);
  });

  it('rejects things that are not numbers', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1/0')).toBeNull();
    expect(parseNumber('1..2')).toBeNull();
  });
});

describe('fractions', () => {
  it('scales and formats exactly', () => {
    expect(formatMixed(mul(frac(3, 2), frac(3, 2)))).toBe('2 1/4');
    expect(formatMixed(mul(frac(1, 4), frac(3, 4)))).toBe('3/16');
    expect(formatMixed(mul(frac(2), frac(3, 2)))).toBe('3');
  });
});

describe('closeness', () => {
  it('measures percent off', () => {
    expect(percentOff(90, 100)).toBe(10);
    expect(within(104, 100, 5)).toBe(true);
    expect(within(106, 100, 5)).toBe(false);
  });
});
