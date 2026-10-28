import { Chess } from 'chess.js';
import { normalizeCode } from './code';
import type { CheckResult, CheckSpec, Transcription } from './types';

type Cell = 'correct' | 'wrong' | 'empty' | 'unclear';

function tally(cells: Cell[], needed: number): Omit<CheckResult, 'status'> {
  const count = (k: Cell) => cells.filter((c) => c === k).length;
  return { correct: count('correct'), wrong: count('wrong'), empty: count('empty'), unclear: count('unclear'), total: cells.length, needed };
}

function gridCell(written: string | undefined, expected: number): Cell {
  const s = (written ?? '').trim();
  if (s === '') return 'empty';
  if (s.includes('?')) return 'unclear';
  const digits = s.replace(/[^0-9]/g, '');
  if (digits === '') return 'unclear';
  return Number(digits) === expected ? 'correct' : 'wrong';
}

function letters(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
}

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/** Closest option to a child's spelling, or null if nothing is close enough. */
export function matchOption(written: string, options: string[]): string | null {
  const w = letters(written);
  if (!w) return null;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const opt of options) {
    const o = letters(opt);
    const score = o === w ? 0 : o.startsWith(w) && w.length >= 3 ? 0.5 : distance(o, w);
    if (score < bestScore) {
      best = opt;
      bestScore = score;
    }
  }
  const tolerance = Math.max(1, Math.floor(letters(best ?? '').length / 4));
  return bestScore <= tolerance ? best : null;
}

function logicCell(written: string | undefined, expected: string, options: string[]): Cell {
  const s = (written ?? '').trim();
  if (s === '') return 'empty';
  if (s.includes('?')) return 'unclear';
  const match = matchOption(s, options);
  if (!match) return 'unclear';
  return match === expected ? 'correct' : 'wrong';
}

function sanKey(s: string): string {
  return s
    .replace(/0-0-0|o-o-o/gi, 'O-O-O')
    .replace(/0-0|o-o/gi, 'O-O')
    .replace(/[x+#!?=:\-\s.]/gi, '')
    .toLowerCase();
}

/** Legal moves (UCI) that a handwritten move could mean. */
export function readMove(fen: string, written: string): string[] {
  const game = new Chess(fen);
  const key = sanKey(written);
  if (!key) return [];
  return game
    .moves({ verbose: true })
    .filter((m) => sanKey(m.san) === key || m.lan === key)
    .map((m) => m.lan);
}

function chessCell(written: string | undefined, p: { fen: string; solution: string; mateInOne: boolean }): Cell {
  const s = (written ?? '').trim();
  if (s === '') return 'empty';
  if (s.includes('?')) return 'unclear';
  const moves = readMove(p.fen, s);
  if (moves.length === 0) return 'wrong';
  const good = moves.some((uci) => {
    if (uci === p.solution) return true;
    if (!p.mateInOne) return false;
    const g = new Chess(p.fen);
    g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return g.isCheckmate();
  });
  return good ? 'correct' : 'wrong';
}

function cellsFor(spec: CheckSpec, rows: string[][]): { cells: Cell[]; needed: number } {
  switch (spec.type) {
    case 'grid': {
      const cells: Cell[] = [];
      spec.solution.forEach((row, r) =>
        row.forEach((value, c) => {
          if (!spec.given[r][c]) cells.push(gridCell(rows[r]?.[c], value));
        }),
      );
      return { cells, needed: cells.length };
    }
    case 'logic': {
      const cells: Cell[] = [];
      spec.categories.forEach((category, c) => {
        // Find the row by its category name; fall back to the printed order.
        const row = rows.find((r) => matchOption(r[0] ?? '', spec.categories) === category) ?? rows[c] ?? [];
        spec.people.forEach((_, p) => cells.push(logicCell(row[p + 1], spec.answers[p][c], spec.options[c])));
      });
      return { cells, needed: cells.length };
    }
    case 'chess': {
      const cells = spec.puzzles.map((p, i) => chessCell(rows[i]?.[0], p));
      return { cells, needed: Math.min(4, cells.length) };
    }
  }
}

/** Compares what Claude read off the photo with the stored solution. */
export function compare(spec: CheckSpec, code: string, t: Transcription): CheckResult {
  const { cells, needed } = cellsFor(spec, t.rows);
  const counts = tally(cells, needed);
  const result = (status: CheckResult['status']): CheckResult => ({ status, ...counts });

  if (t.photo === 'not_a_worksheet') return result('not-a-sheet');
  if (t.answerKeyPage) return result('answer-key');
  const seen = normalizeCode(t.sheetCode);
  if (!seen) return result('no-code');
  if (seen !== normalizeCode(code)) return result('wrong-sheet');

  if (spec.type === 'chess') {
    if (counts.correct >= needed) return result('pass');
    if (counts.unclear > 0) return result('unclear');
    if (counts.correct + counts.wrong < needed) return result('incomplete');
    return result('wrong');
  }
  if (counts.unclear > 0) return result('unclear');
  if (counts.empty > 0) return result('incomplete');
  if (counts.wrong > 0) return result('wrong');
  return result('pass');
}
