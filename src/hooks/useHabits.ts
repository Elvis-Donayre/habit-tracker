import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Habit, HabitProgress, HabitMetrics } from '@/types';

export function useHabits(userId: string | undefined) {
  const supabase = createClient();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['habits', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return (data as Habit[]) ?? [];
    },
    enabled: !!userId,
  });

  const progress = useQuery({
    queryKey: ['habit-progress', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('habit_progress')
        .select('*')
        .eq('user_id', userId);
      return (data as HabitProgress[]) ?? [];
    },
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('habits').insert(habit).select().single();
      if (error) throw error;
      await supabase.from('habit_metrics').insert({
        habit_id: data.id,
        total_minutes_invested: 0,
        total_sessions: 0,
        current_streak: 0,
        longest_streak: 0,
        completion_percentage: 0,
      });
      return data as Habit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits', userId] });
      qc.invalidateQueries({ queryKey: ['habit-progress', userId] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Habit> }) => {
      const { data, error } = await supabase
        .from('habits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits', userId] });
      qc.invalidateQueries({ queryKey: ['habit-progress', userId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('habits')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits', userId] });
      qc.invalidateQueries({ queryKey: ['habit-progress', userId] });
    },
  });

  const metricsBatch = useQuery({
    queryKey: ['habit-metrics-batch', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId);
      if (!habits?.length) return [];
      const ids = habits.map((h) => h.id);
      const { data } = await supabase
        .from('habit_metrics')
        .select('*')
        .in('habit_id', ids);
      return (data as HabitMetrics[]) ?? [];
    },
    enabled: !!userId,
  });

  return { list, progress, create, update, remove, metricsBatch };
}
