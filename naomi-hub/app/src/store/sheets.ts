import type { SheetRecord } from '../check/types';
import { loadJson, saveJson } from './storage';

const KEY = 'sheets-v1';

export async function loadSheets(): Promise<SheetRecord[]> {
  return (await loadJson<{ sheets: SheetRecord[] }>(KEY, { sheets: [] })).sheets;
}

export async function getSheet(id: string): Promise<SheetRecord | null> {
  return (await loadSheets()).find((s) => s.id === id) ?? null;
}

/** Keeps the 30 most recent sheets. */
export async function addSheet(sheet: SheetRecord): Promise<void> {
  const sheets = [sheet, ...(await loadSheets())].slice(0, 30);
  await saveJson(KEY, { sheets });
}

export async function updateSheet(id: string, patch: Partial<SheetRecord>): Promise<SheetRecord | null> {
  const sheets = await loadSheets();
  const i = sheets.findIndex((s) => s.id === id);
  if (i < 0) return null;
  sheets[i] = { ...sheets[i], ...patch };
  await saveJson(KEY, { sheets });
  return sheets[i];
}

export function openSheets(sheets: SheetRecord[]): SheetRecord[] {
  return sheets.filter((s) => s.status === 'open');
}
