import { describe, expect, it } from 'vitest';
import { MISSIONS, missionsFor, seasonOf, tallyList } from './missions';
import { SPECIES, SPOTS, speciesById } from './species';

describe('animal detective data', () => {
  it('has about 30+ species with unique ids and valid spots and months', () => {
    expect(SPECIES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length);
    const spotIds = new Set(SPOTS.map((s) => s.id));
    for (const s of SPECIES) {
      expect(s.months.length).toBeGreaterThan(0);
      for (const m of s.months) expect(m >= 0 && m <= 11).toBe(true);
      for (const sp of s.spots) expect(spotIds.has(sp)).toBe(true);
    }
  });

  it('night and dusk mammals carry a caution', () => {
    for (const s of SPECIES.filter((x) => x.group === 'mammal' && x.when === 'night')) expect(s.caution).toBeTruthy();
  });

  it('missions reference real species and unique ids', () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    for (const m of MISSIONS) for (const id of m.lookFor) expect(speciesById(id), `${m.id}: ${id}`).toBeDefined();
  });

  it('every month offers at least 4 missions, each with a non-empty tally list at every spot', () => {
    for (let month = 0; month < 12; month++) {
      const list = missionsFor(month);
      expect(list.length).toBeGreaterThanOrEqual(4);
      for (const m of list) {
        for (const spot of m.spot ? [m.spot] : SPOTS.map((s) => s.id)) {
          const t = tallyList(m, spot, month);
          expect(t.length, `${m.id} @ ${spot} in month ${month}`).toBeGreaterThan(0);
          for (const id of t) expect(speciesById(id)!.months).toContain(month);
        }
      }
    }
  });

  it('late October is fall, with migration first-class', () => {
    expect(seasonOf(9)).toBe('fall');
    expect(seasonOf(11)).toBe('winter');
    expect(seasonOf(2)).toBe('spring');
    expect(seasonOf(6)).toBe('summer');
    const ids = missionsFor(9).map((m) => m.id);
    expect(ids).toContain('migration-watch');
    expect(ids.indexOf('migration-watch')).toBeLessThan(ids.indexOf('secret-sit'));
  });
});
