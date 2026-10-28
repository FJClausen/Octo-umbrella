import { makeRng, pick, shuffle, type Rng } from './rng';

export interface Category {
  name: string;
  items: string[];
  /** "the friend who owns the parrot" */
  subject: (item: string) => string;
  /** "owns the parrot" */
  is: (item: string) => string;
  /** "does not own the parrot" */
  isNot: (item: string) => string;
}

export interface Clue {
  positive: boolean;
  a: { cat: number; item: number };
  b: { cat: number; item: number };
}

export interface LogicGridPuzzle {
  kind: 'logic-grid';
  title: string;
  intro: string;
  categories: { name: string; items: string[] }[];
  clues: string[];
  /** solution[cat][person] = item index; cat 0 is the people, identity. */
  solution: number[][];
  /** Structured clues, kept for verification. */
  rawClues: Clue[];
}

const THEMES: { title: string; peopleWord: string; people: string[]; cats: { name: string; pool: string[]; is: string; isNot: string; whose: string }[] }[] = [
  {
    title: 'The Science Fair',
    peopleWord: 'student',
    people: ['Ava', 'Ben', 'Chloe', 'Diego', 'Emma'],
    cats: [
      { name: 'Project', pool: ['volcano', 'robot arm', 'solar oven', 'crystal garden', 'water filter'], is: 'built the {x}', isNot: 'did not build the {x}', whose: 'who built the {x}' },
      { name: 'Ribbon', pool: ['blue', 'red', 'yellow', 'green', 'purple'], is: 'won the {x} ribbon', isNot: 'did not win the {x} ribbon', whose: 'who won the {x} ribbon' },
      { name: 'Grade', pool: ['4th', '5th', '6th', '7th', '8th'], is: 'is in {x} grade', isNot: 'is not in {x} grade', whose: 'in {x} grade' },
    ],
  },
  {
    title: 'Pet Parade',
    peopleWord: 'friend',
    people: ['Finn', 'Greta', 'Hugo', 'Isla', 'Jonas'],
    cats: [
      { name: 'Pet', pool: ['parrot', 'tortoise', 'ferret', 'rabbit', 'gecko'], is: 'owns the {x}', isNot: 'does not own the {x}', whose: 'who owns the {x}' },
      { name: 'Snack', pool: ['pretzels', 'grapes', 'popcorn', 'cheese', 'apple slices'], is: 'brought {x}', isNot: 'did not bring {x}', whose: 'who brought {x}' },
      { name: 'Costume', pool: ['pirate', 'astronaut', 'knight', 'wizard', 'detective'], is: 'dressed as {a x}', isNot: 'did not dress as {a x}', whose: 'dressed as {a x}' },
    ],
  },
  {
    title: 'Chess Club Tournament',
    peopleWord: 'player',
    people: ['Kira', 'Leo', 'Mila', 'Noah', 'Olga'],
    cats: [
      { name: 'Favorite piece', pool: ['knight', 'bishop', 'rook', 'queen', 'pawn'], is: 'loves the {x} most', isNot: 'does not love the {x} most', whose: 'whose favorite piece is the {x}' },
      { name: 'Points', pool: ['1 point', '2 points', '3 points', '4 points', '5 points'], is: 'scored {x}', isNot: 'did not score {x}', whose: 'who scored {x}' },
      { name: 'Country', pool: ['Spain', 'Germany', 'Norway', 'India', 'Brazil'], is: 'is from {x}', isNot: 'is not from {x}', whose: 'from {x}' },
    ],
  },
];

function fmt(template: string, x: string): string {
  const article = /^[aeiou]/i.test(x) ? 'an' : 'a';
  return template.replace('{a x}', `${article} ${x}`).replace('{x}', x);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  const out: number[][] = [];
  for (const p of permutations(n - 1)) {
    for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  }
  return out;
}

/** Person index holding `item` of category `cat` in assignment `s`. */
function owner(s: number[][], cat: number, item: number): number {
  return s[cat].indexOf(item);
}

function clueHolds(s: number[][], clue: Clue): boolean {
  const same = owner(s, clue.a.cat, clue.a.item) === owner(s, clue.b.cat, clue.b.item);
  return clue.positive ? same : !same;
}

export function countLogicGridSolutions(n: number, cats: number, clues: Clue[], limit = 2): number {
  const perms = permutations(n);
  const identity = perms.find((p) => p.every((v, i) => v === i))!;
  const s: number[][] = [identity];
  let count = 0;
  const rec = (cat: number): boolean => {
    if (cat === cats) {
      if (clues.every((c) => clueHolds(s, c))) count++;
      return count >= limit;
    }
    for (const p of perms) {
      s[cat] = p;
      // Prune: check clues whose categories are all assigned.
      const ok = clues.every((c) => c.a.cat > cat || c.b.cat > cat || clueHolds(s, c));
      if (ok && rec(cat + 1)) return true;
    }
    s.length = cat;
    return false;
  };
  rec(1);
  return count;
}

/** Clue counts that still fit the printed page with the grids. */
export const MAX_CLUES: Record<3 | 4 | 5, number> = { 3: 8, 4: 12, 5: 12 };

/** Generates candidates until one fits MAX_CLUES (keeping the shortest if none do). */
export function generateLogicGrid(size: 3 | 4 | 5 = 4, seed?: number): LogicGridPuzzle {
  const rng = makeRng(seed);
  let best: LogicGridPuzzle | null = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const p = generateOnce(size, rng);
    if (!best || p.clues.length < best.clues.length) best = p;
    if (best.clues.length <= MAX_CLUES[size]) break;
  }
  return best!;
}

function generateOnce(size: 3 | 4 | 5, rng: Rng): LogicGridPuzzle {
  const theme = pick(rng, THEMES);
  const extraCats = 2;
  const people = shuffle(rng, theme.people).slice(0, size);
  const chosen = shuffle(rng, theme.cats).slice(0, extraCats);
  const cats: Category[] = [
    {
      name: capitalize(theme.peopleWord),
      items: people,
      subject: (x) => x,
      is: (x) => `is ${x}`,
      isNot: (x) => `is not ${x}`,
    },
    ...chosen.map((c) => ({
      name: c.name,
      items: shuffle(rng, c.pool).slice(0, size),
      subject: (x: string) => `the ${theme.peopleWord} ${fmt(c.whose, x)}`,
      is: (x: string) => fmt(c.is, x),
      isNot: (x: string) => fmt(c.isNot, x),
    })),
  ];
  const nCats = cats.length;
  const solution: number[][] = [people.map((_, i) => i)];
  for (let c = 1; c < nCats; c++) solution.push(shuffle(rng, people.map((_, i) => i)));

  const pool: Clue[] = [];
  for (let ca = 0; ca < nCats; ca++) {
    for (let cb = ca + 1; cb < nCats; cb++) {
      for (let ia = 0; ia < size; ia++) {
        for (let ib = 0; ib < size; ib++) {
          const positive = owner(solution, ca, ia) === owner(solution, cb, ib);
          // Mostly negatives so the puzzle needs real deduction, but enough
          // positives to keep the clue list short enough for one page.
          if (positive ? rng() < 0.6 : rng() < 0.2) continue;
          const [first, second] = rng() < 0.5 || ca === 0 ? [{ cat: ca, item: ia }, { cat: cb, item: ib }] : [{ cat: cb, item: ib }, { cat: ca, item: ia }];
          pool.push({ positive, a: first, b: second });
        }
      }
    }
  }

  let clues: Clue[] = [];
  for (const clue of shuffle(rng, pool)) {
    clues.push(clue);
    if (countLogicGridSolutions(size, nCats, clues) === 1) break;
  }
  // Drop clues that are not needed.
  for (const clue of shuffle(rng, clues.slice())) {
    const without = clues.filter((c) => c !== clue);
    if (countLogicGridSolutions(size, nCats, without) === 1) clues = without;
  }

  const text = (c: Clue) => {
    const a = cats[c.a.cat];
    const b = cats[c.b.cat];
    const subject = a.subject(a.items[c.a.item]);
    const pred = c.positive ? b.is(b.items[c.b.item]) : b.isNot(b.items[c.b.item]);
    return `${capitalize(subject)} ${pred}.`;
  };

  const catNames = cats.slice(1).map((c) => c.name.toLowerCase());
  return {
    kind: 'logic-grid',
    title: theme.title,
    intro: `Each ${theme.peopleWord} has a different ${catNames.slice(0, -1).join(', ')} and ${catNames[catNames.length - 1]}.`,
    categories: cats.map((c) => ({ name: c.name, items: c.items })),
    clues: clues.map(text),
    solution,
    rawClues: clues,
  };
}
