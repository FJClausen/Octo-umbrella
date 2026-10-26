import { loadJson, saveJson } from './storage';

/** Point values from the spec. */
export const POINTS = {
  expedition: 50,
  backyard: 30,
  desk: 20,
  ipad: 10,
  misionBonus: 10,
} as const;

export type PointKind = keyof typeof POINTS;

export interface PointEntry {
  at: string;
  activity: string;
  kind: PointKind;
  points: number;
  note?: string;
}

export interface PointsState {
  total: number;
  log: PointEntry[];
}

const KEY = 'points-v1';
const EMPTY: PointsState = { total: 0, log: [] };

export function loadPoints(): Promise<PointsState> {
  return loadJson(KEY, EMPTY);
}

export async function awardPoints(activity: string, kind: PointKind, note?: string): Promise<PointsState> {
  const state = await loadPoints();
  const entry: PointEntry = { at: new Date().toISOString(), activity, kind, points: POINTS[kind], note };
  const next = { total: state.total + entry.points, log: [entry, ...state.log].slice(0, 500) };
  await saveJson(KEY, next);
  return next;
}

export function todayPoints(state: PointsState, now = new Date()): number {
  const day = now.toDateString();
  return state.log.filter((e) => new Date(e.at).toDateString() === day).reduce((a, e) => a + e.points, 0);
}
