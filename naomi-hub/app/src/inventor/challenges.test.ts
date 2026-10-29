import { describe, expect, it } from 'vitest';
import { CHALLENGES, isWinterMonth, reflectionFor, safetyNotes, sortForSeason, type Material } from './challenges';

const ALLOWED: Material[] = ['paper', 'cardboard', 'tape', 'string', 'straws', 'popsicle sticks', 'rubber bands', 'LEGO', 'recycling'];

describe('inventor challenges', () => {
  it('have unique ids, materials from the household list and a time option', () => {
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length);
    for (const c of CHALLENGES) {
      c.materials.forEach((m) => expect(ALLOWED).toContain(m));
      expect(c.minutes.length).toBeGreaterThan(0);
      expect(c.places.length).toBeGreaterThan(0);
    }
  });

  it('water builds happen only on the patio, drop tests only from the porch', () => {
    CHALLENGES.filter((c) => c.water).forEach((c) => expect(c.places).toEqual(['patio']));
    CHALLENGES.filter((c) => c.dropTest).forEach((c) => expect(c.places).toEqual(['porch']));
  });

  it('safety notes always name the off-limits things, plus drop and water rules', () => {
    const egg = CHALLENGES.find((c) => c.dropTest)!;
    const notes = safetyNotes(egg).join(' ');
    expect(notes).toMatch(/fire pit/);
    expect(notes).toMatch(/grown-up/);
    expect(safetyNotes(CHALLENGES.find((c) => c.water)!).join(' ')).toMatch(/patio/);
  });

  it('winter puts indoor builds first', () => {
    expect(isWinterMonth(0)).toBe(true);
    expect(isWinterMonth(5)).toBe(false);
    const sorted = sortForSeason(CHALLENGES, 11);
    const firstOutdoorOnly = sorted.findIndex((c) => !c.places.includes('indoors'));
    expect(sorted.slice(firstOutdoorOnly).every((c) => !c.places.includes('indoors'))).toBe(true);
    expect(sortForSeason(CHALLENGES, 6)).toEqual(CHALLENGES);
  });

  it('always has a reflection question', () => {
    for (let i = -3; i < 20; i++) expect(reflectionFor(i)).toMatch(/\?$/);
  });
});
