import { deletePhoto } from './photos';
import { loadJson, saveJson } from './storage';

export interface Invention {
  id: string;
  challengeId: string;
  title: string;
  at: string;
  minutes: number;
  photoUri: string | null;
  reflectionQuestion: string;
  reflection: string;
  result: number | null;
  resultUnit: string;
}

const KEY = 'inventor-v1';

export async function loadInventions(): Promise<Invention[]> {
  return (await loadJson<{ items: Invention[] }>(KEY, { items: [] })).items;
}

export async function addInvention(item: Invention): Promise<void> {
  const items = [item, ...(await loadInventions())].slice(0, 200);
  await saveJson(KEY, { items });
}

export async function removeInvention(id: string): Promise<void> {
  const items = await loadInventions();
  const gone = items.find((i) => i.id === id);
  if (gone?.photoUri) deletePhoto(gone.photoUri);
  await saveJson(KEY, { items: items.filter((i) => i.id !== id) });
}
