import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { StravaActivity, StravaConnection } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export function useActivities(userId: string | null) {
  return useQuery({
    queryKey: ['strava_activities', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<StravaActivity[]> => {
      const { data, error } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', userId!)
        .order('start_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as StravaActivity[];
    },
  });
}

export function useStravaConnection(userId: string | null) {
  return useQuery({
    queryKey: ['strava_connection', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<StravaConnection | null> => {
      const { data, error } = await supabase
        .from('strava_connection')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as StravaConnection | null;
    },
  });
}

/**
 * Kicks off the server-side sync. The edge function holds the Strava tokens and
 * refreshes them — the device never sees them.
 */
export function useSyncStrava(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ imported: number }>(
        'strava-sync',
        { body: {} },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava_activities', userId] });
      qc.invalidateQueries({ queryKey: ['strava_connection', userId] });
    },
  });
}

/** Asks the edge function for the Strava consent URL to open in the browser. */
export async function getStravaAuthUrl() {
  const { data, error } = await supabase.functions.invoke<{ url: string }>('strava-oauth', {
    body: { action: 'authorize' },
  });
  if (error) throw error;
  return data!.url;
}

export async function exchangeStravaCode(code: string, scope: string | null) {
  const { data, error } = await supabase.functions.invoke('strava-oauth', {
    body: { action: 'exchange', code, scope },
  });
  if (error) throw error;
  return data;
}

export function useDisconnectStrava(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Goes through a security-definer function: the client has no direct
      // access to strava_accounts at all, so the tokens stay unreachable.
      const { error } = await supabase.rpc('disconnect_strava');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strava_connection', userId] }),
  });
}
