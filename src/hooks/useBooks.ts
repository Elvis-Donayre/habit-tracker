import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Book } from '@/types';

export function useBooks(userId: string | undefined) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['books', userId],
    queryFn: async () => {
      if (!userId) return [];
      const sb = createClient();
      const { data, error } = await sb
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .order('title', { ascending: true });
      if (error) throw error;
      return (data as Book[]) ?? [];
    },
    enabled: !!userId,
  });

  const add = useMutation({
    mutationFn: async ({ title, author }: { title: string; author?: string }) => {
      const sb = createClient();
      const { error } = await sb.from('books').insert({
        user_id: userId,
        title: title.trim(),
        author: author?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books', userId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const sb = createClient();
      const { error } = await sb.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books', userId] }),
  });

  return { list, add, remove };
}
