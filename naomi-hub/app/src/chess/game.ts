import { Chess, type Square } from 'chess.js';
import type { ChessPuzzle } from './types';

export interface UciMove {
  from: Square;
  to: Square;
  promotion?: string;
}

export function parseUci(uci: string): UciMove {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

/** Position the solver sees: the puzzle FEN after the opponent's first move. */
export function startPosition(p: ChessPuzzle): Chess {
  const game = new Chess(p.fen);
  game.move(parseUci(p.moves[0]));
  return game;
}

export type MoveResult = 'correct' | 'solved' | 'wrong' | 'illegal';

/**
 * Checks the solver's move at `ply` (index into p.moves, always odd).
 * A different move that still gives checkmate counts as solving it, as on Lichess.
 */
export function checkMove(game: Chess, p: ChessPuzzle, ply: number, move: UciMove): MoveResult {
  const trial = new Chess(game.fen());
  try {
    trial.move(move);
  } catch {
    return 'illegal';
  }
  const expected = parseUci(p.moves[ply]);
  const matches =
    expected.from === move.from &&
    expected.to === move.to &&
    (expected.promotion ?? 'q') === (move.promotion ?? 'q');
  if (trial.isCheckmate()) return 'solved';
  if (!matches) return 'wrong';
  return ply + 1 >= p.moves.length ? 'solved' : 'correct';
}

/** Solution in SAN from the solver's position, e.g. "1. Qh7+ Kf8 2. Qh8#" (or "Qh7+ Kf8 Qh8#"). */
export function solutionSan(p: ChessPuzzle, numbered = true): string {
  const game = startPosition(p);
  const parts: string[] = [];
  let moveNo = game.moveNumber();
  const whiteFirst = game.turn() === 'w';
  p.moves.slice(1).forEach((uci, i) => {
    const san = game.move(parseUci(uci)).san;
    const isWhite = (i % 2 === 0) === whiteFirst;
    if (!numbered) parts.push(san);
    else if (isWhite) parts.push(`${moveNo}. ${san}`);
    else parts.push(i === 0 ? `${moveNo}… ${san}` : san);
    if (!isWhite) moveNo++;
  });
  return parts.join(' ');
}
