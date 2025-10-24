import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SearchableSelect from '../components/UI/SearchableSelect';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    loadCompanies();
    generateReport();
  }, [selectedDate, selectedCompany, searchTerm]);

  const loadCompanies = async () => {
    try {
      const companies = await supabaseDB.getCompanies();
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



  const generateReport = async () => {
    setLoading(true);
    try {
      console.log('🔄 Generating Daily Report for:', selectedDate);
      
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
        filteredEntries = filteredEntries.filter(
          entry => entry.company_name === selectedCompany
        );
      }

      // Apply search filter
      if (searchTerm) {
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
      }

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


      console.log(`✅ Daily Report generated for ${selectedDate}: ${filteredEntries.length} entries`);
      toast.success(`Daily Report generated: ${filteredEntries.length} entries for ${selectedDate}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };


  const printReport = async () => {
    try {
      const { printCashBook } = await import('../utils/print');

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

      printCashBook(printData, {
        title: `Daily Report - ${format(new Date(selectedDate), 'dd/MM/yyyy')}`,
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
      Date: format(new Date(entry.c_date), 'dd-MMM-yyyy'),
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
      Approved: entry.approved ? 'Yes' : 'No',
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


  return (
    <div className='min-h-screen flex flex-col'>
      <div className='max-w-6xl w-full mx-auto space-y-6'>
        {/* Responsive filter bar */}
        <div className='flex flex-col md:flex-row gap-4 items-end'>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Date
            </label>
            <input
              type='date'
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div className='flex-1'>
            <SearchableSelect
              label='Company'
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={companies}
              placeholder='Select company...'
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
              <p className='mt-2 text-gray-600'>Generating Daily Report for {selectedDate}...</p>
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
                  Daily Report for {selectedDate}
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

              <table className='min-w-full text-sm'>
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
                    <th className='px-3 py-2 text-left'>Staff</th>
                    <th className='px-3 py-2 text-left'>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.entries.map((entry: any, idx: number) => (
                    <tr
                      key={entry.sno}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
                    >
                      <td className='px-3 py-2'>{entry.sno}</td>
                      <td className='px-3 py-2'>{entry.c_date}</td>
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
                      <td className='px-3 py-2'>{entry.staff}</td>
                      <td className='px-3 py-2'>
                        {entry.approved ? 'Yes' : 'No'}
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
      </div>
    </div>
  );
};

export default DailyReport;
