import geo from '../../../content/geo.json';

export type Lang = 'en' | 'de' | 'es';
export type Names = Record<Lang, string>;

export interface Place {
  id: string;
  name: Names;
  /** Countries only. */
  a2?: string;
  continent?: string;
  subregion?: string;
  rank: number;
  pop?: number;
  lat: number;
  label: [number, number];
  path: string;
  bbox: [number, number, number, number];
  area: number;
  capital: Names | null;
}

export interface QuizSet {
  id: string;
  label: string;
  kind: 'world' | 'us';
  places: Place[];
}

const COUNTRIES = (geo as unknown as { world: { countries: Place[] } }).world.countries;
const STATES = (geo as unknown as { us: { states: Place[] } }).us.states;

const byContinent = (...c: string[]) => COUNTRIES.filter((p) => c.includes(p.continent ?? ''));

export const SETS: QuizSet[] = [
  { id: 'world', label: 'Whole world', kind: 'world', places: COUNTRIES },
  { id: 'europe', label: 'Europe', kind: 'world', places: byContinent('Europe') },
  { id: 'americas', label: 'The Americas', kind: 'world', places: byContinent('North America', 'South America') },
  { id: 'africa', label: 'Africa', kind: 'world', places: byContinent('Africa') },
  { id: 'asia', label: 'Asia', kind: 'world', places: byContinent('Asia') },
  { id: 'oceania', label: 'Oceania', kind: 'world', places: byContinent('Oceania') },
  { id: 'us', label: 'US states', kind: 'us', places: STATES },
];

export function setById(id: string): QuizSet {
  return SETS.find((s) => s.id === id) ?? SETS[0];
}

/** Regional-indicator letters make the flag emoji, e.g. "DE" → 🇩🇪. */
export function flagEmoji(a2: string): string {
  return [...a2.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

export function bboxOf(places: Place[], pad = 0.03): [number, number, number, number] {
  const x0 = Math.min(...places.map((p) => p.bbox[0]));
  const y0 = Math.min(...places.map((p) => p.bbox[1]));
  const x1 = Math.max(...places.map((p) => p.bbox[2]));
  const y1 = Math.max(...places.map((p) => p.bbox[3]));
  const px = (x1 - x0) * pad;
  const py = (y1 - y0) * pad;
  return [x0 - px, y0 - py, x1 - x0 + 2 * px, y1 - y0 + 2 * py];
}
