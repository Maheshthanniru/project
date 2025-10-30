import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import Card from '../components/UI/Card';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useCompanyBalances, useDropdownData, useInvalidateDashboard } from '../hooks/useDashboardData';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  AlertTriangle,
  Building,
  Users,
  RefreshCw,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  // React Query hooks for data fetching
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useDashboardStats(selectedDate);
  const { data: companyBalances, isLoading: companyLoading, isFetching: companyFetching } = useCompanyBalances();
  const { companies, accounts, subAccounts, users, pendingApprovals, uniqueSubAccountsCount, activeOperatorCount, isLoading: dropdownLoading } = useDropdownData();
  const { invalidateAll, invalidateStats, invalidateRecentEntries } = useInvalidateDashboard();

  // Combined loading states
  const loading = statsLoading || companyLoading || dropdownLoading;
  const autoUpdating = statsFetching || companyFetching;

  // Listen for storage events to refresh when new entries are created
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-refresh' && e.newValue) {
        invalidateAll();
        // Clear the trigger
        localStorage.removeItem('dashboard-refresh');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [invalidateAll]);

  // Also check for refresh trigger on component mount
  useEffect(() => {
    const refreshTrigger = localStorage.getItem('dashboard-refresh');
    if (refreshTrigger) {
      invalidateAll();
      localStorage.removeItem('dashboard-refresh');
    }
  }, [invalidateAll]);

  // Listen for custom events to refresh dashboard
  useEffect(() => {
    const handleDashboardRefresh = () => {
      invalidateAll();
    };

    window.addEventListener('dashboard-refresh', handleDashboardRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleDashboardRefresh);
  }, [invalidateAll]);

  // Set up Supabase real-time subscription for automatic updates
  useEffect(() => {
    console.log('🔄 Setting up Supabase real-time subscription for dashboard...');
    
    const subscription = supabase
      .channel('cash_book_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'cash_book'
        },
        (payload) => {
          console.log('📊 Database change detected:', payload.eventType, payload.new || payload.old);
          // Show a subtle notification that dashboard is updating
          toast.success('Dashboard updated automatically', {
            duration: 2000,
            position: 'top-right',
            style: {
              background: '#10B981',
              color: 'white',
            },
          });
          // Invalidate React Query cache to trigger refetch
          invalidateAll();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up Supabase real-time subscription...');
      subscription.unsubscribe();
    };
  }, [invalidateAll]);

  // Manual refresh function
  const handleManualRefresh = () => {
    invalidateAll();
    toast.success('Dashboard refreshed!', {
      duration: 2000,
      position: 'top-right',
    });
  };

  const getTransactionColor = (credit: number, debit: number) => {
    if (credit > 0) return 'text-green-600';
    if (debit > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTransactionBg = (credit: number, debit: number) => {
    if (credit > 0) return 'bg-green-50 border-green-200';
    if (debit > 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const dateOptions = [
    { value: format(new Date(), 'yyyy-MM-dd'), label: 'Today' },
    {
      value: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'),
      label: 'Yesterday',
    },
    {
      value: format(new Date(Date.now() - 2 * 86400000), 'yyyy-MM-dd'),
      label: '2 Days Ago',
    },
    {
      value: format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd'),
      label: 'Last Week',
    },
  ];

  return (
    <div className='min-h-screen flex flex-col space-y-6'>
      {/* Welcome Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Welcome back, {user?.username}!
          </h1>
          <p className='text-gray-600'>
            Here's your business overview for today.
            {companyBalances && companyBalances.length > 0 && (
              <span className='ml-2 text-blue-600 font-medium'>
                ({companyBalances.length} companies tracked)
              </span>
            )}
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <button
            onClick={handleManualRefresh}
            disabled={loading || autoUpdating}
            className='flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <RefreshCw className={`w-4 h-4 ${(loading || autoUpdating) ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : autoUpdating ? 'Auto-updating...' : 'Refresh'}
          </button>
          {autoUpdating && !loading && (
            <div className='flex items-center gap-2 text-sm text-green-600'>
              <div className='w-2 h-2 bg-green-600 rounded-full animate-pulse'></div>
              Auto-updating all 67k+ transactions...
            </div>
          )}
          {loading && (
            <div className='flex items-center gap-2 text-sm text-blue-600'>
              <div className='w-2 h-2 bg-blue-600 rounded-full animate-pulse'></div>
              Processing all transactions...
            </div>
          )}
          <Select
            value={selectedDate}
            onChange={setSelectedDate}
            options={dateOptions}
            className='w-40'
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
        <Card className='bg-gradient-to-r from-green-500 to-green-600 text-white p-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100 text-xs font-medium'>Total Credit</p>
              <p className='text-lg font-bold'>
                {statsLoading ? (
                  <div className='animate-pulse'>Loading...</div>
                ) : stats?.totalCredit !== undefined ? (
                  `₹${stats.totalCredit.toLocaleString()}`
                ) : (
                  <span className='text-yellow-200'>Error loading</span>
                )}
              </p>
            </div>
            <TrendingUp className='w-5 h-5 text-green-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-red-500 to-red-600 text-white p-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-100 text-xs font-medium'>Total Debit</p>
              <p className='text-lg font-bold'>
                {statsLoading ? (
                  <div className='animate-pulse'>Loading...</div>
                ) : stats?.totalDebit !== undefined ? (
                  `₹${stats.totalDebit.toLocaleString()}`
                ) : (
                  <span className='text-yellow-200'>Error loading</span>
                )}
              </p>
            </div>
            <TrendingDown className='w-5 h-5 text-red-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100 text-xs font-medium'>Net Balance</p>
              <p className='text-lg font-bold'>
                {statsLoading ? (
                  <div className='animate-pulse'>Loading...</div>
                ) : stats?.balance !== undefined ? (
                  `₹${stats.balance.toLocaleString()}`
                ) : (
                  <span className='text-yellow-200'>Error loading</span>
                )}
              </p>
            </div>
            <DollarSign className='w-5 h-5 text-blue-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100 text-xs font-medium'>
                Transactions
              </p>
              <p className='text-lg font-bold'>
                {statsLoading ? (
                  <div className='animate-pulse'>Loading...</div>
                ) : stats?.totalTransactions !== undefined ? (
                  stats.totalTransactions.toLocaleString()
                ) : (
                  <span className='text-yellow-200'>Error loading</span>
                )}
              </p>
            </div>
            <FileText className='w-5 h-5 text-purple-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-orange-100 text-xs font-medium'>Pending</p>
              <p className='text-lg font-bold'>{pendingApprovals?.data || 0}</p>
            </div>
            <AlertTriangle className='w-5 h-5 text-orange-200' />
          </div>
        </Card>

      </div>

      {/* Online vs Offline Transaction Stats */}
      {/* Removed online and offline transaction cards */}

      {/* Quick Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <Card className='bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 p-3'>
          <div className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-indigo-600' />
            <div>
              <p className='font-medium text-indigo-800 text-xs'>Total Companies</p>
              <p className='text-lg font-bold text-indigo-900'>
                {companies?.data?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className='bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 p-3'>
          <div className='flex items-center gap-2'>
            <FileText className='w-5 h-5 text-emerald-600' />
            <div>
              <p className='font-medium text-emerald-800 text-xs'>Total Accounts</p>
              <p className='text-lg font-bold text-emerald-900'>
                {accounts?.data?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-3'>
          <div className='flex items-center gap-2'>
            <FileText className='w-5 h-5 text-purple-600' />
            <div>
              <p className='font-medium text-purple-800 text-xs'>Sub Accounts</p>
              <p className='text-lg font-bold text-purple-900'>
                {uniqueSubAccountsCount?.data || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className='bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 p-3'>
          <div className='flex items-center gap-2'>
            <Users className='w-5 h-5 text-amber-600' />
            <div>
              <p className='font-medium text-amber-800 text-xs'>Active Users</p>
              <p className='text-lg font-bold text-amber-900'>
                {activeOperatorCount?.data || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Company Closing Balances Table */}
      <Card
        title='Company Closing Balances'
        subtitle='Current balance for each company (Credit - Debit)'
      >
        {loading ? (
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-2 text-gray-600'>Loading company balances...</p>
          </div>
        ) : !companyBalances || companyBalances.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            No company data found.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <div className='max-h-48 overflow-y-auto'>
              <table className='w-full text-xs'>
                <thead className='sticky top-0 bg-gray-50 z-10'>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-3 px-4 font-semibold text-gray-700'>
                      Company Name
                    </th>
                    <th className='text-right py-3 px-4 font-semibold text-gray-700'>
                      Total Credit
                    </th>
                    <th className='text-right py-3 px-4 font-semibold text-gray-700'>
                      Total Debit
                    </th>
                    <th className='text-right py-3 px-4 font-semibold text-gray-700'>
                      Closing Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                {companyBalances?.map((company, index) => (
                  <tr
                    key={company.companyName}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className='py-3 px-4 font-medium text-gray-900'>
                      {company.companyName}
                    </td>
                    <td className='py-3 px-4 text-right text-green-600 font-medium'>
                      ₹{company.totalCredit.toLocaleString()}
                    </td>
                    <td className='py-3 px-4 text-right text-red-600 font-medium'>
                      ₹{company.totalDebit.toLocaleString()}
                    </td>
                    <td className='py-3 px-4 text-right font-semibold'>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          company.closingBalance > 0
                            ? 'bg-green-100 text-green-800'
                            : company.closingBalance < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        ₹{company.closingBalance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            {/* Summary Footer */}
            <div className='mt-4 p-4 bg-gray-100 rounded-lg border'>
              <div className='grid grid-cols-4 gap-4 text-sm'>
                <div className='font-semibold text-gray-900'>
                  Total Companies: {companyBalances?.length || 0}
                </div>
                <div className='text-right text-green-600 font-semibold'>
                  ₹{companyBalances?.reduce((sum, c) => sum + c.totalCredit, 0)?.toLocaleString() || '0'}
                </div>
                <div className='text-right text-red-600 font-semibold'>
                  ₹{companyBalances?.reduce((sum, c) => sum + c.totalDebit, 0)?.toLocaleString() || '0'}
                </div>
                <div className='text-right'>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-bold ${
                      (companyBalances?.reduce((sum, c) => sum + c.closingBalance, 0) || 0) > 0
                        ? 'bg-green-100 text-green-800'
                        : (companyBalances?.reduce((sum, c) => sum + c.closingBalance, 0) || 0) < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    ₹{companyBalances?.reduce((sum, c) => sum + c.closingBalance, 0)?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
};

export default Dashboard;
