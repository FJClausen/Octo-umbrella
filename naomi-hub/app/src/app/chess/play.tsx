import type { Chess, Square } from 'chess.js';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ChessBoard } from '../../components/ChessBoard';
import { Body, Button, H1 } from '../../components/ui';
import { checkMove, parseUci, solutionSan, startPosition, type UciMove } from '../../chess/game';
import { PUZZLES } from '../../chess/puzzles';
import { dailyPuzzle, pickPuzzle, ROUND_SIZE, THEME_LABELS, updateRating } from '../../chess/rating';
import type { ChessPuzzle } from '../../chess/types';
import { loadChess, saveChess, todayKey, type ChessProgress } from '../../store/chessProgress';
import { awardPoints, POINTS } from '../../store/points';
import { colors } from '../../theme';

type Status = 'thinking' | 'opponent' | 'wrong' | 'solved' | 'revealed';

export default function ChessPlay() {
  const { mode, theme } = useLocalSearchParams<{ mode?: string; theme?: string }>();
  const isDaily = mode === 'daily';
  const total = isDaily ? 1 : ROUND_SIZE;
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const boardSize = Math.min(landscape ? height - 160 : width - 56, 720);

  const [progress, setProgress] = useState<ChessProgress | null>(null);
  const [puzzle, setPuzzle] = useState<ChessPuzzle | null>(null);
  const [game, setGame] = useState<Chess | null>(null);
  const [ply, setPly] = useState(1);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [status, setStatus] = useState<Status>('thinking');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [ratingDelta, setRatingDelta] = useState(0);
  const [, force] = useState(0);
  const firstTry = useRef(true);

  const nextPuzzle = (p: ChessProgress): ChessPuzzle | null => {
    if (isDaily) {
      const today = todayKey();
      if (p.daily?.date === today) return PUZZLES.find((x) => x.id === p.daily!.id) ?? null;
      return dailyPuzzle(PUZZLES, today, p.rating);
    }
    return pickPuzzle(PUZZLES, { rating: p.rating, seen: new Set(p.seen), theme: theme || undefined });
  };

  const begin = (p: ChessProgress) => {
    const next = nextPuzzle(p);
    setPuzzle(next);
    if (!next) return;
    const g = startPosition(next);
    const first = parseUci(next.moves[0]);
    setGame(g);
    setPly(1);
    setSelected(null);
    setLastMove([first.from, first.to]);
    setStatus('thinking');
    firstTry.current = true;
  };

  useEffect(() => {
    loadChess().then((p) => {
      setProgress(p);
      begin(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const record = async (solved: boolean) => {
    if (!progress || !puzzle) return;
    const rating = updateRating(progress.rating, puzzle.rating, solved, progress.played);
    setRatingDelta((d) => d + rating - progress.rating);
    const next: ChessProgress = {
      ...progress,
      rating,
      played: progress.played + 1,
      solved: progress.solved + (solved ? 1 : 0),
      seen: [...progress.seen, puzzle.id],
      daily: isDaily ? { date: todayKey(), id: puzzle.id, done: true } : progress.daily,
      history: [...progress.history, { at: new Date().toISOString(), id: puzzle.id, solved, rating }],
    };
    setProgress(next);
    setResults((r) => [...r, solved]);
    await saveChess(next);
  };

  const play = (move: UciMove) => {
    if (!game || !puzzle) return;
    const expected = parseUci(puzzle.moves[ply]);
    const promotion =
      game.get(move.from)?.type === 'p' && (move.to[1] === '8' || move.to[1] === '1')
        ? expected.from === move.from && expected.to === move.to
          ? expected.promotion ?? 'q'
          : 'q'
        : undefined;
    const full = { ...move, promotion };
    const result = checkMove(game, puzzle, ply, full);
    if (result === 'illegal') return;
    setSelected(null);
    if (result === 'wrong') {
      setStatus('wrong');
      if (firstTry.current) {
        firstTry.current = false;
        void record(false);
      }
      return;
    }
    game.move(full);
    setLastMove([full.from, full.to]);
    if (result === 'solved') {
      setStatus('solved');
      if (firstTry.current) void record(true);
      firstTry.current = false;
      force((n) => n + 1);
      return;
    }
    setStatus('opponent');
    force((n) => n + 1);
    setTimeout(() => {
      const reply = parseUci(puzzle.moves[ply + 1]);
      game.move(reply);
      setLastMove([reply.from, reply.to]);
      setPly(ply + 2);
      setStatus('thinking');
    }, 600);
  };

  const onSquarePress = (sq: Square) => {
    if (!game || status === 'opponent' || status === 'solved' || status === 'revealed') return;
    const piece = game.get(sq);
    if (selected) {
      if (piece && piece.color === game.turn()) return setSelected(sq);
      return play({ from: selected, to: sq });
    }
    if (piece && piece.color === game.turn()) {
      setSelected(sq);
      if (status === 'wrong') setStatus('thinking');
    }
  };

  const reveal = () => {
    if (!game || !puzzle) return;
    if (firstTry.current) {
      firstTry.current = false;
      void record(false);
    }
    for (let i = ply; i < puzzle.moves.length; i++) game.move(parseUci(puzzle.moves[i]));
    const last = parseUci(puzzle.moves[puzzle.moves.length - 1]);
    setLastMove([last.from, last.to]);
    setStatus('revealed');
  };

  const next = async () => {
    if (index + 1 >= total) {
      await awardPoints(isDaily ? 'Daily chess puzzle' : 'Chess round', 'ipad');
      setIndex(total);
      return;
    }
    setIndex(index + 1);
    if (progress) begin(progress);
  };

  const label = useMemo(() => puzzle?.themes.map((t) => THEME_LABELS[t]).find(Boolean), [puzzle]);

  if (!progress) return <View style={styles.screen} />;

  if (!puzzle || !game) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Body>No puzzles found for this theme.</Body>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (index >= total) {
    const solved = results.filter(Boolean).length;
    return (
      <View style={[styles.screen, styles.center]}>
        <H1>{isDaily ? 'Daily puzzle done!' : `Round done: ${solved}/${total}`}</H1>
        <Body>
          Rating {progress.rating} ({ratingDelta >= 0 ? '+' : ''}
          {ratingDelta}) · +{POINTS.ipad} points
        </Body>
        <Body muted>Now go set up one of these positions on a real board and show someone the trick!</Body>
        <View style={styles.row}>
          <Button label="Back to chess" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const toMove = game.turn() === 'w' ? 'White' : 'Black';
  const message = {
    thinking: `${toMove} to move. Find the best move!`,
    opponent: 'Good move! Opponent replies…',
    wrong: 'Not quite. Try again, or show the answer.',
    solved: 'Solved! 🎉',
    revealed: `Answer: ${solutionSan(puzzle)}`,
  }[status];

  return (
    <View style={[styles.screen, { flexDirection: landscape ? 'row' : 'column' }]}>
      <View style={styles.boardWrap}>
        <ChessBoard
          game={game}
          size={boardSize}
          flipped={startPosition(puzzle).turn() === 'b'}
          selected={selected}
          lastMove={lastMove}
          onSquarePress={onSquarePress}
        />
      </View>
      <View style={styles.side}>
        <Text style={styles.counter}>
          {isDaily ? 'Daily puzzle' : `Puzzle ${index + 1} of ${total}`}
          {label ? ` · ${label}` : ''}
        </Text>
        <Text style={[styles.message, status === 'wrong' && { color: colors.bad }, status === 'solved' && { color: colors.good }]}>
          {message}
        </Text>
        <Body muted>
          Your rating: {progress.rating} · Puzzle: {puzzle.rating}
        </Body>
        <View style={styles.row}>
          {status === 'solved' || status === 'revealed' ? (
            <Button big label={index + 1 >= total ? 'Finish' : 'Next puzzle'} onPress={next} />
          ) : (
            <Button kind="secondary" label="Show answer" onPress={reveal} disabled={status === 'opponent'} />
          )}
        </View>
        <View style={styles.dots}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                results[i] === true && { backgroundColor: colors.good },
                results[i] === false && { backgroundColor: colors.bad },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 28, gap: 28 },
  center: { alignItems: 'center', justifyContent: 'center' },
  boardWrap: { alignItems: 'center' },
  side: { flex: 1, minWidth: 260 },
  counter: { fontSize: 16, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  message: { fontSize: 26, fontWeight: '800', color: colors.ink, marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  dots: { flexDirection: 'row', gap: 10, marginTop: 24 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.ink },
});
