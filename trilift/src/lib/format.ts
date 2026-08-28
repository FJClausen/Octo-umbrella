import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export const KG_PER_LB = 0.45359237;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;

export function kg(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)} kg`;
}

export function signedKg(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)} kg`;
}

/** Seconds -> "1:23:45" or "23:45". */
export function duration(seconds: number | null | undefined) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Swim pace per 100m, from metres and seconds. */
export function pacePer100(distanceM: number | null, movingS: number | null) {
  if (!distanceM || !movingS || distanceM <= 0) return '—';
  const secondsPer100 = (movingS / distanceM) * 100;
  const m = Math.floor(secondsPer100 / 60);
  const s = Math.round(secondsPer100 % 60);
  return `${m}:${String(s).padStart(2, '0')}/100m`;
}

export function km(distanceM: number | null | undefined, digits = 1) {
  if (!distanceM) return '—';
  return `${(distanceM / 1000).toFixed(digits)} km`;
}

export function watts(value: number | null | undefined) {
  if (!value) return '—';
  return `${Math.round(value)} W`;
}

export const shortDate = (iso: string) => format(parseISO(iso), 'd MMM');
export const longDate = (iso: string) => format(parseISO(iso), 'EEEE d MMM');
export const relative = (iso: string) =>
  formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');
