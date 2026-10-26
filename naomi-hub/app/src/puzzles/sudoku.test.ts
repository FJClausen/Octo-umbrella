import { describe, expect, it } from 'vitest';
import { countSudokuSolutions, generateSudoku, isValidSudokuSolution, type SudokuSize } from './sudoku';

describe('sudoku', () => {
  for (const size of [6, 9] as SudokuSize[]) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      it(`${size}x${size} ${difficulty} has exactly one solution`, () => {
        for (let seed = 1; seed <= 5; seed++) {
          const p = generateSudoku(size, difficulty, seed * 7919);
          expect(isValidSudokuSolution(p.solution, size)).toBe(true);
          expect(countSudokuSolutions(p.puzzle, size, 2)).toBe(1);
          p.puzzle.forEach((v, i) => v !== 0 && expect(v).toBe(p.solution[i]));
        }
      });
    }
  }

  it('is reproducible from a seed', () => {
    expect(generateSudoku(9, 'medium', 42).puzzle).toEqual(generateSudoku(9, 'medium', 42).puzzle);
  });

  it('detects multiple solutions on an empty grid', () => {
    expect(countSudokuSolutions(new Array(36).fill(0), 6, 2)).toBe(2);
  });

  it('harder puzzles show fewer clues', () => {
    const clues = (d: 'easy' | 'hard') => generateSudoku(9, d, 3).puzzle.filter((v) => v).length;
    expect(clues('hard')).toBeLessThan(clues('easy'));
  });
});
