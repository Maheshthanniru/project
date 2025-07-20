import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle, Users, Building, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/UI/Card';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
    totalTransactions: 0,
    pendingApprovals: 0,
    companiesCount: 0,
    accountsCount: 0,
    activeUsersCount: 0,
    onlineCredit: 0,
    offlineCredit: 0,
    onlineDebit: 0,
    offlineDebit: 0,
    totalOnline: 0,
    totalOffline: 0,
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get stats from Supabase database
      const dashboardStats = await supabaseDB.getDashboardStats(selectedDate);
      
      // Get additional counts
      const companies = await supabaseDB.getCompanies();
      const accounts = await supabaseDB.getAccounts();
      const users = await supabaseDB.getUsers();
      const pendingApprovals = await supabaseDB.getPendingApprovalsCount();
      
      setStats({
        totalCredit: dashboardStats.totalCredit,
        totalDebit: dashboardStats.totalDebit,
        balance: dashboardStats.balance,
        totalTransactions: dashboardStats.todayEntries,
        pendingApprovals: pendingApprovals,
        companiesCount: companies.length,
        accountsCount: accounts.length,
        activeUsersCount: users.filter(u => u.is_active).length,
        onlineCredit: dashboardStats.onlineCredit,
        offlineCredit: dashboardStats.offlineCredit,
        onlineDebit: dashboardStats.onlineDebit,
        offlineDebit: dashboardStats.offlineDebit,
        totalOnline: dashboardStats.totalOnline,
        totalOffline: dashboardStats.totalOffline,
      });

      // Get recent entries
      const entries = await supabaseDB.getCashBookEntries();
      setRecentEntries(entries.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    { value: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), label: 'Yesterday' },
    { value: format(new Date(Date.now() - 2 * 86400000), 'yyyy-MM-dd'), label: '2 Days Ago' },
    { value: format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd'), label: 'Last Week' },
  ];

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">Here's your business overview for today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={selectedDate}
            onChange={setSelectedDate}
            options={dateOptions}
            className="w-40"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Credit</p>
              <p className="text-2xl font-bold">₹{stats.totalCredit.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Debit</p>
              <p className="text-2xl font-bold">₹{stats.totalDebit.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Net Balance</p>
              <p className="text-2xl font-bold">₹{stats.balance.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Transactions</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-200" />
          </div>
        </Card>
      </div>

      {/* Online vs Offline Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Online Transactions</p>
              <p className="text-2xl font-bold">₹{stats.totalOnline.toLocaleString()}</p>
              <p className="text-cyan-200 text-xs mt-1">
                Credit: ₹{stats.onlineCredit.toLocaleString()} | Debit: ₹{stats.onlineDebit.toLocaleString()}
              </p>
            </div>
            <Wifi className="w-8 h-8 text-cyan-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Offline Transactions</p>
              <p className="text-2xl font-bold">₹{stats.totalOffline.toLocaleString()}</p>
              <p className="text-gray-200 text-xs mt-1">
                Credit: ₹{stats.offlineCredit.toLocaleString()} | Debit: ₹{stats.offlineDebit.toLocaleString()}
              </p>
            </div>
            <WifiOff className="w-8 h-8 text-gray-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Online Credit</p>
              <p className="text-2xl font-bold">₹{stats.onlineCredit.toLocaleString()}</p>
              <p className="text-indigo-200 text-xs mt-1">
                {stats.totalCredit > 0 ? `${((stats.onlineCredit / stats.totalCredit) * 100).toFixed(1)}%` : '0%'} of total credit
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Online Debit</p>
              <p className="text-2xl font-bold">₹{stats.onlineDebit.toLocaleString()}</p>
              <p className="text-pink-200 text-xs mt-1">
                {stats.totalDebit > 0 ? `${((stats.onlineDebit / stats.totalDebit) * 100).toFixed(1)}%` : '0%'} of total debit
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-pink-200" />
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="font-medium text-indigo-800">Total Companies</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.companiesCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800">Total Accounts</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.accountsCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Active Users</p>
              <p className="text-2xl font-bold text-amber-900">{stats.activeUsersCount || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" subtitle="Latest entries from your cash book">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : recentEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found.
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${getTransactionBg(entry.credit, entry.debit)} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">#{entry.sno}</span>
                      <h4 className="font-medium text-gray-900">{entry.acc_name}</h4>
                      {entry.sub_acc_name && (
                        <span className="text-sm text-gray-500">→ {entry.sub_acc_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{entry.particulars}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{entry.company_name}</span>
                      <span>{format(new Date(entry.c_date), 'MMM dd, yyyy')}</span>
                      <span>{entry.staff}</span>
                      {entry.sale_qty > 0 && <span>Qty: {entry.sale_qty}</span>}
                      {/* Show payment mode */}
                      {entry.credit > 0 && (
                        <div className="space-y-1">
                          {entry.credit_online > 0 && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                              Online: ₹{entry.credit_online.toLocaleString()}
                            </span>
                          )}
                          {entry.credit_offline > 0 && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Offline: ₹{entry.credit_offline.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      {entry.debit > 0 && (
                        <div className="space-y-1">
                          {entry.debit_online > 0 && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                              Online: ₹{entry.debit_online.toLocaleString()}
                            </span>
                          )}
                          {entry.debit_offline > 0 && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Offline: ₹{entry.debit_offline.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.credit > 0 && (
                      <p className={`font-semibold ${getTransactionColor(entry.credit, entry.debit)}`}>
                        +₹{entry.credit.toLocaleString()}
                      </p>
                    )}
                    {entry.debit > 0 && (
                      <p className={`font-semibold ${getTransactionColor(entry.credit, entry.debit)}`}>
                        -₹{entry.debit.toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {entry.approved ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {entry.edited && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Edited
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;