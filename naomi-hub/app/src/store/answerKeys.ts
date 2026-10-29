import { loadJson, saveJson } from './storage';

/** Answer keys never print; they stay here for a parent to open. */
export interface AnswerKey {
  id: string;
  title: string;
  createdAt: string;
  html: string;
}

const KEY = 'answer-keys-v1';
const KEEP = 30;

export async function loadAnswerKeys(): Promise<AnswerKey[]> {
  return (await loadJson<{ items: AnswerKey[] }>(KEY, { items: [] })).items;
}

export async function getAnswerKey(id: string): Promise<AnswerKey | null> {
  return (await loadAnswerKeys()).find((k) => k.id === id) ?? null;
}

export async function addAnswerKey(title: string, html: string): Promise<AnswerKey> {
  const item: AnswerKey = { id: `${Date.now()}`, title, createdAt: new Date().toISOString(), html };
  await saveJson(KEY, { items: [item, ...(await loadAnswerKeys())].slice(0, KEEP) });
  return item;
}
