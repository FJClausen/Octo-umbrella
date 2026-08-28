import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { StrengthSession, StravaActivity } from '@/lib/database.types';
import { calfProgressionStreak, topCalfLoad } from '@/logic/streaks';
import { weeklyRate, type WeightPoint } from '@/logic/trend';

const daysAgo = (iso: string) => differenceInCalendarDays(new Date(), parseISO(iso));

const inWindow = (iso: string, from: number, to: number) => {
  const d = daysAgo(iso);
  return d >= from && d < to;
};

export type Recap = {
  headline: string;
  lines: string[];
};

/**
 * A short written summary of the last seven days. Deliberately generated on
 * device from the numbers already loaded — it costs nothing, works offline, and
 * says the same thing every time for the same data.
 */
export function weeklyRecap(
  sessions: StrengthSession[],
  activities: StravaActivity[],
  weights: WeightPoint[],
): Recap {
  const thisWeek = sessions.filter((s) => inWindow(s.performed_on, 0, 7));
  const lastWeek = sessions.filter((s) => inWindow(s.performed_on, 7, 14));

  const rides = activities.filter((a) => a.type === 'Ride' && inWindow(a.start_date, 0, 7));
  const swims = activities.filter((a) => a.type === 'Swim' && inWindow(a.start_date, 0, 7));

  const lines: string[] = [];

  // --- Strength ---------------------------------------------------------
  if (thisWeek.length === 0) {
    lines.push('No strength sessions logged this week — the next one is the one that counts.');
  } else {
    const target = thisWeek.length >= 3 ? 'target hit' : `${3 - thisWeek.length} to go`;
    const versus =
      lastWeek.length === 0
        ? ''
        : thisWeek.length > lastWeek.length
          ? ' — up on last week'
          : thisWeek.length === lastWeek.length
            ? ' — same as last week'
            : ' — down on last week';
    lines.push(
      `${thisWeek.length} strength ${thisWeek.length === 1 ? 'session' : 'sessions'} (${target})${versus}.`,
    );
  }

  // --- Calf / Achilles --------------------------------------------------
  const calfLoads = thisWeek.map(topCalfLoad).filter((l): l is number => l != null);
  if (calfLoads.length) {
    const streak = calfProgressionStreak(sessions);
    const heaviest = Math.max(...calfLoads);
    lines.push(
      streak >= 2
        ? `Calf raises topped out at ${heaviest} kg, holding or climbing ${streak} sessions running. That is the tendon work doing its job.`
        : `Calf raises topped out at ${heaviest} kg.`,
    );
  }

  const flagged = thisWeek.filter((s) => (s.achilles_pain ?? 0) >= 3);
  if (flagged.length) {
    lines.push(
      `Achilles flagged at 3+ in ${flagged.length} of ${thisWeek.length} sessions — worth holding load steady rather than adding this week.`,
    );
  }

  // --- Bike -------------------------------------------------------------
  if (rides.length) {
    const hours = rides.reduce((a, r) => a + (r.moving_time_s ?? 0), 0) / 3600;
    const best = rides.reduce(
      (max, r) => Math.max(max, Number(r.weighted_average_watts ?? r.average_watts ?? 0)),
      0,
    );
    lines.push(
      best > 0
        ? `${rides.length} ${rides.length === 1 ? 'ride' : 'rides'}, ${hours.toFixed(1)} h, best normalised power ${Math.round(best)} W.`
        : `${rides.length} ${rides.length === 1 ? 'ride' : 'rides'}, ${hours.toFixed(1)} h on the bike.`,
    );
  }

  // --- Swim -------------------------------------------------------------
  if (swims.length) {
    const metres = swims.reduce((a, s) => a + Number(s.distance_m ?? 0), 0);
    lines.push(`${swims.length} ${swims.length === 1 ? 'swim' : 'swims'}, ${Math.round(metres)} m total.`);
  }

  if (!rides.length && !swims.length) {
    lines.push('No cardio synced from Strava this week.');
  }

  // --- Weight -----------------------------------------------------------
  const rate = weeklyRate(weights);
  if (rate != null) {
    if (rate < -0.15) {
      lines.push(`Weight trending down about ${Math.abs(rate).toFixed(2)} kg/week. Right in the range.`);
    } else if (rate > 0.15) {
      lines.push(`Weight trending up about ${rate.toFixed(2)} kg/week — worth a look at the intake side.`);
    } else {
      lines.push('Weight is holding steady. With this much lifting, flat scale weight can still mean a leaner you.');
    }
  }

  const headline =
    thisWeek.length >= 3 && rides.length >= 2
      ? 'Full week, start to finish.'
      : thisWeek.length + rides.length + swims.length === 0
        ? 'Quiet week. Clean slate ahead.'
        : 'Solid work in the bank.';

  return { headline, lines };
}
