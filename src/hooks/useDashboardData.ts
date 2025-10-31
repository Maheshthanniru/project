import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseDB } from '../lib/supabaseDatabase';
import { queryKeys } from '../lib/queryClient';

// Hook for dashboard stats
export const useDashboardStats = (selectedDate?: string) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, selectedDate],
    queryFn: () => supabaseDB.getDashboardStats(selectedDate),
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Hook for recent entries (today's entries only for LIFO display)
export const useRecentEntries = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.recentEntries,
    queryFn: () => supabaseDB.getTodaysCashBookEntries(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
  });
};

// Hook for recent entries by specific date (for NewEntry form)
export const useRecentEntriesByDate = (date: string) => {
  return useQuery({
    queryKey: ['recentEntries', date],
    queryFn: () => {
      console.log('🔍 Fetching recent entries for date:', date);
      return supabaseDB.getCashBookEntriesByDate(date);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
    enabled: !!date, // Only fetch if date is provided
    onSuccess: (data) => {
      console.log('✅ Recent entries fetched successfully:', data?.length || 0, 'entries for date:', date);
    },
    onError: (error) => {
      console.error('❌ Error fetching recent entries for date:', date, error);
    }
  });
};

// Hook for company balances
export const useCompanyBalances = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.companyBalances,
    queryFn: () => supabaseDB.getCompanyClosingBalances(),
    staleTime: 3 * 60 * 1000, // 3 minutes for company balances
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

// Hook for dropdown data (companies, accounts, sub accounts, users)
export const useDropdownData = () => {
  const companiesQuery = useQuery({
    queryKey: queryKeys.dropdowns.companies,
    queryFn: () => supabaseDB.getCompanies(), // Use getCompanies() to show ALL companies, including newly created ones
    staleTime: 10 * 60 * 1000, // 10 minutes for dropdown data
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const accountsQuery = useQuery({
    queryKey: queryKeys.dropdowns.accounts,
    queryFn: () => supabaseDB.getAccounts(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const subAccountsQuery = useQuery({
    queryKey: queryKeys.dropdowns.subAccounts,
    queryFn: () => supabaseDB.getSubAccounts(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: queryKeys.dropdowns.users,
    queryFn: () => supabaseDB.getUsers(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const pendingApprovalsQuery = useQuery({
    queryKey: queryKeys.approvals.count,
    queryFn: () => supabaseDB.getPendingApprovalsCount(),
    staleTime: 1 * 60 * 1000, // 1 minute for pending approvals
    gcTime: 3 * 60 * 1000,
  });

  const uniqueSubAccountsCountQuery = useQuery({
    queryKey: ['subAccounts', 'uniqueCount'],
    queryFn: () => supabaseDB.getUniqueSubAccountsCount(),
    staleTime: 10 * 60 * 1000, // 10 minutes for sub accounts count
    gcTime: 30 * 60 * 1000,
  });

  const activeOperatorCountQuery = useQuery({
    queryKey: ['operators', 'activeCount'],
    queryFn: () => supabaseDB.getActiveOperatorCount(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return {
    companies: companiesQuery,
    accounts: accountsQuery,
    subAccounts: subAccountsQuery,
    users: usersQuery,
    pendingApprovals: pendingApprovalsQuery,
    uniqueSubAccountsCount: uniqueSubAccountsCountQuery,
    activeOperatorCount: activeOperatorCountQuery,
    isLoading: companiesQuery.isLoading || accountsQuery.isLoading || subAccountsQuery.isLoading || usersQuery.isLoading || pendingApprovalsQuery.isLoading || uniqueSubAccountsCountQuery.isLoading || activeOperatorCountQuery.isLoading,
    isError: companiesQuery.isError || accountsQuery.isError || subAccountsQuery.isError || usersQuery.isError || pendingApprovalsQuery.isError || uniqueSubAccountsCountQuery.isError || activeOperatorCountQuery.isError,
  };
};

// Utility hook for invalidating dashboard data
export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentEntries });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.companyBalances });
    queryClient.invalidateQueries({ queryKey: queryKeys.cashBook.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.count });
  };

  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.companyBalances });
  };

  const invalidateRecentEntries = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentEntries });
    queryClient.invalidateQueries({ queryKey: queryKeys.cashBook.all });
  };

  return {
    invalidateAll,
    invalidateStats,
    invalidateRecentEntries,
  };
};
