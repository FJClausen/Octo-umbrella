import { pieceGlyph } from '../chess/glyphs';
import { solutionSan, startPosition } from '../chess/game';
import type { ChessPuzzle } from '../chess/types';
import { THEME_LABELS } from '../chess/rating';
import type { CheckSpec } from '../check/types';
import { escapeHtml, renderSheet } from './html';

const FILES = 'abcdefgh';

function diagram(p: ChessPuzzle, cell: number): string {
  const game = startPosition(p);
  const flipped = game.turn() === 'b';
  const board = game.board();
  const rows: string[] = [];
  for (let vr = 0; vr < 8; vr++) {
    const r = flipped ? 7 - vr : vr;
    const tds: string[] = [];
    for (let vc = 0; vc < 8; vc++) {
      const c = flipped ? 7 - vc : vc;
      const piece = board[r][c];
      const dark = (r + c) % 2 === 1;
      tds.push(
        `<td style="width:${cell}px;height:${cell}px;padding:0;text-align:center;vertical-align:middle;font-size:${Math.round(cell * 0.8)}px;line-height:1;background:${dark ? '#bdbdbd' : '#fff'}">${piece ? pieceGlyph(piece.color, piece.type) : ''}</td>`,
      );
    }
    rows.push(`<tr><td style="font-size:12pt;padding-right:4px;border:none">${8 - r}</td>${tds.join('')}</tr>`);
  }
  const files = (flipped ? FILES.split('').reverse() : FILES.split(''))
    .map((f) => `<td style="font-size:12pt;text-align:center;border:none">${f}</td>`)
    .join('');
  rows.push(`<tr><td style="border:none"></td>${files}</tr>`);
  return `<table style="border-collapse:collapse;border:2px solid #000">${rows.join('')}</table>`;
}

function label(p: ChessPuzzle): string {
  const theme = p.themes.map((t) => THEME_LABELS[t]).find(Boolean);
  return theme ?? 'Find the best move';
}

/** Up to six diagrams, three per row. Page 2 has the solutions. */
export function chessSheet(puzzles: ChessPuzzle[], code?: string): string {
  const six = puzzles.slice(0, 6);
  const cells = six
    .map((p, i) => {
      const toMove = startPosition(p).turn() === 'w' ? 'White' : 'Black';
      return `<div style="display:inline-block;vertical-align:top;width:32%;margin-bottom:12pt">
<div style="font-size:13pt;font-weight:700">${i + 1}. ${toMove} to move</div>
<div style="font-size:12pt;margin-bottom:4pt">${escapeHtml(label(p))}</div>
${diagram(p, 22)}
<div style="font-size:13pt;margin-top:6pt">My move: _________</div></div>`;
    })
    .join('');
  const answers = `<ol>${six
    .map((p) => `<li style="margin-bottom:6pt">${escapeHtml(solutionSan(p, false))} <span class="small">(rating ${p.rating})</span></li>`)
    .join('')}</ol>`;
  return renderSheet({
    code,
    title: 'Chess Puzzle Sheet',
    subtitle: 'Find the best move for the side to move. Write your answer under each board.',
    puzzleHtml: cells,
    answerHtml: answers,
  });
}

/** Check data for a printed chess sheet: the position she sees and the first winning move. */
export function chessCheckSpec(puzzles: ChessPuzzle[]): CheckSpec {
  return {
    type: 'chess',
    puzzles: puzzles.slice(0, 6).map((p) => ({
      fen: startPosition(p).fen(),
      solution: p.moves[1],
      mateInOne: p.moves.length === 2 && p.themes.includes('mateIn1'),
    })),
  };
}
