import { START_RATING } from '../chess/rating';
import { loadJson, saveJson } from './storage';

export interface ChessProgress {
  rating: number;
  played: number;
  solved: number;
  seen: string[];
  daily: { date: string; id: string; done: boolean } | null;
  history: { at: string; id: string; solved: boolean; rating: number }[];
}

const KEY = 'chess-v1';
const EMPTY: ChessProgress = { rating: START_RATING, played: 0, solved: 0, seen: [], daily: null, history: [] };

export function loadChess(): Promise<ChessProgress> {
  return loadJson(KEY, EMPTY);
}

export function saveChess(p: ChessProgress): Promise<void> {
  return saveJson(KEY, { ...p, seen: p.seen.slice(-2000), history: p.history.slice(-300) });
}

export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
