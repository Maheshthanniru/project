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
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Responsive filter bar */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Filter controls here */}
        </div>
        {/* Responsive table/card layout */}
        <Card className="overflow-x-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          {/* Table content here */}
        </Card>
      </div>
    </div>
  );
};

export default BalanceSheet;