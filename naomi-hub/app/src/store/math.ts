import { loadJson, saveJson } from './storage';

export interface MathRun {
  missionId: string;
  seed: number;
  printedAt: string | null;
  doneAt: string | null;
  answers: Record<string, number>;
}

interface MathState {
  /** Latest run per mission. */
  runs: Record<string, MathRun>;
  completed: number;
}

const KEY = 'math-v1';

export async function loadMath(): Promise<MathState> {
  return loadJson<MathState>(KEY, { runs: {}, completed: 0 });
}

export async function saveRun(run: MathRun): Promise<void> {
  const s = await loadMath();
  const wasDone = Boolean(s.runs[run.missionId]?.doneAt && s.runs[run.missionId]?.seed === run.seed);
  s.runs[run.missionId] = run;
  if (run.doneAt && !wasDone) s.completed++;
  await saveJson(KEY, s);
}
