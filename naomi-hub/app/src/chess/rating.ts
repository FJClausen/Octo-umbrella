import type { ChessPuzzle } from './types';

export const START_RATING = 600;
export const MIN_RATING = 400;
export const MAX_RATING = 2000;
export const ROUND_SIZE = 5;

export function expectedScore(player: number, puzzle: number): number {
  return 1 / (1 + Math.pow(10, (puzzle - player) / 400));
}

/** Elo-style update. Bigger steps for the first 30 puzzles so the rating settles fast. */
export function updateRating(player: number, puzzle: number, solved: boolean, played: number): number {
  const k = played < 30 ? 40 : 24;
  const next = player + k * ((solved ? 1 : 0) - expectedScore(player, puzzle));
  return Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, next)));
}

export interface PickOptions {
  rating: number;
  seen: ReadonlySet<string>;
  theme?: string;
  random?: () => number;
}

/** Picks an unseen puzzle near the player's rating, widening the window until something fits. */
export function pickPuzzle(puzzles: readonly ChessPuzzle[], opts: PickOptions): ChessPuzzle | null {
  const random = opts.random ?? Math.random;
  const pool = opts.theme ? puzzles.filter((p) => p.themes.includes(opts.theme!)) : puzzles;
  if (pool.length === 0) return null;
  for (const window of [75, 150, 250, 400, 3000]) {
    const near = pool.filter((p) => Math.abs(p.rating - opts.rating) <= window);
    const fresh = near.filter((p) => !opts.seen.has(p.id));
    const choice = fresh.length ? fresh : window === 3000 ? near : [];
    if (choice.length) return choice[Math.floor(random() * choice.length)];
  }
  return null;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Same puzzle all day for a given date key (YYYY-MM-DD) and starting rating band. */
export function dailyPuzzle(puzzles: readonly ChessPuzzle[], dateKey: string, rating: number): ChessPuzzle | null {
  const band = puzzles.filter((p) => Math.abs(p.rating - rating) <= 200);
  const pool = band.length ? band : puzzles;
  if (!pool.length) return null;
  return pool[hash(dateKey) % pool.length];
}

export const THEME_LABELS: Record<string, string> = {
  mateIn1: 'Mate in 1',
  mateIn2: 'Mate in 2',
  mateIn3: 'Mate in 3',
  fork: 'Forks',
  pin: 'Pins',
  skewer: 'Skewers',
  hangingPiece: 'Hanging pieces',
  discoveredAttack: 'Discovered attacks',
  backRankMate: 'Back-rank mates',
  doubleCheck: 'Double check',
  deflection: 'Deflection',
  attraction: 'Attraction',
  sacrifice: 'Sacrifices',
  promotion: 'Promotion',
  endgame: 'Endgames',
  trappedPiece: 'Trapped pieces',
};
