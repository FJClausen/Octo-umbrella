import { generateKenKen, generateLogicGrid, generateMagicSquare, generatePyramid, generateSudoku, type Difficulty } from '../puzzles';
import { kenkenSheet, logicGridSheet, magicSquareSheet, pyramidSheet, sudokuSheet } from './puzzleSheets';

export type Kind = 'sudoku6' | 'sudoku9' | 'kenken' | 'logic' | 'pyramid' | 'magic';

/** Generates a fresh puzzle of `kind` at `level` and returns its printable HTML. */
export function buildSheet(kind: Kind, level: Difficulty, seed: number): string {
  const step = { easy: 0, medium: 1, hard: 2 }[level];
  switch (kind) {
    case 'sudoku6':
      return sudokuSheet(generateSudoku(6, level, seed));
    case 'sudoku9':
      return sudokuSheet(generateSudoku(9, level, seed));
    case 'kenken':
      return kenkenSheet(generateKenKen(4 + step, seed));
    case 'logic':
      return logicGridSheet(generateLogicGrid(([3, 4, 5] as const)[step], seed));
    case 'pyramid':
      return pyramidSheet(generatePyramid(4 + step, [9, 15, 25][step], seed));
    case 'magic':
      return level === 'hard'
        ? magicSquareSheet(generateMagicSquare(4, 1, seed))
        : magicSquareSheet(generateMagicSquare(3, level === 'easy' ? 1 : 2 + (seed % 19), seed));
  }
}
