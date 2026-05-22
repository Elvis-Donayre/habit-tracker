import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Session, WeeklySummary } from '@/types';

export function useSessions(userId: string | undefined) {
  const supabase = createClient();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['sessions', userId],
    queryFn: async () => {
      if (!userId) return [];
      // Filter sessions through the activities join — sessions have no direct user_id column.
      // RLS on the sessions table must allow access based on auth.uid() via the activity relationship.
      const { data, error } = await supabase
        .from('sessions')
        .select('*, activities!inner(user_id, name)')
        .eq('activities.user_id', userId)
        .order('session_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as Session[]) ?? [];
    },
    enabled: !!userId,
  });

  const weeklySummary = useQuery({
    queryKey: ['weekly-summary', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('weekly_summary')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data as WeeklySummary[]) ?? [];
    },
    enabled: !!userId,
  });

  const register = useMutation({
    mutationFn: async (session: Omit<Session, 'id' | 'created_at' | 'activities'>) => {
      const { data, error } = await supabase.from('sessions').insert(session).select().single();
      if (error) throw error;
      return data as Session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', userId] });
      qc.invalidateQueries({ queryKey: ['weekly-summary', userId] });
      qc.invalidateQueries({ queryKey: ['habit-progress', userId] });
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  return { list, weeklySummary, register };
}
