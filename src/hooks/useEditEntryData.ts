import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseDB } from '../lib/supabaseDatabase';
import { queryKeys } from '../lib/queryClient';
import toast from 'react-hot-toast';

// Hook for getting a single cash book entry for editing
export const useCashBookEntry = (id: string) => {
  return useQuery({
    queryKey: queryKeys.cashBook.byId(id),
    queryFn: () => supabaseDB.getCashBookEntry(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: !!id, // Only fetch if ID is provided
  });
};

// Hook for updating an entry
export const useUpdateCashBookEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, entry }: { id: string; entry: any }) => 
      supabaseDB.updateCashBookEntry(id, entry),
    onSuccess: (_, { id }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.cashBook.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashBook.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentEntries });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.companyBalances });
      
      toast.success('Entry updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    },
  });
};

// Hook for deleting an entry
export const useDeleteCashBookEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supabaseDB.deleteCashBookEntry(id),
    onSuccess: (_, id) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.cashBook.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashBook.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentEntries });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.companyBalances });
      
      toast.success('Entry deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    },
  });
};





