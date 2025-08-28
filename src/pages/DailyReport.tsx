import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Search } from 'lucide-react';

interface DailyReportData {
  entries: any[];
  totalCredit: number;
  totalDebit: number;
  openingBalance: number;
  closingBalance: number;
  grandTotal: number;
  companyBalances: { [key: string]: number };
  onlineCredit: number;
  offlineCredit: number;
  onlineDebit: number;
  offlineDebit: number;
  totalOnline: number;
  totalOffline: number;
}

const DailyReport: React.FC = () => {
  const { user } = useAuth();
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
    onlineCredit: 0,
    offlineCredit: 0,
    onlineDebit: 0,
    offlineDebit: 0,
    totalOnline: 0,
    totalOffline: 0,
  });
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showCompanyBalances, setShowCompanyBalances] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get entries for the selected date
      let entries = await supabaseDB.getCashBookEntries();
      entries = entries.filter(entry => entry.c_date === selectedDate);

      // Apply company filter
      if (selectedCompany) {
        entries = entries.filter(
          entry => entry.company_name === selectedCompany
        );
      }

      // Apply search filter
      if (searchTerm) {
        entries = entries.filter(
          entry =>
            entry.particulars
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            entry.acc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.sub_acc_name &&
              entry.sub_acc_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            entry.staff.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Calculate totals
      const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
      const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);

      // Calculate online vs offline breakdown
      let onlineCredit = 0;
      let offlineCredit = 0;
      let onlineDebit = 0;
      let offlineDebit = 0;

      entries.forEach(entry => {
        // Credit amounts
        onlineCredit += entry.credit_online || 0;
        offlineCredit += entry.credit_offline || 0;

        // Debit amounts
        onlineDebit += entry.debit_online || 0;
        offlineDebit += entry.debit_offline || 0;
      });

      const totalOnline = onlineCredit + onlineDebit;
      const totalOffline = offlineCredit + offlineDebit;

      // Calculate opening balance (all entries before selected date)
      const allEntries = await supabaseDB.getCashBookEntries();
      const previousEntries = allEntries.filter(
        entry => entry.c_date < selectedDate
      );
      const openingBalance = previousEntries.reduce(
        (sum, entry) => sum + (entry.credit - entry.debit),
        0
      );

      const closingBalance = openingBalance + (totalCredit - totalDebit);
      const grandTotal = totalCredit + totalDebit;

      // Calculate company-wise balances
      const companyBalances: { [key: string]: number } = {};
      const allCompanies = await supabaseDB.getCompanies();

      allCompanies.forEach(company => {
        const companyEntries = entries.filter(
          entry => entry.company_name === company.company_name
        );
        const companyCredit = companyEntries.reduce(
          (sum, entry) => sum + entry.credit,
          0
        );
        const companyDebit = companyEntries.reduce(
          (sum, entry) => sum + entry.debit,
          0
        );
        companyBalances[company.company_name] = companyCredit - companyDebit;
      });

      setReportData({
        entries,
        totalCredit,
        totalDebit,
        openingBalance,
        closingBalance,
        grandTotal,
        companyBalances,
        onlineCredit,
        offlineCredit,
        onlineDebit,
        offlineDebit,
        totalOnline,
        totalOffline,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate =
      direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
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

  const getRowColor = (entry: any) => {
    if (!entry.approved) return 'bg-yellow-50 border-yellow-200';
    if (entry.edited) return 'bg-blue-50 border-blue-200';
    if (entry.credit > 0) return 'bg-green-50 border-green-200';
    if (entry.debit > 0) return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
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
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {companies.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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

              {/* Online vs Offline Transaction Breakdown */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                <div className='bg-cyan-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-cyan-900 font-semibold text-sm'>
                    Online Transactions:
                  </span>
                  <span className='text-xl font-bold text-cyan-900'>
                    ₹{reportData.totalOnline.toLocaleString()}
                  </span>
                  <span className='text-cyan-700 text-xs mt-1'>
                    Credit: ₹{reportData.onlineCredit.toLocaleString()} | Debit:
                    ₹{reportData.onlineDebit.toLocaleString()}
                  </span>
                </div>
                <div className='bg-gray-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-gray-900 font-semibold text-sm'>
                    Offline Transactions:
                  </span>
                  <span className='text-xl font-bold text-gray-900'>
                    ₹{reportData.totalOffline.toLocaleString()}
                  </span>
                  <span className='text-gray-700 text-xs mt-1'>
                    Credit: ₹{reportData.offlineCredit.toLocaleString()} |
                    Debit: ₹{reportData.offlineDebit.toLocaleString()}
                  </span>
                </div>
                <div className='bg-indigo-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-indigo-900 font-semibold text-sm'>
                    Online Credit:
                  </span>
                  <span className='text-xl font-bold text-indigo-900'>
                    ₹{reportData.onlineCredit.toLocaleString()}
                  </span>
                  <span className='text-indigo-700 text-xs mt-1'>
                    {reportData.totalCredit > 0
                      ? `${((reportData.onlineCredit / reportData.totalCredit) * 100).toFixed(1)}%`
                      : '0%'}{' '}
                    of total credit
                  </span>
                </div>
                <div className='bg-pink-100 rounded-lg p-4 flex flex-col items-start justify-center'>
                  <span className='text-pink-900 font-semibold text-sm'>
                    Online Debit:
                  </span>
                  <span className='text-xl font-bold text-pink-900'>
                    ₹{reportData.onlineDebit.toLocaleString()}
                  </span>
                  <span className='text-pink-700 text-xs mt-1'>
                    {reportData.totalDebit > 0
                      ? `${((reportData.onlineDebit / reportData.totalDebit) * 100).toFixed(1)}%`
                      : '0%'}{' '}
                    of total debit
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
                    <th className='px-3 py-2 text-center'>Payment Mode</th>
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
                        {entry.approved ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DailyReport;
