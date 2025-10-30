import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import SearchableSelect from '../components/UI/SearchableSelect';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Search, Calendar } from 'lucide-react';

interface DailyReportData {
  entries: any[];
  totalCredit: number;
  totalDebit: number;
  openingBalance: number;
  closingBalance: number;
  grandTotal: number;
  companyBalances: { [key: string]: number };
}

const DailyReport: React.FC = () => {
  const { user } = useAuth();
  // Persisted initial date for stable mount; avoid calling helper before it's defined
  const initialPersistedDate = ((): string => {
    const saved = localStorage.getItem('dailyReportDate');
    return saved || format(new Date(), 'yyyy-MM-dd');
  })();
  const [selectedDate, setSelectedDate] = useState(initialPersistedDate);
  const [displayDate, setDisplayDate] = useState(() => {
    const [y, m, d] = initialPersistedDate.split('-');
    return `${d}/${m}/${y}`;
  });
  const [selectedCompany, setSelectedCompany] = useState(
    () => localStorage.getItem('dailyReportCompany') || ''
  );
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('dailyReportSearch') || '');
  const [reportData, setReportData] = useState<DailyReportData>({
    entries: [],
    totalCredit: 0,
    totalDebit: 0,
    openingBalance: 0,
    closingBalance: 0,
    grandTotal: 0,
    companyBalances: {},
  });
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showCompanyBalances, setShowCompanyBalances] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Data loading states
  const [totalEntries, setTotalEntries] = useState(0);
  const [allLoadedEntries, setAllLoadedEntries] = useState<any[]>([]);

  // Helper functions for date format conversion
  const convertToInternalFormat = (ddMMyyyy: string): string => {
    if (!ddMMyyyy) return '';
    const [day, month, year] = ddMMyyyy.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const convertToDisplayFormat = (yyyyMMdd: string): string => {
    if (!yyyyMMdd) return '';
    const [year, month, day] = yyyyMMdd.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDatePickerChange = async (dateValue: string) => {
    if (dateValue) {
      setSelectedDate(dateValue);
      setDisplayDate(convertToDisplayFormat(dateValue));
      // Don't clear company selection - allow multiple filters
      // Load companies for the new date
      await loadCompaniesByDate(dateValue);
    }
  };

  // Load base companies once on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Re-generate report when any filter changes
  useEffect(() => {
    generateReport();
  }, [selectedDate, selectedCompany, searchTerm]);

  // Persist filters so the page does not jump back to today automatically
  useEffect(() => {
    if (selectedDate) localStorage.setItem('dailyReportDate', selectedDate);
  }, [selectedDate]);
  useEffect(() => {
    localStorage.setItem('dailyReportCompany', selectedCompany || '');
  }, [selectedCompany]);
  useEffect(() => {
    localStorage.setItem('dailyReportSearch', searchTerm || '');
  }, [searchTerm]);


  // useEffect to load companies when date changes
  useEffect(() => {
    if (selectedDate) {
      console.log('🔄 Date changed, loading companies for date:', selectedDate);
      loadCompaniesByDate(selectedDate);
    }
  }, [selectedDate]);

  const loadCompanies = async () => {
    try {
      const companies = await supabaseDB.getCompaniesWithData();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const loadCompaniesByDate = async (date: string) => {
    try {
      console.log('🔍 Loading companies for date:', date);
      
      // Don't clear company selection - allow multiple filters
      
      // Get all entries for the specific date
      const { data, error } = await supabase
        .from('cash_book')
        .select('company_name')
        .eq('c_date', date);

      if (error) {
        console.error('Error loading companies by date:', error);
        return;
      }

      // Extract unique company names
      const uniqueCompanies = [...new Set(data.map(entry => entry.company_name).filter(Boolean))];
      
      console.log(`📊 Found ${uniqueCompanies.length} companies for date ${date}:`, uniqueCompanies);
      
      // Update companies dropdown with date-specific options (preserve selection when possible)
      const companiesData = uniqueCompanies.map(name => ({
        value: name,
        label: name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);
      // If current selection still exists in the new list, keep it
      if (selectedCompany && uniqueCompanies.includes(selectedCompany)) {
        // keep as is
      } else if (selectedCompany) {
        // previously selected company not available for this date
        setSelectedCompany('');
      }
      
      // Show toast with summary
      if (data.length > 0) {
        toast.success(`Found ${data.length} entries on ${date} with ${uniqueCompanies.length} companies: ${uniqueCompanies.join(', ')}`);
      } else {
        toast.info(`No entries found on ${date}`);
        // If no entries found, load all companies
        await loadCompanies();
      }
      
    } catch (error) {
      console.error('Error loading companies by date:', error);
      toast.error('Failed to load companies for selected date');
      // Fallback to loading all companies
      await loadCompanies();
    }
  };



  const generateReport = async () => {
    setLoading(true);
    try {
      console.log('🔄 Generating Daily Report with filters:', {
        selectedDate,
        selectedCompany,
        searchTerm
      });
      
      // Use server-side filtering for much faster performance
      const { data: entries, error } = await supabase
        .from('cash_book')
        .select('*')
        .eq('c_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries for date:', error);
        toast.error('Failed to load entries for selected date');
        return;
      }

      console.log(`✅ Loaded ${entries?.length || 0} entries for ${selectedDate}`);

      // Apply company filter
      let filteredEntries = entries || [];
      if (selectedCompany) {
        const beforeCompanyFilter = filteredEntries.length;
        filteredEntries = filteredEntries.filter(
          entry => entry.company_name === selectedCompany
        );
        console.log(`📊 Company filter: ${beforeCompanyFilter} → ${filteredEntries.length} entries`);
      }

      // Apply search filter
      if (searchTerm) {
        const beforeSearchFilter = filteredEntries.length;
        filteredEntries = filteredEntries.filter(
          entry =>
            entry.particulars
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            entry.acc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.sub_acc_name &&
              entry.sub_acc_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            entry.staff?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.log(`🔍 Search filter: ${beforeSearchFilter} → ${filteredEntries.length} entries`);
      }

      console.log(`📈 Final filtered entries: ${filteredEntries.length}`);

      // Calculate opening balance efficiently using server-side query
      const { data: previousEntries, error: prevError } = await supabase
        .from('cash_book')
        .select('credit, debit')
        .lt('c_date', selectedDate);

      if (prevError) {
        console.error('Error fetching previous entries:', prevError);
      }

      const openingBalance = (previousEntries || []).reduce(
        (sum, entry) => sum + (entry.credit - entry.debit),
        0
      );

      // Calculate totals
      const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
      const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);

      const closingBalance = openingBalance + (totalCredit - totalDebit);
      const grandTotal = totalCredit + totalDebit;

      // Calculate company-wise balances efficiently
      const companyBalances: { [key: string]: number } = {};
      const allCompanies = companies.filter(c => c.value !== '');

      allCompanies.forEach(company => {
        const companyEntries = filteredEntries.filter(
          entry => entry.company_name === company.value
        );
        const companyCredit = companyEntries.reduce(
          (sum, entry) => sum + entry.credit,
          0
        );
        const companyDebit = companyEntries.reduce(
          (sum, entry) => sum + entry.debit,
          0
        );
        companyBalances[company.value] = companyCredit - companyDebit;
      });

      setReportData({
        entries: filteredEntries,
        totalCredit,
        totalDebit,
        openingBalance,
        closingBalance,
        grandTotal,
        companyBalances,
      });

      // Update total entries count for display
      const totalCount = await supabaseDB.getCashBookEntriesCount();
      setTotalEntries(totalCount);
      setAllLoadedEntries(filteredEntries); // Store current filtered entries

      console.log(`✅ Daily Report generated for ${selectedDate}: ${filteredEntries.length} entries`);
      toast.success(`Daily Report generated: ${filteredEntries.length} entries for ${selectedDate}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = async (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate =
      direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    const newDateString = format(newDate, 'yyyy-MM-dd');
    const newDisplayDate = format(newDate, 'dd/MM/yyyy');
    setSelectedDate(newDateString);
    setDisplayDate(newDisplayDate);
    // Clear company selection when date changes
    setSelectedCompany('');
    // Load companies for the new date
    await loadCompaniesByDate(newDateString);
  };

  const printReport = async () => {
    try {
      const { printDailyReport } = await import('../utils/print');

      // Transform data to include all required fields
      const printData = reportData.entries.map(entry => ({
        sno: entry.sno,
        date: entry.c_date,
        companyName: entry.company_name,
        accountName: entry.acc_name,
        subAccount: entry.sub_acc_name || '',
        particulars: entry.particulars,
        credit: entry.credit,
        debit: entry.debit,
        staff: entry.staff,
        approved: entry.approved ? 'Approved' : 'Pending',
      }));

      printDailyReport(printData, {
        title: `Daily Report - ${displayDate}`,
        subtitle: selectedCompany
          ? `Company: ${selectedCompany}`
          : 'All Companies',
        headerText: 'Thirumala Group - Daily Transaction Report',
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Print failed. Please try again.');
    }
  };

  const exportToExcel = () => {
    const exportData = reportData.entries.map(entry => ({
      'S.No': entry.sno,
      Date: format(new Date(entry.c_date), 'dd/MM/yyyy'),
      Company: entry.company_name,
      'Main Account': entry.acc_name,
      'Sub Account': entry.sub_acc_name || '',
      Particulars: entry.particulars,
      Credit: entry.credit,
      Debit: entry.debit,
      'Sale Qty': entry.sale_qty,
      'Purchase Qty': entry.purchase_qty || 0,
      Staff: entry.staff,
      User: entry.users,
      'Entry Time': entry.entry_time,
      Approved: entry.approved ? `${entry.users || 'Unknown User'} - ${entry.entry_time ? format(new Date(entry.entry_time), 'dd/MM/yyyy HH:mm') : 'N/A'}` : 'Pending',
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
    a.download = `daily-report-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const getRowColor = (entry: any) => {
    if (!entry.approved) return 'bg-yellow-50 border-yellow-200';
    if (entry.edited) return 'bg-blue-50 border-blue-200';
    if (entry.credit > 0) return 'bg-green-50 border-green-200';
    if (entry.debit > 0) return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <div className='w-full px-4 space-y-6'>
        {/* Responsive filter bar */}
        <div className='flex flex-col md:flex-row gap-4 items-end'>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Date (dd/MM/yyyy)
            </label>
            <div className='relative'>
              <input
                type='text'
                value={displayDate}
                placeholder='dd/MM/yyyy'
                onChange={async (e) => {
                  const inputValue = e.target.value;
                  setDisplayDate(inputValue);
                  
                  // Convert to internal format for database queries
                  const internalDate = convertToInternalFormat(inputValue);
                  if (internalDate && internalDate !== '--') {
                    setSelectedDate(internalDate);
                    // Clear company selection when date changes
                    setSelectedCompany('');
                    // Load companies for the new date
                    await loadCompaniesByDate(internalDate);
                  }
                }}
                onBlur={async (e) => {
                  const inputValue = e.target.value;
                  // Validate and format the date on blur
                  if (inputValue && inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    const internalDate = convertToInternalFormat(inputValue);
                    if (internalDate && internalDate !== '--') {
                      setSelectedDate(internalDate);
                      setDisplayDate(inputValue); // Keep the formatted input
                      // Clear company selection when date changes
                      setSelectedCompany('');
                      // Load companies for the new date
                      await loadCompaniesByDate(internalDate);
                    }
                  } else if (inputValue) {
                    // If invalid format, reset to current date
                    const currentDate = format(new Date(), 'yyyy-MM-dd');
                    setSelectedDate(currentDate);
                    setDisplayDate(convertToDisplayFormat(currentDate));
                  }
                }}
                className='w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              {/* Hidden date input positioned over calendar icon */}
              <input
                id='hidden-date-input'
                type='date'
                value={selectedDate}
                onChange={(e) => handleDatePickerChange(e.target.value)}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-0 cursor-pointer'
                style={{ zIndex: 10 }}
              />
              
              {/* Calendar icon for visual reference */}
              <div className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none'>
                <Calendar className='w-5 h-5' />
              </div>
            </div>
          </div>
          <div className='flex-1'>
            <SearchableSelect
              label='Company'
              value={selectedCompany}
              onChange={value => setSelectedCompany(value)}
              options={companies}
              placeholder='Select or search company...'
            />
          </div>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Search
            </label>
            <div className='relative'>
              <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
          <div className='flex flex-row gap-2 mt-2 md:mt-0'>
            <Button 
              variant='secondary' 
              onClick={() => {
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                setDisplayDate(format(new Date(), 'dd/MM/yyyy'));
                setSelectedCompany('');
                setSearchTerm('');
                loadCompanies();
              }}
            >
              Clear Filters
            </Button>
            <Button variant='secondary' onClick={generateReport}>
              Refresh
            </Button>
            <Button variant='secondary' onClick={printReport}>
              Print
            </Button>
            <Button variant='secondary' onClick={exportToExcel}>
              Export
            </Button>
          </div>
        </div>
        
        
        {/* Responsive table/card layout */}
        <Card className='overflow-x-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
          {/* Progress Indicator */}
          {loading && (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-2 text-gray-600'>Generating Daily Report for {displayDate}...</p>
            </div>
          )}
          
          {loading ? (
            <div className='text-center text-gray-500 py-8'>Loading...</div>
          ) : reportData.entries.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>
              No entries found for this date.
            </div>
          ) : (
            <>
              <div className='mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
                <div className='text-lg font-semibold'>
                  Daily Report for {displayDate}
                </div>
                <div className='flex flex-col md:flex-row md:items-center gap-4 text-sm text-gray-600'>
                  <span>Total Entries: {reportData.entries.length}</span>
                  <span className='text-xs text-green-600 font-medium'>
                    ✓ Optimized query for {selectedDate}
                  </span>
                  <span>
                    Total Credits: ₹{reportData.totalCredit.toLocaleString()}
                  </span>
                  <span>
                    Total Debits: ₹{reportData.totalDebit.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className='flex flex-col md:flex-row gap-4 mb-6'>
                <div className='flex-1 bg-green-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-green-900 font-semibold text-sm'>
                    Total Credit:
                  </span>
                  <span className='text-2xl font-bold text-green-900'>
                    ₹{reportData.totalCredit.toLocaleString()}
                  </span>
                </div>
                <div className='flex-1 bg-red-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-red-700 font-semibold text-sm'>
                    Total Debit:
                  </span>
                  <span className='text-2xl font-bold text-red-700'>
                    ₹{reportData.totalDebit.toLocaleString()}
                  </span>
                </div>
                <div className='flex-1 bg-blue-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-blue-800 font-semibold text-sm'>
                    Balance:
                  </span>
                  <span className='text-2xl font-bold text-blue-800'>
                    ₹
                    {Math.abs(
                      reportData.totalCredit - reportData.totalDebit
                    ).toLocaleString()}{' '}
                    {reportData.totalCredit - reportData.totalDebit >= 0
                      ? 'CR'
                      : 'DR'}
                  </span>
                </div>
              </div>

              {/* Online/Offline breakdown removed */}
              <table className='w-full text-sm'>
                <thead className='bg-blue-100'>
                  <tr>
                    <th className='px-3 py-2 text-left'>S.No</th>
                    <th className='px-3 py-2 text-left'>Date</th>
                    <th className='px-3 py-2 text-left'>Company</th>
                    <th className='px-3 py-2 text-left'>Account</th>
                    <th className='px-3 py-2 text-left'>Sub Account</th>
                    <th className='px-3 py-2 text-left'>Particulars</th>
                    <th className='px-3 py-2 text-right'>Credit</th>
                    <th className='px-3 py-2 text-right'>Debit</th>
                    <th className='px-3 py-2 text-center'>Payment Mode</th>
                    <th className='px-3 py-2 text-left'>Staff</th>
                    <th className='px-3 py-2 text-left'>User</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.entries.map((entry: any, idx: number) => (
                    <tr
                      key={entry.sno}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                    >
                      <td className='px-3 py-2'>{idx + 1}</td>
                      <td className='px-3 py-2'>
                        {entry.c_date ? format(new Date(entry.c_date), 'dd/MM/yyyy') : ''}
                      </td>
                      <td className='px-3 py-2'>{entry.company_name}</td>
                      <td className='px-3 py-2'>{entry.acc_name}</td>
                      <td className='px-3 py-2'>{entry.sub_acc_name || '-'}</td>
                      <td
                        className='px-3 py-2 max-w-xs truncate'
                        title={entry.particulars}
                      >
                        {entry.particulars}
                      </td>
                      <td className='px-3 py-2 text-right text-green-700'>
                        {entry.credit > 0
                          ? `₹${entry.credit.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className='px-3 py-2 text-right text-red-700'>
                        {entry.debit > 0
                          ? `₹${entry.debit.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className='px-3 py-2 text-center'>
                        {entry.credit > 0 && (
                          <div className='space-y-1'>
                            {entry.credit_online > 0 && (
                              <span className='inline-block px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800'>
                                Online: ₹{entry.credit_online.toLocaleString()}
                              </span>
                            )}
                            {entry.credit_offline > 0 && (
                              <span className='inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                                Offline: ₹
                                {entry.credit_offline.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        {entry.debit > 0 && (
                          <div className='space-y-1'>
                            {entry.debit_online > 0 && (
                              <span className='inline-block px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800'>
                                Online: ₹{entry.debit_online.toLocaleString()}
                              </span>
                            )}
                            {entry.debit_offline > 0 && (
                              <span className='inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                                Offline: ₹{entry.debit_offline.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className='px-3 py-2'>{entry.staff}</td>
                      <td className='px-3 py-2'>
                        {entry.approved ? (
                          <div className='text-xs'>
                            <div className='font-medium text-green-700'>
                              {entry.users || 'Unknown User'}
                            </div>
                            <div className='text-gray-500'>
                              {entry.entry_time ? format(new Date(entry.entry_time), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className='text-orange-600 font-medium'>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Performance Info */}
              {reportData.entries.length > 0 && (
                <div className='text-center text-sm text-green-600 py-4 mt-4 border-t border-gray-200'>
                  ✓ Fast Daily Report generated using optimized server-side queries
                </div>
              )}
            </>
          )}
        </Card>

        {/* Company Closing Balances */}
        {reportData.entries.length > 0 && (
          <Card
            title='Company Closing Balances'
            subtitle={`Current balance for each company (Credit - Debit) for ${displayDate}`}
            className='bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          >
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
                    {Object.entries(reportData.companyBalances).map(([companyName, balance], index) => {
                      // Calculate credit and debit for this company
                      const companyEntries = reportData.entries.filter(entry => entry.company_name === companyName);
                      const totalCredit = companyEntries.reduce((sum, entry) => sum + entry.credit, 0);
                      const totalDebit = companyEntries.reduce((sum, entry) => sum + entry.debit, 0);
                      
                      return (
                        <tr
                          key={companyName}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                          }`}
                        >
                          <td className='py-3 px-4 font-medium text-gray-900'>
                            {companyName}
                          </td>
                          <td className='py-3 px-4 text-right text-green-600 font-medium'>
                            ₹{totalCredit.toLocaleString()}
                          </td>
                          <td className='py-3 px-4 text-right text-red-600 font-medium'>
                            ₹{totalDebit.toLocaleString()}
                          </td>
                          <td className='py-3 px-4 text-right font-semibold'>
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${
                                balance > 0
                                  ? 'bg-green-100 text-green-800'
                                  : balance < 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              ₹{balance.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Summary Footer */}
              <div className='mt-4 p-4 bg-gray-100 rounded-lg border'>
                <div className='grid grid-cols-4 gap-4 text-sm'>
                  <div className='font-semibold text-gray-900'>
                    Total Companies: {Object.keys(reportData.companyBalances).length}
                  </div>
                  <div className='text-right text-green-600 font-semibold'>
                    ₹{reportData.totalCredit.toLocaleString()}
                  </div>
                  <div className='text-right text-red-600 font-semibold'>
                    ₹{reportData.totalDebit.toLocaleString()}
                  </div>
                  <div className='text-right'>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-bold ${
                        reportData.closingBalance > 0
                          ? 'bg-green-100 text-green-800'
                          : reportData.closingBalance < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      ₹{reportData.closingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
