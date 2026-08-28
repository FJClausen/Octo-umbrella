import { kgToLb, lbToKg } from '@/lib/format';

export type UnitSystem = 'metric' | 'imperial';

/**
 * Everything is stored in kilograms. This is the single conversion boundary:
 * `toDisplay` on the way out of the database, `toStorage` on the way back in.
 * Dumbbells tend to be labelled in pounds even where the scale reads kilos, so
 * the preference covers both body weight and lifted load.
 */
export function unitLabel(system: UnitSystem) {
  return system === 'imperial' ? 'lb' : 'kg';
}

export function toDisplay(kgValue: number | null | undefined, system: UnitSystem) {
  if (kgValue == null) return null;
  return system === 'imperial' ? kgToLb(kgValue) : kgValue;
}

export function toStorage(displayValue: number | null | undefined, system: UnitSystem) {
  if (displayValue == null) return null;
  return system === 'imperial' ? lbToKg(displayValue) : displayValue;
}

export function formatWeight(
  kgValue: number | null | undefined,
  system: UnitSystem,
  digits = 1,
) {
  const v = toDisplay(kgValue, system);
  if (v == null || Number.isNaN(v)) return '—';
  return `${v.toFixed(digits)} ${unitLabel(system)}`;
}
