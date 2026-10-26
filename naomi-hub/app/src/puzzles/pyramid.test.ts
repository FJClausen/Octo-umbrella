import { describe, expect, it } from 'vitest';
import { generatePyramid, pyramidRank, solvePyramid } from './pyramid';

describe('number pyramid', () => {
  for (const base of [4, 5, 6]) {
    it(`base ${base} is uniquely solvable step by step`, () => {
      for (let seed = 1; seed <= 6; seed++) {
        const p = generatePyramid(base, 15, seed * 613);
        expect(solvePyramid(p.shown)).toEqual(p.rows);
        expect(pyramidRank(p.shown)).toBe(base);
        const blanks = p.shown.flat().filter((v) => v === null).length;
        expect(blanks).toBeGreaterThan(0);
      }
    });
  }

  it('rows add up', () => {
    const p = generatePyramid(5, 9, 1);
    for (let k = 1; k < p.rows.length; k++) {
      p.rows[k].forEach((v, i) => expect(v).toBe(p.rows[k - 1][i] + p.rows[k - 1][i + 1]));
    }
  });

  it('rank detects under-determined pyramids', () => {
    expect(pyramidRank([[null, null, null], [3, null], [null]])).toBe(1);
  });
});
