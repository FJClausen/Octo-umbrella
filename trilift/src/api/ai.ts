import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PhotoAnalysis } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function usePhotoAnalyses(userId: string | null) {
  return useQuery({
    queryKey: ['photo_analyses', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PhotoAnalysis[]> => {
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as PhotoAnalysis[];
    },
  });
}

/**
 * Runs the progress-photo read. The photo never leaves Supabase from the device:
 * the edge function pulls it from storage, calls the Anthropic API server-side
 * with the key held as a function secret, and writes the result back.
 */
export function useAnalyzePhoto(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bodyLogId: string) => {
      const { data, error } = await supabase.functions.invoke<PhotoAnalysis>('analyze-photo', {
        body: { body_log_id: bodyLogId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photo_analyses', userId] }),
  });
}
