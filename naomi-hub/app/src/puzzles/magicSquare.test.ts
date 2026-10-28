import { describe, expect, it } from 'vitest';
import { countMagicSolutions, generateMagicSquare, isMagic, magicSum } from './magicSquare';

describe('magic square', () => {
  it('3x3 puzzles have exactly one solution', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const start = seed % 2 ? 1 : 5;
      const p = generateMagicSquare(3, start, seed);
      expect(isMagic(p.solution, 3, start)).toBe(true);
      expect(countMagicSolutions(p.puzzle, 3, start, 2)).toBe(1);
      expect(p.magicSum).toBe(magicSum(3, start));
    }
  });

  it('4x4 puzzles have exactly one solution', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const p = generateMagicSquare(4, 1, seed);
      expect(isMagic(p.solution, 4, 1)).toBe(true);
      expect(countMagicSolutions(p.puzzle, 4, 1, 2)).toBe(1);
    }
  }, 60_000);

  it('magic sums', () => {
    expect(magicSum(3, 1)).toBe(15);
    expect(magicSum(4, 1)).toBe(34);
    expect(magicSum(3, 10)).toBe(42);
  });
});
