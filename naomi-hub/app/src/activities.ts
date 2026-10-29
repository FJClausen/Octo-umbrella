export interface Activity {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  route: '/puzzles' | '/chess' | '/animals' | '/math' | '/inventor' | '/geography' | null;
}

/** Order matches the spec. `route: null` shows as coming soon. */
export const ACTIVITIES: Activity[] = [
  { id: 'puzzles', title: 'Puzzle Printer', blurb: 'Print a brain-twister and solve it with a pencil.', emoji: '🧩', route: '/puzzles' },
  { id: 'geo-quest', title: 'Geo Quest', blurb: 'Riddles and hidden spots outside.', emoji: '🧭', route: null },
  { id: 'chess', title: 'Chess Puzzles', blurb: 'Print a sheet of puzzles, or play a round here.', emoji: '♞', route: '/chess' },
  { id: 'language', title: 'Language Lab', blurb: 'German and Spanish missions.', emoji: '🗣️', route: null },
  { id: 'animals', title: 'Animal Detective', blurb: 'Track the backyard squirrels and birds.', emoji: '🐿️', route: '/animals' },
  { id: 'math-wild', title: 'Math in the Wild', blurb: 'Estimate, measure, and spot patterns.', emoji: '📏', route: '/math' },
  { id: 'inventor', title: "Inventor's Challenge", blurb: 'Build something with limits and a timer.', emoji: '🛠️', route: '/inventor' },
  { id: 'art', title: 'Art Studio', blurb: 'Drawing prompts and printable templates.', emoji: '🎨', route: null },
  { id: 'geography', title: 'Geography Quiz', blurb: 'Countries, flags, capitals and states.', emoji: '🗺️', route: '/geography' },
];
