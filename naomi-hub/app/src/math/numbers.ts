/** Exact fractions, so a scaled recipe can be checked without rounding surprises. */
export interface Fraction {
  n: number;
  d: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(n: number, d = 1): Fraction {
  const g = gcd(n, d);
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d);
}

export function toNumber(f: Fraction): number {
  return f.n / f.d;
}

/** "2 1/4", "3/4", "5". */
export function formatMixed(f: Fraction): string {
  const whole = Math.trunc(f.n / f.d);
  const rest = Math.abs(f.n % f.d);
  if (rest === 0) return String(whole);
  return whole === 0 ? `${rest}/${f.d}` : `${whole} ${rest}/${f.d}`;
}

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': ' 1/2', '⅓': ' 1/3', '⅔': ' 2/3', '¼': ' 1/4', '¾': ' 3/4', '⅛': ' 1/8', '⅜': ' 3/8', '⅝': ' 5/8', '⅞': ' 7/8',
};

/**
 * Reads what a kid types: "12", "12.5", "12,5", "2 1/4", "9/4", "1½", "  7 cm ".
 * Returns null if it isn't a number.
 */
export function parseNumber(input: string): number | null {
  let s = input.trim().toLowerCase();
  for (const [u, r] of Object.entries(UNICODE_FRACTIONS)) s = s.split(u).join(r);
  s = s.replace(/[a-z²³%]+\.?$/g, '').trim(); // trailing unit
  s = s.replace(/^(-?\d+),(\d+)$/, '$1.$2'); // German decimal comma
  let m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const whole = Number(m[1]);
    const part = Number(m[2]) / Number(m[3]);
    return Number(m[3]) === 0 ? null : whole < 0 ? whole - part : whole + part;
  }
  m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
  return null;
}

export function percentOff(estimate: number, actual: number): number {
  if (actual === 0) return estimate === 0 ? 0 : 100;
  return (Math.abs(estimate - actual) / Math.abs(actual)) * 100;
}

export function within(value: number, target: number, tolerancePct: number): boolean {
  return percentOff(value, target) <= tolerancePct;
}

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

export function round(n: number, places = 1): number {
  const k = 10 ** places;
  return Math.round(n * k) / k;
}
