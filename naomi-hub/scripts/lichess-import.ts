/**
 * Builds /content/puzzles.json from the Lichess puzzle database (CC0).
 *
 *   node scripts/lichess-import.ts                 # download from database.lichess.org
 *   node scripts/lichess-import.ts --input file    # use a local .csv or .csv.zst
 *   node scripts/lichess-import.ts --target 3000 --seed 7
 *
 * Needs Node 22.18+ (runs TypeScript directly, built-in zstd). No npm packages.
 *
 * Keeps puzzles rated 400–1800 with a stable rating and decent popularity, then
 * reservoir-samples ~target puzzles balanced across themes and rating bands.
 */
import { createReadStream, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { createZstdDecompress } from 'node:zlib';

const URL_DEFAULT = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../content/puzzles.json');

const MIN_RATING = 400;
const MAX_RATING = 1800;
const MAX_DEVIATION = 90;
const MIN_POPULARITY = 80;
const MIN_PLAYS = 300;
const MAX_MOVES = 8;

/** Rarest first, so a puzzle lands in the most specific theme it has. */
const THEMES = [
  'doubleCheck',
  'skewer',
  'backRankMate',
  'trappedPiece',
  'promotion',
  'discoveredAttack',
  'pin',
  'attraction',
  'deflection',
  'fork',
  'hangingPiece',
  'mateIn3',
  'mateIn2',
  'mateIn1',
  'sacrifice',
  'endgame',
];
const BANDS = [400, 700, 1000, 1300, 1600, 1801];

interface Row {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Reservoir<T> {
  items: T[] = [];
  seen = 0;
  size: number;
  rng: () => number;
  constructor(size: number, rng: () => number) {
    this.size = size;
    this.rng = rng;
  }
  add(item: T): void {
    this.seen++;
    if (this.items.length < this.size) this.items.push(item);
    else {
      const j = Math.floor(this.rng() * this.seen);
      if (j < this.size) this.items[j] = item;
    }
  }
}

async function openInput(input: string | undefined): Promise<Readable> {
  if (input) {
    const file = createReadStream(input);
    return input.endsWith('.zst') ? file.pipe(createZstdDecompress()) : file;
  }
  console.error(`Downloading ${URL_DEFAULT} …`);
  const res = await fetch(URL_DEFAULT);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  return Readable.fromWeb(res.body as import('node:stream/web').ReadableStream).pipe(createZstdDecompress());
}

async function main(): Promise<void> {
  const target = Number(arg('target') ?? 3000);
  const rng = mulberry32(Number(arg('seed') ?? 20261026));
  const perCell = Math.ceil(target / (THEMES.length * (BANDS.length - 1)));
  const cells = new Map<string, Reservoir<Row>>();
  const overflow = new Reservoir<Row>(target, rng);

  const lines = createInterface({ input: await openInput(arg('input')), crlfDelay: Infinity });
  let header: string[] | null = null;
  let total = 0;
  let kept = 0;
  for await (const line of lines) {
    if (!line) continue;
    const cols = line.split(',');
    if (!header) {
      header = cols;
      continue;
    }
    total++;
    if (total % 500_000 === 0) console.error(`  ${total.toLocaleString()} rows, ${kept.toLocaleString()} kept`);
    const get = (name: string) => cols[header!.indexOf(name)];
    const rating = Number(get('Rating'));
    if (!(rating >= MIN_RATING && rating <= MAX_RATING)) continue;
    if (Number(get('RatingDeviation')) > MAX_DEVIATION) continue;
    if (Number(get('Popularity')) < MIN_POPULARITY) continue;
    if (Number(get('NbPlays')) < MIN_PLAYS) continue;
    const moves = get('Moves');
    if (moves.split(' ').length > MAX_MOVES) continue;
    const themes = get('Themes');
    const themeList = themes.split(' ');
    const theme = THEMES.find((t) => themeList.includes(t));
    if (!theme) continue;
    kept++;
    const band = BANDS.findIndex((b, i) => rating >= b && rating < BANDS[i + 1]);
    const key = `${theme}:${band}`;
    if (!cells.has(key)) cells.set(key, new Reservoir<Row>(perCell, rng));
    const row: Row = { id: get('PuzzleId'), fen: get('FEN'), moves, rating, themes };
    cells.get(key)!.add(row);
    overflow.add(row);
  }

  const chosen = new Map<string, Row>();
  for (const r of cells.values()) for (const row of r.items) chosen.set(row.id, row);
  // Thin themes leave gaps; top up from the overall sample.
  for (const row of overflow.items) {
    if (chosen.size >= target) break;
    chosen.set(row.id, row);
  }
  const puzzles = [...chosen.values()].slice(0, target).sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id));

  const head = {
    source: 'Lichess puzzle database (https://database.lichess.org/#puzzles)',
    license: 'CC0',
    generatedAt: new Date().toISOString(),
  };
  const body = puzzles.map((p) => `    ${JSON.stringify(p)}`).join(',\n');
  writeFileSync(OUT, `${JSON.stringify(head, null, 2).slice(0, -2)},\n  "puzzles": [\n${body}\n  ]\n}\n`);

  const byTheme = THEMES.map((t) => `${t}: ${puzzles.filter((p) => p.themes.split(' ').includes(t)).length}`);
  console.error(`Read ${total.toLocaleString()} rows, ${kept.toLocaleString()} passed filters.`);
  console.error(`Wrote ${puzzles.length} puzzles to ${OUT}`);
  console.error(byTheme.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
