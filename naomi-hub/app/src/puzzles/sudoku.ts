import { makeRng, shuffle, type Rng } from './rng';

export type SudokuSize = 6 | 9;
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Flat row-major grid; 0 = empty. */
export type Grid = number[];

export interface SudokuPuzzle {
  kind: 'sudoku';
  size: SudokuSize;
  boxRows: number;
  boxCols: number;
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
}

export function boxShape(size: SudokuSize): { boxRows: number; boxCols: number } {
  return size === 6 ? { boxRows: 2, boxCols: 3 } : { boxRows: 3, boxCols: 3 };
}

function candidates(grid: Grid, size: SudokuSize, idx: number): number[] {
  const { boxRows, boxCols } = boxShape(size);
  const r = Math.floor(idx / size);
  const c = idx % size;
  const used = new Set<number>();
  for (let i = 0; i < size; i++) {
    used.add(grid[r * size + i]);
    used.add(grid[i * size + c]);
  }
  const br = r - (r % boxRows);
  const bc = c - (c % boxCols);
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) used.add(grid[(br + i) * size + bc + j]);
  }
  const out: number[] = [];
  for (let v = 1; v <= size; v++) if (!used.has(v)) out.push(v);
  return out;
}

/** Counts solutions up to `limit`. Picks the most constrained empty cell first. */
export function countSudokuSolutions(grid: Grid, size: SudokuSize, limit = 2): number {
  const g = grid.slice();
  let count = 0;
  const solve = (): boolean => {
    let best = -1;
    let bestCands: number[] | null = null;
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== 0) continue;
      const cands = candidates(g, size, i);
      if (cands.length === 0) return false;
      if (!bestCands || cands.length < bestCands.length) {
        best = i;
        bestCands = cands;
        if (cands.length === 1) break;
      }
    }
    if (best === -1) {
      count++;
      return count >= limit;
    }
    for (const v of bestCands!) {
      g[best] = v;
      if (solve()) return true;
    }
    g[best] = 0;
    return false;
  };
  solve();
  return count;
}

export function isValidSudokuSolution(grid: Grid, size: SudokuSize): boolean {
  if (grid.length !== size * size || grid.some((v) => v < 1 || v > size)) return false;
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    const g = grid.slice();
    g[i] = 0;
    if (!candidates(g, size, i).includes(v)) return false;
  }
  return true;
}

function fillGrid(rng: Rng, size: SudokuSize): Grid {
  const g: Grid = new Array(size * size).fill(0);
  const fill = (idx: number): boolean => {
    if (idx === g.length) return true;
    for (const v of shuffle(rng, candidates(g, size, idx))) {
      g[idx] = v;
      if (fill(idx + 1)) return true;
    }
    g[idx] = 0;
    return false;
  };
  fill(0);
  return g;
}

const TARGET_CLUES: Record<SudokuSize, Record<Difficulty, number>> = {
  6: { easy: 18, medium: 14, hard: 11 },
  9: { easy: 38, medium: 31, hard: 25 },
};

export function generateSudoku(
  size: SudokuSize,
  difficulty: Difficulty = 'medium',
  seed?: number,
): SudokuPuzzle {
  const rng = makeRng(seed);
  const solution = fillGrid(rng, size);
  const puzzle = solution.slice();
  const target = TARGET_CLUES[size][difficulty];
  let clues = puzzle.length;
  for (const idx of shuffle(rng, puzzle.map((_, i) => i))) {
    if (clues <= target) break;
    const keep = puzzle[idx];
    puzzle[idx] = 0;
    if (countSudokuSolutions(puzzle, size, 2) !== 1) puzzle[idx] = keep;
    else clues--;
  }
  return { kind: 'sudoku', size, ...boxShape(size), puzzle, solution, difficulty };
}
