import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';

import type { BodyLog, Measurements } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

const BUCKET = 'progress-photos';

export function useBodyLogs(userId: string | null) {
  return useQuery({
    queryKey: ['body_logs', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<BodyLog[]> => {
      const { data, error } = await supabase
        .from('body_logs')
        .select('*')
        .eq('user_id', userId!)
        .order('logged_on', { ascending: false })
        .limit(400);
      if (error) throw error;
      return (data ?? []) as BodyLog[];
    },
  });
}

/**
 * Uploads a local image to the user's private folder. The path is prefixed with
 * the user id because the storage policy keys off the first path segment.
 */
export async function uploadProgressPhoto(userId: string, localUri: string) {
  const extension = localUri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;
  const bytes = await new File(localUri).arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: extension === 'png' ? 'image/png' : 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  return path;
}

/** The bucket is private, so every render needs a fresh signed URL. */
export function useSignedPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['photo-url', path],
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export type BodyLogInput = {
  logged_on: string;
  weight_kg: number | null;
  photo_path?: string | null;
  measurements?: Measurements;
  notes?: string | null;
};

export function useSaveBodyLog(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BodyLogInput) => {
      const { data, error } = await supabase
        .from('body_logs')
        .upsert({ user_id: userId!, ...input }, { onConflict: 'user_id,logged_on' })
        .select()
        .single();
      if (error) throw error;
      return data as BodyLog;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['body_logs', userId] });
    },
  });
}
