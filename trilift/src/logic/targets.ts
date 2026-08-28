import { differenceInYears, parseISO } from 'date-fns';

import type { Profile } from '@/lib/database.types';

const KCAL_PER_KG_FAT = 7700;

export function ageFrom(dob: string | null | undefined) {
  if (!dob) return null;
  return differenceInYears(new Date(), parseISO(dob));
}

/** Mifflin–St Jeor. Returns null when the profile is missing what it needs. */
export function bmr(profile: Profile, weightKg: number | null) {
  const age = ageFrom(profile.dob);
  if (!weightKg || !profile.height_cm || age == null) return null;
  const base = 10 * weightKg + 6.25 * profile.height_cm - 5 * age;
  return Math.round(profile.sex === 'female' ? base - 161 : base + 5);
}

/**
 * The plan is 3 strength + 2 bike + 1 swim, so "moderately active" (1.55) is the
 * honest multiplier — high enough to reflect the volume, not so high that the
 * deficit turns aggressive.
 */
export const ACTIVITY_FACTOR = 1.55;

export function maintenanceCalories(profile: Profile, weightKg: number | null) {
  const base = bmr(profile, weightKg);
  return base == null ? null : Math.round(base * ACTIVITY_FACTOR);
}

export type DailyTargets = {
  maintenance: number;
  calories: number;
  deficit: number;
  proteinG: number;
};

/**
 * A moderate deficit sized from the weekly loss target, which the brief puts at
 * ~0.4–0.5 kg/week. Floored at 1500 kcal so a bad weigh-in can never produce a
 * target that would undercut recovery.
 */
export function dailyTargets(
  profile: Profile,
  weightKg: number | null,
): DailyTargets | null {
  const maintenance = maintenanceCalories(profile, weightKg);
  if (maintenance == null || !weightKg) return null;

  const deficit = Math.round((profile.weekly_loss_target_kg * KCAL_PER_KG_FAT) / 7);
  const calories = Math.max(1500, maintenance - deficit);

  return {
    maintenance,
    calories,
    deficit: maintenance - calories,
    proteinG: Math.round(weightKg * profile.protein_g_per_kg),
  };
}

/** Weeks to the goal at the current target pace, from the latest weight. */
export function weeksToGoal(currentKg: number | null, profile: Profile) {
  if (!currentKg || !profile.goal_weight_kg) return null;
  const remaining = currentKg - profile.goal_weight_kg;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / Math.max(profile.weekly_loss_target_kg, 0.1));
}

/** 0–1 progress from the starting weight to the goal weight. */
export function goalProgress(profile: Profile, currentKg: number | null) {
  const { start_weight_kg: start, goal_weight_kg: goal } = profile;
  if (!start || !goal || !currentKg || start === goal) return null;
  const raw = (start - currentKg) / (start - goal);
  return Math.min(1, Math.max(0, raw));
}
