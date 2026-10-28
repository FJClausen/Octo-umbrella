/** One Lichess puzzle. `moves` are UCI; moves[0] is the opponent's move, then the solver alternates. */
export interface ChessPuzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}

/** Compact on-disk form written by scripts/lichess-import.ts. */
export interface PuzzleFile {
  source: string;
  license: string;
  generatedAt: string;
  puzzles: { id: string; fen: string; moves: string; rating: number; themes: string }[];
}

export function parsePuzzleFile(file: PuzzleFile): ChessPuzzle[] {
  return file.puzzles.map((p) => ({
    id: p.id,
    fen: p.fen,
    moves: p.moves.split(' '),
    rating: p.rating,
    themes: p.themes.split(' ').filter(Boolean),
  }));
}
