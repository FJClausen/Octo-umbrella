import { describe, expect, it } from 'vitest';
import { mathSheet } from '../print/mathSheet';
import { isWinter, missionById, MISSIONS, suggest, variantFor } from './missions';

describe('math missions', () => {
  it('have unique ids and at least one field', () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    MISSIONS.forEach((m) => expect(m.fields.length).toBeGreaterThan(0));
  });

  it('every mission evaluates plausible answers without NaN or undefined', () => {
    for (const m of MISSIONS) {
      const v = variantFor(m, 3);
      const answers = Object.fromEntries(m.fields.map((f, i) => [f.id, v.expected[f.id] ?? 5 + i]));
      const fb = m.evaluate(answers, v.expected);
      expect(fb.length, m.id).toBeGreaterThan(0);
      fb.forEach((f) => expect(f.text, m.id).not.toMatch(/NaN|undefined|Infinity/));
    }
  });

  it('a recipe scaled correctly is all right, and a wrong amount is flagged', () => {
    const m = missionById('pancake-scale')!;
    const v = variantFor(m, 11);
    expect(m.evaluate(v.expected, v.expected)[0].tone).toBe('great');
    const wrong = { ...v.expected, i0: v.expected.i0 + 1 };
    const fb = m.evaluate(wrong, v.expected);
    expect(fb[0].text).toMatch(/4 of 5/);
    expect(fb.some((f) => f.tone === 'retry' && f.text.startsWith('flour'))).toBe(true);
  });

  it('recipe answer keys use exact fractions', () => {
    const m = missionById('pancake-scale')!;
    for (let seed = 1; seed < 20; seed++) {
      const v = variantFor(m, seed);
      v.answerKey.forEach((line) => expect(line).not.toMatch(/\d\.\d/));
    }
  });

  it('math checks catch arithmetic slips', () => {
    const m = missionById('paver-patrol')!;
    const ok = m.evaluate({ estimate: 200, length: 2, width: 2, count: 50, area: 200 }, {});
    expect(ok[0].tone).toBe('great');
    expect(ok[1].tone).toBe('great');
    const slip = m.evaluate({ estimate: 200, length: 2, width: 2, count: 50, area: 100 }, {});
    expect(slip[0].tone).toBe('retry');
  });

  it('Solve for x accepts the rounded answer', () => {
    const m = missionById('mystery-fence')!;
    expect(m.evaluate({ p: 5.5, g: 0.5, x: 12 }, {})[0].tone).toBe('great');
    expect(m.evaluate({ p: 5.5, g: 0.5, x: 10 }, {})[0].tone).toBe('retry');
  });

  it('winter suggestions skip sunny patio missions', () => {
    expect(isWinter(11)).toBe(true);
    expect(isWinter(6)).toBe(false);
    for (let i = 0; i < 50; i++) {
      const m = suggest(MISSIONS, 0, () => i / 50);
      expect(m.place === 'patio' && Boolean(m.needsSun)).toBe(false);
    }
  });

  it('every mission prints a 2-page sheet', () => {
    for (const m of MISSIONS) {
      const html = mathSheet(m, variantFor(m, 5));
      expect(html.match(/<section class="page">/g)).toHaveLength(2);
      expect(html).toContain('My answers');
    }
  });
});
