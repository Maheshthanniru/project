import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Printer, Download, 
  FileText, Building, User, DollarSign, Eye, 
  ChevronDown, ChevronUp, RefreshCw, X, Settings,
  ArrowUpDown, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface DetailedLedgerFilters {
  fromDate: string;
  toDate: string;
  companyName: string;
  mainAccount: string;
  subAccount: string;
  staffwise: string;
  creditAmount: number;
  debitAmount: number;
  betweenDates: boolean;
}

interface LedgerEntry {
  id: string;
  sno: number;
  date: string;
  companyName: string;
  accountName: string;
  subAccount: string;
  particulars: string;
  credit: number;
  debit: number;
  staff: string;
  user: string;
  entryTime: string;
  approved: boolean;
  balance: number;
  runningBalance: number;
}

const DetailedLedger: React.FC = () => {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState<DetailedLedgerFilters>({
    fromDate: '2016-10-31',
    toDate: format(new Date(), 'yyyy-MM-dd'),
    companyName: '',
    mainAccount: '',
    subAccount: '',
    staffwise: '',
    creditAmount: 0,
    debitAmount: 0,
    betweenDates: true,
  });

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown data
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [subAccounts, setSubAccounts] = useState<{ value: string; label: string }[]>([]);
  const [staffList, setStaffList] = useState<{ value: string; label: string }[]>([]);

  // Summary data
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
    recordCount: 0,
    openingBalance: 0,
    closingBalance: 0,
  });

  useEffect(() => {
    loadDropdownData();
    loadLedgerData();
  }, []);



  useEffect(() => {
    applyFilters();
  }, [ledgerEntries, filters, searchTerm]);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);

      // Load all accounts independently
      const allAccounts = await supabaseDB.getAccounts();
      const accountsData = allAccounts.map((account: any) => ({
        value: account.acc_name,
        label: account.acc_name
      }));
      setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);

      // Load all sub accounts independently
      const allSubAccounts = await supabaseDB.getSubAccounts();
      const subAccountsData = allSubAccounts.map((subAcc: any) => ({
        value: subAcc.sub_acc,
        label: subAcc.sub_acc
      }));
      setSubAccounts([{ value: '', label: 'All Sub Accounts' }, ...subAccountsData]);

      // Load staff
      const users = await supabaseDB.getUsers();
      const usersData = users.filter(u => u.is_active).map(user => ({
        value: user.username,
        label: user.username
      }));
      setStaffList([{ value: '', label: 'All Staff' }, ...usersData]);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };



  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const entries = await supabaseDB.getCashBookEntries();
      
      // Convert to ledger format with running balance
      let runningBalance = 0;
      const ledgerData: LedgerEntry[] = entries.map((entry, index) => {
        const balance = entry.credit - entry.debit;
        runningBalance += balance;
        
        return {
          id: entry.id,
          sno: entry.sno,
          date: entry.c_date,
          companyName: entry.company_name,
          accountName: entry.acc_name,
          subAccount: entry.sub_acc_name || '',
          particulars: entry.particulars,
          credit: entry.credit,
          debit: entry.debit,
          staff: entry.staff,
          user: entry.staff, // Using staff as user since user field doesn't exist in Supabase schema
          entryTime: entry.entry_time,
          approved: entry.approved,
          balance: balance,
          runningBalance: runningBalance,
        };
      });

      setLedgerEntries(ledgerData);
    } catch (error) {
      console.error('Error loading ledger data:', error);
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ledgerEntries];

    // Date range filter
    if (filters.betweenDates) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        return entryDate >= fromDate && entryDate <= toDate;
      });
    }

    // Company filter
    if (filters.companyName) {
      filtered = filtered.filter(entry => entry.companyName === filters.companyName);
    }

    // Main Account filter
    if (filters.mainAccount) {
      filtered = filtered.filter(entry => entry.accountName === filters.mainAccount);
    }

    // Sub Account filter
    if (filters.subAccount) {
      filtered = filtered.filter(entry => entry.subAccount === filters.subAccount);
    }

    // Staff filter
    if (filters.staffwise) {
      filtered = filtered.filter(entry => entry.staff === filters.staffwise);
    }

    // Credit amount filter
    if (filters.creditAmount > 0) {
      filtered = filtered.filter(entry => entry.credit >= filters.creditAmount);
    }

    // Debit amount filter
    if (filters.debitAmount > 0) {
      filtered = filtered.filter(entry => entry.debit >= filters.debitAmount);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.subAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.staff.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Calculate summary
    const totalCredit = filtered.reduce((sum, entry) => sum + entry.credit, 0);
    const totalDebit = filtered.reduce((sum, entry) => sum + entry.debit, 0);
    const balance = totalCredit - totalDebit;

    setSummary({
      totalCredit,
      totalDebit,
      balance,
      recordCount: filtered.length,
      openingBalance: 0, // Calculate based on entries before date range
      closingBalance: balance,
    });

    setFilteredEntries(filtered);
  };

  const handleFilterChange = (field: keyof DetailedLedgerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset dependent filters
    if (field === 'companyName') {
      setFilters(prev => ({ ...prev, mainAccount: '', subAccount: '' }));
    }
    if (field === 'mainAccount') {
      setFilters(prev => ({ ...prev, subAccount: '' }));
    }
  };

  const getRecords = () => {
    applyFilters();
    toast.success(`Found ${filteredEntries.length} records`);
  };

  const resetFilters = () => {
    setFilters({
      fromDate: '2016-10-31',
      toDate: format(new Date(), 'yyyy-MM-dd'),
      companyName: '',
      mainAccount: '',
      subAccount: '',
      staffwise: '',
      creditAmount: 0,
      debitAmount: 0,
      betweenDates: true,
    });
    setSearchTerm('');
    toast.success('Filters reset');
  };

  const printReport = () => {
    setShowPrintPreview(true);
  };

  const printAll = () => {
    // Print all records without filters
    const allEntries = ledgerEntries;
    console.log('Printing all records:', allEntries.length);
    toast.success(`Preparing to print ${allEntries.length} records`);
    setShowPrintPreview(true);
  };

  const exportToExcel = () => {
    const exportData = filteredEntries.map(entry => ({
      'S.No': entry.sno,
      'Date': entry.date,
      'Company': entry.companyName,
      'Main Account': entry.accountName,
      'Sub Account': entry.subAccount || '',
      'Particulars': entry.particulars,
      'Credit': entry.credit,
      'Debit': entry.debit,
      'Balance': entry.balance,
      'Running Balance': entry.runningBalance,
      'Staff': entry.staff,
      'User': entry.user,
      'Entry Time': entry.entryTime,
      'Approved': entry.approved ? 'Yes' : 'No',
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed-ledger-${filters.fromDate}-to-${filters.toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Ledger exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detailed Ledger</h1>
          <p className="text-gray-600">Comprehensive ledger analysis with advanced filtering</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={Settings}
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            icon={RefreshCw}
            variant="secondary"
            onClick={loadLedgerData}
          >
            Refresh
          </Button>
          <Button
            icon={Download}
            variant="secondary"
            onClick={exportToExcel}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="space-y-6">
            {/* Date Range Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="betweenDates"
                  checked={filters.betweenDates}
                  onChange={(e) => handleFilterChange('betweenDates', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="betweenDates" className="text-sm font-medium text-gray-700">
                  Between Dates
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(value) => handleFilterChange('fromDate', value)}
                    disabled={!filters.betweenDates}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(value) => handleFilterChange('toDate', value)}
                    disabled={!filters.betweenDates}
                  />
                </div>
              </div>
            </div>

            {/* Account Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Company Name"
                value={filters.companyName}
                onChange={(value) => handleFilterChange('companyName', value)}
                options={companies}
              />
              
              <Select
                label="Main Account"
                value={filters.mainAccount}
                onChange={(value) => handleFilterChange('mainAccount', value)}
                options={accounts}
                disabled={!filters.companyName}
              />
              
              <Select
                label="Sub Account"
                value={filters.subAccount}
                onChange={(value) => handleFilterChange('subAccount', value)}
                options={subAccounts}
                disabled={!filters.mainAccount}
              />
              
              <Select
                label="Staffwise"
                value={filters.staffwise}
                onChange={(value) => handleFilterChange('staffwise', value)}
                options={staffList}
              />
            </div>

            {/* Amount Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Credit Amount (Minimum)"
                type="number"
                value={filters.creditAmount}
                onChange={(value) => handleFilterChange('creditAmount', parseFloat(value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
              />
              
              <Input
                label="Debit Amount (Minimum)"
                type="number"
                value={filters.debitAmount}
                onChange={(value) => handleFilterChange('debitAmount', parseFloat(value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={getRecords}
                className="bg-green-600 hover:bg-green-700"
              >
                Get Record
              </Button>
              
              <Button
                variant="secondary"
                onClick={resetFilters}
              >
                Reset
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => setShowFilters(false)}
              >
                Close
              </Button>
              
              <Button
                icon={Printer}
                variant="secondary"
                onClick={printReport}
              >
                Print
              </Button>
              
              <Button
                icon={Printer}
                variant="secondary"
                onClick={printAll}
              >
                Print All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search in ledger entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
            <strong>{filteredEntries.length}</strong> records found
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Credit</p>
              <p className="text-2xl font-bold">₹{summary.totalCredit.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Debit</p>
              <p className="text-2xl font-bold">₹{summary.totalDebit.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </Card>

        <Card className={`bg-gradient-to-r ${
          summary.balance >= 0 
            ? 'from-blue-500 to-blue-600' 
            : 'from-orange-500 to-orange-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Balance</p>
              <p className="text-2xl font-bold">
                ₹{Math.abs(summary.balance).toLocaleString()}
                {summary.balance >= 0 ? ' CR' : ' DR'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card title="Detailed Ledger Entries" subtitle={`Showing ${filteredEntries.length} entries`}>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading ledger data...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No entries found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">S.No</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Account</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Sub Account</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Particulars</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Credit</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Debit</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Staff</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">User</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Entry Time</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Running Balance</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id} className={`border-b hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}>
                    <td className="px-3 py-2 font-medium">{entry.sno}</td>
                    <td className="px-3 py-2">{format(new Date(entry.date), 'dd-MMM-yy')}</td>
                    <td className="px-3 py-2 font-medium text-blue-600">{entry.companyName}</td>
                    <td className="px-3 py-2">{entry.accountName}</td>
                    <td className="px-3 py-2">{entry.subAccount || '-'}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={entry.particulars}>
                      {entry.particulars}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2">{entry.staff}</td>
                    <td className="px-3 py-2">{entry.user}</td>
                    <td className="px-3 py-2">{format(new Date(entry.entryTime), 'HH:mm:ss')}</td>
                    <td className={`px-3 py-2 text-right font-bold ${
                      entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(entry.runningBalance).toLocaleString()}
                      {entry.runningBalance >= 0 ? ' CR' : ' DR'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {entry.approved ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Footer */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-800">Total Credit:</div>
                <div className="text-lg font-bold text-green-900">₹{summary.totalCredit.toLocaleString()}</div>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-800">Total Debit:</div>
                <div className="text-lg font-bold text-red-900">₹{summary.totalDebit.toLocaleString()}</div>
              </div>
              <div className={`p-3 rounded-lg ${
                summary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <div className={`text-sm font-medium ${
                  summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'
                }`}>
                  Balance:
                </div>
                <div className={`text-lg font-bold ${
                  summary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'
                }`}>
                  ₹{Math.abs(summary.balance).toLocaleString()}
                  {summary.balance >= 0 ? ' CR' : ' DR'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Print Preview - Detailed Ledger</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    icon={Printer}
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={X}
                    onClick={() => setShowPrintPreview(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Print Content */}
              <div className="print:block">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Thirumala Group</h1>
                  <h2 className="text-lg font-semibold text-gray-700">Detailed Ledger Report</h2>
                  <p className="text-gray-600">
                    From {format(new Date(filters.fromDate), 'MMM dd, yyyy')} to {format(new Date(filters.toDate), 'MMM dd, yyyy')}
                  </p>
                  {filters.companyName && <p className="text-gray-600">Company: {filters.companyName}</p>}
                  {filters.mainAccount && <p className="text-gray-600">Account: {filters.mainAccount}</p>}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Total Credit</div>
                    <div className="text-lg font-bold">₹{summary.totalCredit.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Total Debit</div>
                    <div className="text-lg font-bold">₹{summary.totalDebit.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Balance</div>
                    <div className="text-lg font-bold">
                      ₹{Math.abs(summary.balance).toLocaleString()}
                      {summary.balance >= 0 ? ' CR' : ' DR'}
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left">S.No</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Date</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Company</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Account</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Particulars</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Credit</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Debit</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="border border-gray-300 px-2 py-1">{entry.sno}</td>
                        <td className="border border-gray-300 px-2 py-1">{format(new Date(entry.date), 'dd-MMM-yy')}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.companyName}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.accountName}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.particulars}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {Math.abs(entry.runningBalance).toLocaleString()}
                          {entry.runningBalance >= 0 ? ' CR' : ' DR'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-6 text-center text-xs text-gray-500">
                  Generated on {format(new Date(), 'MMM dd, yyyy HH:mm:ss')} by {user?.username}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedLedger;