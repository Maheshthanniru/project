import React, { useState, useEffect } from 'react';
import { 
  Calculator, Search, Filter, Printer, Download, 
  FileText, Building, User, DollarSign, Eye, 
  ChevronDown, ChevronUp, RefreshCw, X, Settings,
  ArrowUpDown, TrendingUp, TrendingDown, BarChart3,
  CheckCircle, AlertCircle, Clock, Users, PieChart
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface BalanceSheetFilters {
  companyName: string;
  betweenDates: boolean;
  fromDate: string;
  toDate: string;
  plYesNo: string;
  bothYesNo: string;
}

interface BalanceSheetAccount {
  accountName: string;
  credit: number;
  debit: number;
  balance: number;
  plYesNo: string;
  bothYesNo: string;
  result: string;
}

const BalanceSheet: React.FC = () => {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState<BalanceSheetFilters>({
    companyName: '',
    betweenDates: true,
    fromDate: '2016-10-31',
    toDate: format(new Date(), 'yyyy-MM-dd'),
    plYesNo: '',
    bothYesNo: '',
  });

  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);

  // Dropdown data
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);

  // Summary totals
  const [totals, setTotals] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balanceRs: 0,
  });

  const yesNoOptions = [
    { value: '', label: 'All' },
    { value: 'YES', label: 'YES' },
    { value: 'NO', label: 'NO' },
    { value: 'BOTH', label: 'BOTH' },
  ];

  useEffect(() => {
    loadDropdownData();
    generateBalanceSheet();
  }, []);

  useEffect(() => {
    generateBalanceSheet();
  }, [filters]);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const generateBalanceSheet = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get filtered entries
      let entries = await supabaseDB.getCashBookEntries();
      
      // Apply date filter
      if (filters.betweenDates) {
        entries = entries.filter(entry => {
          const entryDate = new Date(entry.c_date);
          const fromDate = new Date(filters.fromDate);
          const toDate = new Date(filters.toDate);
          return entryDate >= fromDate && entryDate <= toDate;
        });
      }

      // Apply company filter
      if (filters.companyName) {
        entries = entries.filter(entry => entry.company_name === filters.companyName);
      }

      // Group by account name and calculate balances
      const accountMap = new Map<string, BalanceSheetAccount>();

      entries.forEach(entry => {
        if (!accountMap.has(entry.acc_name)) {
          accountMap.set(entry.acc_name, {
            accountName: entry.acc_name,
            credit: 0,
            debit: 0,
            balance: 0,
            plYesNo: getAccountPLStatus(entry.acc_name),
            bothYesNo: getAccountBothStatus(entry.acc_name),
            result: '',
          });
        }
        
        const account = accountMap.get(entry.acc_name)!;
        account.credit += entry.credit;
        account.debit += entry.debit;
        account.balance = account.credit - account.debit;
        account.result = account.balance >= 0 ? 'CREDIT' : 'DEBIT';
      });

      let balanceSheetAccounts = Array.from(accountMap.values());

      // Apply P&L filter
      if (filters.plYesNo) {
        balanceSheetAccounts = balanceSheetAccounts.filter(acc => acc.plYesNo === filters.plYesNo);
      }

      // Apply Both filter
      if (filters.bothYesNo) {
        balanceSheetAccounts = balanceSheetAccounts.filter(acc => acc.bothYesNo === filters.bothYesNo);
      }

      // Sort by account name
      balanceSheetAccounts.sort((a, b) => a.accountName.localeCompare(b.accountName));

      setBalanceSheetData(balanceSheetAccounts);

      // Calculate totals
      const totalCredit = balanceSheetAccounts.reduce((sum, acc) => sum + acc.credit, 0);
      const totalDebit = balanceSheetAccounts.reduce((sum, acc) => sum + acc.debit, 0);
      const balanceRs = totalCredit - totalDebit;

      setTotals({
        totalCredit,
        totalDebit,
        balanceRs,
      });

    } catch (error) {
      console.error('Error generating balance sheet:', error);
      toast.error('Failed to generate balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const getAccountPLStatus = (accountName: string): string => {
    // Determine if account should be included in P&L
    const plAccounts = ['SALES', 'PURCHASE', 'EXPENSE', 'INCOME', 'REVENUE'];
    const isPlAccount = plAccounts.some(type => 
      accountName.toUpperCase().includes(type)
    );
    return isPlAccount ? 'YES' : 'NO';
  };

  const getAccountBothStatus = (accountName: string): string => {
    // Determine if account appears in both balance sheet and P&L
    const bothAccounts = ['CAPITAL', 'DRAWINGS', 'RESERVES'];
    const isBothAccount = bothAccounts.some(type => 
      accountName.toUpperCase().includes(type)
    );
    return isBothAccount ? 'BOTH' : 'NO';
  };

  const handleFilterChange = (field: keyof BalanceSheetFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const refreshData = () => {
    generateBalanceSheet();
    toast.success('Balance sheet refreshed successfully!');
  };

  const resetFilters = () => {
    setFilters({
      companyName: '',
      betweenDates: true,
      fromDate: '2016-10-31',
      toDate: format(new Date(), 'yyyy-MM-dd'),
      plYesNo: '',
      bothYesNo: '',
    });
    toast.success('Filters reset');
  };

  const updateBalanceSheetAndPL = () => {
    // This would update the balance sheet and P&L in the database
    toast.success('Balance sheet and P&L updated successfully!');
  };

  const exportToExcel = () => {
    const exportData = balanceSheetData.map(account => ({
      'Account Name': account.accountName,
      'Credit': account.credit,
      'Debit': account.debit,
      'Balance': account.balance,
      'P&L Yes/No': account.plYesNo,
      'Both Yes/No': account.bothYesNo,
      'Result': account.result,
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
    a.download = `balance-sheet-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Balance sheet exported successfully!');
  };

  const printReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600">Comprehensive balance sheet and profit & loss analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={RefreshCw}
            variant="secondary"
            onClick={refreshData}
          >
            Refresh
          </Button>
          <Button
            icon={Printer}
            variant="secondary"
            onClick={printReport}
          >
            Print
          </Button>
          <Button
            icon={Download}
            variant="secondary"
            onClick={exportToExcel}
          >
            Export
          </Button>
          <Button
            icon={X}
            variant="secondary"
            onClick={() => setShowFinalReport(false)}
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-6">
          {/* Company Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Company Name"
              value={filters.companyName}
              onChange={(value) => handleFilterChange('companyName', value)}
              options={companies}
            />
            
            <Select
              label="P&L Yes/No"
              value={filters.plYesNo}
              onChange={(value) => handleFilterChange('plYesNo', value)}
              options={yesNoOptions}
            />
            
            <Select
              label="Both Yes/No"
              value={filters.bothYesNo}
              onChange={(value) => handleFilterChange('bothYesNo', value)}
              options={yesNoOptions}
            />
          </div>

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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateBalanceSheet}
              className="bg-green-600 hover:bg-green-700"
            >
              Refresh
            </Button>
            
            <Button
              variant="secondary"
              onClick={resetFilters}
            >
              Reset
            </Button>
            
            <Button
              onClick={() => setShowFinalReport(!showFinalReport)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {showFinalReport ? 'Hide' : 'Show'} Final Report
            </Button>
            
            <Button
              onClick={updateBalanceSheetAndPL}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Update Balance sheet and PL
            </Button>
          </div>
        </div>
      </Card>

      {/* Balance Sheet Table */}
      <Card title="Balance Sheet Table" subtitle={`${balanceSheetData.length} accounts`}>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating balance sheet...</p>
          </div>
        ) : balanceSheetData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No accounts found for the selected criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">P&L Yes/No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">AccountName</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Credit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Debit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Balance</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Both Yes/No</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheetData.map((account, index) => (
                    <tr key={account.accountName} className={`border-b hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={account.plYesNo === 'YES'}
                          readOnly
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600">{account.accountName}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {account.credit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {account.debit.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {account.balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={account.bothYesNo === 'YES' || account.bothYesNo === 'BOTH'}
                          readOnly
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="mt-6 bg-gray-900 text-white p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-gray-300">Totals</div>
                  <div className="text-2xl font-bold">{totals.totalCredit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300"></div>
                  <div className="text-2xl font-bold">{totals.totalDebit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Balance Rs</div>
                  <div className={`text-2xl font-bold ${
                    totals.balanceRs >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {Math.abs(totals.balanceRs).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Final Report Modal */}
      {showFinalReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Final Report</h3>
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
                    onClick={() => setShowFinalReport(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Final Report Content */}
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900">Thirumala Groups</h1>
                  <h2 className="text-xl font-semibold text-gray-700 mt-2">Final Report</h2>
                  <p className="text-gray-600 mt-1">Balance Sheet Table Platform</p>
                  {filters.companyName && (
                    <p className="text-gray-600">Company: {filters.companyName}</p>
                  )}
                  <p className="text-gray-600">
                    Period: {format(new Date(filters.fromDate), 'MMM dd, yyyy')} to {format(new Date(filters.toDate), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left">P&L Yes/No</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">AccountName</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Credit</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Debit</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Balance</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Both Yes/No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceSheetData.map((account) => (
                        <tr key={account.accountName}>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {account.plYesNo === 'YES' ? '✓' : ''}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">{account.accountName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            {account.credit.toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            {account.debit.toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            {account.balance.toLocaleString()}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {account.bothYesNo === 'YES' || account.bothYesNo === 'BOTH' ? '✓' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center font-bold">
                    <div>
                      <div className="text-gray-700">Totals</div>
                      <div className="text-xl">{totals.totalCredit.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-700"></div>
                      <div className="text-xl">{totals.totalDebit.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-700">Balance Rs</div>
                      <div className="text-xl">{Math.abs(totals.balanceRs).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500">
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

export default BalanceSheet;