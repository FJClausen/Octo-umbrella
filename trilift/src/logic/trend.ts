import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { BodyLog } from '@/lib/database.types';

export type WeightPoint = { date: string; weight: number };

export function weightPoints(logs: BodyLog[]): WeightPoint[] {
  return logs
    .filter((l): l is BodyLog & { weight_kg: number } => l.weight_kg != null)
    .map((l) => ({ date: l.logged_on, weight: Number(l.weight_kg) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Scale weight is noisy — water, food timing, a hard session the day before. An
 * exponentially weighted average is what we show as "trend" so a single bad
 * morning does not read as a setback.
 */
export function smoothed(points: WeightPoint[], alpha = 0.3): WeightPoint[] {
  let acc: number | null = null;
  return points.map((p) => {
    acc = acc == null ? p.weight : alpha * p.weight + (1 - alpha) * acc;
    return { date: p.date, weight: acc };
  });
}

/** kg per week over the trailing window, by least-squares over the trend line. */
export function weeklyRate(points: WeightPoint[], days = 28): number | null {
  if (points.length < 2) return null;

  const last = points[points.length - 1];
  const cutoff = differenceInCalendarDays(parseISO(last.date), 0);
  const recent = points.filter(
    (p) => cutoff - differenceInCalendarDays(parseISO(p.date), 0) <= days,
  );
  if (recent.length < 2) return null;

  const t0 = parseISO(recent[0].date);
  const xs = recent.map((p) => differenceInCalendarDays(parseISO(p.date), t0));
  const ys = recent.map((p) => p.weight);
  const n = xs.length;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;

  return (num / den) * 7;
}

export const latestWeight = (points: WeightPoint[]) =>
  points.length ? points[points.length - 1].weight : null;
