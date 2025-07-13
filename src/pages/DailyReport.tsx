import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Printer, Download, 
  Search, Filter, FileText, TrendingUp, TrendingDown, 
  Building, DollarSign, Eye, X, RefreshCw, BarChart3
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
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
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
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
        label: company.company_name
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
        entries = entries.filter(entry => entry.company_name === selectedCompany);
      }

      // Apply search filter
      if (searchTerm) {
        entries = entries.filter(entry =>
          entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.acc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (entry.sub_acc_name && entry.sub_acc_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          entry.staff.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Calculate totals
      const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
      const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);

      // Calculate opening balance (all entries before selected date)
      const allEntries = await supabaseDB.getCashBookEntries();
      const previousEntries = allEntries.filter(entry => entry.c_date < selectedDate);
      const openingBalance = previousEntries.reduce((sum, entry) => sum + (entry.credit - entry.debit), 0);

      const closingBalance = openingBalance + (totalCredit - totalDebit);
      const grandTotal = totalCredit + totalDebit;

      // Calculate company-wise balances
      const companyBalances: { [key: string]: number } = {};
      const allCompanies = await supabaseDB.getCompanies();
      
      allCompanies.forEach(company => {
        const companyEntries = allEntries.filter(entry => 
          entry.company_name === company.company_name && entry.c_date <= selectedDate
        );
        companyBalances[company.company_name] = companyEntries.reduce(
          (sum, entry) => sum + (entry.credit - entry.debit), 0
        );
      });

      setReportData({
        entries: entries.sort((a, b) => a.sno - b.sno),
        totalCredit,
        totalDebit,
        openingBalance,
        closingBalance,
        grandTotal,
        companyBalances,
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
    const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
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
        approved: entry.approved ? 'Approved' : 'Pending'
      }));
      
      printCashBook(printData, {
        title: `Daily Report - ${format(new Date(selectedDate), 'dd/MM/yyyy')}`,
        subtitle: selectedCompany ? `Company: ${selectedCompany}` : 'All Companies',
        headerText: 'Thirumala Group - Daily Transaction Report'
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Print failed. Please try again.');
    }
  };

  const exportToExcel = () => {
    const exportData = reportData.entries.map(entry => ({
      'S.No': entry.sno,
      'Date': format(new Date(entry.c_date), 'dd-MMM-yyyy'),
      'Company': entry.company_name,
      'Main Account': entry.acc_name,
      'Sub Account': entry.sub_acc_name || '',
      'Particulars': entry.particulars,
      'Credit': entry.credit,
      'Debit': entry.debit,
      'Sale Qty': entry.sale_qty,
      'Purchase Qty': entry.purchase_qty || 0,
      'Staff': entry.staff,
      'User': entry.users,
      'Entry Time': entry.entry_time,
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
    <div className="min-h-screen flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Responsive filter bar */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-row gap-2 mt-2 md:mt-0">
            <Button icon={RefreshCw} variant="secondary" onClick={generateReport}>Refresh</Button>
            <Button icon={Printer} variant="secondary" onClick={printReport}>Print</Button>
            <Button icon={Download} variant="secondary" onClick={exportToExcel}>Export</Button>
          </div>
        </div>
        {/* Responsive table/card layout */}
        <Card className="overflow-x-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : reportData.entries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No entries found for this date.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-3 py-2 text-left">S.No</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Company</th>
                  <th className="px-3 py-2 text-left">Account</th>
                  <th className="px-3 py-2 text-left">Sub Account</th>
                  <th className="px-3 py-2 text-left">Particulars</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-left">Staff</th>
                  <th className="px-3 py-2 text-left">Approved</th>
                </tr>
              </thead>
              <tbody>
                {reportData.entries.map((entry: any, idx: number) => (
                  <tr key={entry.sno} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                    <td className="px-3 py-2">{entry.sno}</td>
                    <td className="px-3 py-2">{entry.c_date}</td>
                    <td className="px-3 py-2">{entry.company_name}</td>
                    <td className="px-3 py-2">{entry.acc_name}</td>
                    <td className="px-3 py-2">{entry.sub_acc_name || '-'}</td>
                    <td className="px-3 py-2 max-w-xs truncate" title={entry.particulars}>{entry.particulars}</td>
                    <td className="px-3 py-2 text-right text-green-700">{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                    <td className="px-3 py-2 text-right text-red-700">{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                    <td className="px-3 py-2">{entry.staff}</td>
                    <td className="px-3 py-2">{entry.approved ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DailyReport;