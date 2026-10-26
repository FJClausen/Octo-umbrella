/** U+FE0E keeps iOS from drawing the pawn as an emoji. */
const GLYPH: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

export const pieceGlyph = (color: string, type: string) => `${GLYPH[color + type]}︎`;
