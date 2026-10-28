import { describe, expect, it } from 'vitest';
import { countKenKenSolutions, generateKenKen } from './kenken';

describe('kenken', () => {
  for (const size of [4, 5, 6]) {
    it(`${size}x${size} has exactly one solution and valid cages`, () => {
      for (let seed = 1; seed <= 5; seed++) {
        const p = generateKenKen(size, seed * 104729);
        expect(countKenKenSolutions(size, p.cages, 2)).toBe(1);
        const covered = p.cages.flatMap((c) => c.cells).sort((a, b) => a - b);
        expect(covered).toEqual(Array.from({ length: size * size }, (_, i) => i));
        for (const cage of p.cages) {
          const vals = cage.cells.map((c) => p.solution[c]);
          if (cage.op === '=') expect(vals).toEqual([cage.target]);
          if (cage.op === '+') expect(vals.reduce((a, b) => a + b)).toBe(cage.target);
          if (cage.op === '×') expect(vals.reduce((a, b) => a * b)).toBe(cage.target);
          if (cage.op === '-') expect(Math.abs(vals[0] - vals[1])).toBe(cage.target);
          if (cage.op === '÷') expect(Math.max(...vals) / Math.min(...vals)).toBe(cage.target);
        }
      }
    });
  }

  it('solution is a Latin square', () => {
    const p = generateKenKen(5, 9);
    for (let r = 0; r < 5; r++) {
      expect(new Set(p.solution.slice(r * 5, r * 5 + 5)).size).toBe(5);
      expect(new Set([0, 1, 2, 3, 4].map((i) => p.solution[i * 5 + r])).size).toBe(5);
    }
  });
});
