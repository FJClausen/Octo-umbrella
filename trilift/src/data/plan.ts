/**
 * The weekly framework from the project brief, as data.
 *
 * Strength: 3x/week, ~30 min, full body every time. Every session carries heavy,
 * slow-controlled calf raises in both a straight-knee (gastrocnemius) and a
 * bent-knee (soleus) variation — heavy slow resistance is the Achilles work.
 * Nothing here is plyometric or fast stretch-shortening by design.
 *
 * Cardio: polarised. One long easy ride, one hard structured ride, one aerobic
 * swim. Running is deliberately absent while the Achilles is a question mark.
 */

export type ExerciseTag = 'calf' | 'lower' | 'upper-push' | 'upper-pull' | 'core';

export type ExerciseSpec = {
  key: string;
  name: string;
  tag: ExerciseTag;
  sets: number;
  repRange: string;
  /** Shown under the exercise while logging. Keep it to one actionable line. */
  cue: string;
};

export type StrengthTemplate = {
  key: string;
  name: string;
  focus: string;
  exercises: ExerciseSpec[];
};

/** Present in every session — the tendon work, not optional. */
const CALF_STRAIGHT: ExerciseSpec = {
  key: 'calf_raise_straight',
  name: 'Standing calf raise (straight knee)',
  tag: 'calf',
  sets: 3,
  repRange: '6–8',
  cue: '3s up, 2s pause at the top, 3s down. Heavy — around a 7-rep max.',
};

const CALF_BENT: ExerciseSpec = {
  key: 'calf_raise_bent',
  name: 'Seated calf raise (bent knee)',
  tag: 'calf',
  sets: 3,
  repRange: '8–10',
  cue: 'Knee at ~90°. Same slow tempo — this one is the soleus.',
};

export const STRENGTH_TEMPLATES: StrengthTemplate[] = [
  {
    key: 'A',
    name: 'Session A',
    focus: 'Squat pattern + horizontal push/pull',
    exercises: [
      {
        key: 'goblet_squat',
        name: 'Goblet squat',
        tag: 'lower',
        sets: 3,
        repRange: '8–10',
        cue: 'Elbows inside the knees, chest tall, full depth.',
      },
      {
        key: 'db_floor_press',
        name: 'Dumbbell floor press',
        tag: 'upper-push',
        sets: 3,
        repRange: '8–10',
        cue: 'Pause when the triceps touch down. No bounce.',
      },
      {
        key: 'one_arm_row',
        name: 'One-arm dumbbell row',
        tag: 'upper-pull',
        sets: 3,
        repRange: '8–10 each',
        cue: 'Drive the elbow to the hip, no torso rotation.',
      },
      CALF_STRAIGHT,
      CALF_BENT,
    ],
  },
  {
    key: 'B',
    name: 'Session B',
    focus: 'Hinge + vertical push/pull',
    exercises: [
      {
        key: 'rdl',
        name: 'Romanian deadlift',
        tag: 'lower',
        sets: 3,
        repRange: '8–10',
        cue: 'Push the hips back, shins vertical, stop at the stretch.',
      },
      {
        key: 'db_overhead_press',
        name: 'Dumbbell overhead press',
        tag: 'upper-push',
        sets: 3,
        repRange: '8–10',
        cue: 'Ribs down, squeeze the glutes — no lower-back arch.',
      },
      {
        key: 'lat_pulldown',
        name: 'Lat pulldown (or band pulldown)',
        tag: 'upper-pull',
        sets: 3,
        repRange: '10–12',
        cue: 'Pull the elbows down and back, chest to the bar.',
      },
      CALF_STRAIGHT,
      CALF_BENT,
    ],
  },
  {
    key: 'C',
    name: 'Session C',
    focus: 'Single leg + carries and trunk',
    exercises: [
      {
        key: 'split_squat',
        name: 'Rear-foot-elevated split squat',
        tag: 'lower',
        sets: 3,
        repRange: '8–10 each',
        cue: 'Slow down, drive through the front heel. Control, not speed.',
      },
      {
        key: 'incline_press',
        name: 'Incline dumbbell press',
        tag: 'upper-push',
        sets: 3,
        repRange: '10–12',
        cue: 'Low incline. Full stretch at the bottom.',
      },
      {
        key: 'chest_supported_row',
        name: 'Chest-supported row',
        tag: 'upper-pull',
        sets: 3,
        repRange: '10–12',
        cue: 'Let the chest take the load so the lower back stays fresh.',
      },
      CALF_STRAIGHT,
      CALF_BENT,
    ],
  },
];

export const templateByKey = (key: string | null | undefined) =>
  STRENGTH_TEMPLATES.find((t) => t.key === key) ?? null;

/** Exercises where the Achilles is the point — tracked as its own progression. */
export const CALF_KEYS = [CALF_STRAIGHT.key, CALF_BENT.key];

export type PlannedSession = {
  key: string;
  kind: 'strength' | 'bike' | 'swim' | 'rest';
  title: string;
  detail: string;
};

/** The week as a set of commitments, not fixed weekdays — order them to suit. */
export const WEEKLY_PLAN: PlannedSession[] = [
  { key: 'strength-a', kind: 'strength', title: 'Strength A', detail: '30 min, full body' },
  {
    key: 'bike-z2',
    kind: 'bike',
    title: 'Long Zone 2 ride',
    detail: '75–120 min conversational. The aerobic base — keep it genuinely easy.',
  },
  { key: 'strength-b', kind: 'strength', title: 'Strength B', detail: '30 min, full body' },
  {
    key: 'swim',
    kind: 'swim',
    title: 'Swim',
    detail: 'Aerobic and technique. Zero impact on the tendon.',
  },
  { key: 'strength-c', kind: 'strength', title: 'Strength C', detail: '30 min, full body' },
  {
    key: 'bike-intervals',
    kind: 'bike',
    title: 'Structured intervals',
    detail: 'Threshold or VO2max. This is the one hard session — make it count.',
  },
  { key: 'rest', kind: 'rest', title: 'Rest / active recovery', detail: '1–2 days, easy spin or walk' },
];

/** Percent-of-FTP targets for the hard ride, given a current FTP. */
export function bikeIntervalTargets(ftp: number | null) {
  if (!ftp) return null;
  const at = (pct: number) => Math.round((ftp * pct) / 5) * 5;
  return {
    endurance: `${at(0.56)}–${at(0.75)} W`,
    tempo: `${at(0.76)}–${at(0.9)} W`,
    threshold: `${at(0.91)}–${at(1.05)} W`,
    vo2max: `${at(1.06)}–${at(1.2)} W`,
  };
}
