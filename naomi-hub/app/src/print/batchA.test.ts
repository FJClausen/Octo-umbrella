import { describe, expect, it } from 'vitest';
import { missionById as animalMission, tallyList } from '../animals/missions';
import { spotById } from '../animals/species';
import { setById } from '../geo/data';
import { MISSIONS, variantFor } from '../math/missions';
import { fieldNotesSheet } from './fieldNotesSheet';
import { mapSheet } from './mapSheet';
import { splitSheet } from './html';
import { mathSheet } from './mathSheet';

const sheets: Record<string, string> = {
  'map-world': mapSheet(setById('world'), 'en', 1),
  'map-us-de': mapSheet(setById('us'), 'de', 2),
  'map-oceania': mapSheet(setById('oceania'), 'es', 3),
};
for (const m of MISSIONS) sheets[`math-${m.id}`] = mathSheet(m, variantFor(m, 7));
for (const id of ['migration-watch', 'squirrel-census', 'secret-sit']) {
  const m = animalMission(id)!;
  const spot = m.spot ?? 'crape-myrtle';
  sheets[`field-${id}`] = fieldNotesSheet(m, spotById(spot)!, 10, tallyList(m, spot, 9));
}

describe('batch A print sheets', () => {
  for (const [name, html] of Object.entries(sheets)) {
    it(`${name}: no answer key in the printout`, () => {
      const { print, answers } = splitSheet(html);
      const field = name.startsWith('field-');
      expect(print.match(/<section class="page">/g) ?? []).toHaveLength(field ? 2 : 1);
      expect(print).not.toContain('Answer key');
      if (field) expect(answers).toBeNull();
      else expect(answers).toContain('<section class="page">');
    });

    it(`${name}: black, white and gray only`, () => {
      for (const c of html.match(/#[0-9a-fA-F]{3,6}\b/g) ?? []) {
        const hex = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        expect(r === g && g === b, `${c} is not gray`).toBe(true);
      }
    });

    it(`${name}: no text below 12pt`, () => {
      for (const m of html.matchAll(/font-size:\s*(\d+)(pt|px)/g)) {
        const pt = m[2] === 'pt' ? Number(m[1]) : Number(m[1]) * 0.75;
        expect(pt).toBeGreaterThanOrEqual(12);
      }
    });
  }

  it('map sheet numbers 12 places and lists them on the key page', () => {
    const html = sheets['map-world'];
    const { print, answers } = splitSheet(html);
    expect(answers!.match(/<li/g)).toHaveLength(12);
    expect(print.match(/<li/g)).toHaveLength(12);
    expect(print).not.toContain('Canberra');
  });

  it('field notes list the tally animals on both pages', () => {
    const html = sheets['field-migration-watch'];
    expect(html).toContain('Red-tailed hawk');
    expect(html).toContain('ID guide: Migration watch');
    expect(html).not.toContain('Answer key');
  });
});

describe('splitSheet', () => {
  it('pulls the title and keeps the answer page as its own document', () => {
    const { print, answers, title } = splitSheet(sheets['math-paver-patrol']);
    expect(title).toBe('Paver Patrol');
    expect(print.trim().endsWith('</html>')).toBe(true);
    expect(answers!.startsWith('<!doctype html>')).toBe(true);
    expect(answers).toContain('Hints and how to check');
    expect(print).not.toContain('Hints and how to check');
  });
});
