import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { BookReading } from '@/types';

/** Local 'YYYY-MM-DD' (avoids UTC drift from toISOString). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useBookReadings(userId: string | undefined) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['book_readings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const sb = createClient();
      const { data, error } = await sb
        .from('book_readings')
        .select('*')
        .eq('user_id', userId)
        .order('round_number', { ascending: true });
      if (error) throw error;
      return (data as BookReading[]) ?? [];
    },
    enabled: !!userId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['book_readings', userId] });

  /** Start a new (open) reading round. */
  const start = useMutation({
    mutationFn: async ({ bookId, roundNumber, startedAt }: { bookId: string; roundNumber: number; startedAt?: string }) => {
      const sb = createClient();
      const { error } = await sb.from('book_readings').insert({
        book_id: bookId,
        user_id: userId,
        round_number: roundNumber,
        started_at: startedAt ?? todayISO(),
        finished_at: null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Close an open round (mark finished + rating). */
  const finish = useMutation({
    mutationFn: async ({ id, finishedAt, rating }: { id: string; finishedAt: string; rating: number | null }) => {
      const sb = createClient();
      const { error } = await sb.from('book_readings').update({ finished_at: finishedAt, rating }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Record a fully-completed past read in one shot. */
  const logCompleted = useMutation({
    mutationFn: async ({ bookId, roundNumber, startedAt, finishedAt, rating }: { bookId: string; roundNumber: number; startedAt: string; finishedAt: string; rating: number | null }) => {
      const sb = createClient();
      const { error } = await sb.from('book_readings').insert({
        book_id: bookId,
        user_id: userId,
        round_number: roundNumber,
        started_at: startedAt,
        finished_at: finishedAt,
        rating,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const sb = createClient();
      const { error } = await sb.from('book_readings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { list, start, finish, logCompleted, remove };
}
