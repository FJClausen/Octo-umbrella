/**
 * Database types for the Supabase schema in supabase/migrations.
 * Kept in sync by hand; regenerate with `supabase gen types` if you prefer.
 */
import type { LineupSlot } from "@/lib/site";

export type Role = "coach" | "parent";
export type ProfileStatus = "pending" | "approved" | "denied";

type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: Role;
          status: ProfileStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          role?: Role;
          status?: ProfileStatus;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          first_name: string;
          positions: string[];
          photo_url: string | null;
          parent_id: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          positions?: string[];
          photo_url?: string | null;
          parent_id?: string | null;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: [];
      };
      player_private: {
        Row: {
          player_id: string;
          last_name: string | null;
          coaching_notes: string | null;
        };
        Insert: {
          player_id: string;
          last_name?: string | null;
          coaching_notes?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["player_private"]["Insert"]
        >;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          type: string;
          title: string;
          opponent: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          notes: string | null;
          jersey_color: string | null;
          score_us: number | null;
          score_them: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          opponent?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          notes?: string | null;
          jersey_color?: string | null;
          score_us?: number | null;
          score_them?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      rsvps: {
        Row: {
          id: string;
          event_id: string;
          player_id: string;
          status: string;
          note: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          player_id: string;
          status: string;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rsvps"]["Insert"]>;
        Relationships: [];
      };
      news: {
        Row: {
          id: string;
          title: string;
          body: string;
          image_url: string | null;
          author_id: string | null;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          image_url?: string | null;
          author_id?: string | null;
          published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["news"]["Insert"]>;
        Relationships: [];
      };
      snack_slots: {
        Row: {
          id: string;
          event_id: string | null;
          slot_date: string;
          label: string | null;
          claimed_by: string | null;
          claimed_by_name: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          slot_date: string;
          label?: string | null;
          claimed_by?: string | null;
          claimed_by_name?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["snack_slots"]["Insert"]>;
        Relationships: [];
      };
      practice_plans: {
        Row: {
          id: string;
          event_id: string | null;
          session_date: string;
          warmup: string | null;
          exercises: string | null;
          scrimmages: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          session_date: string;
          warmup?: string | null;
          exercises?: string | null;
          scrimmages?: string | null;
          image_url?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["practice_plans"]["Insert"]
        >;
        Relationships: [];
      };
      exercise_templates: {
        Row: {
          id: string;
          title: string;
          setup: string | null;
          run_of_play: string | null;
          tags: string[];
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          setup?: string | null;
          run_of_play?: string | null;
          tags?: string[];
          image_url?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["exercise_templates"]["Insert"]
        >;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          title: string;
          url: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          url: string;
          description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      lineups: {
        Row: {
          id: string;
          event_id: string | null;
          formation_key: string | null;
          slots: LineupSlot[];
          plan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          formation_key?: string | null;
          slots?: LineupSlot[];
          plan?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lineups"]["Insert"]>;
        Relationships: [];
      };
      gallery_photos: {
        Row: {
          id: string;
          url: string;
          storage_path: string;
          caption: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          storage_path: string;
          caption?: string | null;
          uploaded_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["gallery_photos"]["Insert"]
        >;
        Relationships: [];
      };
      photo_comments: {
        Row: {
          id: string;
          photo_id: string;
          author_id: string | null;
          author_name: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          author_id?: string | null;
          author_name?: string | null;
          body: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["photo_comments"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_coach: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_approved: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      claim_snack_slot: {
        Args: { slot_id: string };
        Returns: undefined;
      };
      release_snack_slot: {
        Args: { slot_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases used across the app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type PlayerPrivate =
  Database["public"]["Tables"]["player_private"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type Rsvp = Database["public"]["Tables"]["rsvps"]["Row"];
export type News = Database["public"]["Tables"]["news"]["Row"];
export type SnackSlot = Database["public"]["Tables"]["snack_slots"]["Row"];
export type PracticePlan =
  Database["public"]["Tables"]["practice_plans"]["Row"];
export type ExerciseTemplate =
  Database["public"]["Tables"]["exercise_templates"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type Lineup = Database["public"]["Tables"]["lineups"]["Row"];
export type GalleryPhoto =
  Database["public"]["Tables"]["gallery_photos"]["Row"];
export type PhotoComment =
  Database["public"]["Tables"]["photo_comments"]["Row"];

// Update payload aliases for building partial patches in server actions.
export type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];
export type NewsUpdate = Database["public"]["Tables"]["news"]["Update"];
export type PlayerUpdate = Database["public"]["Tables"]["players"]["Update"];

export type { Timestamps };
