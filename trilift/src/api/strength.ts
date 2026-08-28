import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { StrengthEntry, StrengthSession } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useStrengthSessions(userId: string | null) {
  return useQuery({
    queryKey: ['strength_sessions', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<StrengthSession[]> => {
      const { data, error } = await supabase
        .from('strength_sessions')
        .select('*')
        .eq('user_id', userId!)
        .order('performed_on', { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as StrengthSession[];
    },
  });
}

/** Most recent session of a given template — the source for pre-filled sets. */
export function lastSessionOfTemplate(
  sessions: StrengthSession[] | undefined,
  templateKey: string,
) {
  return sessions?.find((s) => s.template_key === templateKey) ?? null;
}

export type StrengthSessionInput = {
  performed_on: string;
  template_key: string;
  exercises: StrengthEntry[];
  duration_min?: number | null;
  achilles_pain?: number | null;
  notes?: string | null;
};

export function useSaveStrengthSession(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StrengthSessionInput) => {
      const { data, error } = await supabase
        .from('strength_sessions')
        .insert({ user_id: userId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as StrengthSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strength_sessions', userId] });
    },
  });
}

export function useDeleteStrengthSession(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('strength_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strength_sessions', userId] });
    },
  });
}
