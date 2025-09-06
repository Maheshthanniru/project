import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Calendar,
  Building,
  FileText,
  User,
  Calculator,
  Lock,
  Unlock,
  Edit,
  History,
  RefreshCw,
  Plus,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface EditHistory {
  id: string;
  entryId: string;
  action: string;
  userId: string;
  timestamp: string;
  sno?: number;
  editedBy?: string;
  editedAt?: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  oldValues?: any;
  newValues?: any;
}

const EditEntry: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entriesForSelectedDate, setEntriesForSelectedDate] = useState<any[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Performance optimization states
  const [pageSize] = useState(1000); // Show 1000 entries per page for better data visibility
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });
  
  // Add filter state variables (moved before memoized filtering)
  const [filterCompanyName, setFilterCompanyName] = useState('');
  const [filterAccountName, setFilterAccountName] = useState('');
  const [filterSubAccountName, setFilterSubAccountName] = useState('');
  const [filterParticulars, setFilterParticulars] = useState('');
  const [filterSaleQ, setFilterSaleQ] = useState('');
  const [filterPurchaseQ, setFilterPurchaseQ] = useState('');
  
  // Memoized filtered entries for better performance
  // Note: Company/Account filters are handled in loadFilteredEntries, not here
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    // Apply date filter from calendar selection (priority over other date filters)
    if (selectedDateFilter) {
      filtered = filtered.filter(entry => {
        if (entry.c_date) {
          const entryDate = format(new Date(entry.c_date), 'yyyy-MM-dd');
          return entryDate === selectedDateFilter;
        }
        return false;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(
        entry =>
          entry.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.acc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (dateFilter && !selectedDateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.c_date);
        return entryDate.toDateString() === filterDate.toDateString();
      });
    }
    
    if (statusFilter) {
      if (statusFilter === 'locked') {
        filtered = filtered.filter(entry => entry.lock_record);
      } else if (statusFilter === 'unlocked') {
        filtered = filtered.filter(entry => !entry.lock_record);
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(entry => entry.approved);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(entry => !entry.approved);
      }
    }
    
    // Company/Account filters are handled in loadFilteredEntries function
    // to ensure we load from all 67k records, not just the initially loaded subset
    
    return filtered;
  }, [entries, selectedDateFilter, searchTerm, dateFilter, statusFilter]);
  
  const [showHistory, setShowHistory] = useState(false);
  const [entryHistory] = useState<EditHistory[]>([]);

  // Form data for editing
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  // Add dropdown data for edit form
  const [particularsOptions, setParticularsOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // New state for dependent dropdowns
  const [distinctAccountNames, setDistinctAccountNames] = useState<
    { value: string; label: string }[]
  >([]);
  const [dependentSubAccounts, setDependentSubAccounts] = useState<
    { value: string; label: string }[]
  >([]);
  const [dependentParticulars, setDependentParticulars] = useState<
    { value: string; label: string }[]
  >([]);

  const [filterCredit, setFilterCredit] = useState('');
  const [filterDebit, setFilterDebit] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterDate, setFilterDate] = useState('');


  useEffect(() => {
    const initializeData = async () => {
      console.log('🔄 Initializing EditEntry data...');
      await loadEntries();
      await loadDropdownData();
    };

    initializeData();
  }, []); // Remove dependencies to prevent re-initialization on filter changes

  // Separate useEffect for filter changes
  useEffect(() => {
    console.log('🔄 Filters changed, reloading entries...');
    loadEntries();
  }, [searchTerm, dateFilter, statusFilter]);

  // Separate useEffect for company/account filters - these need to load filtered data
  useEffect(() => {
    if (filterCompanyName || filterAccountName || filterSubAccountName) {
      console.log('🔄 Company/Account filters changed, loading filtered data...');
      loadFilteredEntries();
    } else {
      console.log('🔄 No company/account filters, loading all entries...');
      loadEntries();
    }
  }, [filterCompanyName, filterAccountName, filterSubAccountName]);

  // Note: Removed useEffect hooks for company-based account loading
  // Now using global cash_book data for dependent dropdowns


  const loadDropdownData = async () => {
    try {
      console.log('🔄 Loading dropdown data...');
      
      // Load ALL companies from companies table (primary source)
      console.log('🏢 Loading ALL companies from companies table...');
      
      // Get count first
      const companiesCount = await supabaseDB.getCompaniesCount();
      console.log('📊 Total companies in companies table:', companiesCount);
      
      const companies = await supabaseDB.getCompanies();
      console.log('🏢 Raw companies from companies table:', companies.length);
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      console.log('🏢 Companies loaded from companies table:', companiesData.length);
      console.log('🏢 Company names from companies table:', companiesData.map(c => c.label));
      
      // Verify we got all companies
      if (companiesData.length !== companiesCount) {
        console.warn(`⚠️ Warning: Expected ${companiesCount} companies but got ${companiesData.length}`);
      }
      
      setCompanies(companiesData);
      
      // Also log cash_book companies for comparison
      const { data: cashBookCompanyData, error: cashBookError } = await supabase
        .from('cash_book')
        .select('company_name')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '')
        .limit(10000);
      
      if (!cashBookError && cashBookCompanyData) {
        const uniqueCashBookCompanies = [...new Set(cashBookCompanyData.map(item => item.company_name).filter(name => name && name.trim() !== ''))];
        console.log('📊 Companies with data in cash_book:', uniqueCashBookCompanies.length);
        console.log('📊 Cash_book company names:', uniqueCashBookCompanies);
      }

      const users = await supabaseDB.getUsers();
      console.log('👥 Users loaded:', users.length);
      const usersData = users
        .filter(u => u.is_active)
        .map(user => ({
          value: user.username,
          label: user.username,
        }));
      setUsers(usersData);

      // Load all account names initially for display
      await loadDistinctAccountNames();

      // Load unique values for dropdowns
      const uniqueParticulars = await supabaseDB.getUniqueParticulars();
      console.log('📝 Particulars loaded:', uniqueParticulars.length);
      const particularsData = uniqueParticulars.map(particular => ({
        value: particular,
        label: particular,
      }));
      setParticularsOptions(particularsData);

      // Note: Sale quantity, purchase quantity, credit amount, and debit amount options
      // are not currently used in the UI, so we skip loading them for performance
      
      console.log('✅ All dropdown data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  // Note: Removed loadAccountsByCompany and loadSubAccountsByAccount functions
  // Now using loadDistinctAccountNames and loadDependentSubAccounts for real cash_book data

  // New functions for dependent dropdowns
  const loadDistinctAccountNames = async () => {
    try {
      const accountNames = await supabaseDB.getDistinctAccountNames();
      const accountNamesData = accountNames.map(name => ({
        value: name,
        label: name,
      }));
      setDistinctAccountNames(accountNamesData);
    } catch (error) {
      console.error('Error loading distinct account names:', error);
      toast.error('Failed to load account names');
    }
  };

  // Company-based filtering functions
  const loadAccountNamesByCompany = async (companyName: string) => {
    try {
      const accountNames = await supabaseDB.getDistinctAccountNamesByCompany(companyName);
      const accountNamesData = accountNames.map(name => ({
        value: name,
        label: name,
      }));
      setDistinctAccountNames(accountNamesData);
    } catch (error) {
      console.error('Error loading account names by company:', error);
      toast.error('Failed to load account names');
    }
  };

  const loadDependentSubAccounts = async (accountName: string) => {
    try {
      const subAccountNames = await supabaseDB.getSubAccountsByAccountName(accountName);
      const subAccountNamesData = subAccountNames.map(name => ({
        value: name,
        label: name,
      }));
      setDependentSubAccounts(subAccountNamesData);
    } catch (error) {
      console.error('Error loading dependent sub accounts:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const loadSubAccountsByAccountAndCompany = async (accountName: string, companyName: string) => {
    try {
      const subAccountNames = await supabaseDB.getSubAccountsByAccountAndCompany(accountName, companyName);
      const subAccountNamesData = subAccountNames.map(name => ({
        value: name,
        label: name,
      }));
      setDependentSubAccounts(subAccountNamesData);
    } catch (error) {
      console.error('Error loading sub accounts by account and company:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const loadDependentParticulars = async (accountName: string, subAccountName: string) => {
    try {
      const particulars = await supabaseDB.getParticularsBySubAccount(accountName, subAccountName);
      const particularsData = particulars.map(name => ({
        value: name,
        label: name,
      }));
      setDependentParticulars(particularsData);
    } catch (error) {
      console.error('Error loading dependent particulars:', error);
      toast.error('Failed to load particulars');
    }
  };

  const loadEntries = async () => {
    try {
      console.log('🔍 Loading entries from database...');

      // First, try direct Supabase query to check if RLS is blocking access
      const { data: directData, error: directError } = await supabase
        .from('cash_book')
        .select('*')
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (directError) {
        console.error('❌ Direct Supabase query failed:', directError);
        toast.error('Database access failed: ' + directError.message);

        // Check if it's an RLS issue
        if (
          directError.message.includes('permission') ||
          directError.message.includes('policy')
        ) {
          toast.error(
            'RLS policies are blocking access. Please disable RLS in Supabase dashboard.'
          );
        }
        return;
      }

      console.log(
        '✅ Direct Supabase query successful, found',
        directData?.length || 0,
        'entries'
      );

      // Load first page (1000 entries) for better data visibility
      let allEntries = await supabaseDB.getCashBookEntries(pageSize, 0);
      console.log('✅ Initial entries fetched:', allEntries.length);
      
      // Get total count for pagination info
      const { count } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact', head: true });
      console.log('📊 Total entries in database:', count);
      setTotalEntries(count || 0);

      // Apply search filter
      if (searchTerm) {
        allEntries = allEntries.filter(
          entry =>
            entry.particulars
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            entry.acc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply date filter
      if (dateFilter) {
        allEntries = allEntries.filter(entry => entry.c_date === dateFilter);
      }

      // Apply status filter
      if (statusFilter) {
        switch (statusFilter) {
          case 'approved':
            allEntries = allEntries.filter(entry => entry.approved);
            break;
          case 'pending':
            allEntries = allEntries.filter(entry => !entry.approved);
            break;
          case 'edited':
            allEntries = allEntries.filter(entry => entry.edited);
            break;
          case 'locked':
            // TODO: Implement locked filter when Supabase schema supports it
            allEntries = allEntries.filter(() => false);
            break;
        }
      }

      // Apply new filters
      if (filterCompanyName) {
        allEntries = allEntries.filter(
          entry =>
            entry.company_name &&
            entry.company_name
              .toLowerCase()
              .includes(filterCompanyName.toLowerCase())
        );
      }
      if (filterAccountName) {
        allEntries = allEntries.filter(
          entry =>
            entry.acc_name &&
            entry.acc_name
              .toLowerCase()
              .includes(filterAccountName.toLowerCase())
        );
      }
      if (filterSubAccountName) {
        allEntries = allEntries.filter(
          entry =>
            entry.sub_acc_name &&
            entry.sub_acc_name
              .toLowerCase()
              .includes(filterSubAccountName.toLowerCase())
        );
      }
      if (filterParticulars) {
        allEntries = allEntries.filter(
          entry =>
            entry.particulars &&
            entry.particulars
              .toLowerCase()
              .includes(filterParticulars.toLowerCase())
        );
      }
      if (filterSaleQ) {
        allEntries = allEntries.filter(
          entry => String(entry.sale_qty || '') === filterSaleQ
        );
      }
      if (filterPurchaseQ) {
        allEntries = allEntries.filter(
          entry => String(entry.purchase_qty || '') === filterPurchaseQ
        );
      }
      if (filterCredit) {
        allEntries = allEntries.filter(
          entry => String(entry.credit || '') === filterCredit
        );
      }
      if (filterDebit) {
        allEntries = allEntries.filter(
          entry => String(entry.debit || '') === filterDebit
        );
      }
      if (filterStaff) {
        allEntries = allEntries.filter(
          entry =>
            entry.staff &&
            entry.staff.toLowerCase().includes(filterStaff.toLowerCase())
        );
      }
      if (filterDate) {
        allEntries = allEntries.filter(entry => entry.c_date === filterDate);
      }

      console.log('✅ Final filtered entries:', allEntries.length);
      setEntries(allEntries);
      setSelectedDateFilter(''); // Clear date filter when loading all entries

      if (allEntries.length === 0) {
        toast.success('No entries found in database');
      } else {
        toast.success(`Loaded ${allEntries.length} entries (showing first ${pageSize} of ${count || 0})`);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error(
        'Failed to load entries: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const loadMoreEntries = useCallback(async () => {
    if (isLoadingMore || entries.length >= totalEntries) return;
    
    try {
      setIsLoadingMore(true);
      
      // If company/account filters are active, load more filtered entries with pagination
      if (filterCompanyName || filterAccountName || filterSubAccountName) {
        console.log('🔄 Company/Account filters active, loading more filtered entries...');
        
        try {
          setLoading(true);
          console.log('🔄 Loading more filtered entries with pagination...');
          console.log('🔍 Filters:', { filterCompanyName, filterAccountName, filterSubAccountName });
          console.log('🔍 Current entries:', entries.length, 'Total available:', totalEntries);
          
          // Load next batch of filtered entries
          const result = await supabaseDB.getFilteredCashBookEntries({
            companyName: filterCompanyName || undefined,
            accountName: filterAccountName || undefined,
            subAccountName: filterSubAccountName || undefined,
          }, pageSize, entries.length);
          
          console.log(`📊 More filtered entries loaded: ${result.data.length}`);
          
          // Append new entries to existing ones
          setEntries(prevEntries => [...prevEntries, ...result.data]);
          setTotalEntries(result.total);
          
          if (result.data.length === 0) {
            toast.success(`No more entries found for the selected filters`);
          } else {
            toast.success(`Loaded ${result.data.length} more entries (${entries.length + result.data.length} of ${result.total} total from 67k records)`);
          }
        } catch (error) {
          console.error('Error loading more filtered entries:', error);
          toast.error('Failed to load more filtered entries: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // Otherwise, use normal pagination for global data
      const nextPage = Math.floor(entries.length / pageSize) + 1;
      const offset = entries.length;
      
      console.log(`🔄 Loading more entries - Page: ${nextPage}, Offset: ${offset}`);
      
      const moreEntries = await supabaseDB.getCashBookEntries(pageSize, offset);
      console.log(`✅ Loaded ${moreEntries.length} more entries`);
      
      setEntries(prev => [...prev, ...moreEntries]);
      
      if (moreEntries.length === 0) {
        toast.success('No more entries to load');
      }
    } catch (error) {
      console.error('Error loading more entries:', error);
      toast.error('Failed to load more entries');
    } finally {
      setIsLoadingMore(false);
    }
  }, [entries.length, totalEntries, pageSize, isLoadingMore, filterCompanyName, filterAccountName, filterSubAccountName]);

  const loadAllEntries = useCallback(async () => {
    try {
      setIsLoadingAll(true);
      setLoadingProgress({ current: 0, total: 0, message: 'Starting to load all entries...' });
      // If company/account filters are active, load all filtered entries
      if (filterCompanyName || filterAccountName || filterSubAccountName) {
        console.log('🔄 Loading ALL filtered entries...');
        setLoadingProgress({ current: 0, total: 0, message: `Loading all entries for ${filterCompanyName || 'selected filters'}...` });
        
        try {
          setLoading(true);
          console.log('🔄 Loading all filtered entries with server-side filtering...');
          console.log('🔍 Filters:', { filterCompanyName, filterAccountName, filterSubAccountName });
          
          // Use getAllFilteredCashBookEntries to load all at once for filtered data
          const filteredEntries = await supabaseDB.getAllFilteredCashBookEntries({
            companyName: filterCompanyName || undefined,
            accountName: filterAccountName || undefined,
            subAccountName: filterSubAccountName || undefined,
          });
          
          console.log(`📊 All filtered entries loaded: ${filteredEntries.length}`);
          
          setEntries(filteredEntries);
          setTotalEntries(filteredEntries.length);
          
          if (filteredEntries.length === 0) {
            toast.success(`No entries found for the selected filters`);
          } else {
            toast.success(`Loaded all ${filteredEntries.length} entries matching your filters from 67k records`);
          }
        } catch (error) {
          console.error('Error loading all filtered entries:', error);
          toast.error('Failed to load filtered entries: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // Otherwise, load all global entries
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
      
      setEntries(allEntries);
      setTotalEntries(allEntries.length);
      setLoadingProgress({ current: allEntries.length, total: totalCount, message: 'Loading complete!' });
      
      toast.success(`Loaded ALL ${allEntries.length} entries successfully`);
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
  }, [filterCompanyName, filterAccountName, filterSubAccountName]);

  const loadFilteredEntries = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading filtered entries with pagination...');
      console.log('🔍 Filters:', { filterCompanyName, filterAccountName, filterSubAccountName });
      console.log('🔍 About to call getFilteredCashBookEntries with company:', filterCompanyName);
      
      // Use paginated server-side filtering (load first 1000 entries)
      const result = await supabaseDB.getFilteredCashBookEntries({
        companyName: filterCompanyName || undefined,
        accountName: filterAccountName || undefined,
        subAccountName: filterSubAccountName || undefined,
      }, pageSize, 0);
      
      console.log(`📊 Filtered entries loaded: ${result.data.length} of ${result.total} total`);
      console.log('📊 First few entries:', result.data.slice(0, 3).map(e => ({ 
        id: e.id, 
        company: e.company_name, 
        date: e.c_date 
      })));
      
      setEntries(result.data);
      setTotalEntries(result.total);
      
      if (result.data.length === 0) {
        toast.success(`No entries found for the selected filters`);
      } else {
        toast.success(`Found ${result.total} entries matching your filters from all 67k records`);
      }
    } catch (error) {
      console.error('Error loading filtered entries:', error);
      toast.error('Failed to load filtered entries: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filterCompanyName, filterAccountName, filterSubAccountName, pageSize]);



  // Debug function to test RLS and data access
  const testDataAccess = async () => {
    try {
      console.log('🔍 Testing data access in EditEntry...');

      // Test direct access
      const { data, error } = await supabase.from('cash_book').select('count');

      if (error) {
        console.error('❌ Data access test failed:', error);
        toast.error('Data access test failed: ' + error.message);
      } else {
        console.log('✅ Data access test successful, count:', data);
        toast.success('Data access test successful! Count: ' + data);
      }

      // Test RLS status
      const { data: rlsStatus, error: rlsError } =
        await supabase.rpc('check_rls_status');

      if (rlsError) {
        console.log('❌ RLS status check failed:', rlsError);
      } else {
        console.log('📊 RLS Status:', rlsStatus);
        const tablesWithRLS =
          rlsStatus?.filter((table: any) => table.rls_enabled) || [];
        if (tablesWithRLS.length > 0) {
          toast.error(
            `${tablesWithRLS.length} tables have RLS enabled. Please disable RLS.`
          );
        } else {
          toast.success('No RLS policies are blocking access');
        }
      }
    } catch (error) {
      console.error('💥 Data access test error:', error);
      toast.error(
        'Data access test error: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const handleEdit = async (entry: any) => {
    // TODO: Implement locked check when Supabase schema supports it
    setSelectedEntry({ ...entry });
    setEditMode(true);
    setEntriesForSelectedDate([]); // Clear multiple entries selection
    
    // Set filter values to match the selected entry to prevent useEffect from clearing data
    setFilterCompanyName(entry.company_name || '');
    setFilterAccountName(entry.acc_name || '');
    
    // Load company-specific account names
    if (entry.company_name) {
      await loadAccountNamesByCompany(entry.company_name);
    }
    
    // Load dependent dropdown data for the selected entry
    if (entry.acc_name && entry.company_name) {
      await loadSubAccountsByAccountAndCompany(entry.acc_name, entry.company_name);
    } else if (entry.acc_name) {
      await loadDependentSubAccounts(entry.acc_name);
    }
    
    if (entry.acc_name && entry.sub_acc_name) {
      await loadDependentParticulars(entry.acc_name, entry.sub_acc_name);
    }
  };

  const handleSave = async () => {
    if (!selectedEntry) return;

    setLoading(true);
    try {
      // If the entry was approved or rejected, set it to pending on edit
      const updates = { ...selectedEntry };
      if (
        selectedEntry.approved === 'true' ||
        selectedEntry.approved === 'false'
      ) {
        updates.approved = '';
      }
      const updatedEntry = await supabaseDB.updateCashBookEntry(
        selectedEntry.id,
        updates,
        user?.username || 'admin'
      );
      if (updatedEntry) {
        await loadEntries();
        setEditMode(false);
        setSelectedEntry(null);
        toast.success('Entry updated successfully!');
      } else {
        toast.error('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry: any) => {
    if (!isAdmin) {
      toast.error('Only admins can delete entries');
      return;
    }

    // TODO: Implement locked check when Supabase schema supports it

    if (
      window.confirm(`Are you sure you want to delete entry #${entry.sno}?`)
    ) {
      try {
        console.log(
          'Attempting to delete entry:',
          entry.id,
          'by user:',
          user?.username
        );
        const success = await supabaseDB.deleteCashBookEntry(
          entry.id,
          user?.username || 'admin'
        );
        console.log('Delete result:', success);
        if (success) {
          await loadEntries();
          toast.success('Entry deleted successfully!');
        } else {
          toast.error('Failed to delete entry - check console for details');
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error(
          `Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setSelectedEntry(null);
    setEntriesForSelectedDate([]); // Clear multiple entries selection
    setSelectedDateFilter(''); // Clear date filter
    // Clear dependent dropdowns
    setDependentSubAccounts([]);
    setDependentParticulars([]);
    // Reset filter values
    setFilterCompanyName('');
    setFilterAccountName('');
  };

  const handleInputChange = async (field: string, value: any) => {
    setSelectedEntry((prev: any) => ({
      ...prev,
      [field]: value,
    }));

    // Load dependent dropdowns
    if (field === 'company_name') {
      setFilterCompanyName(value);
      setFilterAccountName('');
      setSelectedEntry((prev: any) => ({
        ...prev,
        acc_name: '',
        sub_acc_name: '',
        particulars: '',
      }));
      // Load account names for the selected company
      if (value) {
        await loadAccountNamesByCompany(value);
      } else {
        // If no company selected, load all account names
        await loadDistinctAccountNames();
      }
      // Clear dependent dropdowns
      setDependentSubAccounts([]);
      setDependentParticulars([]);
    }
    if (field === 'acc_name') {
      setFilterAccountName(value);
      setSelectedEntry((prev: any) => ({ 
        ...prev, 
        sub_acc_name: '',
        particulars: '',
      }));
      // Load sub accounts for the selected account and company
      if (value && selectedEntry.company_name) {
        await loadSubAccountsByAccountAndCompany(value, selectedEntry.company_name);
      } else {
        // Fallback to global sub accounts if no company
        await loadDependentSubAccounts(value);
      }
      setDependentParticulars([]);
    }
    if (field === 'sub_acc_name') {
      setSelectedEntry((prev: any) => ({ 
        ...prev, 
        particulars: '',
      }));
      // Load dependent particulars
      if (selectedEntry.acc_name && value) {
        await loadDependentParticulars(selectedEntry.acc_name, value);
      }
    }
  };

  // Get dates that have entries - Enhanced with better error handling
  const getDatesWithEntries = useMemo(() => {
    const datesWithEntries = new Set<string>();
    entries.forEach(entry => {
      if (entry.c_date) {
        try {
          // Handle different date formats and ensure proper parsing
          const entryDate = new Date(entry.c_date);
          if (!isNaN(entryDate.getTime())) {
            const dateStr = format(entryDate, 'yyyy-MM-dd');
            datesWithEntries.add(dateStr);
          }
        } catch (error) {
          console.warn('Invalid date format for entry:', entry.c_date, error);
        }
      }
    });
    
    // Debug: Log dates with entries for verification
    if (datesWithEntries.size > 0) {
      console.log('Calendar: Dates with entries:', Array.from(datesWithEntries).sort());
    }
    
    return datesWithEntries;
  }, [entries]);

  // Custom Calendar Component
  const CustomCalendar = ({ onDateSelect, selectedDate, onClose }: {
    onDateSelect: (date: string) => void;
    selectedDate: string;
    onClose: () => void;
  }) => {
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else {
          newDate.setMonth(newDate.getMonth() + 1);
        }
        return newDate;
      });
    };

    const handleDateClick = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      onDateSelect(dateStr);
      onClose();
    };

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-sm">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isCurrentMonth = date.getMonth() === month;
            const isToday = dateStr === format(today, 'yyyy-MM-dd');
            const isSelected = dateStr === selectedDate;
            const hasEntries = getDatesWithEntries.has(dateStr);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  relative p-2 text-xs rounded hover:bg-blue-100 transition-colors
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${isToday ? 'bg-blue-200 font-bold' : ''}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                `}
              >
                {date.getDate()}
                {hasEntries && (
                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full opacity-80 shadow-sm"></div>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-80 shadow-sm"></div>
            <span>Has entries</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const toggleLock = async (entry: any) => {
    if (!isAdmin) {
      toast.error('Only admins can lock/unlock records');
      return;
    }
    try {
      let result;
      if (entry.locked || entry.lock_record) {
        result = await supabaseDB.unlockEntry(
          entry.id,
          user?.username || 'admin'
        );
      } else {
        result = await supabaseDB.lockEntry(
          entry.id,
          user?.username || 'admin'
        );
      }
      if (result) {
        await loadEntries();
        toast.success(
          `Entry ${entry.locked || entry.lock_record ? 'unlocked' : 'locked'} successfully!`
        );
      } else {
        toast.error('Failed to update lock status');
      }
    } catch (error) {
      toast.error('Error updating lock status');
    }
  };


  const exportData = async (
    exportFormat: 'json' | 'excel' | 'pdf' | 'csv' = 'json'
  ) => {
    try {
      await supabaseDB.exportData();

      if (exportFormat === 'excel' || exportFormat === 'csv') {
        // Export to Excel/CSV - use the current filtered entries instead of all data
        const currentEntries =
          entries.length > 0 ? entries : await supabaseDB.getAllCashBookEntries();

        // Debug: Log first entry to see date format
        if (currentEntries.length > 0) {
          console.log('Sample entry date format:', {
            c_date: currentEntries[0].c_date,
            type: typeof currentEntries[0].c_date,
            entry_time: currentEntries[0].entry_time,
          });
        }

        const exportData = currentEntries.map((entry: any) => {
          // Format date properly for Excel
          let formattedDate = '';
          if (entry.c_date) {
            try {
              // Handle different date formats
              if (typeof entry.c_date === 'string') {
                if (entry.c_date.includes('-')) {
                  // YYYY-MM-DD format
                  const [year, month, day] = entry.c_date.split('-');
                  formattedDate = `${day}/${month}/${year}`;
                } else if (entry.c_date.includes('/')) {
                  // Already in DD/MM/YYYY format
                  formattedDate = entry.c_date;
                } else {
                  // Try to parse as Date object
                  const date = new Date(entry.c_date);
                  if (!isNaN(date.getTime())) {
                    formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                  } else {
                    formattedDate = entry.c_date;
                  }
                }
              } else if (entry.c_date instanceof Date) {
                // Date object
                formattedDate = `${entry.c_date.getDate().toString().padStart(2, '0')}/${(entry.c_date.getMonth() + 1).toString().padStart(2, '0')}/${entry.c_date.getFullYear()}`;
              } else {
                formattedDate = String(entry.c_date);
              }
            } catch (error) {
              console.error('Error formatting date:', error, entry.c_date);
              formattedDate = String(entry.c_date || '');
            }
          }

          // Format entry time if available
          let formattedEntryTime = '';
          if (entry.entry_time) {
            try {
              if (typeof entry.entry_time === 'string') {
                // If it's already formatted, use as is
                if (entry.entry_time.includes(':')) {
                  formattedEntryTime = entry.entry_time;
                } else {
                  // Try to parse and format
                  const time = new Date(entry.entry_time);
                  if (!isNaN(time.getTime())) {
                    formattedEntryTime = time.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                  } else {
                    formattedEntryTime = entry.entry_time;
                  }
                }
              } else {
                formattedEntryTime = String(entry.entry_time);
              }
            } catch (error) {
              formattedEntryTime = String(entry.entry_time || '');
            }
          }

          return {
            'S.No': entry.sno || '',
            Date: formattedDate,
            Company: entry.company_name || '',
            'Main Account': entry.acc_name || '',
            'Sub Account': entry.sub_acc_name || '',
            Particulars: entry.particulars || '',
            Credit: entry.credit || 0,
            Debit: entry.debit || 0,
            'Sale Qty': entry.sale_qty || 0,
            'Purchase Qty': entry.purchase_qty || 0,
            Staff: entry.staff || '',
            User: entry.users || '',
            'Entry Time': formattedEntryTime,
            Approved: entry.approved ? 'Yes' : 'No',
            Edited: entry.edited ? 'Yes' : 'No',
          };
        });

        if (exportData.length === 0) {
          toast.error('No data to export');
          return;
        }

        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(','),
          ...exportData.map((row: any) =>
            headers
              .map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes
                const escapedValue = String(value).replace(/"/g, '""');
                return `"${escapedValue}"`;
              })
              .join(',')
          ),
        ].join('\n');

        // Add BOM for Excel to properly recognize UTF-8 and date formats
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        const blob = new Blob([csvWithBOM], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thirumala-entries-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${exportFormat.toUpperCase()} export completed!`);
      } else if (exportFormat === 'pdf') {
        // Export to PDF - use the current filtered entries
        const currentEntries =
          entries.length > 0 ? entries : await supabaseDB.getAllCashBookEntries();

        if (currentEntries.length === 0) {
          toast.error('No data to export');
          return;
        }

        const jsPDF = await import('jspdf');
        const doc = new jsPDF.default();

        // Add title
        doc.setFontSize(16);
        doc.text('Thirumala Group - Cash Book Entries', 20, 20);
        doc.setFontSize(12);
        doc.text(
          `Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          20,
          30
        );
        doc.text(`Total Entries: ${currentEntries.length}`, 20, 40);

        let yPosition = 60;

        // Add cash book entries
        doc.setFontSize(14);
        doc.text('Cash Book Entries', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(8);
        const headers = [
          'S.No',
          'Date',
          'Company',
          'Account',
          'Particulars',
          'Credit',
          'Debit',
        ];
        let xPosition = 20;

        // Add headers
        headers.forEach(header => {
          doc.text(header, xPosition, yPosition);
          xPosition += 25;
        });
        yPosition += 5;

        // Add data (limited to fit on page)
        currentEntries.slice(0, 25).forEach((entry: any) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          xPosition = 20;
          doc.text(String(entry.sno || ''), xPosition, yPosition);
          xPosition += 25;
          doc.text(String(entry.c_date || ''), xPosition, yPosition);
          xPosition += 25;
          doc.text(
            String(entry.company_name || '').substring(0, 12),
            xPosition,
            yPosition
          );
          xPosition += 25;
          doc.text(
            String(entry.acc_name || '').substring(0, 12),
            xPosition,
            yPosition
          );
          xPosition += 25;
          doc.text(
            String(entry.particulars || '').substring(0, 15),
            xPosition,
            yPosition
          );
          xPosition += 25;
          doc.text(String(entry.credit || ''), xPosition, yPosition);
          xPosition += 25;
          doc.text(String(entry.debit || ''), xPosition, yPosition);

          yPosition += 5;
        });

        // Add summary
        if (yPosition < 200) {
          yPosition += 10;
          doc.setFontSize(10);
          doc.text('Summary:', 20, yPosition);
          yPosition += 5;
          doc.setFontSize(8);
          const totalCredit = currentEntries.reduce(
            (sum, entry) => sum + (entry.credit || 0),
            0
          );
          const totalDebit = currentEntries.reduce(
            (sum, entry) => sum + (entry.debit || 0),
            0
          );
          doc.text(
            `Total Credit: ₹${totalCredit.toLocaleString()}`,
            25,
            yPosition
          );
          yPosition += 4;
          doc.text(
            `Total Debit: ₹${totalDebit.toLocaleString()}`,
            25,
            yPosition
          );
          yPosition += 4;
          doc.text(
            `Balance: ₹${(totalCredit - totalDebit).toLocaleString()}`,
            25,
            yPosition
          );
        }

        doc.save(
          `thirumala-entries-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`
        );
        toast.success('PDF export completed!');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-600 bg-green-100';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-100';
      case 'DELETE':
        return 'text-red-600 bg-red-100';
      case 'LOCK':
        return 'text-orange-600 bg-orange-100';
      case 'UNLOCK':
        return 'text-yellow-600 bg-yellow-100';
      case 'APPROVE':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'edited', label: 'Edited' },
    { value: 'locked', label: 'Locked' },
  ];

  // Print voucher for an entry
  function printVoucher(entry: any) {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Voucher - Thirumala Group</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .voucher-header { text-align: center; margin-bottom: 32px; }
            .voucher-title { font-size: 2rem; font-weight: bold; color: #2d3748; }
            .voucher-section { margin-bottom: 16px; }
            .voucher-label { font-weight: bold; color: #374151; min-width: 120px; display: inline-block; }
            .voucher-value { color: #1a202c; }
            .voucher-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            .voucher-table th, .voucher-table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
            .voucher-table th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="voucher-header">
            <div class="voucher-title">Thirumala Group</div>
            <div style="font-size:1.2rem; color:#4b5563; margin-top:8px;">Voucher</div>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Voucher No:</span>
            <span class="voucher-value">${entry.sno}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Date:</span>
            <span class="voucher-value">${entry.c_date ? new Date(entry.c_date).toLocaleDateString() : ''}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Company:</span>
            <span class="voucher-value">${entry.company_name}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Main Account:</span>
            <span class="voucher-value">${entry.acc_name}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Sub Account:</span>
            <span class="voucher-value">${entry.sub_acc_name || '-'}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Particulars:</span>
            <span class="voucher-value">${entry.particulars}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Credit:</span>
            <span class="voucher-value">₹${entry.credit?.toLocaleString?.() ?? entry.credit}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Debit:</span>
            <span class="voucher-value">₹${entry.debit?.toLocaleString?.() ?? entry.debit}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Sale Quantity:</span>
            <span class="voucher-value">${entry.sale_qty ?? '-'}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Purchase Quantity:</span>
            <span class="voucher-value">${entry.purchase_qty ?? '-'}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Staff:</span>
            <span class="voucher-value">${entry.staff}</span>
          </div>
          <div class="voucher-section">
            <span class="voucher-label">Status:</span>
            <span class="voucher-value">${entry.approved ? 'Approved' : 'Pending'}</span>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  return (
    <div className='min-h-screen flex flex-col w-full max-w-full'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Edit Form</h1>
          <p className='text-gray-600'>
            , edit, and manage cash book entries with complete history tracking
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='secondary' onClick={testDataAccess}>
            Test Data Access
          </Button>
          <Button
            variant='secondary'
            onClick={() => {
              const format = window.prompt(
                'Enter export format (csv or pdf):',
                'csv'
              );
              if (format === 'csv' || format === 'pdf') {
                exportData(format);
              } else if (format !== null) {
                toast.error('Invalid format. Please enter "csv" or "pdf"');
              }
            }}
          >
            Export
          </Button>
          <Button
            variant='secondary'
            onClick={async () => {
              await loadEntries();
              toast.success('Data refreshed!');
            }}
          >
            Refresh
          </Button>
        </div>
      </div>


      {/* Search and Filter */}
      <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-6 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full'>
          {/* Date - First */}
          <div className='col-span-1'>
            <Input
              label='Date'
              type='date'
              value={filterDate}
              onChange={setFilterDate}
            />
          </div>
          {/* Company Name - Second */}
          <div className='col-span-1'>
            <Select
              label='Company Name'
              value={filterCompanyName}
              onChange={async (value) => {
                setFilterCompanyName(value);
                setFilterAccountName('');
                setFilterSubAccountName('');
                // Load account names for the selected company
                if (value) {
                  await loadAccountNamesByCompany(value);
                } else {
                  // If no company selected, load all account names
                  await loadDistinctAccountNames();
                }
                // Clear dependent dropdowns
                setDependentSubAccounts([]);
                setDependentParticulars([]);
              }}
              options={companies}
              placeholder='Select company...'
            />
          </div>
          
          {/* Account Name - Third */}
          <div className='col-span-1'>
            <Select
              label='Account Name'
              value={filterAccountName}
              onChange={async (value) => {
                setFilterAccountName(value);
                setFilterSubAccountName('');
                // Load sub accounts for the selected account and company
                if (value && filterCompanyName) {
                  await loadSubAccountsByAccountAndCompany(value, filterCompanyName);
                } else if (value) {
                  // Fallback to global sub accounts if no company
                  await loadDependentSubAccounts(value);
                } else {
                  // Clear sub accounts if no account selected
                  setDependentSubAccounts([]);
                }
                setDependentParticulars([]);
              }}
              options={distinctAccountNames}
              placeholder='Select account...'
            />
          </div>
          
          {/* Sub Account - Fourth */}
          <div className='col-span-1'>
            <Select
              label='Sub Account'
              value={filterSubAccountName}
              onChange={async (value) => {
                setFilterSubAccountName(value);
                // Load particulars for the selected account and sub account
                if (value && filterAccountName) {
                  await loadDependentParticulars(filterAccountName, value);
                } else {
                  // Clear particulars if no sub account selected
                  setDependentParticulars([]);
                }
              }}
              options={dependentSubAccounts}
              placeholder='Select sub account...'
            />
          </div>
          
          {/* Staff - Fifth */}
          <div className='col-span-1'>
            <Select
              label='Staff'
              value={filterStaff}
              onChange={setFilterStaff}
              options={users}
              placeholder='Select staff...'
            />
          </div>
          
          {/* Particulars */}
          <div className='col-span-1'>
            <Select
              label='Particulars'
              value={filterParticulars}
              onChange={setFilterParticulars}
              options={particularsOptions}
              placeholder='Select particulars...'
            />
          </div>
          
          {/* Credit */}
          <div className='col-span-1'>
            <Input
              label='Credit'
              type='number'
              value={filterCredit}
              onChange={setFilterCredit}
              placeholder='Enter credit amount'
            />
          </div>
          
          {/* Debit */}
          <div className='col-span-1'>
            <Input
              label='Debit'
              type='number'
              value={filterDebit}
              onChange={setFilterDebit}
              placeholder='Enter debit amount'
            />
          </div>
          
          {/* Remaining fields */}
          <div className='col-span-1'>
            <Input
              label='Search'
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder='Search entries...'
            />
          </div>
          <div className='col-span-1'>
            <Select
              label='Status Filter'
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </div>
          <div className='col-span-1 flex items-end'>
            <Button
              onClick={async () => {
                setSearchTerm('');
                setDateFilter('');
                setStatusFilter('');
                setFilterCompanyName('');
                setFilterAccountName('');
                setFilterSubAccountName('');
                setFilterParticulars('');
                setFilterSaleQ('');
                setFilterPurchaseQ('');
                setFilterCredit('');
                setFilterDebit('');
                setFilterStaff('');
                setFilterDate('');
                setSelectedDateFilter(''); // Clear calendar date filter
                setEntriesForSelectedDate([]); // Clear multiple entries selection
                // Clear dependent dropdowns and reload all account names
                setDependentSubAccounts([]);
                setDependentParticulars([]);
                await loadDistinctAccountNames();
                // Reload all entries since filters are cleared
                await loadEntries();
              }}
              variant='secondary'
              className='w-full'
            >
              Clear Filters
            </Button>
          </div>
          <div className='col-span-1 flex items-end'>
            <div className='text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 w-full text-center'>
              <strong>{filteredEntries.length}</strong> entries found
              {selectedDateFilter && (
                <div className='text-xs text-blue-600 mt-1'>
                  Filtered by: {format(new Date(selectedDateFilter), 'dd-MMM-yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className='mt-4 flex gap-2'>
          <Button
            size='sm'
            variant='secondary'
            icon={RefreshCw}
            onClick={async () => {
              console.log('🔄 Refreshing company names...');
              await loadDropdownData();
              toast.success('Company names refreshed');
            }}
          >
            Refresh Companies
          </Button>
        </div>
      </Card>

      {/* Entries List - Improved Card Layout */}
      <Card
        title='Cash Book Entries'
        subtitle={`Manage and edit your transaction records`}
        className='p-6 mb-6 w-full'
      >
        <div className='space-y-4 w-full overflow-x-auto'>
          {loading ? (
            // Loading skeleton
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='border rounded-xl shadow-md px-4 py-3 bg-gray-50 animate-pulse'>
                  <div className='flex flex-wrap items-center gap-4'>
                    <div className='h-4 bg-gray-300 rounded w-16'></div>
                    <div className='h-4 bg-gray-300 rounded w-24'></div>
                    <div className='h-4 bg-gray-300 rounded w-32'></div>
                    <div className='h-4 bg-gray-300 rounded w-28'></div>
                    <div className='h-4 bg-gray-300 rounded w-36'></div>
                    <div className='h-4 bg-gray-300 rounded w-40'></div>
                    <div className='h-4 bg-gray-300 rounded w-20'></div>
                    <div className='h-4 bg-gray-300 rounded w-20'></div>
                    <div className='h-4 bg-gray-300 rounded w-24'></div>
                    <div className='h-4 bg-gray-300 rounded w-32'></div>
                    <div className='h-4 bg-gray-300 rounded w-24'></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              No entries found matching your criteria.
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                className={`group border rounded-xl shadow-md px-4 py-3 transition-shadow hover:shadow-lg bg-white relative min-w-full ${entry.lock_record ? 'opacity-80 bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}`}
                style={{ cursor: 'pointer' }}
              >
                {/* Horizontal layout - elements arranged side by side */}
                <div className='flex flex-wrap items-center gap-4'>
                  {/* S.No */}
                  <span className='font-bold text-blue-700 min-w-[60px]'>
                    #{entry.sno}
                  </span>
                  
                  {/* Date */}
                  <span className='text-sm text-gray-600 min-w-[120px]'>
                    <Calendar className='w-4 h-4 inline mr-1' />
                    {format(new Date(entry.c_date), 'MMM dd, yyyy')}
                  </span>
                  
                  {/* Company */}
                  <span
                    className='font-bold text-blue-900 bg-blue-50 rounded px-2 py-1 text-sm min-w-[150px]'
                    title={entry.company_name}
                  >
                    <Building className='w-4 h-4 mr-1 inline' />
                    {entry.company_name}
                  </span>
                  
                  {/* Account */}
                  <span
                    className='font-semibold text-indigo-900 bg-indigo-50 rounded px-2 py-1 text-sm min-w-[150px]'
                    title={entry.acc_name}
                  >
                    <FileText className='w-4 h-4 mr-1 inline' />
                    {entry.acc_name}
                  </span>
                  
                  {/* Sub Account */}
                  <span
                    className='font-semibold text-purple-900 bg-purple-50 rounded px-2 py-1 text-sm min-w-[150px]'
                    title={entry.sub_acc_name}
                  >
                    <User className='w-4 h-4 mr-1 inline' />
                    {entry.sub_acc_name}
                  </span>
                  
                  {/* Particulars */}
                  <span
                    className='text-gray-800 font-medium max-w-[200px] truncate text-sm min-w-[150px]'
                    title={entry.particulars}
                  >
                    {entry.particulars}
                  </span>
                  
                  {/* Credit Amount */}
                  <span className='text-green-700 font-semibold text-sm min-w-[100px]'>
                    <Calculator className='w-4 h-4 inline mr-1' />
                    ₹{entry.credit.toLocaleString()}
                  </span>
                  
                  {/* Debit Amount */}
                  <span className='text-red-700 font-semibold text-sm min-w-[100px]'>
                    <Calculator className='w-4 h-4 inline mr-1' />
                    ₹{entry.debit.toLocaleString()}
                  </span>
                  
                  {/* Staff */}
                  <span className='text-sm text-gray-700 min-w-[100px]'>{entry.staff}</span>
                  
                  {/* Status badges */}
                  <div className='flex flex-wrap gap-1 min-w-[200px]'>
                    {entry.lock_record && (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                        <Lock className='w-3 h-3 mr-1' />
                        Locked
                      </span>
                    )}
                    {entry.edited && (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                        Edited ({entry.editCount}x)
                      </span>
                    )}
                    {entry.approved ? (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                        Approved
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800'>
                        Pending
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className='flex flex-wrap gap-2 min-w-[200px]'>
                    {isAdmin && (
                      <Button
                        size='sm'
                        variant='secondary'
                        icon={entry.lock_record ? Unlock : Lock}
                        onClick={() => {
                          toggleLock(entry);
                        }}
                      >
                        {entry.lock_record ? 'Unlock' : 'Lock'}
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => printVoucher(entry)}
                    >
                      Voucher
                    </Button>
                    <Button
                      size='sm'
                      icon={Edit}
                      onClick={() => {
                        handleEdit(entry);
                      }}
                      disabled={entry.lock_record && !isAdmin}
                    >
                      <span className='sr-only'>Edit</span>
                    </Button>
                    {isAdmin && (
                      <Button
                        size='sm'
                        variant='danger'
                        onClick={() => {
                          handleDelete(entry);
                        }}
                        disabled={entry.lock_record}
                      >
                        <span className='sr-only'>Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
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
            {/* Debug info */}
            <div className='text-xs text-gray-500 mb-2'>
              Debug: entries.length={entries.length}, totalEntries={totalEntries}, showButtons={entries.length < totalEntries}
              {filterCompanyName && <div>Company Filter: {filterCompanyName}</div>}
            </div>
            
            
            {/* Show Load More button if we have more entries to load */}
            {entries.length < totalEntries && (
              <Button
                onClick={loadMoreEntries}
                disabled={isLoadingMore || isLoadingAll}
                variant='secondary'
                icon={isLoadingMore ? RefreshCw : Plus}
                className='min-w-[200px]'
              >
                {isLoadingMore ? 'Loading...' : 
                  filterCompanyName ? 
                    `Load More (${totalEntries - entries.length} remaining for ${filterCompanyName})` : 
                    `Load More (${totalEntries - entries.length} remaining)`
                }
              </Button>
            )}
            
            {/* Show message if all entries are loaded */}
            {totalEntries > 0 && entries.length >= totalEntries && (
              <div className='text-green-600 font-medium'>
                ✅ All {totalEntries} entries loaded successfully!
                {filterCompanyName && <div className='text-sm'>for {filterCompanyName}</div>}
              </div>
            )}
            
          </div>
          
          {/* Pagination Info */}
          {totalEntries > 0 && (
            <div className='text-center text-sm text-gray-600 py-2'>
              Showing {entries.length} of {totalEntries} entries
              {filterCompanyName && <div className='text-xs text-blue-600'>for {filterCompanyName}</div>}
            </div>
          )}
        </div>
      </Card>

      {/* History Modal */}
      {showHistory && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <History className='w-5 h-5' />
                  Entry History
                </h3>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </Button>
              </div>

              <div className='space-y-4'>
                {entryHistory.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    No history found for this entry.
                  </div>
                ) : (
                  entryHistory.map(history => (
                    <div
                      key={history.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(history.action)}`}
                          >
                            {history.action}
                          </span>
                          <span className='font-medium text-gray-900'>
                            by {history.editedBy}
                          </span>
                        </div>
                        <div className='text-sm text-gray-500'>
                          {history.editedAt
                            ? format(
                                new Date(history.editedAt),
                                'MMM dd, yyyy HH:mm:ss'
                              )
                            : 'Unknown time'}
                        </div>
                      </div>

                      {history.changes && history.changes.length > 0 && (
                        <div className='space-y-2'>
                          <h5 className='font-medium text-gray-700'>
                            Changes Made:
                          </h5>
                          {history.changes.map((change, index) => (
                            <div
                              key={index}
                              className='bg-gray-50 p-3 rounded text-sm'
                            >
                              <div className='font-medium text-gray-700 mb-1'>
                                {change.field}:
                              </div>
                              <div className='flex items-center gap-2'>
                                <span className='text-red-600 bg-red-100 px-2 py-1 rounded'>
                                  {String(change.oldValue)}
                                </span>
                                <span>→</span>
                                <span className='text-green-600 bg-green-100 px-2 py-1 rounded'>
                                  {String(change.newValue)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Entries for Selected Date */}
      {entriesForSelectedDate.length > 1 && (
        <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <h4 className='text-sm font-semibold text-blue-800 mb-2'>
            Multiple Entries for {selectedEntry?.c_date ? format(new Date(selectedEntry.c_date), 'dd-MMM-yyyy') : 'Selected Date'}
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
            {entriesForSelectedDate.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={`p-2 text-xs rounded border text-left transition-colors ${
                  selectedEntry?.id === entry.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100'
                }`}
              >
                <div className='font-medium'>Entry #{entry.sno}</div>
                <div className='text-gray-500'>{entry.company_name}</div>
                <div className='text-gray-500'>{entry.acc_name}</div>
                {entry.credit > 0 && <div className='text-green-600'>Credit: ₹{entry.credit}</div>}
                {entry.debit > 0 && <div className='text-red-600'>Debit: ₹{entry.debit}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal - Fixed Layout with Proper Spacing */}
      {selectedEntry && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col shadow-lg'>
            {/* Header */}
            <div className='p-6 border-b border-gray-200 flex-shrink-0'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  {editMode ? 'Edit Entry' : 'View Entry'} #{selectedEntry.sno}
                </h3>
                <div className='flex items-center gap-2'>
                  {!editMode && !selectedEntry.lock_record && (
                    <Button
                      size='sm'
                      icon={Edit}
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button size='sm' variant='secondary' onClick={handleCancel}>
                    Close
                  </Button>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className='flex-1 p-1'>
              <div className='w-full max-w-7xl mx-auto'>
                <Card className='p-1 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg'>
                  <form className='space-y-1 text-xs'>
                    {/* Basic Information - Reordered */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1'>
                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={selectedEntry?.c_date ? format(new Date(selectedEntry.c_date), 'dd-MMM-yyyy') : ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Select date..."
                          />
                          <button
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            disabled={selectedEntry?.lock_record}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Calendar className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        {showCalendar && (
                          <CustomCalendar
                            onDateSelect={(date) => {
                              if (editMode) {
                                handleInputChange('c_date', date);
                              } else {
                                // In view mode, filter entries by selected date
                                setSelectedDateFilter(date);
                                
                                const entriesForDate = entries.filter(entry => {
                                  if (entry.c_date) {
                                    const entryDate = format(new Date(entry.c_date), 'yyyy-MM-dd');
                                    return entryDate === date;
                                  }
                                  return false;
                                });
                                
                                setEntriesForSelectedDate(entriesForDate);
                                
                                if (entriesForDate.length > 0) {
                                  // Show the first entry for that date
                                  setSelectedEntry(entriesForDate[0]);
                                  toast.success(`Found ${entriesForDate.length} entries for ${format(new Date(date), 'dd-MMM-yyyy')}. Showing filtered results.`);
                                } else {
                                  // No entries for this date, show a message
                                  toast(`No entries found for ${format(new Date(date), 'dd-MMM-yyyy')}`);
                                }
                              }
                              setShowCalendar(false);
                            }}
                            selectedDate={selectedEntry?.c_date || ''}
                            onClose={() => setShowCalendar(false)}
                          />
                        )}
                      </div>
                      <Select
                        label='Company Name'
                        value={selectedEntry?.company_name || ''}
                        onChange={value => editMode ? handleInputChange('company_name', value) : undefined}
                        options={companies}
                        disabled={!editMode || selectedEntry?.lock_record}
                      />
                      <Select
                        label='Main Account'
                        value={selectedEntry?.acc_name || ''}
                        onChange={value => editMode ? handleInputChange('acc_name', value) : undefined}
                        options={distinctAccountNames}
                        disabled={!editMode || selectedEntry?.lock_record}
                        placeholder='Select account...'
                      />
                      <Select
                        label='Sub Account'
                        value={selectedEntry?.sub_acc_name || ''}
                        onChange={value => editMode ? handleInputChange('sub_acc_name', value) : undefined}
                        options={dependentSubAccounts}
                        disabled={!editMode || selectedEntry?.lock_record || !selectedEntry?.acc_name}
                        placeholder='Select sub account...'
                      />
                      <Select
                        label='Staff'
                        value={selectedEntry?.staff || ''}
                        onChange={value => editMode ? handleInputChange('staff', value) : undefined}
                        options={users}
                        disabled={!editMode || selectedEntry?.lock_record}
                      />
                    </div>

                    {/* Particulars */}
                    <Input
                      label='Particulars'
                      value={selectedEntry?.particulars || ''}
                      onChange={value => editMode ? handleInputChange('particulars', value) : undefined}
                      placeholder='Enter transaction details...'
                      disabled={!editMode || selectedEntry?.lock_record}
                    />

                    {/* Amounts */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-1'>
                      <Input
                        label='Credit'
                        value={selectedEntry?.credit || ''}
                        onChange={val =>
                          editMode ? handleInputChange('credit', parseFloat(val) || 0) : undefined
                        }
                        placeholder='Enter credit amount...'
                        disabled={!editMode || selectedEntry?.lock_record}
                        className={
                          (selectedEntry?.credit || 0) > 0
                            ? 'border-green-300 bg-green-50'
                            : ''
                        }
                      />
                      <Input
                        label='Debit'
                        value={selectedEntry?.debit || ''}
                        onChange={val =>
                          editMode ? handleInputChange('debit', parseFloat(val) || 0) : undefined
                        }
                        placeholder='Enter debit amount...'
                        disabled={!editMode || selectedEntry?.lock_record}
                        className={
                          (selectedEntry?.debit || 0) > 0 ? 'border-red-300 bg-red-50' : ''
                        }
                      />
                    </div>

                    {/* Quantity Details */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-1'>
                      <Input
                        label='Sale Quantity'
                        type='number'
                        value={selectedEntry?.sale_qty || ''}
                        onChange={val =>
                          editMode ? handleInputChange('sale_qty', parseFloat(val) || 0) : undefined
                        }
                        placeholder='Enter sale quantity...'
                        disabled={!editMode || selectedEntry?.lock_record}
                      />
                      <Input
                        label='Purchase Quantity'
                        type='number'
                        value={selectedEntry?.purchase_qty || ''}
                        onChange={val =>
                          editMode ? handleInputChange('purchase_qty', parseFloat(val) || 0) : undefined
                        }
                        placeholder='Enter purchase quantity...'
                        disabled={!editMode || selectedEntry?.lock_record}
                      />
                    </div>
                  </form>
                </Card>
              </div>
            </div>

            {/* Entry Metadata */}
            <div className='bg-gray-50 p-4 rounded-lg mt-8'>
                <h4 className='font-medium text-gray-900 mb-3'>
                  Entry Information
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Entry Time:
                    </span>
                    <div>
                      {selectedEntry?.entry_time ? format(
                        new Date(selectedEntry.entry_time),
                        'MMM dd, yyyy HH:mm:ss'
                      ) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Created By:
                    </span>
                    <div>{selectedEntry?.users || 'N/A'}</div>
                  </div>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Edit Count:
                    </span>
                    <div>{selectedEntry?.e_count || 0}</div>
                  </div>
                </div>
                {selectedEntry?.edited && (
                  <div className='mt-2 text-sm'>
                    <span className='font-medium text-gray-700'>
                      Last Edited:
                    </span>
                    <div>
                      on{' '}
                      {format(
                        new Date(selectedEntry.updated_at),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </div>
                  </div>
                )}
              </div>

            {/* Footer - Fixed at Bottom */}
            {editMode && (
              <div className='p-6 border-t border-gray-200 bg-white flex-shrink-0'>
                <div className='flex gap-4'>
                  <Button
                    onClick={handleSave}
                    disabled={!editMode || selectedEntry.lock_record || loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant='secondary' onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEntry;
