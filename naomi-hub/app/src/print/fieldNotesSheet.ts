import type { AnimalMission } from '../animals/missions';
import { speciesById, type Spot } from '../animals/species';
import { escapeHtml, renderSheet } from './html';

const cell = 'border:1px solid #000;padding:4px 6px;font-size:12pt;';

/** Page 1: field notes to fill in outside. Page 2: ID guide for the listed animals. */
export function fieldNotesSheet(m: AnimalMission, spot: Spot, minutes: number, speciesIds: string[]): string {
  const species = speciesIds.map((id) => speciesById(id)).filter((s) => s !== undefined);
  const weather = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Cold']
    .map((w) => `<span style="margin-right:14pt">☐ ${w}</span>`)
    .join('');
  // Two animals per row keeps page 1 to one page even with 8 animals.
  const names = [...species.map((s) => escapeHtml(s.name)), 'Other:', 'Other:'];
  const rows = Array.from({ length: Math.ceil(names.length / 2) }, (_, i) => names.slice(i * 2, i * 2 + 2));
  const tally = `<table style="width:100%"><tr>${`<th style="${cell};width:27%">Animal</th><th style="${cell}">Tally</th>`.repeat(2)}</tr>${rows
    .map((r) => `<tr>${[0, 1].map((j) => `<td style="${cell};height:26px">${r[j] ?? ''}</td><td style="${cell}"></td>`).join('')}</tr>`)
    .join('')}</table>`;
  const steps = `<ol>${m.steps.map((s) => `<li style="margin-bottom:3pt">${escapeHtml(s)}</li>`).join('')}</ol>`;
  const page1 = `<div class="top"><div>Time: ________</div><div>Temperature: ______</div></div>
<div style="margin:6pt 0">${weather}</div>
<p style="margin:4pt 0">${escapeHtml(m.brief)}</p>${steps}
<h2>Tally</h2>${tally}
<h2>Sketch</h2><div style="border:1px solid #000;height:120px"></div>
<p style="margin:8pt 0 2pt"><b>${escapeHtml(m.question)}</b></p>
<div style="border-bottom:1px solid #000;height:22pt"></div><div style="border-bottom:1px solid #000;height:22pt"></div>`;
  const guide = `${species
    .map(
      (s) =>
        `<div style="margin-bottom:7pt"><b>${escapeHtml(s.name)}</b>: ${escapeHtml(s.lookFor)}<div class="small">${escapeHtml(s.fact)}${s.caution ? ` ${escapeHtml(s.caution)}` : ''}</div></div>`,
    )
    .join('')}<p class="small">Stay away from the AC unit, the grill and the fire-pit table.</p>`;
  return renderSheet({
    title: `Field notes: ${m.title}`,
    subtitle: `${spot.name} · ${minutes}-minute sit`,
    puzzleHtml: page1,
    answerHtml: guide,
    page2Title: `ID guide: ${m.title}`,
  });
}
