import { describe, expect, it } from 'vitest';
import { newSheetCode, normalizeCode } from './code';
import { compare, matchOption, readMove } from './compare';
import type { CheckSpec, Transcription } from './types';

const grid: CheckSpec = {
  type: 'grid',
  solution: [
    [1, 2],
    [2, 1],
  ],
  given: [
    [true, false],
    [false, false],
  ],
};

const photo = (rows: string[][], extra: Partial<Transcription> = {}): Transcription => ({
  photo: 'ok',
  sheetCode: 'K7Q3',
  answerKeyPage: false,
  rows,
  ...extra,
});

describe('grid sheets', () => {
  it('passes when every blank cell is right', () => {
    const r = compare(grid, 'K7Q3', photo([['1', '2'], ['2', '1']]));
    expect(r).toMatchObject({ status: 'pass', correct: 3, total: 3 });
  });

  it('ignores misread printed givens', () => {
    expect(compare(grid, 'K7Q3', photo([['7', '2'], ['2', '1']])).status).toBe('pass');
  });

  it('counts wrong, empty and unclear cells', () => {
    expect(compare(grid, 'K7Q3', photo([['1', '3'], ['2', '1']]))).toMatchObject({ status: 'wrong', wrong: 1 });
    expect(compare(grid, 'K7Q3', photo([['1', ''], ['2', '1']]))).toMatchObject({ status: 'incomplete', empty: 1 });
    expect(compare(grid, 'K7Q3', photo([['1', '?'], ['2', '3']]))).toMatchObject({ status: 'unclear', unclear: 1, wrong: 1 });
  });

  it('treats missing rows as empty', () => {
    expect(compare(grid, 'K7Q3', photo([['1', '2']])).status).toBe('incomplete');
  });

  it('rejects the wrong sheet, the answer key and photos without a code', () => {
    const good = [['1', '2'], ['2', '1']];
    expect(compare(grid, 'K7Q3', photo(good, { sheetCode: 'AC4D' })).status).toBe('wrong-sheet');
    expect(compare(grid, 'K7Q3', photo(good, { answerKeyPage: true })).status).toBe('answer-key');
    expect(compare(grid, 'K7Q3', photo(good, { sheetCode: '' })).status).toBe('no-code');
    expect(compare(grid, 'K7Q3', photo(good, { photo: 'not_a_worksheet' })).status).toBe('not-a-sheet');
  });

  it('matches codes regardless of case and spacing', () => {
    expect(compare(grid, 'K7Q3', photo([['1', '2'], ['2', '1']], { sheetCode: 'k7 q3' })).status).toBe('pass');
  });
});

const logic: CheckSpec = {
  type: 'logic',
  people: ['Isla', 'Jonas'],
  categories: ['Pet', 'Snack'],
  options: [
    ['parrot', 'tortoise'],
    ['grapes', 'apple slices'],
  ],
  answers: [
    ['tortoise', 'grapes'],
    ['parrot', 'apple slices'],
  ],
};

describe('logic sheets', () => {
  it('accepts small spelling slips and rows in any order', () => {
    const r = compare(logic, 'K7Q3', photo([['Snack', 'grapes', 'apples'], ['Pet', 'Tortoise', 'parot']]));
    expect(r.status).toBe('pass');
  });

  it('marks a wrong answer wrong and nonsense as unclear', () => {
    expect(compare(logic, 'K7Q3', photo([['Pet', 'parrot', 'parrot'], ['Snack', 'grapes', 'apple slices']])).status).toBe('wrong');
    expect(compare(logic, 'K7Q3', photo([['Pet', 'zebra', 'parrot'], ['Snack', 'grapes', 'apple slices']])).status).toBe('unclear');
  });

  it('matchOption picks the closest spelling or nothing', () => {
    expect(matchOption('torTise', ['parrot', 'tortoise'])).toBe('tortoise');
    expect(matchOption('dog', ['parrot', 'tortoise'])).toBeNull();
  });
});

const backRank = { fen: '6k1/5ppp/8/8/8/8/r4PPP/4R1K1 w - - 1 2', solution: 'e1e8', mateInOne: true };

describe('chess sheets', () => {
  it('reads handwritten notation loosely', () => {
    for (const w of ['Re8#', 're8', 'RE8', 'R-e8', 'Rxe8', 'e1e8', 'Re8+']) {
      expect(readMove(backRank.fen, w), w).toEqual(['e1e8']);
    }
    expect(readMove(backRank.fen, 'Qh7')).toEqual([]);
  });

  it('passes with at least 4 of 6 correct', () => {
    const spec: CheckSpec = { type: 'chess', puzzles: Array(6).fill(backRank) };
    expect(compare(spec, 'K7Q3', photo([['Re8#'], ['Re8'], ['re8'], ['Re8'], ['h3'], ['']])).status).toBe('pass');
    expect(compare(spec, 'K7Q3', photo([['Re8#'], ['Re8'], ['h3'], ['h4'], ['g3'], ['f3']])).status).toBe('wrong');
    expect(compare(spec, 'K7Q3', photo([['Re8#'], ['Re8'], ['?'], ['?'], [''], ['']])).status).toBe('unclear');
    expect(compare(spec, 'K7Q3', photo([['Re8#'], ['Re8'], [''], [''], [''], ['']])).status).toBe('incomplete');
  });

  it('accepts any other checkmate in a mate-in-one', () => {
    const twoMates = { fen: '6k1/5ppp/8/8/8/8/5PPP/R3R1K1 w - - 0 1', solution: 'e1e8', mateInOne: true };
    expect(compare({ type: 'chess', puzzles: [twoMates] }, 'K7Q3', photo([['Ra8#']])).status).toBe('pass');
  });
});

describe('sheet codes', () => {
  it('are 4 unambiguous characters', () => {
    for (let i = 0; i < 50; i++) expect(newSheetCode()).toMatch(/^[ACDEFHJKMNPRTWXY3479]{4}$/);
    expect(normalizeCode(' k7-q3 ')).toBe('K7Q3');
  });
});
