import { describe, expect, it } from 'vitest';
import { generateKenKen, generateLogicGrid, generateMagicSquare, generatePyramid, generateSudoku } from '../puzzles';
import { PUZZLES_FOR_TEST } from './testPuzzles';
import { chessSheet } from './chessSheet';
import { splitSheet } from './html';
import { kenkenSheet, logicGridSheet, magicSquareSheet, pyramidSheet, sudokuSheet } from './puzzleSheets';

const sheets = {
  sudoku6: sudokuSheet(generateSudoku(6, 'easy', 1)),
  sudoku9: sudokuSheet(generateSudoku(9, 'hard', 1)),
  kenken: kenkenSheet(generateKenKen(5, 1)),
  logic: logicGridSheet(generateLogicGrid(4, 1)),
  pyramid: pyramidSheet(generatePyramid(5, 12, 1)),
  magic: magicSquareSheet(generateMagicSquare(3, 1, 1)),
  chess: chessSheet(PUZZLES_FOR_TEST),
};

describe('print sheets', () => {
  for (const [name, html] of Object.entries(sheets)) {
    it(`${name}: prints one page; the answer key stays in the app`, () => {
      const { print, answers } = splitSheet(html);
      expect(print.match(/<section class="page">/g) ?? []).toHaveLength(1);
      expect(print).not.toContain('Answer key');
      expect(answers).toContain('Answer key');
      expect(answers!.match(/<section class="page">/g) ?? []).toHaveLength(1);
    });

    it(`${name}: black, white and gray only`, () => {
      const colors = html.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
      for (const c of colors) {
        const hex = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        expect(r === g && g === b, `${c} is not gray`).toBe(true);
      }
    });

    it(`${name}: no text below 12pt`, () => {
      for (const m of html.matchAll(/font-size:\s*(\d+)(pt|px)/g)) {
        const pt = m[2] === 'pt' ? Number(m[1]) : Number(m[1]) * 0.75;
        expect(pt).toBeGreaterThanOrEqual(12);
      }
    });
  }

  it('chess sheet shows six diagrams', () => {
    expect(sheets.chess.match(/My move:/g)).toHaveLength(6);
  });
});
