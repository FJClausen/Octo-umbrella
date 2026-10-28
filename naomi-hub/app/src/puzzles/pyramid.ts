import { makeRng, randInt, shuffle } from './rng';

export interface PyramidPuzzle {
  kind: 'pyramid';
  /** rows[0] is the base; rows[k][i] = rows[k-1][i] + rows[k-1][i+1]. */
  rows: number[][];
  /** Same shape as rows; null = blank for the solver. */
  shown: (number | null)[][];
}

/** Fills blanks by repeatedly applying top = left + right. Returns null if it gets stuck. */
export function solvePyramid(shown: (number | null)[][]): number[][] | null {
  const g = shown.map((r) => r.slice());
  let progress = true;
  while (progress) {
    progress = false;
    for (let k = 1; k < g.length; k++) {
      for (let i = 0; i < g[k].length; i++) {
        const top = g[k][i];
        const l = g[k - 1][i];
        const r = g[k - 1][i + 1];
        const known = [top, l, r].filter((v) => v !== null).length;
        if (known !== 2) continue;
        if (top === null) g[k][i] = l! + r!;
        else if (l === null) g[k - 1][i] = top - r!;
        else g[k - 1][i + 1] = top - l;
        progress = true;
      }
    }
  }
  return g.every((row) => row.every((v) => v !== null)) ? (g as number[][]) : null;
}

/**
 * Rank of the revealed cells' coefficient vectors over the base values.
 * Rank === base length means the shown numbers pin down exactly one pyramid.
 */
export function pyramidRank(shown: (number | null)[][]): number {
  const n = shown[0].length;
  let coeff: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  const rows: number[][] = [];
  for (let k = 0; k < shown.length; k++) {
    if (k > 0) coeff = coeff.slice(0, -1).map((v, i) => v.map((x, j) => x + coeff[i + 1][j]));
    shown[k].forEach((v, i) => {
      if (v !== null) rows.push(coeff[i].slice());
    });
  }
  // Fraction-free Gaussian elimination.
  let rank = 0;
  for (let col = 0; col < n && rank < rows.length; col++) {
    const pivot = rows.findIndex((r, idx) => idx >= rank && r[col] !== 0);
    if (pivot === -1) continue;
    [rows[rank], rows[pivot]] = [rows[pivot], rows[rank]];
    for (let r = 0; r < rows.length; r++) {
      if (r === rank || rows[r][col] === 0) continue;
      const a = rows[rank][col];
      const b = rows[r][col];
      rows[r] = rows[r].map((x, j) => x * a - rows[rank][j] * b);
    }
    rank++;
  }
  return rank;
}

export function generatePyramid(base = 5, maxBase = 12, seed?: number): PyramidPuzzle {
  const rng = makeRng(seed);
  const rows: number[][] = [Array.from({ length: base }, () => randInt(rng, 1, maxBase))];
  while (rows[rows.length - 1].length > 1) {
    const prev = rows[rows.length - 1];
    rows.push(prev.slice(0, -1).map((v, i) => v + prev[i + 1]));
  }
  const cells = rows.flatMap((r, k) => r.map((_, i) => [k, i] as const));
  let shown: (number | null)[][] = rows.map((r) => r.map(() => null));
  // Reveal random cells until the pyramid can be solved step by step.
  for (const [k, i] of shuffle(rng, cells)) {
    shown[k][i] = rows[k][i];
    if (solvePyramid(shown)) break;
  }
  // Hide any revealed cell that is not needed.
  for (const [k, i] of shuffle(rng, cells)) {
    if (shown[k][i] === null) continue;
    const trial = shown.map((r) => r.slice());
    trial[k][i] = null;
    if (solvePyramid(trial)) shown = trial;
  }
  return { kind: 'pyramid', rows, shown };
}
