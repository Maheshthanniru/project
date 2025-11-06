import { QueryClient } from '@tanstack/react-query';
import { getTableMode } from './tableNames';

// Helper to get current table mode for query keys
const getTableModeForQuery = (): string => {
  return getTableMode();
};

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
// Include table mode in query keys so React Query treats regular and ITR data as separate
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    stats: (date?: string) => ['dashboard', 'stats', getTableModeForQuery(), date] as const,
    recentEntries: () => ['dashboard', 'recentEntries', getTableModeForQuery()] as const,
    companyBalances: () => ['dashboard', 'companyBalances', getTableModeForQuery()] as const,
  },
  // Cash book queries
  cashBook: {
    all: () => ['cashBook', 'all', getTableModeForQuery()] as const,
    list: (page: number, limit: number) => ['cashBook', 'list', getTableModeForQuery(), page, limit] as const,
    byId: (id: string) => ['cashBook', 'detail', getTableModeForQuery(), id] as const,
    byDate: (date: string) => ['cashBook', 'byDate', getTableModeForQuery(), date] as const,
  },
  // Dropdown data queries (accounts/subaccounts change with mode, companies/users don't)
  dropdowns: {
    companies: () => ['dropdowns', 'companies'] as const, // Shared between modes
    accounts: () => ['dropdowns', 'accounts', getTableModeForQuery()] as const,
    subAccounts: () => ['dropdowns', 'subAccounts', getTableModeForQuery()] as const,
    users: () => ['dropdowns', 'users'] as const, // Shared between modes
  },
  // Approval queries
  approvals: {
    pending: () => ['approvals', 'pending', getTableModeForQuery()] as const,
    count: () => ['approvals', 'count', getTableModeForQuery()] as const,
  },
} as const;
