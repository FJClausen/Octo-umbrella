import { describe, expect, it } from 'vitest';
import { countLogicGridSolutions, generateLogicGrid, MAX_CLUES } from './logicGrid';

describe('logic grid', () => {
  for (const size of [3, 4, 5] as const) {
    it(`${size} items has exactly one solution`, () => {
      for (let seed = 1; seed <= 4; seed++) {
        const p = generateLogicGrid(size, seed * 31337);
        expect(countLogicGridSolutions(size, p.categories.length, p.rawClues, 2)).toBe(1);
        expect(p.clues.length).toBe(p.rawClues.length);
        expect(p.clues.length).toBeLessThanOrEqual(MAX_CLUES[size]);
        p.categories.forEach((c) => expect(c.items).toHaveLength(size));
      }
    });
  }

  it('every clue is minimal (removing any one breaks uniqueness)', () => {
    const p = generateLogicGrid(4, 5);
    for (const clue of p.rawClues) {
      const without = p.rawClues.filter((c) => c !== clue);
      expect(countLogicGridSolutions(4, p.categories.length, without, 2)).toBe(2);
    }
  });

  it('uses the right article', () => {
    for (let seed = 1; seed <= 40; seed++) {
      generateLogicGrid(4, seed).clues.forEach((c) => expect(c).not.toMatch(/\ba [aeiou]/i));
    }
  });

  it('clues read as sentences', () => {
    const p = generateLogicGrid(4, 11);
    p.clues.forEach((c) => expect(c).toMatch(/^[A-Z].*\.$/));
  });
});
