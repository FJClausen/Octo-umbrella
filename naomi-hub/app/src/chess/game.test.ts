import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import puzzleFile from '../../../content/puzzles.json';
import { checkMove, parseUci, solutionSan, startPosition } from './game';
import { dailyPuzzle, pickPuzzle, updateRating } from './rating';
import { parsePuzzleFile, type ChessPuzzle, type PuzzleFile } from './types';

const puzzles = parsePuzzleFile(puzzleFile as PuzzleFile);

describe('bundled puzzles', () => {
  it('exist and are in the 400–1800 band', () => {
    expect(puzzles.length).toBeGreaterThan(0);
    puzzles.forEach((p) => {
      expect(p.rating).toBeGreaterThanOrEqual(400);
      expect(p.rating).toBeLessThanOrEqual(1800);
    });
  });

  it('every solution line is legal and ends the puzzle', () => {
    for (const p of puzzles) {
      const game = startPosition(p);
      for (let ply = 1; ply < p.moves.length; ply += 2) {
        const result = checkMove(game, p, ply, parseUci(p.moves[ply]));
        expect(['correct', 'solved']).toContain(result);
        game.move(parseUci(p.moves[ply]));
        if (ply + 1 < p.moves.length) game.move(parseUci(p.moves[ply + 1]));
      }
    }
  });
});

const backRank: ChessPuzzle = {
  id: 't1',
  fen: 'r5k1/5ppp/8/8/8/8/5PPP/4R1K1 b - - 0 1',
  moves: ['a8a2', 'e1e8'],
  rating: 600,
  themes: ['mateIn1', 'backRankMate'],
};

describe('move checking', () => {
  it('accepts the solution and rejects other moves', () => {
    const game = startPosition(backRank);
    expect(checkMove(game, backRank, 1, parseUci('e1e8'))).toBe('solved');
    expect(checkMove(game, backRank, 1, parseUci('e1e7'))).toBe('wrong');
    expect(checkMove(game, backRank, 1, parseUci('e1e9' as string))).toBe('illegal');
  });

  it('formats the solution in SAN', () => {
    expect(solutionSan(backRank)).toBe('2. Re8#');
    expect(solutionSan(backRank, false)).toBe('Re8#');
  });

  it('start position is after the opponent move', () => {
    expect(startPosition(backRank).fen()).toBe(new Chess('6k1/5ppp/8/8/8/8/r4PPP/4R1K1 w - - 1 2').fen());
  });
});

describe('rating', () => {
  it('rises on a win and falls on a loss', () => {
    expect(updateRating(600, 600, true, 0)).toBe(620);
    expect(updateRating(600, 600, false, 0)).toBe(580);
    expect(updateRating(600, 600, true, 50)).toBe(612);
  });

  it('wins against much easier puzzles barely count', () => {
    expect(updateRating(1200, 600, true, 50)).toBeLessThanOrEqual(1201);
  });

  it('stays within bounds', () => {
    expect(updateRating(400, 1800, false, 0)).toBe(400);
  });

  it('picks unseen puzzles near the rating', () => {
    const pool: ChessPuzzle[] = [500, 600, 650, 1500].map((r, i) => ({ ...backRank, id: `p${i}`, rating: r }));
    const pick = pickPuzzle(pool, { rating: 620, seen: new Set(['p1']), random: () => 0 });
    expect(pick?.id).toBe('p2');
    expect(pickPuzzle(pool, { rating: 620, seen: new Set(), theme: 'fork' })).toBeNull();
  });

  it('daily puzzle is stable for a date', () => {
    expect(dailyPuzzle(puzzles, '2026-10-26', 600)?.id).toBe(dailyPuzzle(puzzles, '2026-10-26', 600)?.id);
  });
});
