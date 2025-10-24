import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized settings for SPA behavior
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
      // Background refetch when data becomes stale
      refetchOnMount: true,
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
    users: ['dropdowns', 'users'] as const,
  },
  // Approval queries
  approvals: {
    pending: ['approvals', 'pending'] as const,
    count: ['approvals', 'count'] as const,
  },
} as const;





