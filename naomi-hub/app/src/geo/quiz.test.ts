import { describe, expect, it } from 'vitest';
import { updateRating } from '../chess/rating';
import { flagEmoji, SETS, setById } from './data';
import { makeRound, optionLabel, placeDifficulty, promptFor, ROUND, START_RATING, tappable } from './quiz';

describe('geo data', () => {
  it('has the world and all 50 states, each with a shape and three names', () => {
    expect(setById('world').places.length).toBeGreaterThan(170);
    expect(setById('us').places).toHaveLength(50);
    for (const s of SETS) {
      for (const p of s.places) {
        expect(p.path.length, p.id).toBeGreaterThan(10);
        expect(p.name.en && p.name.de && p.name.es, p.id).toBeTruthy();
      }
    }
  });

  it('knows some facts', () => {
    const world = setById('world').places;
    const de = world.find((p) => p.a2 === 'DE')!;
    expect(de.name.de).toBe('Deutschland');
    expect(de.capital?.en).toBe('Berlin');
    expect(world.find((p) => p.a2 === 'ES')!.name.es).toBe('España');
    expect(setById('us').places.find((p) => p.id === 'MD')!.capital?.en).toBe('Annapolis');
    const ru = world.find((p) => p.a2 === 'RU')!;
    const fr = world.find((p) => p.a2 === 'FR')!;
    expect(ru.area).toBeGreaterThan(fr.area * 10);
  });

  it('makes flag emoji', () => {
    expect(flagEmoji('DE')).toBe('🇩🇪');
    expect(flagEmoji('us')).toBe('🇺🇸');
  });
});

describe('rounds', () => {
  for (const set of SETS) {
    it(`${set.id}: 10 valid questions with the answer among distinct options`, () => {
      for (let seed = 1; seed <= 6; seed++) {
        const qs = makeRound(set, START_RATING, 'en', seed);
        expect(qs).toHaveLength(ROUND);
        const keys = qs.map((q) => (set.places.length < ROUND * 2 ? `${q.type}:${q.subject.id}` : q.subject.id));
        expect(new Set(keys).size).toBe(ROUND);
        for (const q of qs) {
          if (q.type === 'tap') {
            expect(tappable(q.subject, set)).toBe(true);
            continue;
          }
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          const labels = q.options.map((id) => optionLabel(q, set, id, 'en'));
          expect(new Set(labels).size, `${q.type} ${labels}`).toBe(labels.length);
          labels.forEach((l) => expect(l).toBeTruthy());
          if (set.kind === 'us') expect(q.type).not.toBe('flag');
        }
      }
    });
  }

  it('gets harder through the round', () => {
    const qs = makeRound(setById('world'), 900, 'en', 3);
    const first = qs.slice(0, 3).reduce((a, q) => a + q.difficulty, 0);
    const last = qs.slice(-3).reduce((a, q) => a + q.difficulty, 0);
    expect(last).toBeGreaterThan(first);
  });

  it('bigger and north questions have the right answer', () => {
    const set = setById('world');
    for (let seed = 1; seed < 40; seed++) {
      for (const q of makeRound(set, 900, 'en', seed)) {
        if (q.type !== 'bigger' && q.type !== 'north') continue;
        const [a, b] = q.options.map((id) => set.places.find((p) => p.id === id)!);
        const winner = q.type === 'bigger' ? (a.area > b.area ? a : b) : a.lat > b.lat ? a : b;
        expect(q.answer).toBe(winner.id);
      }
    }
  });

  it('prompts in German and Spanish', () => {
    const set = setById('world');
    const de = set.places.find((p) => p.a2 === 'DE')!;
    expect(promptFor('capital', de, set, 'de')).toBe('Was ist die Hauptstadt von Deutschland?');
    expect(promptFor('outline', de, set, 'de')).toBe('Welches Land hat diese Form?');
    expect(promptFor('tap', de, set, 'es')).toBe('Toca Alemania en el mapa');
    expect(promptFor('outline', de, setById('us'), 'de')).toBe('Welcher Bundesstaat hat diese Form?');
  });

  it('famous places are easier than obscure ones', () => {
    const world = setById('world');
    const us = world.places.find((p) => p.a2 === 'US')!;
    const bt = world.places.find((p) => p.a2 === 'BT')!;
    expect(placeDifficulty(us, world)).toBeLessThan(placeDifficulty(bt, world));
  });

  it('adapts: right answers raise the rating, wrong ones lower it', () => {
    expect(updateRating(800, 900, true, 0)).toBeGreaterThan(800);
    expect(updateRating(800, 700, false, 0)).toBeLessThan(800);
  });
});
