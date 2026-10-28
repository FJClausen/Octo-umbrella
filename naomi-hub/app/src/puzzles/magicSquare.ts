import { makeRng, shuffle, type Rng } from './rng';

export interface MagicSquarePuzzle {
  kind: 'magic-square';
  size: 3 | 4;
  /** Numbers used are start .. start + size² - 1, each once. */
  start: number;
  magicSum: number;
  puzzle: number[];
  solution: number[];
}

export function magicSum(size: number, start: number): number {
  return (size * (size * size + 1)) / 2 + size * (start - 1);
}

/**
 * Counts fillings of `grid` (0 = empty) using each of start..start+n²-1 once
 * where every row, column and both diagonals add to the magic sum.
 */
export function countMagicSolutions(
  grid: number[],
  size: number,
  start: number,
  limit = 2,
  rng?: Rng,
  out?: number[],
): number {
  const n = size;
  const m = magicSum(n, start);
  const g = grid.slice();
  const used = new Set(g.filter((v) => v !== 0));
  const values = Array.from({ length: n * n }, (_, i) => start + i);
  let count = 0;

  const lineOk = (cells: number[]): boolean => {
    let sum = 0;
    let empty = 0;
    for (const c of cells) {
      if (g[c] === 0) empty++;
      else sum += g[c];
    }
    return empty === 0 ? sum === m : sum < m;
  };
  const rowCells = (r: number) => Array.from({ length: n }, (_, j) => r * n + j);
  const colCells = (c: number) => Array.from({ length: n }, (_, i) => i * n + c);
  const diag = Array.from({ length: n }, (_, i) => i * n + i);
  const anti = Array.from({ length: n }, (_, i) => i * n + (n - 1 - i));

  const consistent = (idx: number): boolean => {
    const r = Math.floor(idx / n);
    const c = idx % n;
    if (!lineOk(rowCells(r)) || !lineOk(colCells(c))) return false;
    if (r === c && !lineOk(diag)) return false;
    if (r + c === n - 1 && !lineOk(anti)) return false;
    return true;
  };

  const solve = (idx: number): boolean => {
    if (idx === g.length) {
      count++;
      if (out && count === 1) out.splice(0, out.length, ...g);
      return count >= limit;
    }
    if (g[idx] !== 0) return consistent(idx) && solve(idx + 1);
    const order = rng ? shuffle(rng, values) : values;
    for (const v of order) {
      if (used.has(v)) continue;
      g[idx] = v;
      used.add(v);
      if (consistent(idx) && solve(idx + 1)) return true;
      used.delete(v);
      g[idx] = 0;
    }
    return false;
  };
  solve(0);
  return count;
}

export function isMagic(grid: number[], size: number, start: number): boolean {
  const sorted = grid.slice().sort((a, b) => a - b);
  if (!sorted.every((v, i) => v === start + i)) return false;
  return countMagicSolutions(grid, size, start, 1) === 1;
}

const MIN_GIVENS: Record<3 | 4, number> = { 3: 2, 4: 6 };

export function generateMagicSquare(size: 3 | 4 = 3, start = 1, seed?: number): MagicSquarePuzzle {
  const rng = makeRng(seed);
  const solution: number[] = [];
  countMagicSolutions(new Array(size * size).fill(0), size, start, 1, rng, solution);
  const puzzle = solution.slice();
  let givens = puzzle.length;
  for (const idx of shuffle(rng, puzzle.map((_, i) => i))) {
    if (givens <= MIN_GIVENS[size]) break;
    const keep = puzzle[idx];
    puzzle[idx] = 0;
    if (countMagicSolutions(puzzle, size, start, 2) !== 1) puzzle[idx] = keep;
    else givens--;
  }
  return { kind: 'magic-square', size, start, magicSum: magicSum(size, start), puzzle, solution };
}
