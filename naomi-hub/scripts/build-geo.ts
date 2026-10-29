/**
 * Builds content/geo.json for the Geography Quiz from Natural Earth (public domain).
 *
 *   node scripts/build-geo.ts                 # downloads from GitHub
 *   node scripts/build-geo.ts --input DIR     # uses local .geojson files
 *
 * World: Equal Earth projection (equal-area, so "which is bigger" is fair).
 * USA: Albers equal-area for the lower 48, with Alaska and Hawaii as insets.
 * Outlines are simplified (Douglas-Peucker) to keep the bundle small.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../content/geo.json');

type Pt = [number, number];
type Ring = Pt[];
interface Feature {
  properties: Record<string, unknown>;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function load(name: string): Promise<{ features: Feature[] }> {
  const dir = arg('input');
  if (dir) return JSON.parse(readFileSync(join(dir, `${name}.geojson`), 'utf8'));
  const res = await fetch(`${BASE}${name}.geojson`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return (await res.json()) as { features: Feature[] };
}

const RAD = Math.PI / 180;

/** Equal Earth (Šavrič, Patterson, Jenny 2018). */
function equalEarth(lon: number, lat: number): Pt {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
  const M = Math.sqrt(3) / 2;
  const l = lon * RAD;
  const t = Math.asin(M * Math.sin(lat * RAD));
  const t2 = t * t, t6 = t2 * t2 * t2;
  const x = (2 * Math.sqrt(3) * l * Math.cos(t)) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1));
  const y = t * (A4 * t6 * t2 + A3 * t6 + A2 * t2 + A1);
  return [x * 150, -y * 150];
}

/** Albers equal-area conic. */
function albers(lon0: number, lat0: number, p1: number, p2: number) {
  const n = (Math.sin(p1 * RAD) + Math.sin(p2 * RAD)) / 2;
  const C = Math.cos(p1 * RAD) ** 2 + 2 * n * Math.sin(p1 * RAD);
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(lat0 * RAD)) / n;
  return (lon: number, lat: number): Pt => {
    const rho = Math.sqrt(C - 2 * n * Math.sin(lat * RAD)) / n;
    const th = n * (lon - lon0) * RAD;
    return [rho * Math.sin(th), -(rho0 - rho * Math.cos(th))];
  };
}

const lower48 = albers(-96, 37.5, 29.5, 45.5);
const alaska = albers(-154, 50, 55, 65);
const hawaii = albers(-157, 3, 8, 18);

function usProject(state: string) {
  return (lon: number, lat: number): Pt => {
    if (state === 'AK') {
      const [x, y] = alaska(lon, lat);
      return [x * 0.35 * 1000 - 300, y * 0.35 * 1000 + 230];
    }
    if (state === 'HI') {
      const [x, y] = hawaii(lon, lat);
      return [x * 800 - 176, y * 800 + 426];
    }
    const [x, y] = lower48(lon, lat);
    return [x * 1000, y * 1000];
  };
}

function rings(f: Feature): Ring[] {
  const c = f.geometry.coordinates as number[][][] | number[][][][];
  const polys = f.geometry.type === 'Polygon' ? [c as number[][][]] : (c as number[][][][]);
  return polys.map((p) => p[0].map(([lon, lat]) => [lon, lat] as Pt));
}

function area(r: Ring): number {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
}

function simplify(points: Ring, tol: number): Ring {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let best = -1, dist = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
      if (d > dist) [dist, best] = [d, i];
    }
    if (dist > tol && best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Closed rings start and end on the same point, so split at the farthest point and simplify both halves. */
function simplifyRing(ring: Ring, tol: number): Ring {
  if (ring.length < 5) return ring;
  const [x0, y0] = ring[0];
  let far = 1;
  ring.forEach(([x, y], i) => {
    if (Math.hypot(x - x0, y - y0) > Math.hypot(ring[far][0] - x0, ring[far][1] - y0)) far = i;
  });
  const a = simplify(ring.slice(0, far + 1), tol);
  const b = simplify(ring.slice(far), tol);
  return [...a, ...b.slice(1)];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function shape(raw: Ring[], project: (lon: number, lat: number) => Pt, tol: number, minArea: number) {
  const projected = raw.map((r) => r.map(([lon, lat]) => project(lon, lat)));
  const biggest = Math.max(...projected.map(area));
  const kept = projected.filter((r) => area(r) >= minArea || area(r) === biggest).map((r) => simplifyRing(r, tol)).filter((r) => r.length >= 4);
  const xs = kept.flat().map((p) => p[0]);
  const ys = kept.flat().map((p) => p[1]);
  const path = kept.map((r) => 'M' + r.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z').join('');
  return {
    path,
    bbox: [r1(Math.min(...xs)), r1(Math.min(...ys)), r1(Math.max(...xs)), r1(Math.max(...ys))],
    area: Math.round(projected.reduce((s, r) => s + area(r), 0) * 10) / 10,
  };
}

/** Countries with more than one capital in the data: the one quizzes usually expect. */
const PRIMARY_CAPITAL: Record<string, string> = { ZAF: 'Pretoria', BOL: 'La Paz', NLD: 'Amsterdam', LKA: 'Colombo', MYS: 'Kuala Lumpur', CIV: 'Yamoussoukro', BEN: 'Porto-Novo', SWZ: 'Mbabane' };

/** Capitals missing from the 1:110m places layer. */
const EXTRA_CAPITAL: Record<string, { en: string; de: string; es: string }> = {
  SDS: { en: 'Juba', de: 'Juba', es: 'Yuba' },
  GRL: { en: 'Nuuk', de: 'Nuuk', es: 'Nuuk' },
};

const STATE_CAPITALS: Record<string, string> = {
  AL: 'Montgomery', AK: 'Juneau', AZ: 'Phoenix', AR: 'Little Rock', CA: 'Sacramento', CO: 'Denver', CT: 'Hartford', DE: 'Dover',
  FL: 'Tallahassee', GA: 'Atlanta', HI: 'Honolulu', ID: 'Boise', IL: 'Springfield', IN: 'Indianapolis', IA: 'Des Moines', KS: 'Topeka',
  KY: 'Frankfort', LA: 'Baton Rouge', ME: 'Augusta', MD: 'Annapolis', MA: 'Boston', MI: 'Lansing', MN: 'Saint Paul', MS: 'Jackson',
  MO: 'Jefferson City', MT: 'Helena', NE: 'Lincoln', NV: 'Carson City', NH: 'Concord', NJ: 'Trenton', NM: 'Santa Fe', NY: 'Albany',
  NC: 'Raleigh', ND: 'Bismarck', OH: 'Columbus', OK: 'Oklahoma City', OR: 'Salem', PA: 'Harrisburg', RI: 'Providence', SC: 'Columbia',
  SD: 'Pierre', TN: 'Nashville', TX: 'Austin', UT: 'Salt Lake City', VT: 'Montpelier', VA: 'Richmond', WA: 'Olympia', WV: 'Charleston',
  WI: 'Madison', WY: 'Cheyenne',
};

async function main(): Promise<void> {
  const [countries, states, places] = await Promise.all([
    load('ne_110m_admin_0_countries'),
    load('ne_110m_admin_1_states_provinces'),
    load('ne_110m_populated_places'),
  ]);

  const capitals = new Map<string, { en: string; de: string; es: string; lon: number; lat: number }[]>();
  for (const f of places.features) {
    const p = f.properties;
    if (p.ADM0CAP !== 1) continue;
    const [lon, lat] = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
    const key = String(p.ADM0_A3);
    capitals.set(key, [...(capitals.get(key) ?? []), { en: String(p.NAME), de: String(p.NAME_DE || p.NAME), es: String(p.NAME_ES || p.NAME), lon, lat }]);
  }

  const world = countries.features
    .filter((f) => f.properties.CONTINENT !== 'Antarctica' && f.properties.ISO_A2_EH !== '-99')
    .map((f) => {
      const p = f.properties;
      const id = String(p.ADM0_A3);
      const s = shape(rings(f), equalEarth, 0.35, 0.6);
      const caps = capitals.get(id) ?? [];
      const cap = caps.find((c) => c.en === PRIMARY_CAPITAL[id]) ?? caps[0];
      const [lx, ly] = equalEarth(Number(p.LABEL_X), Number(p.LABEL_Y));
      return {
        id,
        a2: String(p.ISO_A2_EH),
        name: { en: String(p.NAME), de: String(p.NAME_DE || p.NAME), es: String(p.NAME_ES || p.NAME) },
        continent: String(p.CONTINENT),
        subregion: String(p.SUBREGION),
        rank: Number(p.LABELRANK),
        pop: Number(p.POP_EST),
        lat: r1(Number(p.LABEL_Y)),
        label: [r1(lx), r1(ly)],
        ...s,
        capital: cap ? { en: cap.en, de: cap.de, es: cap.es } : EXTRA_CAPITAL[id] ?? null,
      };
    })
    .sort((a, b) => a.name.en.localeCompare(b.name.en));

  const us = states.features
    .filter((f) => f.properties.adm0_a3 === 'USA' && STATE_CAPITALS[String(f.properties.postal)])
    .map((f) => {
      const p = f.properties;
      const id = String(p.postal);
      const s = shape(rings(f), usProject(id), 0.6, 4);
      const [lx, ly] = usProject(id)(Number(p.longitude), Number(p.latitude));
      return {
        id,
        name: { en: String(p.name), de: String(p.name_de || p.name), es: String(p.name_es || p.name) },
        rank: 0,
        lat: r1(Number(p.latitude)),
        label: [r1(lx), r1(ly)],
        ...s,
        capital: { en: STATE_CAPITALS[id], de: STATE_CAPITALS[id], es: STATE_CAPITALS[id] },
      };
    })
    .sort((a, b) => a.name.en.localeCompare(b.name.en));

  const out = {
    source: 'Natural Earth 1:110m (public domain), built by scripts/build-geo.ts',
    world: { countries: world },
    us: { states: us },
  };
  writeFileSync(OUT, JSON.stringify(out));
  const multi = [...capitals].filter(([, c]) => c.length > 1).map(([k, c]) => `${k}: ${c.map((x) => x.en).join('/')}`);
  console.error(`countries ${world.length} (no capital: ${world.filter((c) => !c.capital).map((c) => c.name.en).join(', ') || 'none'})`);
  console.error(`states ${us.length}; multi-capital countries: ${multi.join('; ')}`);
  console.error(`wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
