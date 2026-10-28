import { API_URL, APP_SECRET, apiConfigured } from '../config';
import type { ReadKind, Transcription } from './types';

export class CheckUnavailable extends Error {}

/** Sends a photo of a sheet to /api/read-sheet and returns what Claude read. */
export async function readSheetPhoto(
  kind: ReadKind,
  imageBase64: string,
  rows: number[],
  columns?: string[],
): Promise<Transcription> {
  if (!apiConfigured()) throw new CheckUnavailable('not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 75_000);
  try {
    const res = await fetch(`${API_URL}/api/read-sheet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-secret': APP_SECRET },
      body: JSON.stringify({ kind, image: imageBase64, rows, columns }),
      signal: controller.signal,
    });
    if (res.status === 422) return { photo: 'blurry', sheetCode: '', answerKeyPage: false, rows: [] };
    if (!res.ok) throw new CheckUnavailable(`HTTP ${res.status}`);
    return (await res.json()) as Transcription;
  } catch (e) {
    if (e instanceof CheckUnavailable) throw e;
    throw new CheckUnavailable(e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}
