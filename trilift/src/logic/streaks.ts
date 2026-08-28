import { differenceInCalendarWeeks, parseISO, startOfWeek } from 'date-fns';

import { CALF_KEYS } from '@/data/plan';
import type { StrengthSession } from '@/lib/database.types';

const weekKey = (iso: string) =>
  startOfWeek(parseISO(iso), { weekStartsOn: 1 }).toISOString().slice(0, 10);

/** Heaviest load lifted on either calf-raise variation in a session. */
export function topCalfLoad(session: StrengthSession): number | null {
  const loads = session.exercises
    .filter((e) => CALF_KEYS.includes(e.key))
    .flatMap((e) => e.sets.map((s) => s.weight_kg ?? 0))
    .filter((w) => w > 0);
  return loads.length ? Math.max(...loads) : null;
}

/**
 * Consecutive weeks hitting the 3-session strength target, counting back from
 * this week. The current week counts only once it is already at target, so an
 * unfinished week never breaks a streak that is still live.
 */
export function strengthWeekStreak(sessions: StrengthSession[], target = 3) {
  const perWeek = new Map<string, number>();
  for (const s of sessions) {
    const k = weekKey(s.performed_on);
    perWeek.set(k, (perWeek.get(k) ?? 0) + 1);
  }

  const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  let streak = 0;

  for (let back = 0; back < 104; back += 1) {
    const wk = new Date(thisWeek);
    wk.setDate(wk.getDate() - back * 7);
    const count = perWeek.get(wk.toISOString().slice(0, 10)) ?? 0;

    if (count >= target) {
      streak += 1;
    } else if (back === 0) {
      // This week is still in progress — skip it rather than zeroing the streak.
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * How many sessions in a row the top calf load held or went up. This is the
 * number that matters for the tendon: the load has to keep creeping.
 */
export function calfProgressionStreak(sessions: StrengthSession[]) {
  const loads = [...sessions]
    .sort((a, b) => a.performed_on.localeCompare(b.performed_on))
    .map(topCalfLoad)
    .filter((l): l is number => l != null);

  if (loads.length < 2) return 0;

  let streak = 0;
  for (let i = loads.length - 1; i > 0; i -= 1) {
    if (loads[i] >= loads[i - 1]) streak += 1;
    else break;
  }
  return streak;
}

/** Sessions logged in the current Monday-start week. */
export function sessionsThisWeek(sessions: StrengthSession[]) {
  return sessions.filter(
    (s) => differenceInCalendarWeeks(new Date(), parseISO(s.performed_on), { weekStartsOn: 1 }) === 0,
  ).length;
}
