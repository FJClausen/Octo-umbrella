import { deletePhoto } from './photos';
import { loadJson, saveJson } from './storage';

export interface Sit {
  id: string;
  missionId: string;
  title: string;
  spot: string;
  at: string;
  minutes: number;
  /** speciesId → count */
  tally: Record<string, number>;
  other: string;
  answer: string;
  photoUri: string | null;
  squirrelIds: string[];
}

export interface Squirrel {
  id: string;
  name: string;
  markings: string;
  tags: string[];
  photoUri: string | null;
  sightings: number;
  firstSeen: string;
  lastSeen: string;
}

export interface AnimalState {
  /** speciesId → when Naomi first marked it seen here. */
  seen: Record<string, string>;
  sits: Sit[];
  squirrels: Squirrel[];
}

const KEY = 'animals-v1';
const EMPTY: AnimalState = { seen: {}, sits: [], squirrels: [] };

export function loadAnimals(): Promise<AnimalState> {
  return loadJson(KEY, EMPTY);
}

async function update(fn: (s: AnimalState) => AnimalState): Promise<AnimalState> {
  const next = fn(await loadAnimals());
  await saveJson(KEY, next);
  return next;
}

export function setSeen(speciesId: string, seen: boolean): Promise<AnimalState> {
  return update((s) => {
    const next = { ...s.seen };
    if (seen) next[speciesId] ??= new Date().toISOString();
    else delete next[speciesId];
    return { ...s, seen: next };
  });
}

/** Saves a sit, marks every tallied species as seen and bumps recognized squirrels. */
export function addSit(sit: Sit): Promise<AnimalState> {
  return update((s) => {
    const seen = { ...s.seen };
    for (const [id, n] of Object.entries(sit.tally)) if (n > 0) seen[id] ??= sit.at;
    const squirrels = s.squirrels.map((q) => (sit.squirrelIds.includes(q.id) ? { ...q, sightings: q.sightings + 1, lastSeen: sit.at } : q));
    return { seen, squirrels, sits: [sit, ...s.sits].slice(0, 300) };
  });
}

export function saveSquirrel(q: Squirrel): Promise<AnimalState> {
  return update((s) => {
    const exists = s.squirrels.some((x) => x.id === q.id);
    return { ...s, squirrels: exists ? s.squirrels.map((x) => (x.id === q.id ? q : x)) : [...s.squirrels, q] };
  });
}

export function removeSquirrel(id: string): Promise<AnimalState> {
  return update((s) => {
    const gone = s.squirrels.find((q) => q.id === id);
    if (gone?.photoUri) deletePhoto(gone.photoUri);
    return { ...s, squirrels: s.squirrels.filter((q) => q.id !== id) };
  });
}
