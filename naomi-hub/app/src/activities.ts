export interface Activity {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  route: '/puzzles' | '/chess' | null;
}

/** Order matches the spec. Only Puzzle Printer and Chess are live in milestone 2. */
export const ACTIVITIES: Activity[] = [
  { id: 'puzzles', title: 'Puzzle Printer', blurb: 'Print a brain-twister and solve it with a pencil.', emoji: '🧩', route: '/puzzles' },
  { id: 'geo-quest', title: 'Geo Quest', blurb: 'Riddles and hidden spots outside.', emoji: '🧭', route: null },
  { id: 'chess', title: 'Chess Puzzles', blurb: 'Find the winning move. Print a sheet to take away.', emoji: '♞', route: '/chess' },
  { id: 'language', title: 'Language Lab', blurb: 'German and Spanish missions.', emoji: '🗣️', route: null },
  { id: 'animals', title: 'Animal Detective', blurb: 'Track the backyard squirrels and birds.', emoji: '🐿️', route: null },
  { id: 'math-wild', title: 'Math in the Wild', blurb: 'Estimate, measure, and spot patterns.', emoji: '📏', route: null },
  { id: 'inventor', title: "Inventor's Challenge", blurb: 'Build something with limits and a timer.', emoji: '🛠️', route: null },
  { id: 'art', title: 'Art Studio', blurb: 'Drawing prompts and printable templates.', emoji: '🎨', route: null },
  { id: 'geography', title: 'Geography Quiz', blurb: 'Countries, flags, capitals and states.', emoji: '🗺️', route: null },
];
