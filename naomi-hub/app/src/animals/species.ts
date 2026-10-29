/**
 * About 30 animals commonly seen in DC row-house backyards. Months are 0-based
 * (0 = January), matching Date.getMonth(). Facts are kept simple and conservative.
 */

export type SpotId = 'crape-myrtle' | 'fence' | 'flower-bed' | 'bamboo' | 'evergreens' | 'gravel' | 'porch-lookout' | 'sky';

export interface Spot {
  id: SpotId;
  name: string;
  emoji: string;
  where: 'patio' | 'porch';
  tip: string;
}

export const SPOTS: Spot[] = [
  { id: 'crape-myrtle', name: 'Crape myrtle', emoji: '🌸', where: 'patio', tip: 'Sit on the patio and watch the branches and the smooth bark.' },
  { id: 'fence', name: 'Fence top and trellises', emoji: '🪵', where: 'patio', tip: 'Squirrels and birds use the top plank like a highway. Watch both ends.' },
  { id: 'flower-bed', name: 'Lavender and flower bed', emoji: '💜', where: 'patio', tip: 'Watch the lavender, salvia and black-eyed Susans up close. Stay still: bees ignore calm people.' },
  { id: 'bamboo', name: 'Bamboo corner', emoji: '🎋', where: 'patio', tip: 'Birds hide in bamboo. Listen first, then look for movement.' },
  { id: 'evergreens', name: 'Evergreen trees', emoji: '🌲', where: 'patio', tip: 'Evergreens stay green all winter, so birds shelter here when it is cold.' },
  { id: 'gravel', name: 'Gravel strip and border stones', emoji: '🪨', where: 'patio', tip: 'Look low: worms, beetles, spiders and birds hopping on the ground.' },
  { id: 'porch-lookout', name: 'Porch railing lookout', emoji: '🔭', where: 'porch', tip: 'Look out over the treetops toward the brick building. Great for birds flying past.' },
  { id: 'sky', name: 'Open sky', emoji: '☁️', where: 'patio', tip: 'Lie back on the patio and watch the sky above the yard.' },
];

export type Group = 'bird' | 'mammal' | 'insect' | 'other';

export interface Species {
  id: string;
  name: string;
  emoji: string;
  group: Group;
  /** How to tell it apart. */
  lookFor: string;
  fact: string;
  months: number[];
  spots: SpotId[];
  when: 'day' | 'dusk' | 'night';
  caution?: string;
}

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const range = (from: number, to: number): number[] => (from <= to ? ALL.slice(from, to + 1) : [...ALL.slice(from), ...ALL.slice(0, to + 1)]);
const WARM = range(3, 9);

export const SPECIES: Species[] = [
  // Birds
  { id: 'robin', name: 'American robin', emoji: '🐦', group: 'bird', lookFor: 'Orange-red belly, gray back, hops then stops on the ground.', fact: 'Robins find earthworms mostly by looking. Many stay in DC all winter and eat berries.', months: ALL, spots: ['gravel', 'evergreens', 'crape-myrtle'], when: 'day' },
  { id: 'cardinal', name: 'Northern cardinal', emoji: '🐦', group: 'bird', lookFor: 'Male: bright red with a black face. Female: tan with red on the wings and crest.', fact: 'Female cardinals sing too, sometimes from the nest.', months: ALL, spots: ['bamboo', 'evergreens', 'crape-myrtle'], when: 'day' },
  { id: 'blue-jay', name: 'Blue jay', emoji: '🐦', group: 'bird', lookFor: 'Blue back, white belly, crest on the head, loud "jay!" call.', fact: 'Blue jays bury acorns to eat later and can copy the call of a hawk.', months: ALL, spots: ['evergreens', 'fence', 'porch-lookout'], when: 'day' },
  { id: 'mourning-dove', name: 'Mourning dove', emoji: '🕊️', group: 'bird', lookFor: 'Soft tan-gray, small head, long pointed tail, sad "coo-OO-oo".', fact: 'Its wings make a whistling sound when it takes off.', months: ALL, spots: ['fence', 'gravel', 'porch-lookout'], when: 'day' },
  { id: 'house-sparrow', name: 'House sparrow', emoji: '🐦', group: 'bird', lookFor: 'Small and brown. Males have a gray cap and a black bib. Often in noisy groups.', fact: 'House sparrows are not from America. People brought them from Europe in the 1850s.', months: ALL, spots: ['gravel', 'bamboo', 'fence'], when: 'day' },
  { id: 'house-finch', name: 'House finch', emoji: '🐦', group: 'bird', lookFor: 'Male: red head and chest, brown streaky back. Female: brown and streaky all over.', fact: 'House finches used to live only in the western US. Now they live in cities all over the East.', months: ALL, spots: ['crape-myrtle', 'fence'], when: 'day' },
  { id: 'crow', name: 'American crow', emoji: '🐦‍⬛', group: 'bird', lookFor: 'All black, bigger than a pigeon, loud "caw".', fact: 'Crows can remember human faces for years.', months: ALL, spots: ['porch-lookout', 'sky'], when: 'day' },
  { id: 'mockingbird', name: 'Northern mockingbird', emoji: '🐦', group: 'bird', lookFor: 'Gray with white patches that flash on the wings and tail. Sings from high perches.', fact: 'Mockingbirds copy the songs of other birds and even car alarms.', months: ALL, spots: ['fence', 'porch-lookout', 'crape-myrtle'], when: 'day' },
  { id: 'carolina-wren', name: 'Carolina wren', emoji: '🐦', group: 'bird', lookFor: 'Tiny, rusty brown, white eyebrow stripe, tail often sticking up.', fact: 'It is tiny but very loud. Listen for "tea-kettle, tea-kettle, tea-kettle!"', months: ALL, spots: ['bamboo', 'flower-bed', 'gravel'], when: 'day' },
  { id: 'chickadee', name: 'Carolina chickadee', emoji: '🐦', group: 'bird', lookFor: 'Tiny, black cap, black bib, white cheeks.', fact: 'In its "chick-a-dee-dee-dee" call, more "dee" notes can mean a more dangerous predator is near.', months: ALL, spots: ['crape-myrtle', 'evergreens', 'bamboo'], when: 'day' },
  { id: 'titmouse', name: 'Tufted titmouse', emoji: '🐦', group: 'bird', lookFor: 'Small and gray with a pointy crest and big black eyes.', fact: 'Titmice often travel with chickadees in winter, like a team.', months: ALL, spots: ['crape-myrtle', 'evergreens'], when: 'day' },
  { id: 'downy-woodpecker', name: 'Downy woodpecker', emoji: '🐦', group: 'bird', lookFor: 'Small, black and white, short beak. Males have a red spot on the back of the head.', fact: 'It is the smallest woodpecker in North America.', months: ALL, spots: ['crape-myrtle', 'evergreens'], when: 'day' },
  { id: 'red-bellied-woodpecker', name: 'Red-bellied woodpecker', emoji: '🐦', group: 'bird', lookFor: 'Black-and-white striped back, red on the head, loud rolling "churr".', fact: 'Its belly is only a little bit reddish. The red you see is mostly on its head.', months: ALL, spots: ['evergreens', 'porch-lookout'], when: 'day' },
  { id: 'starling', name: 'European starling', emoji: '🐦', group: 'bird', lookFor: 'Shiny dark feathers, short tail, yellow beak in spring. White spots in winter.', fact: 'Starlings came from Europe. Huge flocks swirl together in the sky in fall.', months: ALL, spots: ['sky', 'porch-lookout', 'gravel'], when: 'day' },
  { id: 'white-throated-sparrow', name: 'White-throated sparrow', emoji: '🐦', group: 'bird', lookFor: 'Brown sparrow with a white throat, striped head and a yellow spot near the eye. Scratches under bushes.', fact: 'It only visits DC in the colder months. Its song sounds like "Oh sweet Canada, Canada, Canada".', months: range(9, 3), spots: ['gravel', 'bamboo', 'flower-bed'], when: 'day' },
  { id: 'junco', name: 'Dark-eyed junco', emoji: '🐦', group: 'bird', lookFor: 'Slate-gray top, white belly, pink beak. White tail edges flash when it flies.', fact: 'People call juncos "snowbirds" because they arrive in late fall and leave in spring.', months: range(9, 3), spots: ['gravel', 'evergreens'], when: 'day' },
  { id: 'yellow-rumped-warbler', name: 'Yellow-rumped warbler', emoji: '🐦', group: 'bird', lookFor: 'Streaky gray-brown with a bright yellow patch just above the tail.', fact: 'Most warblers fly south for winter, but this one can eat berries, so many stay nearby.', months: range(9, 4), spots: ['crape-myrtle', 'evergreens', 'bamboo'], when: 'day' },
  { id: 'hummingbird', name: 'Ruby-throated hummingbird', emoji: '🐦', group: 'bird', lookFor: 'Tiny, green back, hovers at flowers. Males have a red throat.', fact: 'Many fly across the Gulf of Mexico without stopping on their way south.', months: range(3, 8), spots: ['flower-bed', 'crape-myrtle'], when: 'day' },
  { id: 'catbird', name: 'Gray catbird', emoji: '🐦', group: 'bird', lookFor: 'All slate gray with a black cap. Makes a "mew" like a cat.', fact: 'Catbirds spend winter far to the south and come back in spring.', months: range(4, 9), spots: ['bamboo', 'evergreens'], when: 'day' },
  { id: 'pigeon', name: 'Rock pigeon', emoji: '🐦', group: 'bird', lookFor: 'Gray with two dark wing bars, shiny green-purple neck.', fact: 'Pigeons are famous for finding their way home from far away.', months: ALL, spots: ['porch-lookout', 'sky'], when: 'day' },
  { id: 'red-tailed-hawk', name: 'Red-tailed hawk', emoji: '🦅', group: 'bird', lookFor: 'Big hawk soaring in circles. Adults have a rusty red tail.', fact: 'When a hawk flies over, small birds often go quiet or hide. Watch for that clue!', months: ALL, spots: ['sky', 'porch-lookout'], when: 'day' },
  { id: 'chimney-swift', name: 'Chimney swift', emoji: '🐦', group: 'bird', lookFor: 'Looks like a flying cigar with skinny curved wings, twittering high up.', fact: 'Swifts cannot perch on branches. They cling to walls inside chimneys.', months: range(3, 9), spots: ['sky', 'porch-lookout'], when: 'day' },
  // Mammals
  { id: 'gray-squirrel', name: 'Eastern gray squirrel', emoji: '🐿️', group: 'mammal', lookFor: 'Gray or black fur and a big bushy tail. DC has lots of black ones!', fact: 'Black squirrels are the same kind as gray ones. Squirrels forget some nuts they bury, and those can grow into trees.', months: ALL, spots: ['fence', 'crape-myrtle', 'evergreens', 'gravel'], when: 'day' },
  { id: 'chipmunk', name: 'Eastern chipmunk', emoji: '🐿️', group: 'mammal', lookFor: 'Smaller than a squirrel, with stripes down its back and face.', fact: 'Chipmunks stuff food into cheek pouches to carry it home.', months: range(2, 10), spots: ['gravel', 'flower-bed'], when: 'day' },
  { id: 'rabbit', name: 'Eastern cottontail', emoji: '🐇', group: 'mammal', lookFor: 'Brown rabbit with a fluffy white tail.', fact: 'Rabbits freeze in place when scared, hoping you will not notice them.', months: ALL, spots: ['gravel', 'flower-bed'], when: 'dusk' },
  { id: 'fox', name: 'Red fox', emoji: '🦊', group: 'mammal', lookFor: 'Orange-red fur, black legs, white tip on a bushy tail.', fact: 'City foxes hunt mice and rats, often at dawn and dusk.', months: ALL, spots: ['porch-lookout', 'gravel'], when: 'dusk', caution: 'Watch from far away. Never go near a wild animal.' },
  { id: 'raccoon', name: 'Raccoon', emoji: '🦝', group: 'mammal', lookFor: 'Black mask, ringed tail, hand-like paws.', fact: 'Raccoons feel their food carefully with very sensitive front paws.', months: ALL, spots: ['fence', 'porch-lookout'], when: 'night', caution: 'Watch from far away with a grown-up. Never go near a raccoon.' },
  { id: 'opossum', name: 'Virginia opossum', emoji: '🐀', group: 'mammal', lookFor: 'Gray fur, white pointy face, long bare tail.', fact: 'Opossums are the only marsupials in North America. Babies ride in a pouch, then on mom’s back.', months: ALL, spots: ['fence', 'gravel'], when: 'night', caution: 'Watch from far away with a grown-up.' },
  { id: 'bat', name: 'Big brown bat', emoji: '🦇', group: 'mammal', lookFor: 'Fluttery zig-zag flight against the sky at dusk.', fact: 'Bats find insects in the dark by listening to echoes of their own calls.', months: WARM, spots: ['sky', 'porch-lookout'], when: 'dusk', caution: 'Never touch a bat, even one on the ground. Tell a grown-up.' },
  // Insects and other small animals
  { id: 'monarch', name: 'Monarch butterfly', emoji: '🦋', group: 'insect', lookFor: 'Big orange butterfly with black veins and white dots on the edges.', fact: 'In fall, monarchs fly all the way to the mountains of Mexico.', months: range(5, 9), spots: ['flower-bed', 'sky'], when: 'day' },
  { id: 'bumblebee', name: 'Bumblebee', emoji: '🐝', group: 'insect', lookFor: 'Fat, fuzzy, black and yellow, loud buzz.', fact: 'Bumblebees can shake pollen loose from flowers by buzzing.', months: range(3, 9), spots: ['flower-bed'], when: 'day', caution: 'Bees are calm if you are calm. Watch, do not touch.' },
  { id: 'honeybee', name: 'Honeybee', emoji: '🐝', group: 'insect', lookFor: 'Slimmer than a bumblebee, golden-brown with stripes.', fact: 'Honeybees do a "waggle dance" to tell their hive where flowers are.', months: range(2, 9), spots: ['flower-bed', 'crape-myrtle'], when: 'day', caution: 'Watch, do not touch.' },
  { id: 'lanternfly', name: 'Spotted lanternfly', emoji: '🪲', group: 'insect', lookFor: 'Gray wings with black spots. Shows bright red underwings when it hops.', fact: 'It is an invasive pest that hurts trees, so DC asks people to report it.', months: range(6, 11), spots: ['fence', 'crape-myrtle'], when: 'day', caution: 'Tell a grown-up if you see one. It does not sting or bite.' },
  { id: 'orb-weaver', name: 'Orb weaver spider', emoji: '🕷️', group: 'other', lookFor: 'A round wheel-shaped web, often with the spider in the middle.', fact: 'Many orb weavers build a brand-new web almost every day.', months: range(7, 10), spots: ['fence', 'bamboo', 'flower-bed'], when: 'day', caution: 'Look closely, but do not touch the spider.' },
  { id: 'woolly-bear', name: 'Woolly bear caterpillar', emoji: '🐛', group: 'insect', lookFor: 'Fuzzy caterpillar, black at both ends and rusty brown in the middle.', fact: 'An old story says its stripes predict the winter. Scientists say they do not!', months: range(8, 10), spots: ['gravel', 'flower-bed'], when: 'day' },
  { id: 'firefly', name: 'Firefly', emoji: '✨', group: 'insect', lookFor: 'Blinking yellow-green lights over the yard after sunset.', fact: 'Different kinds of fireflies flash different patterns, like a secret code.', months: range(5, 7), spots: ['flower-bed', 'sky'], when: 'dusk' },
  { id: 'cicada', name: 'Annual cicada', emoji: '🪲', group: 'insect', lookFor: 'Loud buzzing from the trees on hot days. Empty brown shells on bark.', fact: 'Only the males make the loud buzzing song.', months: range(6, 8), spots: ['evergreens', 'crape-myrtle'], when: 'day' },
  { id: 'mantis', name: 'Praying mantis', emoji: '🦗', group: 'insect', lookFor: 'Long green or brown insect holding its front legs together.', fact: 'A mantis can turn its head to look over its shoulder.', months: range(7, 9), spots: ['flower-bed', 'bamboo'], when: 'day' },
  { id: 'ladybug', name: 'Lady beetle', emoji: '🐞', group: 'insect', lookFor: 'Round red or orange beetle with black spots.', fact: 'Lady beetles eat aphids, tiny bugs that suck juice from plants.', months: range(2, 10), spots: ['flower-bed', 'crape-myrtle'], when: 'day' },
  { id: 'earthworm', name: 'Earthworm', emoji: '🪱', group: 'other', lookFor: 'Under stones and in damp soil, especially after rain.', fact: 'Earthworms have no eyes or lungs. They breathe through their skin.', months: range(2, 10), spots: ['gravel', 'flower-bed'], when: 'day', caution: 'Put stones back exactly where they were.' },
];

export function speciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function spotById(id: string): Spot | undefined {
  return SPOTS.find((s) => s.id === id);
}

export function inSeason(s: Species, month: number): boolean {
  return s.months.includes(month);
}

/** In-season species usually found at a spot, birds first. */
export function likelyAt(spot: SpotId, month: number): Species[] {
  const order: Group[] = ['bird', 'mammal', 'insect', 'other'];
  return SPECIES.filter((s) => s.spots.includes(spot) && inSeason(s, month)).sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}
