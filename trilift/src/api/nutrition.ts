import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NutritionLog } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useNutritionLogs(userId: string | null, days = 30) {
  return useQuery({
    queryKey: ['nutrition_logs', userId, days],
    enabled: Boolean(userId),
    queryFn: async (): Promise<NutritionLog[]> => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId!)
        .gte('logged_on', since)
        .order('logged_on', { ascending: false });
      if (error) throw error;
      return (data ?? []) as NutritionLog[];
    },
  });
}

export function useSaveNutritionLog(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      logged_on: string;
      calories: number | null;
      protein_g: number | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .upsert(
          { user_id: userId!, ...input, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,logged_on' },
        )
        .select()
        .single();
      if (error) throw error;
      return data as NutritionLog;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition_logs', userId] }),
  });
}
