import type { KenKenPuzzle } from '../puzzles/kenken';
import type { LogicGridPuzzle } from '../puzzles/logicGrid';
import type { MagicSquarePuzzle } from '../puzzles/magicSquare';
import type { PyramidPuzzle } from '../puzzles/pyramid';
import type { SudokuPuzzle } from '../puzzles/sudoku';
import { escapeHtml, renderSheet } from './html';

const GRID_CSS = `
.grid td { border: 1px solid #000; text-align: center; vertical-align: middle; font-weight: 600; }
.grid { border: 3px solid #000; }
`;

function sudokuTable(p: SudokuPuzzle, values: number[], cell: number): string {
  const rows: string[] = [];
  for (let r = 0; r < p.size; r++) {
    const tds: string[] = [];
    for (let c = 0; c < p.size; c++) {
      const v = values[r * p.size + c];
      const right = (c + 1) % p.boxCols === 0 && c < p.size - 1 ? 'border-right:3px solid #000;' : '';
      const bottom = (r + 1) % p.boxRows === 0 && r < p.size - 1 ? 'border-bottom:3px solid #000;' : '';
      tds.push(`<td style="width:${cell}px;height:${cell}px;font-size:${Math.round(cell * 0.5)}px;${right}${bottom}">${v || ''}</td>`);
    }
    rows.push(`<tr>${tds.join('')}</tr>`);
  }
  return `<table class="grid">${rows.join('')}</table>`;
}

export function sudokuSheet(p: SudokuPuzzle): string {
  const cell = p.size === 6 ? 70 : 54;
  const rule =
    p.size === 6
      ? 'Fill the grid so every row, column and 2×3 box contains 1–6 exactly once.'
      : 'Fill the grid so every row, column and 3×3 box contains 1–9 exactly once.';
  return renderSheet({
    title: `Sudoku ${p.size}×${p.size} (${p.difficulty})`,
    subtitle: rule,
    css: GRID_CSS,
    puzzleHtml: `<div class="center">${sudokuTable(p, p.puzzle, cell)}</div>`,
    answerHtml: `<div class="center">${sudokuTable(p, p.solution, Math.round(cell * 0.7))}</div>`,
  });
}

function kenkenTable(p: KenKenPuzzle, showSolution: boolean, cell: number): string {
  const n = p.size;
  const cageOf = new Array(n * n).fill(0);
  p.cages.forEach((cage, i) => cage.cells.forEach((c) => (cageOf[c] = i)));
  const labelCell = p.cages.map((cage) => Math.min(...cage.cells));
  const thick = '4px solid #000';
  const thin = '1px dashed #888';
  const rows: string[] = [];
  for (let r = 0; r < n; r++) {
    const tds: string[] = [];
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const id = cageOf[i];
      const top = r === 0 || cageOf[i - n] !== id ? thick : thin;
      const bottom = r === n - 1 || cageOf[i + n] !== id ? thick : thin;
      const left = c === 0 || cageOf[i - 1] !== id ? thick : thin;
      const right = c === n - 1 || cageOf[i + 1] !== id ? thick : thin;
      const cage = p.cages[id];
      const label =
        labelCell[id] === i
          ? `<div style="position:absolute;top:2px;left:4px;font-size:13pt;font-weight:700">${cage.target}${cage.op === '=' ? '' : cage.op}</div>`
          : '';
      const value = showSolution ? `<span style="font-size:${Math.round(cell * 0.45)}px">${p.solution[i]}</span>` : '';
      tds.push(
        `<td style="position:relative;width:${cell}px;height:${cell}px;border-top:${top};border-bottom:${bottom};border-left:${left};border-right:${right};text-align:center;vertical-align:middle">${label}${value}</td>`,
      );
    }
    rows.push(`<tr>${tds.join('')}</tr>`);
  }
  return `<table>${rows.join('')}</table>`;
}

export function kenkenSheet(p: KenKenPuzzle): string {
  const cell = p.size <= 4 ? 100 : p.size === 5 ? 86 : 74;
  return renderSheet({
    title: `KenKen ${p.size}×${p.size}`,
    subtitle: `Use 1–${p.size} once in every row and column. The numbers in each thick-outlined cage must make the target using the operation shown.`,
    puzzleHtml: `<div class="center">${kenkenTable(p, false, cell)}</div>`,
    answerHtml: `<div class="center">${kenkenTable(p, true, Math.round(cell * 0.7))}</div>`,
  });
}

export function logicGridSheet(p: LogicGridPuzzle): string {
  const people = p.categories[0];
  const cellStyle = 'border:1px solid #000;width:26px;height:26px;';
  const headStyle = 'border:1px solid #000;padding:2px 5px;font-size:12pt;font-weight:600;';
  const subGrid = (rows: { name: string; items: string[] }, cols: { name: string; items: string[] }) => {
    const vertical = 'writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;text-align:left;';
    const head = `<tr><th style="${headStyle}"></th>${cols.items.map((it) => `<th style="${headStyle}padding:5px 2px;vertical-align:bottom"><div style="${vertical}">${escapeHtml(it)}</div></th>`).join('')}</tr>`;
    const body = rows.items
      .map((r) => `<tr><th style="${headStyle};text-align:left">${escapeHtml(r)}</th>${cols.items.map(() => `<td style="${cellStyle}"></td>`).join('')}</tr>`)
      .join('');
    return `<div style="margin:0 0 10px 0"><div style="font-weight:700;margin-bottom:2px">${escapeHtml(rows.name)} × ${escapeHtml(cols.name)}</div><table>${head}${body}</table></div>`;
  };
  const grids: string[] = [];
  for (let a = 0; a < p.categories.length; a++) {
    for (let b = a + 1; b < p.categories.length; b++) grids.push(subGrid(p.categories[a], p.categories[b]));
  }
  const grid = `<div style="display:flex;flex-wrap:wrap;column-gap:14px">${grids.join('')}</div>`;
  const twoCols = p.clues.length > 8 ? 'column-count:2;column-gap:24px;' : '';
  const clues = `<ol style="${twoCols}margin:0;padding-left:28px">${p.clues.map((c) => `<li style="margin-bottom:4pt;break-inside:avoid">${escapeHtml(c)}</li>`).join('')}</ol>`;
  const answerHead = `<tr>${p.categories.map((c) => `<th style="${headStyle}">${escapeHtml(c.name)}</th>`).join('')}</tr>`;
  const answerRows = people.items
    .map((_, person) => `<tr>${p.categories.map((c, ci) => `<td style="${headStyle}">${escapeHtml(c.items[p.solution[ci][person]])}</td>`).join('')}</tr>`)
    .join('');
  return renderSheet({
    title: `Logic Grid: ${p.title}`,
    subtitle: `${p.intro} Use the clues. Mark ✗ for "no" and ● for "yes".`,
    puzzleHtml: `<h2>Clues</h2>${clues}<h2>Grid</h2>${grid}`,
    answerHtml: `<table>${answerHead}${answerRows}</table>`,
  });
}

function pyramidHtml(rows: (number | null)[][], cellW: number): string {
  const top = rows.length - 1;
  const lines: string[] = [];
  for (let k = top; k >= 0; k--) {
    const boxes = rows[k]
      .map(
        (v) =>
          `<div style="width:${cellW}px;height:${Math.round(cellW * 0.6)}px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:16pt;font-weight:600;margin:-1px">${v ?? ''}</div>`,
      )
      .join('');
    lines.push(`<div style="display:flex;justify-content:center">${boxes}</div>`);
  }
  return lines.join('');
}

export function pyramidSheet(p: PyramidPuzzle): string {
  const cellW = p.rows[0].length >= 6 ? 84 : 96;
  return renderSheet({
    title: 'Number Pyramid',
    subtitle: 'Each brick is the sum of the two bricks directly below it. Fill in every empty brick.',
    puzzleHtml: pyramidHtml(p.shown, cellW),
    answerHtml: pyramidHtml(p.rows, Math.round(cellW * 0.8)),
  });
}

export function magicSquareSheet(p: MagicSquarePuzzle): string {
  const last = p.start + p.size * p.size - 1;
  const table = (values: number[], cell: number) =>
    `<table class="grid">${Array.from({ length: p.size }, (_, r) => `<tr>${values
      .slice(r * p.size, r * p.size + p.size)
      .map((v) => `<td style="width:${cell}px;height:${cell}px;font-size:${Math.round(cell * 0.4)}px">${v || ''}</td>`)
      .join('')}</tr>`).join('')}</table>`;
  return renderSheet({
    title: `Magic Square ${p.size}×${p.size}`,
    subtitle: `Use each number from ${p.start} to ${last} exactly once. Every row, column and both diagonals must add up to ${p.magicSum}.`,
    css: GRID_CSS,
    puzzleHtml: `<div class="center">${table(p.puzzle, 110)}</div>`,
    answerHtml: `<div class="center">${table(p.solution, 80)}</div>`,
  });
}
