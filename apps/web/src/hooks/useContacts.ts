import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { getContacts, createContact, deleteContact } from '@repo/shared/queries/contacts';
import type { ContactInput } from '@repo/shared/schemas';
import { STALE_TIME_LONG } from '@/lib/queryStaleTimes';

export function useContacts() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contacts', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return getContacts(supabase, userId);
    },
    enabled: !!userId,
    staleTime: STALE_TIME_LONG,
  });

  const createMutation = useMutation({
    mutationFn: (data: ContactInput) => {
      if (!userId) throw new Error('User not authenticated');
      return createContact(supabase, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deleteContact(supabase, userId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', userId] });
    },
  });

  return {
    ...query,
    createContact: createMutation.mutateAsync,
    deleteContact: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
