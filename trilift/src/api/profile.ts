import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Profile } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        // upsert rather than update: covers the case where the signup trigger
        // has not created the row yet.
        .upsert({ id: userId!, ...patch, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (profile) => qc.setQueryData(['profile', userId], profile),
  });
}
