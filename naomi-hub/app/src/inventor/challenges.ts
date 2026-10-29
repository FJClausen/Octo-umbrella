export type Material = 'paper' | 'cardboard' | 'tape' | 'string' | 'straws' | 'popsicle sticks' | 'rubber bands' | 'LEGO' | 'recycling';
export type BuildPlace = 'indoors' | 'porch' | 'patio';

export interface Challenge {
  id: string;
  title: string;
  brief: string;
  materials: Material[];
  /** Extra items from around the house, e.g. a marble or coins for testing. */
  extras?: string[];
  limits: string[];
  test: string;
  /** What Naomi measures when testing, if anything. */
  result?: { label: string; unit: string };
  places: BuildPlace[];
  minutes: (15 | 30 | 45)[];
  water?: boolean;
  /** Dropped from the porch: patio below, grown-up present. */
  dropTest?: boolean;
}

export const ALWAYS_OFF_LIMITS = 'The fire pit, the grill and the AC unit are never part of a build.';

export const CHALLENGES: Challenge[] = [
  {
    id: 'paper-bridge',
    title: 'Paper Bridge',
    brief: 'Bridge a 20 cm gap between two books using only paper and tape.',
    materials: ['paper', 'tape'],
    extras: ['coins for testing'],
    limits: ['At most 10 sheets of paper', 'At most 30 cm of tape', 'The bridge may not touch the table between the books'],
    test: 'Stack coins in the middle, one at a time, until it sags to the table.',
    result: { label: 'Coins it held', unit: 'coins' },
    places: ['indoors', 'porch'],
    minutes: [15, 30],
  },
  {
    id: 'straw-tower',
    title: 'Sky-High Straw Tower',
    brief: 'Build the tallest tower that stands on its own for 10 seconds.',
    materials: ['straws', 'tape'],
    limits: ['20 straws', '1 meter of tape', 'It may not be taped to the floor or a wall'],
    test: 'Let go, count to 10, then measure from the floor to the top.',
    result: { label: 'Height', unit: 'cm' },
    places: ['indoors', 'porch'],
    minutes: [15, 30],
  },
  {
    id: 'egg-drop',
    title: 'Egg Drop From the Porch',
    brief: 'Protect an egg so it survives a drop from the back porch onto the patio.',
    materials: ['paper', 'cardboard', 'tape', 'string', 'straws', 'rubber bands', 'recycling'],
    extras: ['one raw egg (or a cherry tomato for a no-mess version)'],
    limits: ['Your package must fit inside a shoebox', 'No bubble wrap or cotton balls'],
    test: 'With a grown-up, drop it from the porch railing onto the patio stones. Open it: did the egg survive?',
    result: { label: 'Egg survived? (1 = yes, 0 = no)', unit: '' },
    places: ['porch'],
    minutes: [30, 45],
    dropTest: true,
  },
  {
    id: 'marble-run',
    title: 'Slowest Marble Run',
    brief: 'Make a marble take as long as possible to get from the top of a chair to the floor.',
    materials: ['cardboard', 'paper', 'tape', 'recycling'],
    extras: ['a marble', 'a chair', 'timer'],
    limits: ['The marble must keep moving: no stopping it in a cup'],
    test: 'Time three runs and keep the best.',
    result: { label: 'Best time', unit: 'seconds' },
    places: ['indoors'],
    minutes: [30, 45],
  },
  {
    id: 'rubber-band-car',
    title: 'Rubber-Band Racer',
    brief: 'Build a car powered only by a rubber band.',
    materials: ['cardboard', 'straws', 'rubber bands', 'tape', 'popsicle sticks', 'recycling'],
    extras: ['bottle caps for wheels'],
    limits: ['No pushing: wind it up and let go'],
    test: 'Measure how far it rolls on a smooth floor.',
    result: { label: 'Distance', unit: 'cm' },
    places: ['indoors', 'porch'],
    minutes: [30, 45],
  },
  {
    id: 'cargo-boat',
    title: 'Cargo Boat',
    brief: 'Build a boat that carries as many coins as possible without sinking.',
    materials: ['recycling', 'tape', 'straws', 'popsicle sticks'],
    extras: ['a tub of water', 'coins'],
    limits: ['The boat must fit in a shoebox', 'No closed plastic bottles: that would be too easy!'],
    test: 'Float it in a tub on the patio and add coins one by one.',
    result: { label: 'Coins carried', unit: 'coins' },
    places: ['patio'],
    minutes: [15, 30],
    water: true,
  },
  {
    id: 'catapult',
    title: 'Pom-Pom Catapult',
    brief: 'Launch a pom-pom (or crumpled paper ball) into a cup 1 meter away.',
    materials: ['popsicle sticks', 'rubber bands', 'tape', 'recycling'],
    extras: ['a plastic spoon', 'a pom-pom', 'a cup'],
    limits: ['Aim only at the cup: never at people or windows'],
    test: 'Take 10 shots and count how many land in the cup.',
    result: { label: 'Hits out of 10', unit: 'hits' },
    places: ['indoors', 'porch'],
    minutes: [15, 30],
  },
  {
    id: 'earthquake',
    title: 'Earthquake-Proof Building',
    brief: 'Build the tallest LEGO building that survives an earthquake.',
    materials: ['LEGO'],
    limits: ['Base no bigger than a 16 × 16 plate'],
    test: 'Put it on a tray and shake the tray side to side for 10 seconds. Measure what is still standing.',
    result: { label: 'Height still standing', unit: 'cm' },
    places: ['indoors'],
    minutes: [15, 30],
  },
  {
    id: 'glider',
    title: 'Long-Distance Glider',
    brief: 'Fold a paper glider that flies as far as possible.',
    materials: ['paper', 'tape'],
    limits: ['One sheet of paper', 'Up to 3 small pieces of tape'],
    test: 'Throw it 3 times from the same spot and measure the best flight.',
    result: { label: 'Best flight', unit: 'cm' },
    places: ['indoors', 'porch', 'patio'],
    minutes: [15],
  },
  {
    id: 'straw-rocket',
    title: 'Straw Rocket',
    brief: 'Make a paper rocket that you launch by blowing through a straw.',
    materials: ['paper', 'straws', 'tape'],
    limits: ['The rocket must slide over the straw', 'Fins: as many as you like'],
    test: 'Launch 3 times and measure the farthest.',
    result: { label: 'Farthest launch', unit: 'cm' },
    places: ['indoors', 'porch', 'patio'],
    minutes: [15, 30],
  },
  {
    id: 'book-stand',
    title: 'Reading Stand',
    brief: 'Build a stand that holds a book open at a comfortable reading angle.',
    materials: ['cardboard', 'tape', 'rubber bands', 'popsicle sticks'],
    limits: ['It must fold flat when you are done'],
    test: 'Read 2 pages hands-free. Does the book stay open?',
    places: ['indoors', 'porch'],
    minutes: [30, 45],
  },
  {
    id: 'water-wheel',
    title: 'Water Wheel',
    brief: 'Build a wheel that spins when you pour water over it.',
    materials: ['recycling', 'popsicle sticks', 'straws', 'tape', 'cardboard'],
    extras: ['a pencil or skewer as the axle', 'a jug of water'],
    limits: ['Pour from a height of about 20 cm'],
    test: 'Pour one jug over it on the patio and count the turns.',
    result: { label: 'Turns', unit: 'turns' },
    places: ['patio'],
    minutes: [30, 45],
    water: true,
  },
  {
    id: 'mobile',
    title: 'Perfectly Balanced Mobile',
    brief: 'Make a hanging mobile with at least 5 objects where every arm hangs level.',
    materials: ['string', 'straws', 'popsicle sticks', 'paper', 'recycling'],
    limits: ['At least 3 levels'],
    test: 'Hang it up. Is every arm level?',
    places: ['indoors', 'porch'],
    minutes: [30, 45],
  },
  {
    id: 'shadow-theater',
    title: 'Shadow Puppet Theater',
    brief: 'Build a theater and puppets, then perform a 1-minute story.',
    materials: ['cardboard', 'paper', 'tape', 'popsicle sticks'],
    extras: ['a flashlight'],
    limits: ['At least 2 characters'],
    test: 'Perform for someone at home with the lights off.',
    places: ['indoors'],
    minutes: [30, 45],
  },
  {
    id: 'string-phone',
    title: 'String Telephone',
    brief: 'Make a telephone from two cups and string. How far can a whisper travel?',
    materials: ['string', 'recycling', 'tape'],
    limits: ['Keep the string tight and not touching anything'],
    test: 'Whisper a secret word and move farther apart until it can no longer be heard.',
    result: { label: 'Farthest whisper', unit: 'meters' },
    places: ['indoors', 'patio'],
    minutes: [15, 30],
  },
  {
    id: 'rain-hut',
    title: 'Rainproof Hut',
    brief: 'Build a hut for a LEGO figure that stays dry in a rainstorm.',
    materials: ['paper', 'cardboard', 'tape', 'LEGO', 'recycling'],
    extras: ['a cup of water', 'a paper towel inside as a "dryness detector"'],
    limits: ['Base no bigger than your hand'],
    test: 'On the patio, slowly pour a cup of water over the roof. Is the paper towel inside still dry?',
    result: { label: 'Dry? (1 = yes, 0 = no)', unit: '' },
    places: ['patio'],
    minutes: [15, 30],
    water: true,
  },
  {
    id: 'scale-model',
    title: 'Scale Model of the Backyard Studio',
    brief: 'Build a model of the glass room in the backyard at 1:20 scale.',
    materials: ['cardboard', 'paper', 'tape', 'straws', 'popsicle sticks', 'LEGO'],
    extras: ['tape measure'],
    limits: ['Measure the real studio first: every model measurement = real ÷ 20'],
    test: 'Check one measurement of the model × 20 against the real thing.',
    result: { label: 'Model width', unit: 'cm' },
    places: ['indoors', 'patio'],
    minutes: [45],
  },
  {
    id: 'zip-line',
    title: 'Porch Zip Line',
    brief: 'Send a LEGO figure down a string zip line as slowly and safely as possible.',
    materials: ['string', 'straws', 'paper', 'tape', 'LEGO', 'recycling'],
    extras: ['timer'],
    limits: ['Tie the string only to the porch railing and a chair: never to people'],
    test: 'Time the ride from top to bottom. Slower wins, as long as the figure stays on.',
    result: { label: 'Ride time', unit: 'seconds' },
    places: ['porch', 'indoors'],
    minutes: [30, 45],
  },
];

export const REFLECTIONS = [
  'What would you change if you built it again?',
  'What was the hardest part, and how did you solve it?',
  'What surprised you when you tested it?',
  'If you could add one more material, which would you pick and why?',
  'Which part are you proudest of?',
  'What would make it twice as good?',
];

export function isWinterMonth(month: number): boolean {
  return month >= 10 || month <= 2;
}

/** In winter, builds that can happen indoors come first. */
export function sortForSeason(list: Challenge[], month: number): Challenge[] {
  if (!isWinterMonth(month)) return list;
  return [...list].sort((a, b) => Number(!a.places.includes('indoors')) - Number(!b.places.includes('indoors')));
}

export function safetyNotes(c: Challenge): string[] {
  const notes = [ALWAYS_OFF_LIMITS];
  if (c.dropTest) notes.push('Drop tests: only from the porch railing onto the patio, and only with a grown-up there.');
  if (c.water) notes.push('Water stays on the patio.');
  return notes;
}

export function reflectionFor(seed: number): string {
  return REFLECTIONS[Math.abs(seed) % REFLECTIONS.length];
}
