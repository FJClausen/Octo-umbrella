import { likelyAt, speciesById, type SpotId } from './species';

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export function seasonOf(month: number): Season {
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'fall';
}

export interface AnimalMission {
  id: string;
  title: string;
  emoji: string;
  seasons: Season[];
  /** null = Naomi picks the spot. */
  spot: SpotId | null;
  brief: string;
  steps: string[];
  /** Species to put on the tally sheet. Empty = whatever is likely at the spot. */
  lookFor: string[];
  question: string;
  needsAdult?: boolean;
}

export const MISSIONS: AnimalMission[] = [
  // Fall
  {
    id: 'migration-watch', title: 'Migration watch', emoji: '🔭', seasons: ['fall'], spot: 'porch-lookout',
    brief: 'Millions of birds fly south in fall. Some of them pass right over your porch.',
    steps: ['Stand at the porch railing and look over the treetops.', 'Make a tally mark for every bird you see flying past, not just sitting.', 'Note which way most of them fly. Use the brick building as your landmark.'],
    lookFor: ['crow', 'starling', 'red-tailed-hawk', 'blue-jay', 'pigeon', 'yellow-rumped-warbler'],
    question: 'Which way did most birds fly? Why might birds fly that way in fall?',
  },
  {
    id: 'winter-arrivals', title: 'Winter arrivals', emoji: '❄️', seasons: ['fall', 'winter'], spot: 'gravel',
    brief: 'Some birds come to DC for the winter from farther north. They like to scratch on the ground near bushes.',
    steps: ['Sit still on the patio facing the gravel strip and bamboo.', 'Look low, near the ground. Watch for birds kicking leaves.', 'Tally every bird. Star the ones that are winter visitors.'],
    lookFor: ['junco', 'white-throated-sparrow', 'carolina-wren', 'cardinal', 'house-sparrow', 'robin'],
    question: 'Why would a bird fly south to DC for winter instead of staying farther north?',
  },
  {
    id: 'squirrel-stash', title: 'Squirrel stash patrol', emoji: '🌰', seasons: ['fall'], spot: 'fence',
    brief: 'Fall is nut-burying season. Squirrels hide food now to eat in winter.',
    steps: ['Watch the fence top and the ground below it.', 'Tally every squirrel. Make a separate mark each time one digs or buries something.', 'Check your squirrel roster: can you recognize anyone?'],
    lookFor: ['gray-squirrel', 'blue-jay', 'chipmunk'],
    question: 'Where did the squirrels hide food? How do you think they find it again?',
  },
  {
    id: 'web-hunters', title: 'Web hunters', emoji: '🕸️', seasons: ['fall', 'summer'], spot: 'fence',
    brief: 'Late summer and fall are spider season. Morning dew makes webs easy to see.',
    steps: ['Go out in the morning if you can.', 'Search the fence, trellises and bamboo for round webs. Do not touch them.', 'Tally each web. Sketch the best one on your sheet.'],
    lookFor: ['orb-weaver', 'ladybug', 'mantis'],
    question: 'Where were most of the webs? Why would a spider pick that place?',
  },
  {
    id: 'woolly-search', title: 'Woolly bear search', emoji: '🐛', seasons: ['fall'], spot: 'gravel',
    brief: 'Woolly bear caterpillars crawl around in fall, looking for a place to spend the winter.',
    steps: ['Search slowly along the gravel strip and the border stones.', 'Gently lift a few stones and put each one back exactly where it was.', 'Tally everything you find.'],
    lookFor: ['woolly-bear', 'earthworm', 'ladybug', 'orb-weaver'],
    question: 'Where do you think small animals go when it gets cold?',
  },
  {
    id: 'last-flowers', title: 'Last flowers', emoji: '💜', seasons: ['fall', 'summer'], spot: 'flower-bed',
    brief: 'Pollinators visit the last flowers of the year. Who still comes to the lavender and black-eyed Susans?',
    steps: ['Pick one plant to watch. Stand about one big step away.', 'Tally every insect that lands on a flower.', 'Note which plant was busiest.'],
    lookFor: ['bumblebee', 'honeybee', 'monarch', 'ladybug', 'hummingbird'],
    question: 'Were there more visitors on sunny or shady flowers? Why?',
  },
  // Winter
  {
    id: 'evergreen-shelter', title: 'Evergreen shelter', emoji: '🌲', seasons: ['winter'], spot: 'evergreens',
    brief: 'When the other trees are bare, evergreens are a warm hiding place for birds.',
    steps: ['Watch the evergreen trees from the patio.', 'Tally every bird that goes in or out.', 'Compare: count birds in the bare crape myrtle for one minute.'],
    lookFor: ['cardinal', 'chickadee', 'titmouse', 'junco', 'robin', 'downy-woodpecker'],
    question: 'Why do birds like evergreen trees in winter?',
  },
  {
    id: 'cold-day-tracks', title: 'Who is still awake?', emoji: '🐾', seasons: ['winter'], spot: null,
    brief: 'Some animals sleep a lot in winter. Others stay busy. Who is still out in your yard?',
    steps: ['Pick a spot and sit still.', 'Look for animals and for clues: tracks in frost or snow, chewed shells, droppings.', 'Tally animals, and write each clue on your sheet.'],
    lookFor: [],
    question: 'What clues did you find? What animal do you think left each one?',
  },
  // Spring
  {
    id: 'nest-builders', title: 'Nest builders', emoji: '🪺', seasons: ['spring'], spot: null,
    brief: 'In spring, birds carry grass, twigs and moss to build nests.',
    steps: ['Pick a spot and watch for birds carrying something in their beaks.', 'Tally each bird, and star the ones carrying nest stuff.', 'If you find a nest, watch from far away and never touch it.'],
    lookFor: [],
    question: 'What did the birds carry? Where do you think their nests are?',
  },
  {
    id: 'dawn-chorus', title: 'Song detective', emoji: '🎶', seasons: ['spring', 'summer'], spot: 'porch-lookout',
    brief: 'Birds sing the most in the morning. You can find birds with your ears first.',
    steps: ['Close your eyes for one minute and count how many different songs you hear.', 'Open your eyes and try to find each singer.', 'Tally each bird you hear or see.'],
    lookFor: ['cardinal', 'carolina-wren', 'mockingbird', 'robin', 'mourning-dove', 'chickadee'],
    question: 'How many different songs did you hear? Which was the loudest?',
  },
  {
    id: 'hummingbird-return', title: 'Hummingbird return', emoji: '🌸', seasons: ['spring', 'summer'], spot: 'flower-bed',
    brief: 'Hummingbirds come back to DC in spring. They love tube-shaped flowers like salvia.',
    steps: ['Sit near the salvia and lavender. Stay very still.', 'Listen for a buzz like a giant bee.', 'Tally every flower visitor.'],
    lookFor: ['hummingbird', 'bumblebee', 'honeybee', 'catbird'],
    question: 'Which flowers did the visitors like best? What shape were they?',
  },
  // Summer
  {
    id: 'firefly-count', title: 'Firefly flash count', emoji: '✨', seasons: ['summer'], spot: 'flower-bed', needsAdult: true,
    brief: 'On warm summer evenings, fireflies flash their lights to find each other.',
    steps: ['Go out with a grown-up just after sunset.', 'Count flashes for one minute at a time, three times.', 'Watch the sky too: bats and swifts hunt bugs at dusk.'],
    lookFor: ['firefly', 'bat', 'chimney-swift', 'rabbit'],
    question: 'Did you see more flashes near the ground or up high?',
  },
  {
    id: 'pollinator-patrol', title: 'Pollinator patrol', emoji: '🐝', seasons: ['summer', 'spring'], spot: 'flower-bed',
    brief: 'Bees and butterflies move pollen between flowers so plants can make seeds.',
    steps: ['Watch one flower patch.', 'Tally every pollinator that lands.', 'Time how long one bee stays on one flower.'],
    lookFor: ['bumblebee', 'honeybee', 'monarch', 'hummingbird', 'ladybug'],
    question: 'Which pollinator was busiest? How could you tell?',
  },
  {
    id: 'cicada-chorus', title: 'Cicada chorus', emoji: '🪲', seasons: ['summer'], spot: 'evergreens',
    brief: 'On hot days the trees buzz with cicadas. They are very hard to spot.',
    steps: ['Listen for the loudest tree.', 'Search the bark for empty brown shells.', 'Tally cicadas and shells separately.'],
    lookFor: ['cicada', 'mantis', 'blue-jay'],
    question: 'Was it louder in the sun or the shade? Why might that be?',
  },
  // Any season
  {
    id: 'squirrel-census', title: 'Squirrel census', emoji: '🐿️', seasons: ['fall', 'winter', 'spring', 'summer'], spot: 'fence',
    brief: 'Get to know your yard squirrels. Each one looks a little different.',
    steps: ['Watch the fence and trees for squirrels.', 'For each one, look for clues: fur color, tail shape, torn ear, size.', 'Draw the markings on your sheet, then update your squirrel roster in the app.'],
    lookFor: ['gray-squirrel', 'chipmunk'],
    question: 'How did you tell the squirrels apart?',
  },
  {
    id: 'secret-sit', title: 'Secret sit spot', emoji: '🤫', seasons: ['fall', 'winter', 'spring', 'summer'], spot: null,
    brief: 'Pick a spot, sit very still and become part of the yard. Animals come back when you are quiet.',
    steps: ['Pick a spot and get comfortable.', 'Stay still and quiet for the whole timer.', 'Tally everything that moves.'],
    lookFor: [],
    question: 'What did you notice after a few minutes of being still that you missed at first?',
  },
];

export function missionById(id: string): AnimalMission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** Missions for this month, season-only missions first. */
export function missionsFor(month: number): AnimalMission[] {
  const season = seasonOf(month);
  return MISSIONS.filter((m) => m.seasons.includes(season)).sort((a, b) => a.seasons.length - b.seasons.length);
}

/** Species for the tally sheet: the mission's list (in season), or what is likely at the spot. */
export function tallyList(m: AnimalMission, spot: SpotId, month: number): string[] {
  const listed = m.lookFor.map((id) => speciesById(id)).filter((s) => s && s.months.includes(month)).map((s) => s!.id);
  if (listed.length) return listed;
  return likelyAt(spot, month).slice(0, 8).map((s) => s.id);
}
