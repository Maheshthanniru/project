import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized settings for SPA behavior
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh longer to avoid refetch on back/forward
      staleTime: 15 * 60 * 1000, // 15 minutes
      // Keep cache around longer between navigations
      gcTime: 30 * 60 * 1000, // 30 minutes
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Only refetch on reconnect if stale
      refetchOnReconnect: 'always',
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Structural sharing for faster cache updates
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentEntries: ['dashboard', 'recentEntries'] as const,
    companyBalances: ['dashboard', 'companyBalances'] as const,
  },
  // Cash book queries
  cashBook: {
    all: ['cashBook', 'all'] as const,
    list: (page: number, limit: number) => ['cashBook', 'list', page, limit] as const,
    byId: (id: string) => ['cashBook', 'detail', id] as const,
    byDate: (date: string) => ['cashBook', 'byDate', date] as const,
  },
  // Dropdown data queries
  dropdowns: {
    companies: ['dropdowns', 'companies'] as const,
    accounts: ['dropdowns', 'accounts'] as const,
    subAccounts: ['dropdowns', 'subAccounts'] as const,
    users: ['dropdowns', 'users'] as const,
  },
  // Approval queries
  approvals: {
    pending: ['approvals', 'pending'] as const,
    count: ['approvals', 'count'] as const,
  },
} as const;
