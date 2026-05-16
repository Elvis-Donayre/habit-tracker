import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Activity, HabitActivity, ActivityHabitMatrix, Category } from '@/types';

export function useActivities(userId: string | undefined) {
  const supabase = createClient();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['activities', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return (data as Activity[]) ?? [];
    },
    enabled: !!userId,
  });

  const matrix = useQuery({
    queryKey: ['activity-matrix', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('activity_habit_matrix')
        .select('*')
        .eq('user_id', userId);
      return (data as ActivityHabitMatrix[]) ?? [];
    },
    enabled: !!userId,
  });

  const categories = useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return [];
      const result: Category[] = [];
      const { data: predefined } = await supabase.from('categories').select('*');
      if (predefined) {
        result.push(...predefined.map((c) => ({ ...c, type: 'system' as const })));
      }
      const { data: personal } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId);
      if (personal) {
        result.push(...personal.map((c) => ({ ...c, type: 'personal' as const })));
      }
      return result;
    },
    enabled: !!userId,
  });

  const create = useMutation({
    mutationFn: async (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('activities').insert(activity).select().single();
      if (error) throw error;
      return data as Activity;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', userId] });
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Pick<Activity, 'id'> & Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data: result, error } = await supabase
        .from('activities')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as Activity;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', userId] });
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('activities').delete().eq('id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', userId] });
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  const getLinks = async (activityId: string) => {
    const { data } = await supabase
      .from('habit_activities')
      .select('*, habits(id, name)')
      .eq('activity_id', activityId);
    return (data as HabitActivity[]) ?? [];
  };

  const linkToHabit = useMutation({
    mutationFn: async ({
      habitId,
      activityId,
      weight,
    }: {
      habitId: string;
      activityId: string;
      weight: number;
    }) => {
      const { data: existing } = await supabase
        .from('habit_activities')
        .select('*')
        .eq('habit_id', habitId)
        .eq('activity_id', activityId);

      if (existing?.length) {
        await supabase
          .from('habit_activities')
          .update({ weight, updated_at: new Date().toISOString() })
          .eq('habit_id', habitId)
          .eq('activity_id', activityId);
      } else {
        await supabase
          .from('habit_activities')
          .insert({ habit_id: habitId, activity_id: activityId, weight });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  const unlinkFromHabit = useMutation({
    mutationFn: async ({
      habitId,
      activityId,
    }: {
      habitId: string;
      activityId: string;
    }) => {
      await supabase
        .from('habit_activities')
        .delete()
        .eq('habit_id', habitId)
        .eq('activity_id', activityId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-matrix', userId] });
    },
  });

  return { list, matrix, categories, create, update, remove, getLinks, linkToHabit, unlinkFromHabit };
}
