import type { Lang } from '../geo/data';
import { START_RATING } from '../geo/quiz';
import { loadJson, saveJson } from './storage';

export interface GeoProgress {
  rating: { world: number; us: number };
  played: { world: number; us: number };
  best: Record<string, number>;
  lang: Lang;
}

const KEY = 'geo-v1';
const EMPTY: GeoProgress = { rating: { world: START_RATING, us: START_RATING }, played: { world: 0, us: 0 }, best: {}, lang: 'en' };

export async function loadGeo(): Promise<GeoProgress> {
  return loadJson(KEY, EMPTY);
}

export async function saveGeo(p: GeoProgress): Promise<void> {
  await saveJson(KEY, p);
}
