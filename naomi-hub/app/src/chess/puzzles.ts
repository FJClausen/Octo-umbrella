import puzzleFile from '../../../content/puzzles.json';
import { parsePuzzleFile, type ChessPuzzle, type PuzzleFile } from './types';

/** Bundled offline puzzle set (Lichess, CC0). */
export const PUZZLES: ChessPuzzle[] = parsePuzzleFile(puzzleFile as PuzzleFile);

/** Themes that have enough puzzles to make a round. */
export const AVAILABLE_THEMES: string[] = (() => {
  const counts = new Map<string, number>();
  for (const p of PUZZLES) for (const t of p.themes) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].filter(([, n]) => n >= 10).map(([t]) => t);
})();
