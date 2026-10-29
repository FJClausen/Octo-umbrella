import { makeRng, pick } from '../puzzles/rng';
import { FIBONACCI, formatMixed, frac, mul, percentOff, round, toNumber, within, type Fraction } from './numbers';

export type Place = 'patio' | 'porch' | 'indoors' | 'kitchen';
export type Category = 'estimate' | 'geometry' | 'ratio' | 'pattern' | 'probability' | 'algebra';

export interface Field {
  id: string;
  label: string;
  unit?: string;
}

export interface Feedback {
  tone: 'great' | 'ok' | 'retry';
  text: string;
}

/** Per-print details: a recipe's numbers, the answer key, values to check against. */
export interface Variant {
  lines: string[];
  answerKey: string[];
  expected: Record<string, number>;
}

export interface MathMission {
  id: string;
  title: string;
  category: Category;
  place: Place;
  minutes: number;
  needsSun?: boolean;
  tools: string[];
  intro: string;
  steps: string[];
  /** Blank table printed on the sheet for raw notes. */
  record?: { columns: string[]; rows: number };
  /** Final numbers Naomi types in after finishing the sheet. */
  fields: Field[];
  /** Printed on page 2: how to check the work. */
  hints: string[];
  variant?: (seed: number) => Variant;
  evaluate: (v: Record<string, number>, expected: Record<string, number>) => Feedback[];
}

const NO_VARIANT: Variant = { lines: [], answerKey: [], expected: {} };

export function estimateFeedback(estimate: number, actual: number, what: string): Feedback {
  const off = round(percentOff(estimate, actual), 0);
  if (off <= 10) return { tone: 'great', text: `Your estimate of ${what} was only ${off}% off. Expert estimator! ⭐⭐⭐` };
  if (off <= 25) return { tone: 'ok', text: `Your estimate of ${what} was ${off}% off. Nice! ⭐⭐` };
  return { tone: 'ok', text: `Your estimate of ${what} was ${off}% off. Estimating is a skill: try again on another mission. ⭐` };
}

/** Checks Naomi’s own arithmetic: the answer against what the measurements give. */
export function mathCheck(answer: number, fromHerNumbers: number, what: string, tolerancePct = 3): Feedback {
  return within(answer, fromHerNumbers, tolerancePct)
    ? { tone: 'great', text: `Math check: your ${what} matches your measurements (${round(fromHerNumbers)}). ✔` }
    : { tone: 'retry', text: `Math check: from your measurements, ${what} should come out near ${round(fromHerNumbers)}, not ${round(answer)}. Look at your working again.` };
}

interface Ingredient {
  name: string;
  amount: Fraction;
  unit: string;
}

function recipeVariant(
  rng: () => number,
  title: string,
  serves: number,
  ingredients: Ingredient[],
  targets: number[],
): Variant {
  const target = pick(rng, targets);
  const factor = frac(target, serves);
  const scaled = ingredients.map((i) => ({ ...i, amount: mul(i.amount, factor) }));
  return {
    lines: [
      `${title}: the recipe serves ${serves}. You need to make enough for ${target}.`,
      ...ingredients.map((i) => `• ${formatMixed(i.amount)} ${i.unit} ${i.name}`),
    ],
    answerKey: [`Scale factor: ${target} ÷ ${serves} = ${formatMixed(factor)}`, ...scaled.map((i) => `${i.name}: ${formatMixed(i.amount)} ${i.unit}`)],
    expected: Object.fromEntries(scaled.map((i, idx) => [`i${idx}`, toNumber(i.amount)])),
  };
}

function recipeFeedback(v: Record<string, number>, expected: Record<string, number>, names: string[]): Feedback[] {
  const out: Feedback[] = [];
  let right = 0;
  names.forEach((name, idx) => {
    const key = `i${idx}`;
    if (within(v[key], expected[key], 1)) right++;
    else out.push({ tone: 'retry', text: `${name}: check this one again.` });
  });
  out.unshift(
    right === names.length
      ? { tone: 'great', text: `All ${names.length} amounts are exactly right. You could run a bakery! ✔` }
      : { tone: 'ok', text: `${right} of ${names.length} amounts are right.` },
  );
  return out;
}

const PANCAKES: Ingredient[] = [
  { name: 'flour', amount: frac(3, 2), unit: 'cups' },
  { name: 'milk', amount: frac(5, 4), unit: 'cups' },
  { name: 'sugar', amount: frac(2), unit: 'tbsp' },
  { name: 'baking powder', amount: frac(7, 2), unit: 'tsp' },
  { name: 'melted butter', amount: frac(3), unit: 'tbsp' },
];

const TRAIL_MIX: Ingredient[] = [
  { name: 'peanuts', amount: frac(3, 4), unit: 'cup' },
  { name: 'raisins', amount: frac(1, 2), unit: 'cup' },
  { name: 'pretzels', amount: frac(2, 3), unit: 'cup' },
  { name: 'chocolate chips', amount: frac(1, 4), unit: 'cup' },
];

export const MISSIONS: MathMission[] = [
  {
    id: 'paver-patrol',
    title: 'Paver Patrol',
    category: 'geometry',
    place: 'patio',
    minutes: 20,
    tools: ['tape measure', 'pencil'],
    intro: 'The patio is made of big stone pavers. How much ground does it cover?',
    steps: [
      'Before measuring anything, estimate the area of the open patio (the stone part, not the glass room) and write it down.',
      'Measure one paver: its length and its width.',
      'Count how many pavers cover the open patio. Half pavers count as half.',
      'Area of one paver = length × width. Patio area = that × the number of pavers.',
    ],
    record: { columns: ['What', 'Number', 'Unit'], rows: 5 },
    fields: [
      { id: 'estimate', label: 'My estimate of the patio area', unit: 'sq units' },
      { id: 'length', label: 'One paver: length' },
      { id: 'width', label: 'One paver: width' },
      { id: 'count', label: 'Number of pavers' },
      { id: 'area', label: 'My calculated patio area', unit: 'sq units' },
    ],
    hints: [
      'Use the same unit everywhere. If you measured in inches, the area is in square inches.',
      'Square feet from square inches: divide by 144 (12 × 12).',
      'Pavers are not all the same size? Measure a typical one: estimating is fine here.',
    ],
    evaluate: (v) => [mathCheck(v.area, v.length * v.width * v.count, 'patio area'), estimateFeedback(v.estimate, v.area, 'the patio area')],
  },
  {
    id: 'fence-planks',
    title: 'How Tall Is the Fence?',
    category: 'estimate',
    place: 'patio',
    minutes: 15,
    tools: ['tape measure'],
    intro: 'The fence is built from horizontal planks. Can you work out its height without measuring the whole thing?',
    steps: [
      'Estimate the height of the fence and write it down.',
      'Count the planks from the ground to the top.',
      'Measure the height of one plank, and the gap between two planks.',
      'Predict: height = planks × plank height + gaps × gap. Then measure the real height with the tape.',
    ],
    record: { columns: ['What', 'Number', 'Unit'], rows: 5 },
    fields: [
      { id: 'estimate', label: 'My estimate of the fence height' },
      { id: 'planks', label: 'Number of planks' },
      { id: 'plank', label: 'Height of one plank' },
      { id: 'gap', label: 'One gap between planks' },
      { id: 'predicted', label: 'My predicted fence height' },
      { id: 'measured', label: 'Measured fence height' },
    ],
    hints: [
      'With 10 planks there are 9 gaps between them.',
      'If prediction and measurement differ a little, the planks may not all be the same.',
    ],
    evaluate: (v) => [
      mathCheck(v.predicted, v.planks * v.plank + Math.max(0, v.planks - 1) * v.gap, 'prediction', 5),
      estimateFeedback(v.predicted, v.measured, 'the fence height (your prediction vs. the tape)'),
      estimateFeedback(v.estimate, v.measured, 'the fence height (your first guess)'),
    ],
  },
  {
    id: 'shadow-tree',
    title: 'Measure a Tree With Your Shadow',
    category: 'ratio',
    place: 'patio',
    minutes: 15,
    needsSun: true,
    tools: ['tape measure', 'a helper'],
    intro: 'On a sunny day, every shadow is the same fraction of its object. Use yours to measure the crape myrtle.',
    steps: [
      'Estimate how tall the crape myrtle is.',
      'Measure your own height (or use the one from the doctor).',
      'Stand in the sun and have a helper measure your shadow, heel to the top of the head.',
      'Right away, measure the tree’s shadow from trunk to the tip of its top branch.',
      'Tree height = tree shadow × (your height ÷ your shadow).',
    ],
    record: { columns: ['What', 'Number', 'Unit'], rows: 5 },
    fields: [
      { id: 'estimate', label: 'My estimate of the tree height' },
      { id: 'me', label: 'My height' },
      { id: 'myShadow', label: 'My shadow' },
      { id: 'treeShadow', label: 'Tree shadow' },
      { id: 'tree', label: 'My calculated tree height' },
    ],
    hints: [
      'Do both shadows within a few minutes: shadows grow as the sun moves.',
      'The tree’s shadow may land on the fence or pergola. Pick a time when it lies on the patio.',
      'This is the same trick Thales used to measure a pyramid 2,600 years ago.',
    ],
    evaluate: (v) => [mathCheck(v.tree, v.treeShadow * (v.me / v.myShadow), 'tree height', 4), estimateFeedback(v.estimate, v.tree, 'the tree height')],
  },
  {
    id: 'shadow-clock',
    title: 'Shadow Clock',
    category: 'algebra',
    place: 'patio',
    minutes: 45,
    needsSun: true,
    tools: ['chalk or small stones', 'tape measure', 'timer'],
    intro: 'The pergola slats throw striped shadows on the patio. They move. How fast, and where will they be later?',
    steps: [
      'Mark the edge of one shadow stripe on the ground with chalk or a stone. Write the time.',
      'Every 10 minutes, mark it again, 4 times in all.',
      'Measure the distance from the first mark to each later one.',
      'Speed = distance moved ÷ minutes. Use it to predict where the stripe will be 30 minutes after your last mark, and mark that spot.',
      'Wait and see if you were right!',
    ],
    record: { columns: ['Time', 'Minutes since start', 'Distance from first mark'], rows: 5 },
    fields: [
      { id: 'distance', label: 'Distance moved in total' },
      { id: 'mins', label: 'Minutes between first and last mark' },
      { id: 'speed', label: 'My speed', unit: 'per minute' },
      { id: 'predicted', label: 'Predicted move in the next 30 min' },
      { id: 'actual', label: 'Actual move in those 30 min' },
    ],
    hints: [
      'If the marks are evenly spaced, the speed is steady: that is a linear relationship, distance = speed × time.',
      'Near noon, shadows move differently than in the morning. Why might that be?',
    ],
    evaluate: (v) => [
      mathCheck(v.speed, v.distance / v.mins, 'speed', 5),
      mathCheck(v.predicted, v.speed * 30, 'prediction', 5),
      estimateFeedback(v.predicted, v.actual, 'where the shadow went'),
    ],
  },
  {
    id: 'baluster-count',
    title: 'Railing Riddle',
    category: 'algebra',
    place: 'porch',
    minutes: 15,
    tools: ['tape measure'],
    intro: 'The porch railing has rows of white balusters (the thin posts). Can you predict how many there are without counting?',
    steps: [
      'Estimate how many balusters the whole railing has.',
      'Measure the length of one straight section of railing.',
      'Measure the distance from the center of one baluster to the center of the next.',
      'Predict: balusters = length ÷ spacing + 1. Then count them for real.',
    ],
    record: { columns: ['Section', 'Length', 'Spacing', 'Predicted', 'Counted'], rows: 4 },
    fields: [
      { id: 'estimate', label: 'My first estimate' },
      { id: 'length', label: 'Section length' },
      { id: 'spacing', label: 'Spacing (center to center)' },
      { id: 'predicted', label: 'My prediction for that section' },
      { id: 'counted', label: 'Counted in that section' },
    ],
    hints: ['Why “+ 1”? Five fence posts make four gaps. This is called the fencepost problem.'],
    evaluate: (v) => [
      mathCheck(v.predicted, v.length / v.spacing + 1, 'prediction', 8),
      estimateFeedback(v.predicted, v.counted, 'the balusters (prediction vs. count)'),
    ],
  },
  {
    id: 'checker-floor',
    title: 'Checkerboard Floor',
    category: 'geometry',
    place: 'porch',
    minutes: 20,
    tools: ['tape measure', 'pencil'],
    intro: 'The porch floor has a green and yellow pattern. What fraction is green? How big is the porch?',
    steps: [
      'Look closely at the pattern and sketch one repeating block on the sheet.',
      'In your block, count the green squares and the total squares.',
      'Measure one small square and count how many squares fit along and across the porch.',
      'Porch area = squares along × squares across × area of one square.',
    ],
    record: { columns: ['What', 'Number'], rows: 6 },
    fields: [
      { id: 'green', label: 'Green squares in one block' },
      { id: 'total', label: 'Total squares in one block' },
      { id: 'pct', label: 'Percent green', unit: '%' },
      { id: 'side', label: 'Side of one small square' },
      { id: 'along', label: 'Squares along' },
      { id: 'across', label: 'Squares across' },
      { id: 'area', label: 'My porch area', unit: 'sq units' },
    ],
    hints: ['Percent = green ÷ total × 100.', 'A repeating block is the smallest piece that, copied over and over, makes the whole floor.'],
    evaluate: (v) => [
      mathCheck(v.pct, (v.green / v.total) * 100, 'percent green', 2),
      mathCheck(v.area, v.along * v.across * v.side * v.side, 'porch area'),
    ],
  },
  {
    id: 'step-ruler',
    title: 'Your Body Is a Ruler',
    category: 'estimate',
    place: 'patio',
    minutes: 15,
    tools: ['tape measure'],
    intro: 'Roman soldiers measured roads in paces. How good is your pace?',
    steps: [
      'Walk 10 normal steps in a straight line. Measure the total distance.',
      'Your step length = distance ÷ 10.',
      'Pick a distance, like the glass door to the far fence. Walk it and count your steps.',
      'Predict the distance = steps × step length. Then measure it with the tape.',
    ],
    record: { columns: ['What', 'Number', 'Unit'], rows: 5 },
    fields: [
      { id: 'ten', label: 'Distance of 10 steps' },
      { id: 'steps', label: 'Steps across my chosen distance' },
      { id: 'predicted', label: 'My predicted distance' },
      { id: 'measured', label: 'Measured distance' },
    ],
    hints: ['A longer test walk (20 steps) makes a more accurate step length. Why?'],
    evaluate: (v) => [mathCheck(v.predicted, (v.ten / 10) * v.steps, 'prediction', 5), estimateFeedback(v.predicted, v.measured, 'the distance')],
  },
  {
    id: 'gravel-sample',
    title: 'Counting the Uncountable',
    category: 'estimate',
    place: 'patio',
    minutes: 20,
    tools: ['ruler', 'small cup'],
    intro: 'How many white stones are in the gravel strip by the planter? Way too many to count, so scientists sample.',
    steps: [
      'Guess the total number of stones in the strip.',
      'Mark out a small square, 10 × 10 (cm or inches), on the gravel. Count only the top-layer stones inside it.',
      'Measure the length and width of the whole gravel strip.',
      'Total ≈ stones in sample × (strip area ÷ sample area).',
    ],
    record: { columns: ['What', 'Number'], rows: 5 },
    fields: [
      { id: 'guess', label: 'My first guess' },
      { id: 'sample', label: 'Stones in the sample square' },
      { id: 'length', label: 'Strip length' },
      { id: 'width', label: 'Strip width' },
      { id: 'total', label: 'My estimate from the sample' },
    ],
    hints: ['Sample area = 10 × 10 = 100 square units.', 'Ecologists count birds, trees and fish exactly this way.'],
    evaluate: (v) => [mathCheck(v.total, v.sample * ((v.length * v.width) / 100), 'sample estimate', 5), estimateFeedback(v.guess, v.total, 'the stones (first guess vs. sampling)')],
  },
  {
    id: 'fibonacci-hunt',
    title: 'Fibonacci Hunt',
    category: 'pattern',
    place: 'patio',
    minutes: 20,
    tools: ['pencil'],
    intro: 'Nature loves the numbers 1, 1, 2, 3, 5, 8, 13, 21… Find them in the garden!',
    steps: [
      'Count the petals on 3 different flowers (black-eyed Susans, lavender, anything blooming).',
      'Find a pinecone, sunflower head or cactus if you can, and count the spirals going one way.',
      'Count the leaves going around a stem until one sits right above the first.',
      'Write your 5 best counts.',
    ],
    record: { columns: ['What I counted', 'Number'], rows: 6 },
    fields: [
      { id: 'c1', label: 'Count 1' },
      { id: 'c2', label: 'Count 2' },
      { id: 'c3', label: 'Count 3' },
      { id: 'c4', label: 'Count 4' },
      { id: 'c5', label: 'Count 5' },
    ],
    hints: ['Each Fibonacci number is the sum of the two before it: 5 + 8 = 13.', 'Not every count will be Fibonacci, because flowers lose petals!'],
    evaluate: (v) => {
      const counts = ['c1', 'c2', 'c3', 'c4', 'c5'].map((k) => v[k]);
      const fib = counts.filter((c) => FIBONACCI.includes(c));
      return [
        {
          tone: fib.length >= 3 ? 'great' : 'ok',
          text: `${fib.length} of your 5 counts are Fibonacci numbers${fib.length ? ` (${fib.join(', ')})` : ''}.`,
        },
      ];
    },
  },
  {
    id: 'leaf-ratio',
    title: 'Leaf Shape Detective',
    category: 'ratio',
    place: 'patio',
    minutes: 20,
    tools: ['ruler'],
    intro: 'Are all leaves from one plant the same shape, even if they are different sizes?',
    steps: [
      'Pick 5 fallen leaves from the same plant (crape myrtle leaves are great).',
      'Measure each leaf’s length and width at the widest point.',
      'For each leaf, ratio = length ÷ width.',
      'Find the average ratio of all 5.',
    ],
    record: { columns: ['Leaf', 'Length', 'Width', 'Length ÷ width'], rows: 5 },
    fields: [
      { id: 'r1', label: 'Ratio, leaf 1' },
      { id: 'r2', label: 'Ratio, leaf 2' },
      { id: 'r3', label: 'Ratio, leaf 3' },
      { id: 'r4', label: 'Ratio, leaf 4' },
      { id: 'r5', label: 'Ratio, leaf 5' },
      { id: 'avg', label: 'My average ratio' },
    ],
    hints: ['Average = add them all up, then divide by 5.', 'Similar shapes have the same ratio even when one is bigger.'],
    evaluate: (v) => {
      const rs = ['r1', 'r2', 'r3', 'r4', 'r5'].map((k) => v[k]);
      const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
      const spread = Math.max(...rs) - Math.min(...rs);
      return [
        mathCheck(v.avg, mean, 'average', 2),
        { tone: 'ok', text: spread / mean < 0.2 ? 'Your leaves have very similar shapes: they are nearly similar figures!' : 'Your leaves vary a lot in shape. Interesting: why might that be?' },
      ];
    },
  },
  {
    id: 'coin-flips',
    title: 'Is a Coin Fair?',
    category: 'probability',
    place: 'indoors',
    minutes: 15,
    tools: ['a coin'],
    intro: 'Heads and tails should each come up half the time. Do they really?',
    steps: [
      'Predict how many heads you will get in 50 flips.',
      'Flip 50 times and tally heads and tails in groups of 10.',
      'Percent heads = heads ÷ 50 × 100.',
    ],
    record: { columns: ['Flips', 'Heads', 'Tails'], rows: 5 },
    fields: [
      { id: 'predicted', label: 'My predicted heads' },
      { id: 'heads', label: 'Heads in 50 flips' },
      { id: 'pct', label: 'Percent heads', unit: '%' },
    ],
    hints: ['Getting exactly 25 is actually unlikely: only about 1 time in 9.', 'The more flips, the closer to 50% you usually get. That is the law of large numbers.'],
    evaluate: (v) => [
      mathCheck(v.pct, (v.heads / 50) * 100, 'percent', 2),
      { tone: 'ok', text: Math.abs(v.heads - 25) <= 5 ? `${v.heads} heads is well within what a fair coin does.` : `${v.heads} heads is a bit unusual for a fair coin. Try another 50!` },
    ],
  },
  {
    id: 'two-dice',
    title: 'Lucky Number Seven',
    category: 'probability',
    place: 'indoors',
    minutes: 20,
    tools: ['two dice'],
    intro: 'Roll two dice and add them. Which total comes up most often, and why?',
    steps: [
      'Guess which total (2 to 12) will come up most.',
      'Roll 36 times and tally each total.',
      'List all the ways to make 7 (1+6, 2+5, …) and all the ways to make 2.',
    ],
    record: { columns: ['Total', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], rows: 2 },
    fields: [
      { id: 'top', label: 'Total that came up most' },
      { id: 'sevens', label: 'How many 7s' },
      { id: 'waysSeven', label: 'Ways to make 7' },
      { id: 'waysTwo', label: 'Ways to make 2' },
    ],
    hints: ['Count 3+4 and 4+3 as different ways: the two dice are different dice.', 'With 36 rolls, you would expect about 6 sevens.'],
    evaluate: (v) => [
      v.waysSeven === 6 ? { tone: 'great', text: 'Yes, there are 6 ways to make 7, more than any other total. ✔' } : { tone: 'retry', text: 'Ways to make 7: count again, using each die separately.' },
      v.waysTwo === 1 ? { tone: 'great', text: 'Only 1 way to make 2 (1+1). ✔' } : { tone: 'retry', text: 'Ways to make 2: there is just one, 1 + 1.' },
      { tone: 'ok', text: `You rolled ${v.sevens} sevens; the expected number is 6 out of 36.` },
    ],
  },
  {
    id: 'pancake-scale',
    title: 'Pancake Party',
    category: 'ratio',
    place: 'kitchen',
    minutes: 20,
    tools: ['measuring cups and spoons'],
    intro: 'Friends are coming! Scale the pancake recipe so there is enough for everyone.',
    steps: [
      'Work out the scale factor: people you need ÷ people the recipe serves.',
      'Multiply every ingredient by the scale factor. Keep fractions as fractions!',
      'Write the new amounts on the sheet.',
      'Bonus: make the pancakes with a grown-up and check the measuring cups.',
    ],
    fields: PANCAKES.map((i, idx) => ({ id: `i${idx}`, label: `${i.name}`, unit: i.unit })),
    hints: ['To multiply a mixed number, change it to an improper fraction first: 1 1/2 = 3/2.'],
    variant: (seed) => recipeVariant(makeRng(seed), 'Pancakes', 4, PANCAKES, [2, 6, 8, 10, 12]),
    evaluate: (v, e) => recipeFeedback(v, e, PANCAKES.map((i) => i.name)),
  },
  {
    id: 'trail-mix',
    title: 'Trail Mix Factory',
    category: 'ratio',
    place: 'kitchen',
    minutes: 20,
    tools: ['measuring cups', 'kitchen scale'],
    intro: 'Make a big batch of trail mix for a hike, keeping exactly the same mix.',
    steps: [
      'Find the scale factor for the batch size on your sheet.',
      'Scale every ingredient.',
      'Bonus: weigh 1 cup of each ingredient on the kitchen scale. Which is heaviest per cup?',
    ],
    fields: TRAIL_MIX.map((i, idx) => ({ id: `i${idx}`, label: i.name, unit: i.unit })),
    hints: ['Fractions with different bottoms are easier with a common denominator: 2/3 = 8/12.'],
    variant: (seed) => recipeVariant(makeRng(seed), 'Trail mix', 2, TRAIL_MIX, [3, 5, 6, 8]),
    evaluate: (v, e) => recipeFeedback(v, e, TRAIL_MIX.map((i) => i.name)),
  },
  {
    id: 'lemonade-ratio',
    title: 'Perfect Lemonade',
    category: 'ratio',
    place: 'kitchen',
    minutes: 15,
    tools: ['measuring cup', 'a pitcher'],
    intro: 'The best lemonade is 1 part lemon juice to 4 parts water, plus sugar to taste.',
    steps: [
      'Measure how much water your pitcher holds when full (in cups).',
      'The pitcher holds juice + water. With a 1 : 4 ratio, juice is 1/5 of the total.',
      'Work out how much juice and how much water you need.',
      'Bonus: make it with a grown-up and rate it from 1 to 10.',
    ],
    fields: [
      { id: 'pitcher', label: 'Pitcher holds', unit: 'cups' },
      { id: 'juice', label: 'Lemon juice', unit: 'cups' },
      { id: 'water', label: 'Water', unit: 'cups' },
    ],
    hints: ['1 : 4 means 5 equal parts in total.', 'Check: juice + water should equal the pitcher.'],
    evaluate: (v) => [mathCheck(v.juice, v.pitcher / 5, 'juice', 3), mathCheck(v.water, (v.pitcher * 4) / 5, 'water', 3)],
  },
  {
    id: 'mystery-fence',
    title: 'Solve for x',
    category: 'algebra',
    place: 'patio',
    minutes: 15,
    tools: ['tape measure'],
    intro: 'A fence builder wants a fence 72 inches tall using the same planks and gaps as yours. How many planks?',
    steps: [
      'Measure one plank (p) and one gap (g) on our fence, in inches.',
      'With x planks there are x − 1 gaps, so the height is x·p + (x − 1)·g.',
      'Set that equal to 72 and solve for x. Round to a whole plank.',
    ],
    fields: [
      { id: 'p', label: 'Plank height (p)', unit: 'in' },
      { id: 'g', label: 'Gap (g)', unit: 'in' },
      { id: 'x', label: 'Planks needed (x)' },
    ],
    hints: ['x·p + x·g − g = 72, so x·(p + g) = 72 + g, so x = (72 + g) ÷ (p + g).'],
    evaluate: (v) => {
      const exact = (72 + v.g) / (v.p + v.g);
      return [Math.abs(v.x - exact) <= 0.6 ? { tone: 'great', text: `Correct! x ≈ ${round(exact, 2)}, so about ${Math.round(exact)} planks. ✔` } : { tone: 'retry', text: `Not quite. With your p and g, x comes out near ${round(exact, 2)}.` }];
    },
  },
];

export function missionById(id: string): MathMission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function variantFor(m: MathMission, seed: number): Variant {
  return m.variant ? m.variant(seed) : NO_VARIANT;
}

export const OUTDOOR: Place[] = ['patio', 'porch'];

/** November to March, outdoor patio missions are offered less. */
export function isWinter(month: number): boolean {
  return month >= 10 || month <= 2;
}

export function suggest(missions: MathMission[], month: number, random: () => number = Math.random): MathMission {
  const pool = isWinter(month) ? missions.filter((m) => m.place !== 'patio' || !m.needsSun) : missions;
  return pool[Math.floor(random() * pool.length)];
}
