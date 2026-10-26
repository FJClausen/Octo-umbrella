import type { ChessPuzzle } from '../chess/types';

/** Fixed positions for print tests (mate in 1 after the opponent's move). */
export const PUZZLES_FOR_TEST: ChessPuzzle[] = Array.from({ length: 6 }, (_, i) => ({
  id: `print${i}`,
  fen: 'r5k1/5ppp/8/8/8/8/5PPP/4R1K1 b - - 0 1',
  moves: ['a8a2', 'e1e8'],
  rating: 600 + i * 50,
  themes: ['mateIn1', 'backRankMate'],
}));
