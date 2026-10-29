import { bboxOf, type Lang, type QuizSet } from '../geo/data';
import { tappable } from '../geo/quiz';
import { makeRng, shuffle } from '../puzzles/rng';
import { escapeHtml, renderSheet } from './html';

/** Blank outline map with up to 12 numbered places to label; names on page 2. */
export function mapSheet(set: QuizSet, lang: Lang, seed: number): string {
  const rng = makeRng(seed);
  const [x, y, w, h] = bboxOf(set.places, 0.02);
  const candidates = set.places.filter((p) => tappable(p, set));
  const easyFirst = [...candidates].sort((a, b) => a.rank - b.rank || b.area - a.area);
  const chosen = shuffle(rng, easyFirst.slice(0, Math.max(12, Math.ceil(easyFirst.length * 0.6)))).slice(0, 12);
  const fs = w / 45;
  const r = fs * 0.85;
  const paths = set.places.map((p) => `<path d="${p.path}" fill="#fff" stroke="#000" stroke-width="${w / 700}"/>`).join('');
  const marks = chosen
    .map(
      (p, i) =>
        `<circle cx="${p.label[0]}" cy="${p.label[1]}" r="${r}" fill="#fff" stroke="#000" stroke-width="${w / 900}"/><text x="${p.label[0]}" y="${p.label[1] + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-family="Helvetica, Arial" font-weight="700">${i + 1}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" style="width:100%;height:auto;max-height:520px">${paths}${marks}</svg>`;
  const blanks = `<ol style="columns:2;column-gap:28px">${chosen.map(() => '<li style="margin-bottom:8pt">______________________</li>').join('')}</ol>`;
  const key = `<ol style="columns:2;column-gap:28px">${chosen.map((p) => `<li style="margin-bottom:4pt">${escapeHtml(p.name[lang])}${p.capital ? ` <span class="small">(${escapeHtml(p.capital[lang])})</span>` : ''}</li>`).join('')}</ol>`;
  const noun = set.kind === 'us' ? 'state' : 'country';
  return renderSheet({
    title: `Blank map: ${set.label}`,
    subtitle: `Write the name of each numbered ${noun}. Bonus: add its capital.`,
    puzzleHtml: `${svg}${blanks}`,
    answerHtml: key,
  });
}
