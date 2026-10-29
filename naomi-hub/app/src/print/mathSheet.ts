import type { MathMission, Variant } from '../math/missions';
import { escapeHtml, renderSheet } from './html';

const PLACE: Record<MathMission['place'], string> = {
  patio: 'Patio',
  porch: 'Back porch',
  indoors: 'Indoors',
  kitchen: 'Kitchen (with a grown-up)',
};

const cell = 'border:1px solid #000;padding:4px 6px;font-size:12pt;';

export function mathSheet(m: MathMission, v: Variant): string {
  const steps = `<ol>${m.steps.map((s) => `<li style="margin-bottom:4pt">${escapeHtml(s)}</li>`).join('')}</ol>`;
  const lines = v.lines.length ? `<div style="margin:6pt 0 8pt">${v.lines.map((l) => `<div>${escapeHtml(l)}</div>`).join('')}</div>` : '';
  const record = m.record
    ? `<h2>My notes</h2><table style="width:100%"><tr>${m.record.columns.map((c) => `<th style="${cell}">${escapeHtml(c)}</th>`).join('')}</tr>${Array.from(
        { length: m.record.rows },
        () => `<tr>${m.record!.columns.map(() => `<td style="${cell};height:26px"></td>`).join('')}</tr>`,
      ).join('')}</table>`
    : '<h2>My working</h2><div style="border:1px solid #000;height:110px"></div>';
  const answers = `<h2>My answers</h2><table style="width:100%">${m.fields
    .map((f) => `<tr><td style="${cell};width:55%">${escapeHtml(f.label)}${f.unit ? ` (${escapeHtml(f.unit)})` : ''}</td><td style="${cell}"></td></tr>`)
    .join('')}</table><p class="small">Then type these answers into the app to see how you did.</p>`;
  const hints = `<h2>Hints and how to check</h2><ul>${m.hints.map((h) => `<li style="margin-bottom:4pt">${escapeHtml(h)}</li>`).join('')}</ul>`;
  const key = v.answerKey.length ? `<h2>Answer key</h2>${v.answerKey.map((k) => `<div>${escapeHtml(k)}</div>`).join('')}` : '';
  return renderSheet({
    title: m.title,
    subtitle: `${PLACE[m.place]} · about ${m.minutes} minutes · You need: ${m.tools.join(', ')}`,
    puzzleHtml: `<p>${escapeHtml(m.intro)}</p>${lines}${steps}${record}${answers}`,
    answerHtml: `${hints}${key}`,
  });
}
