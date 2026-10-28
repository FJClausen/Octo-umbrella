import type { CheckSpec, ReadKind } from '../check/types';
import { generateKenKen, generateLogicGrid, generateMagicSquare, generatePyramid, generateSudoku, type Difficulty } from '../puzzles';
import { kenkenSheet, logicGridSheet, magicSquareSheet, pyramidSheet, sudokuSheet } from './puzzleSheets';

export type Kind = 'sudoku6' | 'sudoku9' | 'kenken' | 'logic' | 'pyramid' | 'magic';

export interface BuiltSheet {
  html: string;
  title: string;
  readKind: ReadKind;
  /** Everything needed to check a photo of the finished page. */
  spec: CheckSpec;
}

const toRows = (flat: number[], size: number) => Array.from({ length: size }, (_, r) => flat.slice(r * size, r * size + size));

function gridSpec(solution: number[][], given: boolean[][]): CheckSpec {
  return { type: 'grid', solution, given };
}

/** Generates a fresh puzzle of `kind` at `level`, with `code` printed on page 1. */
export function buildSheet(kind: Kind, level: Difficulty, seed: number, code?: string): BuiltSheet {
  const step = { easy: 0, medium: 1, hard: 2 }[level];
  switch (kind) {
    case 'sudoku6':
    case 'sudoku9': {
      const p = generateSudoku(kind === 'sudoku6' ? 6 : 9, level, seed);
      return {
        html: sudokuSheet(p, code),
        title: `Sudoku ${p.size}×${p.size}`,
        readKind: 'sudoku',
        spec: gridSpec(toRows(p.solution, p.size), toRows(p.puzzle, p.size).map((r) => r.map((v) => v !== 0))),
      };
    }
    case 'kenken': {
      const p = generateKenKen(4 + step, seed);
      const solution = toRows(p.solution, p.size);
      return {
        html: kenkenSheet(p, code),
        title: `KenKen ${p.size}×${p.size}`,
        readKind: 'kenken',
        spec: gridSpec(solution, solution.map((r) => r.map(() => false))),
      };
    }
    case 'logic': {
      const p = generateLogicGrid(([3, 4, 5] as const)[step], seed);
      const [people, ...others] = p.categories;
      return {
        html: logicGridSheet(p, code),
        title: `Logic grid: ${p.title}`,
        readKind: 'logic-grid',
        spec: {
          type: 'logic',
          people: people.items,
          categories: others.map((c) => c.name),
          options: others.map((c) => c.items),
          answers: people.items.map((_, person) => others.map((c, ci) => c.items[p.solution[ci + 1][person]])),
        },
      };
    }
    case 'pyramid': {
      const p = generatePyramid(4 + step, [9, 15, 25][step], seed);
      // Printed top brick first.
      const rows = p.rows.slice().reverse();
      const shown = p.shown.slice().reverse();
      return {
        html: pyramidSheet(p, code),
        title: 'Number pyramid',
        readKind: 'pyramid',
        spec: gridSpec(rows, shown.map((r) => r.map((v) => v !== null))),
      };
    }
    case 'magic': {
      const p =
        level === 'hard' ? generateMagicSquare(4, 1, seed) : generateMagicSquare(3, level === 'easy' ? 1 : 2 + (seed % 19), seed);
      return {
        html: magicSquareSheet(p, code),
        title: `Magic square ${p.size}×${p.size}`,
        readKind: 'magic-square',
        spec: gridSpec(toRows(p.solution, p.size), toRows(p.puzzle, p.size).map((r) => r.map((v) => v !== 0))),
      };
    }
  }
}
