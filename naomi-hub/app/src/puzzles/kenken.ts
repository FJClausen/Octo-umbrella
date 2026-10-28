import { makeRng, randInt, shuffle, type Rng } from './rng';

export type KenKenOp = '+' | '-' | '×' | '÷' | '=';

export interface Cage {
  cells: number[];
  op: KenKenOp;
  target: number;
}

export interface KenKenPuzzle {
  kind: 'kenken';
  size: number;
  cages: Cage[];
  solution: number[];
}

function latinSquare(rng: Rng, n: number): number[] {
  const g = new Array(n * n).fill(0);
  const ok = (idx: number, v: number) => {
    const r = Math.floor(idx / n);
    const c = idx % n;
    for (let i = 0; i < n; i++) if (g[r * n + i] === v || g[i * n + c] === v) return false;
    return true;
  };
  const fill = (idx: number): boolean => {
    if (idx === g.length) return true;
    for (const v of shuffle(rng, Array.from({ length: n }, (_, i) => i + 1))) {
      if (!ok(idx, v)) continue;
      g[idx] = v;
      if (fill(idx + 1)) return true;
      g[idx] = 0;
    }
    return false;
  };
  fill(0);
  return g;
}

function neighbors(idx: number, n: number): number[] {
  const r = Math.floor(idx / n);
  const c = idx % n;
  const out: number[] = [];
  if (r > 0) out.push(idx - n);
  if (r < n - 1) out.push(idx + n);
  if (c > 0) out.push(idx - 1);
  if (c < n - 1) out.push(idx + 1);
  return out;
}

function partition(rng: Rng, n: number, maxCage: number): number[][] {
  const owner = new Array(n * n).fill(-1);
  const cages: number[][] = [];
  for (const start of shuffle(rng, Array.from({ length: n * n }, (_, i) => i))) {
    if (owner[start] !== -1) continue;
    const id = cages.length;
    const cells = [start];
    owner[start] = id;
    const size = randInt(rng, 1, maxCage) === 1 && rng() < 0.6 ? 2 : randInt(rng, 1, maxCage);
    while (cells.length < size) {
      const frontier = cells.flatMap((c) => neighbors(c, n)).filter((c) => owner[c] === -1);
      if (frontier.length === 0) break;
      const next = frontier[Math.floor(rng() * frontier.length)];
      owner[next] = id;
      cells.push(next);
    }
    cages.push(cells);
  }
  return cages;
}

export function chooseOp(rng: Rng, values: number[]): { op: KenKenOp; target: number } {
  if (values.length === 1) return { op: '=', target: values[0] };
  const sum = values.reduce((a, b) => a + b, 0);
  const prod = values.reduce((a, b) => a * b, 1);
  if (values.length === 2) {
    const [hi, lo] = values[0] >= values[1] ? values : [values[1], values[0]];
    const opts: { op: KenKenOp; target: number }[] = [
      { op: '+', target: sum },
      { op: '-', target: hi - lo },
      { op: '×', target: prod },
    ];
    if (hi % lo === 0) opts.push({ op: '÷', target: hi / lo }, { op: '÷', target: hi / lo });
    return opts[Math.floor(rng() * opts.length)];
  }
  return rng() < 0.55 || prod > 360 ? { op: '+', target: sum } : { op: '×', target: prod };
}

function cageSatisfied(cage: Cage, values: number[]): boolean {
  switch (cage.op) {
    case '=':
      return values[0] === cage.target;
    case '+':
      return values.reduce((a, b) => a + b, 0) === cage.target;
    case '×':
      return values.reduce((a, b) => a * b, 1) === cage.target;
    case '-':
      return Math.abs(values[0] - values[1]) === cage.target;
    case '÷': {
      const [a, b] = values;
      return Math.max(a, b) === cage.target * Math.min(a, b);
    }
  }
}

function cagePartialOk(cage: Cage, values: number[]): boolean {
  if (cage.op === '+') return values.reduce((a, b) => a + b, 0) < cage.target;
  if (cage.op === '×') return cage.target % values.reduce((a, b) => a * b, 1) === 0;
  return true;
}

export function countKenKenSolutions(size: number, cages: Cage[], limit = 2): number {
  const n = size;
  const g = new Array(n * n).fill(0);
  const cageOf = new Array(n * n).fill(0);
  cages.forEach((cage, i) => cage.cells.forEach((c) => (cageOf[c] = i)));
  let count = 0;
  const solve = (idx: number): boolean => {
    if (idx === g.length) {
      count++;
      return count >= limit;
    }
    const r = Math.floor(idx / n);
    const c = idx % n;
    const cage = cages[cageOf[idx]];
    for (let v = 1; v <= n; v++) {
      let clash = false;
      for (let i = 0; i < n && !clash; i++) {
        if (g[r * n + i] === v || g[i * n + c] === v) clash = true;
      }
      if (clash) continue;
      g[idx] = v;
      const filled = cage.cells.filter((cell) => g[cell] !== 0);
      const vals = filled.map((cell) => g[cell]);
      const ok =
        filled.length === cage.cells.length ? cageSatisfied(cage, vals) : cagePartialOk(cage, vals);
      if (ok && solve(idx + 1)) return true;
      g[idx] = 0;
    }
    return false;
  };
  solve(0);
  return count;
}

export function generateKenKen(size = 5, seed?: number): KenKenPuzzle {
  const rng = makeRng(seed);
  const solution = latinSquare(rng, size);
  const groups = partition(rng, size, size >= 6 ? 4 : 3);
  let cages: Cage[] = groups.map((cells) => ({
    cells,
    ...chooseOp(rng, cells.map((c) => solution[c])),
  }));
  // Split cages into single-cell givens until exactly one solution remains.
  while (countKenKenSolutions(size, cages) !== 1) {
    const splittable = cages
      .map((cage, i) => ({ cage, i }))
      .filter(({ cage }) => cage.cells.length > 1)
      .sort((a, b) => b.cage.cells.length - a.cage.cells.length);
    const { cage, i } = splittable[0];
    const cut = cage.cells[cage.cells.length - 1];
    const rest = cage.cells.slice(0, -1);
    cages = [
      ...cages.slice(0, i),
      { cells: rest, ...chooseOp(rng, rest.map((c) => solution[c])) },
      { cells: [cut], op: '=', target: solution[cut] },
      ...cages.slice(i + 1),
    ];
  }
  return { kind: 'kenken', size, cages, solution };
}
