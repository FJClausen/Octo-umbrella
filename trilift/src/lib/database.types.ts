/**
 * Hand-written to match supabase/migrations. If you change the schema, either
 * update this file or regenerate it:
 *   supabase gen types typescript --linked > src/lib/database.types.ts
 */
export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

/** One performed set. `weight_kg` is null for bodyweight movements. */
export type StrengthSet = {
  weight_kg: number | null;
  reps: number;
  rpe?: number | null;
};

export type StrengthEntry = {
  key: string;
  name: string;
  sets: StrengthSet[];
};

export type Measurements = {
  waist_cm?: number;
  chest_cm?: number;
  hips_cm?: number;
  thigh_cm?: number;
  arm_cm?: number;
};

export type Profile = {
  id: string;
  display_name: string | null;
  dob: string | null;
  height_cm: number | null;
  sex: 'male' | 'female' | 'other' | null;
  start_weight_kg: number | null;
  goal_weight_kg: number | null;
  ftp_watts: number | null;
  weekly_loss_target_kg: number;
  protein_g_per_kg: number;
  photo_analysis_days: number;
  unit_system: 'metric' | 'imperial';
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BodyLog = {
  id: string;
  user_id: string;
  logged_on: string;
  weight_kg: number | null;
  photo_path: string | null;
  measurements: Measurements;
  notes: string | null;
  created_at: string;
};

export type StrengthSession = {
  id: string;
  user_id: string;
  performed_on: string;
  template_key: string | null;
  exercises: StrengthEntry[];
  duration_min: number | null;
  achilles_pain: number | null;
  notes: string | null;
  created_at: string;
};

export type StravaActivity = {
  id: number;
  user_id: string;
  type: string;
  sport_type: string | null;
  name: string | null;
  start_date: string;
  elapsed_time_s: number | null;
  moving_time_s: number | null;
  distance_m: number | null;
  total_elevation_gain_m: number | null;
  average_watts: number | null;
  weighted_average_watts: number | null;
  max_watts: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  suffer_score: number | null;
  kilojoules: number | null;
  raw: Json;
  synced_at: string;
};

export type NutritionLog = {
  user_id: string;
  logged_on: string;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
  updated_at: string;
};

export type PhotoAnalysis = {
  id: string;
  user_id: string;
  body_log_id: string | null;
  model: string | null;
  summary: string | null;
  emphasis: { area: string; note: string }[];
  created_at: string;
};

export type StravaConnection = {
  user_id: string;
  athlete_id: number | null;
  athlete_name: string | null;
  scope: string | null;
  last_synced_at: string | null;
  created_at: string;
};

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>;
      body_logs: Row<BodyLog>;
      strength_sessions: Row<StrengthSession>;
      strava_activities: Row<StravaActivity>;
      nutrition_logs: Row<NutritionLog>;
      photo_analyses: Row<PhotoAnalysis>;
    };
    Views: {
      strava_connection: Row<StravaConnection>;
    };
    Functions: {
      disconnect_strava: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
