import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import SearchableSelect from '../components/UI/SearchableSelect';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Search, BarChart3, Plus, Database, RefreshCw, Calendar } from 'lucide-react';

interface DetailedLedgerFilters {
  fromDate: string;
  toDate: string;
  companyName: string;
  mainAccount: string;
  subAccount: string;
  staffwise: string;
  creditAmount: string; // keep as string for easy typing; parse on apply
  debitAmount: string;  // keep as string for easy typing; parse on apply
  betweenDates: boolean;
  paymentMode?: string;
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
  saleQuantity: number;
  purchaseQuantity: number;
  staff: string;
  user: string;
  entryTime: string;
  approved: boolean;
  balance: number;
  runningBalance: number;
  payment_mode: string;
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
  
  // Pagination states
  const [pageSize] = useState(1000); // Show 1000 entries per page
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });

  // Dropdown data
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>(
    []
  );
  const [subAccounts, setSubAccounts] = useState<
    { value: string; label: string }[]
  >([]);
  const [staffList, setStaffList] = useState<
    { value: string; label: string }[]
  >([]);

  // Local visible inputs for dd/MM/yyyy editing to prevent mm/dd flip
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');
  const fromPickerRef = useRef<HTMLInputElement>(null);
  const toPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setFromDateInput(filters.fromDate ? format(new Date(filters.fromDate), 'dd/MM/yyyy') : '');
      setToDateInput(filters.toDate ? format(new Date(filters.toDate), 'dd/MM/yyyy') : '');
    } catch {
      // ignore format errors
    }
  }, [filters.fromDate, filters.toDate]);

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

  // Filter accounts when company changes
  useEffect(() => {
    console.log('Company filter changed:', filters.companyName);
    if (filters.companyName) {
      console.log('Loading accounts for company:', filters.companyName);
      loadAccountsByCompany(filters.companyName);
      // Reset main account and sub account when company changes
      setFilters(prev => ({
        ...prev,
        mainAccount: '',
        subAccount: '',
      }));
    } else {
      console.log('No company selected - clearing accounts and sub-accounts');
      // If no company selected, clear accounts and sub-accounts
      setAccounts([{ value: '', label: 'Select a company first' }]);
      setSubAccounts([{ value: '', label: 'Select a company first' }]);
      // Reset main account and sub account when company is cleared
      setFilters(prev => ({
        ...prev,
        mainAccount: '',
        subAccount: '',
      }));
    }
  }, [filters.companyName]);

  // Filter sub accounts when main account changes
  useEffect(() => {
    if (filters.companyName && filters.mainAccount) {
      loadSubAccountsByAccount(filters.companyName, filters.mainAccount);
      // Reset sub account when main account changes
      setFilters(prev => ({
        ...prev,
        subAccount: '',
      }));
    } else if (filters.companyName) {
      // If company is selected but no main account, show all sub accounts for the company
      loadAllSubAccountsForCompany(filters.companyName);
    } else {
      // If no company selected, clear sub accounts
      setSubAccounts([{ value: '', label: 'Select a company first' }]);
    }
  }, [filters.companyName, filters.mainAccount]);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompaniesWithData();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);

      // Initialize accounts and sub-accounts as empty - they will be loaded when company is selected
      setAccounts([{ value: '', label: 'Select a company first' }]);
      setSubAccounts([{ value: '', label: 'Select a company first' }]);

      // Load staff
      const users = await supabaseDB.getUsers();
      const usersData = users
        .filter(u => u.is_active)
        .map(user => ({
          value: user.username,
          label: user.username,
        }));
      setStaffList([{ value: '', label: 'All Staff' }, ...usersData]);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  // Debug function to check BVR/BVT company data
  const debugCompanyData = async () => {
    try {
      console.log('🔍 [DEBUG] Starting BVR/BVT company data debug...');
      await supabaseDB.debugCompanyAccountData();
      toast.success('Debug data logged to console. Check browser console for details.');
    } catch (error) {
      console.error('Error in debug:', error);
      toast.error('Debug failed. Check console for details.');
    }
  };

  const loadAllAccounts = async () => {
    try {
      // Use getDistinctAccountNames to get all account names from 67k cash_book records
      const allAccountNames = await supabaseDB.getDistinctAccountNames();
      const accountsData = allAccountNames.map((accountName: string) => ({
        value: accountName,
        label: accountName,
      }));
      setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);
    } catch (error) {
      console.error('Error loading all accounts:', error);
      // Fallback to empty state
      setAccounts([{ value: '', label: 'Select a company first' }]);
    }
  };

  const loadAllSubAccounts = async () => {
    try {
      // Use getDistinctSubAccountNames to get all sub-account names from 67k cash_book records
      const allSubAccountNames = await supabaseDB.getDistinctSubAccountNames();
      const subAccountsData = allSubAccountNames.map((subAccountName: string) => ({
        value: subAccountName,
        label: subAccountName,
      }));
      setSubAccounts([
        { value: '', label: 'All Sub Accounts' },
        ...subAccountsData,
      ]);
    } catch (error) {
      console.error('Error loading all sub accounts:', error);
      // Fallback to empty state
      setSubAccounts([{ value: '', label: 'Select a company first' }]);
    }
  };

  const loadAccountsByCompany = async (companyName: string) => {
    try {
      console.log('🔍 [DetailedLedger] Fetching accounts for company:', companyName);
      const accounts = await supabaseDB.getDistinctAccountNamesByCompany(companyName);
      console.log('📊 [DetailedLedger] Fetched accounts:', accounts);
      console.log('📊 [DetailedLedger] Number of accounts found:', accounts.length);
      
      const accountsData = accounts.map((account: string) => ({
        value: account,
        label: account,
      }));
      
      console.log('📊 [DetailedLedger] Setting accounts dropdown with:', accountsData.length + 1, 'items');
      setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);
    } catch (error) {
      console.error('Error loading accounts by company:', error);
      // Fallback to all accounts if there's an error
      await loadAllAccounts();
    }
  };

  const loadSubAccountsByAccount = async (
    companyName: string,
    accountName: string
  ) => {
    try {
      const subAccounts = await supabaseDB.getSubAccountsByAccountAndCompany(
        accountName,
        companyName
      );
      const subAccountsData = subAccounts.map((subAcc: string) => ({
        value: subAcc,
        label: subAcc,
      }));
      setSubAccounts([
        { value: '', label: 'All Sub Accounts' },
        ...subAccountsData,
      ]);
    } catch (error) {
      console.error('Error loading sub accounts by account:', error);
      // Fallback to all sub accounts for the company if there's an error
      await loadAllSubAccountsForCompany(companyName);
    }
  };

  const loadAllSubAccountsForCompany = async (companyName: string) => {
    try {
      // Use getDistinctSubAccountNamesByCompany to get all sub-account names for the company from 67k cash_book records
      const companySubAccountNames = await supabaseDB.getDistinctSubAccountNamesByCompany(companyName);
      const subAccountsData = companySubAccountNames.map((subAccountName: string) => ({
        value: subAccountName,
        label: subAccountName,
      }));
      setSubAccounts([
        { value: '', label: 'All Sub Accounts' },
        ...subAccountsData,
      ]);
    } catch (error) {
      console.error('Error loading sub accounts for company:', error);
      // Fallback to all sub accounts if there's an error
      await loadAllSubAccounts();
    }
  };

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading initial ledger data...');
      
      // Load first page (1000 entries) for better performance
      const entries = await supabaseDB.getCashBookEntries(pageSize, 0);
      console.log('✅ Initial entries fetched:', entries.length);
      
      // Get total count for pagination info
      const totalCount = await supabaseDB.getCashBookEntriesCount();
      setTotalEntries(totalCount);

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
          saleQuantity: entry.sale_qty || 0,
          purchaseQuantity: entry.purchase_qty || 0,
          staff: entry.staff,
          user: entry.staff, // Using staff as user since user field doesn't exist in Supabase schema
          entryTime: entry.entry_time,
          approved: entry.approved,
          balance: balance,
          runningBalance: runningBalance,
          payment_mode: entry.payment_mode || 'Cash',
        };
      });

      setLedgerEntries(ledgerData);
      
      if (entries.length === 0) {
        toast.success('No entries found in database');
      } else {
        toast.success(`Loaded ${entries.length} entries (showing first ${pageSize} of ${totalCount})`);
      }
    } catch (error) {
      console.error('Error loading ledger data:', error);
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreEntries = async () => {
    if (isLoadingMore || ledgerEntries.length >= totalEntries) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = Math.floor(ledgerEntries.length / pageSize) + 1;
      const offset = ledgerEntries.length;
      
      console.log(`🔄 Loading more entries - Page: ${nextPage}, Offset: ${offset}`);
      
      const moreEntries = await supabaseDB.getCashBookEntries(pageSize, offset);
      console.log(`✅ Loaded ${moreEntries.length} more entries`);
      
      // Convert to ledger format with running balance
      let runningBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].runningBalance : 0;
      const moreLedgerData: LedgerEntry[] = moreEntries.map((entry, index) => {
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
          saleQuantity: entry.sale_qty || 0,
          purchaseQuantity: entry.purchase_qty || 0,
          staff: entry.staff,
          user: entry.staff,
          entryTime: entry.entry_time,
          approved: entry.approved,
          balance: balance,
          runningBalance: runningBalance,
          payment_mode: entry.payment_mode || 'Cash',
        };
      });
      
      setLedgerEntries(prev => [...prev, ...moreLedgerData]);
      
      if (moreEntries.length === 0) {
        toast.success('No more entries to load');
      }
    } catch (error) {
      console.error('Error loading more entries:', error);
      toast.error('Failed to load more entries');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadAllEntries = async () => {
    try {
      setIsLoadingAll(true);
      setLoadingProgress({ current: 0, total: 0, message: 'Starting to load all entries...' });
      console.log('🔄 Loading ALL entries from database...');
      
      // First get the total count
      const totalCount = await supabaseDB.getCashBookEntriesCount();
      setLoadingProgress({ current: 0, total: totalCount, message: `Found ${totalCount} total records, starting to load...` });
      
      if (totalCount === 0) {
        toast.error('No records found in database');
        return;
      }
      
      // Load all entries using the pagination helper
      const allEntries = await supabaseDB.getAllCashBookEntries();
      console.log(`✅ Loaded ALL ${allEntries.length} entries`);
      
      // Convert to ledger format with running balance
      let runningBalance = 0;
      const ledgerData: LedgerEntry[] = allEntries.map((entry, index) => {
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
          user: entry.staff,
          entryTime: entry.entry_time,
          approved: entry.approved,
          balance: balance,
          runningBalance: runningBalance,
          payment_mode: entry.payment_mode || 'Cash',
        };
      });
      
      setLedgerEntries(ledgerData);
      setTotalEntries(ledgerData.length);
      setLoadingProgress({ current: ledgerData.length, total: totalCount, message: 'Loading complete!' });
      
      toast.success(`Loaded ALL ${ledgerData.length} entries successfully`);
    } catch (error) {
      console.error('Error loading all entries:', error);
      toast.error('Failed to load all entries: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoadingProgress({ current: 0, total: 0, message: 'Loading failed' });
    } finally {
      setIsLoadingAll(false);
      // Clear progress after a delay
      setTimeout(() => {
        setLoadingProgress({ current: 0, total: 0, message: '' });
      }, 3000);
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
      filtered = filtered.filter(
        entry => entry.companyName === filters.companyName
      );
    }

    // Main Account filter
    if (filters.mainAccount) {
      filtered = filtered.filter(
        entry => entry.accountName === filters.mainAccount
      );
    }

    // Sub Account filter
    if (filters.subAccount) {
      filtered = filtered.filter(
        entry => entry.subAccount === filters.subAccount
      );
    }

    // Staff filter
    if (filters.staffwise) {
      filtered = filtered.filter(entry => entry.staff === filters.staffwise);
    }

    // Credit amount filter (exact match)
    if (filters.creditAmount && filters.creditAmount.trim() !== '') {
      const n = Number(filters.creditAmount);
      if (!Number.isNaN(n)) {
        filtered = filtered.filter(entry => Number(entry.credit) === n);
      }
    }

    // Debit amount filter (exact match)
    if (filters.debitAmount && filters.debitAmount.trim() !== '') {
      const n = Number(filters.debitAmount);
      if (!Number.isNaN(n)) {
        filtered = filtered.filter(entry => Number(entry.debit) === n);
      }
    }

    // Payment mode filter
    if (filters.paymentMode) {
      filtered = filtered.filter(entry => (entry.payment_mode || 'Cash') === filters.paymentMode);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        entry =>
          entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.subAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.credit.toString().includes(searchTerm) ||
          entry.debit.toString().includes(searchTerm)
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

  const handleFilterChange = (
    field: keyof DetailedLedgerFilters,
    value: any
  ) => {
    console.log('Filter change:', field, value);
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };

      // Reset dependent filters
      if (field === 'companyName') {
        newFilters.mainAccount = '';
        newFilters.subAccount = '';
        console.log('Reset main account and sub account');
      }
      if (field === 'mainAccount') {
        newFilters.subAccount = '';
        console.log('Reset sub account');
      }

      console.log('New filters:', newFilters);
      return newFilters;
    });
  };

  const getRecords = () => {
    applyFilters();
    toast.success(`Found ${filteredEntries.length} records`);
  };

  const loadFilteredData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading filtered data from server...');
      
      // Use server-side filtering for better performance with large datasets
      const filteredEntries = await supabaseDB.getAllFilteredCashBookEntries({
        companyName: filters.companyName || undefined,
        accountName: filters.mainAccount || undefined,
        subAccountName: filters.subAccount || undefined,
      });
      
      console.log(`📊 Filtered entries loaded: ${filteredEntries.length}`);
      
      // Convert to ledger format with running balance
      let runningBalance = 0;
      const ledgerData: LedgerEntry[] = filteredEntries.map((entry, index) => {
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
          user: entry.staff,
          entryTime: entry.entry_time,
          approved: entry.approved,
          balance: balance,
          runningBalance: runningBalance,
        };
      });
      
      setLedgerEntries(ledgerData);
      setTotalEntries(ledgerData.length);
      
      if (ledgerData.length === 0) {
        toast.success(`No entries found for the selected filters`);
      } else {
        toast.success(`Found ${ledgerData.length} entries matching your filters`);
      }
    } catch (error) {
      console.error('Error loading filtered data:', error);
      toast.error('Failed to load filtered data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      fromDate: '2016-10-31',
      toDate: format(new Date(), 'yyyy-MM-dd'),
      companyName: '',
      mainAccount: '',
      subAccount: '',
      staffwise: '',
      creditAmount: '',
      debitAmount: '',
      betweenDates: true,
      paymentMode: '',
    });
    setSearchTerm('');
    // Reset accounts and sub-accounts to initial state
    setAccounts([{ value: '', label: 'Select a company first' }]);
    setSubAccounts([{ value: '', label: 'Select a company first' }]);
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
    const exportData = filteredEntries.map((entry, index) => ({
      'S.No': index + 1,
      Date: entry.date,
      Company: entry.companyName,
      'Main Account': entry.accountName,
      'Sub Account': entry.subAccount || '',
      Particulars: entry.particulars,
      Credit: entry.credit,
      Debit: entry.debit,
      Balance: entry.balance,
      Staff: entry.staff,
      'Payment Mode': entry.payment_mode || 'Cash',
      User: entry.user,
      'Entry Time': entry.entryTime,
      // Status removed per requirement
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      ),
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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Detailed Ledger</h1>
          <p className='text-gray-600'>
            Comprehensive ledger analysis with advanced filtering
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='secondary'
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button variant='secondary' onClick={loadLedgerData}>
            Refresh
          </Button>
          <Button variant='secondary' onClick={exportToExcel}>
            Export Excel
          </Button>
          <Button variant='secondary' onClick={debugCompanyData}>
            Debug BVR/BVT
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
          <div className='space-y-6'>
            {/* Date Range Section */}
            <div className='bg-white p-4 rounded-lg border border-gray-200'>
              <div className='flex items-center gap-2 mb-4'>
                <input
                  type='checkbox'
                  id='betweenDates'
                  checked={filters.betweenDates}
                  onChange={e =>
                    handleFilterChange('betweenDates', e.target.checked)
                  }
                  className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                />
                <label
                  htmlFor='betweenDates'
                  className='text-sm font-medium text-gray-700'
                >
                  Between Dates
                </label>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    From
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={fromDateInput}
                      onChange={e => {
                        const v = e.target.value;
                        setFromDateInput(v);
                        const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                        if (m) {
                          const [, dd, mm, yyyy] = m;
                          handleFilterChange('fromDate', `${yyyy}-${mm}-${dd}`);
                        }
                      }}
                      disabled={!filters.betweenDates}
                      placeholder='dd/MM/yyyy'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                      type='button'
                      onClick={() => {
                        const el = fromPickerRef.current as any;
                        if (el && typeof el.showPicker === 'function') {
                          el.showPicker();
                        } else {
                          fromPickerRef.current?.click();
                        }
                      }}
                      className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded'
                    >
                      <Calendar className='w-4 h-4 text-gray-500' />
                    </button>
                    <input
                      ref={fromPickerRef}
                      type='date'
                      value={filters.fromDate}
                      onChange={e => {
                        const iso = e.target.value;
                        handleFilterChange('fromDate', iso);
                        try { setFromDateInput(format(new Date(iso), 'dd/MM/yyyy')); } catch {}
                      }}
                      className='absolute left-0 top-0 w-0 h-0 opacity-0'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    To
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={toDateInput}
                      onChange={e => {
                        const v = e.target.value;
                        setToDateInput(v);
                        const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                        if (m) {
                          const [, dd, mm, yyyy] = m;
                          handleFilterChange('toDate', `${yyyy}-${mm}-${dd}`);
                        }
                      }}
                      disabled={!filters.betweenDates}
                      placeholder='dd/MM/yyyy'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                      type='button'
                      onClick={() => {
                        const el = toPickerRef.current as any;
                        if (el && typeof el.showPicker === 'function') {
                          el.showPicker();
                        } else {
                          toPickerRef.current?.click();
                        }
                      }}
                      className='absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded'
                    >
                      <Calendar className='w-4 h-4 text-gray-500' />
                    </button>
                    <input
                      ref={toPickerRef}
                      type='date'
                      value={filters.toDate}
                      onChange={e => {
                        const iso = e.target.value;
                        handleFilterChange('toDate', iso);
                        try { setToDateInput(format(new Date(iso), 'dd/MM/yyyy')); } catch {}
                      }}
                      className='absolute left-0 top-0 w-0 h-0 opacity-0'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Filters */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <SearchableSelect
                label='Company Name'
                value={filters.companyName}
                onChange={value => handleFilterChange('companyName', value)}
                options={companies}
                placeholder='Search company...'
              />

              <SearchableSelect
                label='Main Account'
                value={filters.mainAccount}
                onChange={value => handleFilterChange('mainAccount', value)}
                options={accounts}
                disabled={!filters.companyName}
                placeholder={
                  !filters.companyName
                    ? 'Select a company first'
                    : 'Search main account...'
                }
              />

              <SearchableSelect
                label='Sub Account'
                value={filters.subAccount}
                onChange={value => handleFilterChange('subAccount', value)}
                options={subAccounts}
                disabled={!filters.mainAccount}
                placeholder={
                  !filters.mainAccount
                    ? 'Select a main account first'
                    : 'Search sub account...'
                }
              />

              <SearchableSelect
                label='Staffwise'
                value={filters.staffwise}
                onChange={value => handleFilterChange('staffwise', value)}
                options={staffList}
                placeholder='Search staff...'
              />
            </div>

            {/* Filtering guidance removed as requested */}

            {/* Amount Filters + Payment Mode */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Credit Amount (Search)
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  value={filters.creditAmount || ''}
                  onChange={e => handleFilterChange('creditAmount', e.target.value)}
                  placeholder='Enter credit amount to search...'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Debit Amount (Search)
                </label>
                <input
                  type='text'
                  inputMode='decimal'
                  value={filters.debitAmount || ''}
                  onChange={e => handleFilterChange('debitAmount', e.target.value)}
                  placeholder='Enter debit amount to search...'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Payment Mode
                </label>
                <select
                  value={filters.paymentMode || ''}
                  onChange={e => handleFilterChange('paymentMode', e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All</option>
                  <option value='Cash'>Cash</option>
                  <option value='Bank Transfer'>Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-3'>
              <Button
                onClick={getRecords}
                className='bg-green-600 hover:bg-green-700'
              >
                Get Record (Client-side)
              </Button>

              <Button
                onClick={loadFilteredData}
                className='bg-blue-600 hover:bg-blue-700'
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load Filtered Data (Server-side)'}
              </Button>

              <Button variant='secondary' onClick={resetFilters}>
                Reset
              </Button>

              <Button variant='secondary' onClick={() => setShowFilters(false)}>
                Close
              </Button>

              <Button variant='secondary' onClick={printReport}>
                Print
              </Button>

              <Button variant='secondary' onClick={printAll}>
                Print All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <Card className='bg-gray-50'>
        <div className='flex items-center gap-4'>
          <div className='relative flex-1'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search in ledger entries...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div className='text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border'>
            <strong>{filteredEntries.length}</strong> records found
            {totalEntries > 0 && (
              <span className='text-xs text-gray-500 ml-2'>
                (of {totalEntries} total)
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='bg-gradient-to-r from-green-500 to-green-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100 text-sm font-medium'>Total Credit</p>
              <p className='text-2xl font-bold'>
                ₹{summary.totalCredit.toLocaleString()}
              </p>
            </div>
            <TrendingUp className='w-8 h-8 text-green-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-red-500 to-red-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-100 text-sm font-medium'>Total Debit</p>
              <p className='text-2xl font-bold'>
                ₹{summary.totalDebit.toLocaleString()}
              </p>
            </div>
            <TrendingDown className='w-8 h-8 text-red-200' />
          </div>
        </Card>

        <Card
          className={`bg-gradient-to-r ${
            summary.balance >= 0
              ? 'from-blue-500 to-blue-600'
              : 'from-orange-500 to-orange-600'
          } text-white`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100 text-sm font-medium'>Balance</p>
              <p className='text-2xl font-bold'>
                ₹{Math.abs(summary.balance).toLocaleString()}
                {summary.balance >= 0 ? ' CR' : ' DR'}
              </p>
            </div>
            <BarChart3 className='w-8 h-8 text-blue-200' />
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card
        title='Detailed Ledger Entries'
        subtitle={`Showing ${filteredEntries.length} entries${totalEntries > 0 ? ` (of ${totalEntries} total)` : ''}`}
      >
        {loading ? (
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-2 text-gray-600'>Loading ledger data...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            No entries found matching your criteria.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs table-fixed'>
              <thead className='sticky top-0 bg-gray-50 z-10'>
                <tr className='border-b border-gray-200'>
                  <th className='w-6 px-1 py-1 text-left font-medium text-gray-700'>
                    S.No
                  </th>
                  <th className='w-12 px-1 py-1 text-left font-medium text-gray-700'>
                    Date
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Company
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Account
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Sub Account
                  </th>
                  <th className='w-32 px-1 py-1 text-left font-medium text-gray-700'>
                    Particulars
                  </th>
                  <th className='w-16 px-1 py-1 text-right font-medium text-gray-700'>
                    Credit
                  </th>
                  <th className='w-16 px-1 py-1 text-right font-medium text-gray-700'>
                    Debit
                  </th>
                  <th className='w-16 px-1 py-1 text-center font-medium text-gray-700'>
                    Sale Qty
                  </th>
                  <th className='w-16 px-1 py-1 text-center font-medium text-gray-700'>
                    Purchase Qty
                  </th>
                  
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Staff
                  </th>
                  <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                    Payment Mode
                  </th>
                  <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                    User
                  </th>
                  <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                    Entry Time
                  </th>
                  
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className='w-6 px-1 py-1 font-medium text-xs'>{index + 1}</td>
                    <td className='w-12 px-1 py-1 text-xs'>
                      {format(new Date(entry.date), 'dd/MM/yyyy')}
                    </td>
                    <td className='w-20 px-1 py-1 font-medium text-blue-600 text-xs truncate' title={entry.companyName}>
                      {entry.companyName}
                    </td>
                    <td className='w-20 px-1 py-1 text-xs truncate' title={entry.accountName}>
                      {entry.accountName}
                    </td>
                    <td className='w-20 px-1 py-1 text-xs truncate' title={entry.subAccount}>
                      {entry.subAccount || '-'}
                    </td>
                    <td
                      className='w-32 px-1 py-1 text-xs truncate'
                      title={entry.particulars}
                    >
                      {entry.particulars}
                    </td>
                    <td className='w-16 px-1 py-1 text-right font-medium text-green-600 text-xs'>
                      {entry.credit > 0
                        ? `₹${entry.credit.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-right font-medium text-red-600 text-xs'>
                      {entry.debit > 0
                        ? `₹${entry.debit.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-center text-xs'>
                      {entry.saleQuantity > 0 ? entry.saleQuantity.toLocaleString() : '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-center text-xs'>
                      {entry.purchaseQuantity > 0 ? entry.purchaseQuantity.toLocaleString() : '-'}
                    </td>
                    
                    <td className='w-20 px-1 py-1 text-xs truncate' title={entry.staff}>
                      {entry.staff}
                    </td>
                    <td className='w-16 px-1 py-1 text-xs truncate' title={entry.payment_mode}>
                      {entry.payment_mode || '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-xs truncate' title={entry.user}>
                      {entry.user}
                    </td>
                    <td className='w-16 px-1 py-1 text-xs'>
                      {format(new Date(entry.entryTime), 'HH:mm:ss')}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Footer */}
            <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border'>
              <div className='bg-green-100 p-3 rounded-lg'>
                <div className='text-sm font-medium text-green-800'>
                  Total Credit:
                </div>
                <div className='text-lg font-bold text-green-900'>
                  ₹{summary.totalCredit.toLocaleString()}
                </div>
              </div>
              <div className='bg-red-100 p-3 rounded-lg'>
                <div className='text-sm font-medium text-red-800'>
                  Total Debit:
                </div>
                <div className='text-lg font-bold text-red-900'>
                  ₹{summary.totalDebit.toLocaleString()}
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  summary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'
                  }`}
                >
                  Balance:
                </div>
                <div
                  className={`text-lg font-bold ${
                    summary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'
                  }`}
                >
                  ₹{Math.abs(summary.balance).toLocaleString()}
                  {summary.balance >= 0 ? ' CR' : ' DR'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Progress Indicator */}
        {isLoadingAll && loadingProgress.total > 0 && (
          <div className='text-center py-4'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto'>
              <div className='text-sm text-blue-800 mb-2'>{loadingProgress.message}</div>
              <div className='w-full bg-blue-200 rounded-full h-2 mb-2'>
                <div 
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className='text-xs text-blue-600'>
                {loadingProgress.current.toLocaleString()} / {loadingProgress.total.toLocaleString()} records
              </div>
            </div>
          </div>
        )}

        {/* Load More and Load All Buttons */}
        <div className='text-center py-4 space-x-4'>
          {ledgerEntries.length < totalEntries && (
            <Button
              onClick={loadMoreEntries}
              disabled={isLoadingMore || isLoadingAll}
              variant='secondary'
              icon={isLoadingMore ? RefreshCw : Plus}
              className='min-w-[200px]'
            >
              {isLoadingMore ? 'Loading...' : `Load More (${totalEntries - ledgerEntries.length} remaining)`}
            </Button>
          )}
          
          {ledgerEntries.length < totalEntries && (
            <Button
              onClick={loadAllEntries}
              disabled={isLoadingMore || isLoadingAll}
              variant='primary'
              icon={isLoadingAll ? RefreshCw : Database}
              className='min-w-[200px]'
            >
              {isLoadingAll ? 'Loading All...' : `Load All ${totalEntries} Records`}
            </Button>
          )}
        </div>
        
        {/* Pagination Info */}
        {totalEntries > 0 && (
          <div className='text-center text-sm text-gray-600 py-2'>
            Showing {ledgerEntries.length} of {totalEntries} entries
          </div>
        )}
      </Card>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold'>
                  Print Preview - Detailed Ledger
                </h3>
                <div className='flex items-center gap-2'>
                  <Button size='sm' onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={() => setShowPrintPreview(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Print Content */}
              <div className='print:block'>
                <div className='text-center mb-6'>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    Thirumala Group
                  </h1>
                  <h2 className='text-lg font-semibold text-gray-700'>
                    Detailed Ledger Report
                  </h2>
                  <p className='text-gray-600'>
                    From {format(new Date(filters.fromDate), 'MMM dd, yyyy')} to{' '}
                    {format(new Date(filters.toDate), 'MMM dd, yyyy')}
                  </p>
                  {filters.companyName && (
                    <p className='text-gray-600'>
                      Company: {filters.companyName}
                    </p>
                  )}
                  {filters.mainAccount && (
                    <p className='text-gray-600'>
                      Account: {filters.mainAccount}
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className='grid grid-cols-2 gap-4 mb-6 text-sm'>
                  <div className='text-center p-3 border border-gray-300'>
                    <div className='font-medium'>Total Credit</div>
                    <div className='text-lg font-bold'>
                      ₹{summary.totalCredit.toLocaleString()}
                    </div>
                  </div>
                  <div className='text-center p-3 border border-gray-300'>
                    <div className='font-medium'>Total Debit</div>
                    <div className='text-lg font-bold'>
                      ₹{summary.totalDebit.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <table className='w-full text-xs border-collapse border border-gray-300'>
                  <thead>
                    <tr className='bg-gray-100'>
                      <th className='border border-gray-300 px-2 py-1 text-left'>
                        S.No
                      </th>
                      <th className='border border-gray-300 px-2 py-1 text-left'>
                        Date
                      </th>
                      <th className='border border-gray-300 px-2 py-1 text-left font-bold'>
                        Company
                      </th>
                      <th className='border border-gray-300 px-2 py-1 text-left'>
                        Account
                      </th>
                      <th className='border border-gray-300 px-2 py-1 text-left'>
                        Particulars
                      </th>
                      <th className='border border-gray-300 px-2 py-1 text-right'>
                        Credit
                      </th>
                      <th className='border border-gray-300 px-2 py-1 text-right'>
                        Debit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td className='border border-gray-300 px-2 py-1'>
                          {index + 1}
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>
                          {format(new Date(entry.date), 'dd-MMM-yy')}
                        </td>
                        <td className='border border-gray-300 px-2 py-1 font-bold'>
                          {entry.companyName}
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>
                          {entry.accountName}
                        </td>
                        <td className='border border-gray-300 px-2 py-1'>
                          {entry.particulars}
                        </td>
                        <td className='border border-gray-300 px-2 py-1 text-right'>
                          {entry.credit > 0
                            ? entry.credit.toLocaleString()
                            : '-'}
                        </td>
                        <td className='border border-gray-300 px-2 py-1 text-right'>
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className='mt-6 text-center text-xs text-gray-500'>
                  Generated on {format(new Date(), 'MMM dd, yyyy HH:mm:ss')} by{' '}
                  {user?.username}
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
