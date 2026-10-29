import { makeRng, shuffle, type Rng } from '../puzzles/rng';
import { bboxOf, flagEmoji, type Lang, type Place, type QuizSet } from './data';

export type QType = 'tap' | 'flag' | 'capital' | 'outline' | 'bigger' | 'north';

export interface Question {
  type: QType;
  /** Difficulty on the same scale as the player rating. */
  difficulty: number;
  prompt: string;
  /** Place the question is about (the one to tap, the flag's country, the outline…). */
  subject: Place;
  /** Answer choices as place ids; empty for tap questions. */
  options: string[];
  answer: string;
  /** Shown big above the choices: a flag emoji. */
  flag?: string;
}

export const START_RATING = 800;
export const ROUND = 10;

const TYPE_OFFSET: Record<QType, number> = { flag: 0, tap: 100, capital: 150, outline: 250, bigger: -50, north: -50 };

/** Famous, big, or labelled early on maps → easier. */
export function placeDifficulty(p: Place, set: QuizSet): number {
  if (set.kind === 'world') return 450 + (p.rank - 1) * 110 + (p.pop !== undefined && p.pop < 2_000_000 ? 120 : 0);
  const famous = ['CA', 'TX', 'FL', 'NY', 'AK', 'HI', 'WA'];
  const byArea = [...set.places].sort((a, b) => b.area - a.area).findIndex((s) => s.id === p.id);
  return famous.includes(p.id) ? 500 : 650 + Math.round((byArea / set.places.length) * 650);
}

const TEMPLATES: Record<Lang, Record<QType, string>> = {
  en: { tap: 'Tap {x} on the map', flag: 'Which country has this flag?', capital: 'What is the capital of {x}?', outline: 'Which {kind} has this shape?', bigger: 'Which is bigger?', north: 'Which is farther north?' },
  de: { tap: 'Tippe auf {x} auf der Karte', flag: 'Zu welchem Land gehört diese Flagge?', capital: 'Was ist die Hauptstadt von {x}?', outline: 'Welche{kind} hat diese Form?', bigger: 'Was ist größer?', north: 'Was liegt weiter nördlich?' },
  es: { tap: 'Toca {x} en el mapa', flag: '¿De qué país es esta bandera?', capital: '¿Cuál es la capital de {x}?', outline: '¿Qué {kind} tiene esta forma?', bigger: '¿Cuál es más grande?', north: '¿Cuál está más al norte?' },
};

const KIND: Record<Lang, Record<'world' | 'us', string>> = {
  en: { world: 'country', us: 'state' },
  de: { world: 's Land', us: 'r Bundesstaat' },
  es: { world: 'país', us: 'estado' },
};

export function promptFor(type: QType, subject: Place, set: QuizSet, lang: Lang): string {
  return TEMPLATES[lang][type].replace('{x}', subject.name[lang]).replace('{kind}', KIND[lang][set.kind]);
}

/** Too small to hit with a finger on the whole-region map. */
export function tappable(p: Place, set: QuizSet): boolean {
  const [, , w, h] = bboxOf(set.places);
  const [x0, y0, x1, y1] = p.bbox;
  return ((x1 - x0) * (y1 - y0)) / (w * h) > 0.0004;
}

function available(type: QType, set: QuizSet): boolean {
  if (type === 'flag') return set.kind === 'world';
  return true;
}

function distractors(rng: Rng, subject: Place, set: QuizSet, need: (p: Place) => boolean, n = 3): Place[] {
  const pool = set.places.filter((p) => p.id !== subject.id && need(p));
  const near = pool.filter((p) => (set.kind === 'us' ? true : p.subregion === subject.subregion));
  const pickFrom = near.length >= n ? near : pool;
  return shuffle(rng, pickFrom).slice(0, n);
}

function makeQuestion(rng: Rng, type: QType, subject: Place, set: QuizSet, lang: Lang): Question | null {
  const base = placeDifficulty(subject, set) + TYPE_OFFSET[type];
  const prompt = promptFor(type, subject, set, lang);
  switch (type) {
    case 'tap':
      if (!tappable(subject, set)) return null;
      return { type, difficulty: base, prompt, subject, options: [], answer: subject.id };
    case 'flag':
      if (!subject.a2) return null;
      return { type, difficulty: base, prompt, subject, flag: flagEmoji(subject.a2), options: shuffle(rng, [subject, ...distractors(rng, subject, set, (p) => Boolean(p.a2))]).map((p) => p.id), answer: subject.id };
    case 'outline':
      return { type, difficulty: base, prompt, subject, options: shuffle(rng, [subject, ...distractors(rng, subject, set, () => true)]).map((p) => p.id), answer: subject.id };
    case 'capital': {
      if (!subject.capital) return null;
      const others = distractors(rng, subject, set, (p) => Boolean(p.capital) && p.capital!.en !== subject.capital!.en);
      if (others.length < 3) return null;
      return { type, difficulty: base, prompt, subject, options: shuffle(rng, [subject, ...others]).map((p) => p.id), answer: subject.id };
    }
    case 'bigger':
    case 'north': {
      const other = shuffle(
        rng,
        set.places.filter((p) => p.id !== subject.id && (type === 'bigger' ? Math.max(p.area, subject.area) / Math.min(p.area, subject.area) > 1.3 : Math.abs(p.lat - subject.lat) > 3)),
      )[0];
      if (!other) return null;
      const answer = type === 'bigger' ? (subject.area > other.area ? subject : other) : subject.lat > other.lat ? subject : other;
      const harder = Math.max(placeDifficulty(subject, set), placeDifficulty(other, set));
      return { type, difficulty: harder + TYPE_OFFSET[type], prompt, subject, options: shuffle(rng, [subject.id, other.id]), answer: answer.id };
    }
  }
}

/** A 10-question round that ramps from 250 below the player rating to 250 above it. */
export function makeRound(set: QuizSet, rating: number, lang: Lang, seed: number = Date.now()): Question[] {
  const rng = makeRng(seed);
  const types = (['tap', 'flag', 'capital', 'outline', 'bigger', 'north'] as QType[]).filter((t) => available(t, set));
  // Small regions (Oceania has 7 countries) may repeat a place, but never with the same question type.
  const small = set.places.length < ROUND * 2;
  const key = (type: QType, id: string) => (small ? `${type}:${id}` : id);
  const used = new Set<string>();
  const out: Question[] = [];
  for (let i = 0; i < ROUND; i++) {
    const target = rating - 250 + (500 * i) / (ROUND - 1);
    for (const type of shuffle(rng, types)) {
      const ranked = set.places
        .filter((p) => !used.has(key(type, p.id)))
        .map((p) => ({ p, gap: Math.abs(placeDifficulty(p, set) + TYPE_OFFSET[type] - target) }))
        .sort((a, b) => a.gap - b.gap)
        .slice(0, 6);
      const q = shuffle(rng, ranked)
        .map(({ p }) => makeQuestion(rng, type, p, set, lang))
        .find((x): x is Question => x !== null);
      if (q) {
        used.add(key(type, q.subject.id));
        out.push(q);
        break;
      }
    }
  }
  return out;
}

export function nameOf(set: QuizSet, id: string, lang: Lang): string {
  return set.places.find((p) => p.id === id)?.name[lang] ?? id;
}

export function capitalOf(set: QuizSet, id: string, lang: Lang): string {
  return set.places.find((p) => p.id === id)?.capital?.[lang] ?? '';
}

/** Text of a choice: capital name for capital questions, place name otherwise. */
export function optionLabel(q: Question, set: QuizSet, id: string, lang: Lang): string {
  return q.type === 'capital' ? capitalOf(set, id, lang) : nameOf(set, id, lang);
}
