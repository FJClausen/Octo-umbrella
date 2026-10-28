import type { Chess, Square } from 'chess.js';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pieceGlyph } from '../chess/glyphs';
import { colors } from '../theme';

const FILES = 'abcdefgh';

export function ChessBoard({
  game,
  size,
  flipped,
  selected,
  lastMove,
  onSquarePress,
}: {
  game: Chess;
  size: number;
  flipped: boolean;
  selected: Square | null;
  lastMove: [Square, Square] | null;
  onSquarePress: (sq: Square) => void;
}) {
  const cell = Math.floor(size / 8);
  const board = game.board();
  const targets = new Set(selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : []);
  const rows = [];
  for (let vr = 0; vr < 8; vr++) {
    const r = flipped ? 7 - vr : vr;
    const cells = [];
    for (let vc = 0; vc < 8; vc++) {
      const c = flipped ? 7 - vc : vc;
      const sq = `${FILES[c]}${8 - r}` as Square;
      const piece = board[r][c];
      const dark = (r + c) % 2 === 1;
      const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq);
      const bg = selected === sq || isLast ? colors.highlight : dark ? colors.darkSquare : colors.lightSquare;
      cells.push(
        <Pressable
          key={sq}
          accessibilityLabel={`${sq}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
          onPress={() => onSquarePress(sq)}
          style={{ width: cell, height: cell, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
        >
          {piece ? (
            <Text style={{ fontSize: cell * 0.78, lineHeight: cell * 0.95, color: '#000' }}>
              {pieceGlyph(piece.color, piece.type)}
            </Text>
          ) : targets.has(sq) ? (
            <View style={[styles.dot, { width: cell * 0.28, height: cell * 0.28, borderRadius: cell * 0.14 }]} />
          ) : null}
          {piece && targets.has(sq) ? <View style={[styles.ring, { borderRadius: cell / 2 }]} /> : null}
          {vc === 0 ? <Text style={[styles.coord, { top: 2, left: 3 }]}>{8 - r}</Text> : null}
          {vr === 7 ? <Text style={[styles.coord, { bottom: 1, right: 4 }]}>{FILES[c]}</Text> : null}
        </Pressable>,
      );
    }
    rows.push(
      <View key={vr} style={{ flexDirection: 'row' }}>
        {cells}
      </View>,
    );
  }
  return <View style={[styles.board, { width: cell * 8 + 6 }]}>{rows}</View>;
}

const styles = StyleSheet.create({
  board: { borderWidth: 3, borderColor: colors.ink },
  dot: { backgroundColor: 'rgba(0,0,0,0.25)' },
  ring: { ...StyleSheet.absoluteFill, borderWidth: 4, borderColor: 'rgba(0,0,0,0.3)' },
  coord: { position: 'absolute', fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.55)' },
});
