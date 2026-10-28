import { describe, expect, it } from 'vitest';
import { compare } from '../check/compare';
import type { CheckSpec } from '../check/types';
import { PUZZLES_FOR_TEST } from './testPuzzles';
import { buildSheet, type Kind } from './buildSheet';
import { chessCheckSpec, chessSheet } from './chessSheet';

/** What a perfect photo of a correctly finished sheet would read as. */
function perfectRows(spec: CheckSpec): string[][] {
  switch (spec.type) {
    case 'grid':
      return spec.solution.map((r) => r.map(String));
    case 'logic':
      return spec.categories.map((category, c) => [category, ...spec.people.map((_, p) => spec.answers[p][c])]);
    case 'chess':
      return spec.puzzles.map((p) => [p.solution]);
  }
}

const read = (spec: CheckSpec, code: string) => ({ photo: 'ok' as const, sheetCode: code, answerKeyPage: false, rows: perfectRows(spec) });

describe('built sheets', () => {
  const kinds: Kind[] = ['sudoku6', 'sudoku9', 'kenken', 'logic', 'pyramid', 'magic'];
  for (const kind of kinds) {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      it(`${kind} ${level}: a perfect answer passes and the code is on page 1 only`, () => {
        const sheet = buildSheet(kind, level, 77, 'K7Q3');
        expect(compare(sheet.spec, 'K7Q3', read(sheet.spec, 'K7Q3')).status).toBe('pass');
        const [page1, page2] = sheet.html.split('<section class="page">').slice(1);
        expect(page1).toContain('Sheet K7Q3');
        expect(page2).not.toContain('K7Q3');
      });
    }
  }

  it('grid specs mark printed numbers as given', () => {
    const sheet = buildSheet('sudoku9', 'medium', 5, 'K7Q3');
    if (sheet.spec.type !== 'grid') throw new Error('expected grid');
    const givens = sheet.spec.given.flat().filter(Boolean).length;
    expect(givens).toBeGreaterThan(20);
    expect(givens).toBeLessThan(81);
  });

  it('logic sheets print a My answers table', () => {
    expect(buildSheet('logic', 'medium', 5, 'K7Q3').html).toContain('My answers');
  });

  it('chess sheets carry the code and a matching spec', () => {
    const html = chessSheet(PUZZLES_FOR_TEST, 'AC4D');
    expect(html.split('<section class="page">')[1]).toContain('Sheet AC4D');
    const spec = chessCheckSpec(PUZZLES_FOR_TEST);
    expect(compare(spec, 'AC4D', read(spec, 'AC4D')).status).toBe('pass');
  });
});
