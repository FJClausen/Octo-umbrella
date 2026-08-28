import { parseISO } from 'date-fns';

import type { StrengthSession, StravaActivity } from '@/lib/database.types';

/** Epley. Lets a heavy triple and a lighter set of ten be compared honestly. */
export const estimated1RM = (weightKg: number, reps: number) =>
  reps <= 1 ? weightKg : weightKg * (1 + reps / 30);

export type PR = {
  kind: 'strength' | 'bike' | 'swim';
  label: string;
  value: string;
  date: string;
};

/**
 * A PR is a session that beat everything before it. We walk forwards keeping a
 * running best, so re-hitting an old number is not celebrated twice.
 */
export function strengthPRs(sessions: StrengthSession[]): PR[] {
  const ordered = [...sessions].sort((a, b) => a.performed_on.localeCompare(b.performed_on));
  const best = new Map<string, number>();
  const prs: PR[] = [];

  for (const session of ordered) {
    for (const exercise of session.exercises) {
      const top = exercise.sets.reduce((max, set) => {
        if (!set.weight_kg || !set.reps) return max;
        return Math.max(max, estimated1RM(set.weight_kg, set.reps));
      }, 0);
      if (top <= 0) continue;

      const previous = best.get(exercise.key);
      if (previous == null || top > previous + 0.01) {
        best.set(exercise.key, top);
        // The very first time an exercise is logged is a baseline, not a PR.
        if (previous != null) {
          prs.push({
            kind: 'strength',
            label: exercise.name,
            value: `${top.toFixed(1)} kg est. 1RM`,
            date: session.performed_on,
          });
        }
      }
    }
  }

  return prs;
}

/** Best weighted-average power on rides long enough to mean something. */
export function bikePRs(activities: StravaActivity[], minMinutes = 20): PR[] {
  const rides = activities
    .filter((a) => a.type === 'Ride' && (a.moving_time_s ?? 0) >= minMinutes * 60)
    .filter((a) => (a.weighted_average_watts ?? a.average_watts) != null)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  let best = 0;
  const prs: PR[] = [];

  for (const ride of rides) {
    const power = Number(ride.weighted_average_watts ?? ride.average_watts);
    if (power > best) {
      const previous = best;
      best = power;
      if (previous > 0) {
        prs.push({
          kind: 'bike',
          label: ride.name ?? 'Ride',
          value: `${Math.round(power)} W normalised`,
          date: ride.start_date.slice(0, 10),
        });
      }
    }
  }

  return prs;
}

/** Best (lowest) pace per 100m on swims of at least 400m. */
export function swimPRs(activities: StravaActivity[], minMetres = 400): PR[] {
  const swims = activities
    .filter((a) => a.type === 'Swim' && (a.distance_m ?? 0) >= minMetres)
    .filter((a) => (a.moving_time_s ?? 0) > 0)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  let best = Infinity;
  const prs: PR[] = [];

  for (const swim of swims) {
    const per100 = (Number(swim.moving_time_s) / Number(swim.distance_m)) * 100;
    if (per100 < best) {
      const previous = best;
      best = per100;
      if (Number.isFinite(previous)) {
        const m = Math.floor(per100 / 60);
        const s = Math.round(per100 % 60);
        prs.push({
          kind: 'swim',
          label: swim.name ?? 'Swim',
          value: `${m}:${String(s).padStart(2, '0')} /100m`,
          date: swim.start_date.slice(0, 10),
        });
      }
    }
  }

  return prs;
}

export function allPRs(sessions: StrengthSession[], activities: StravaActivity[]): PR[] {
  return [...strengthPRs(sessions), ...bikePRs(activities), ...swimPRs(activities)].sort(
    (a, b) => b.date.localeCompare(a.date),
  );
}

/** PRs set in the last `days` days — what the dashboard celebrates. */
export function recentPRs(prs: PR[], days = 14) {
  const cutoff = Date.now() - days * 86_400_000;
  return prs.filter((pr) => parseISO(pr.date).getTime() >= cutoff);
}
