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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Report</h1>
          <p className="text-gray-600">Comprehensive daily transaction report with financial summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={RefreshCw}
            variant="secondary"
            onClick={generateReport}
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
            Export Excel
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Date Navigation */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Navigation</label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={ChevronLeft}
                onClick={() => navigateDate('prev')}
                className="px-3"
              >
                Previous
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={setSelectedDate}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="secondary"
                icon={ChevronRight}
                onClick={() => navigateDate('next')}
                className="px-3"
              >
                Next
              </Button>
            </div>
          </div>

          {/* Company Filter */}
          <Select
            label="Company Filter"
            value={selectedCompany}
            onChange={setSelectedCompany}
            options={companies}
          />

          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="text-xs px-2"
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
                className="text-xs px-2"
              >
                Yesterday
              </Button>
            </div>
          </div>

          {/* Toggle Company Balances */}
          <div className="flex items-end">
            <Button
              size="sm"
              variant={showCompanyBalances ? "primary" : "secondary"}
              icon={BarChart3}
              onClick={() => setShowCompanyBalances(!showCompanyBalances)}
              className="w-full"
            >
              Company Balances
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Credit</p>
              <p className="text-xl font-bold">₹{reportData.totalCredit.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Debit</p>
              <p className="text-xl font-bold">₹{reportData.totalDebit.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-6 h-6 text-red-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Opening Balance</p>
              <p className="text-xl font-bold">₹{reportData.openingBalance.toLocaleString()}</p>
            </div>
            <DollarSign className="w-6 h-6 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Closing Balance</p>
              <p className="text-xl font-bold">₹{reportData.closingBalance.toLocaleString()}</p>
            </div>
            <DollarSign className="w-6 h-6 text-purple-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Grand Total</p>
              <p className="text-xl font-bold">₹{reportData.grandTotal.toLocaleString()}</p>
            </div>
            <FileText className="w-6 h-6 text-orange-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Report Table */}
        <div className="lg:col-span-3">
          <Card title={`Daily Report - ${format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}`} 
                subtitle={`${reportData.entries.length} transactions found`}>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Generating report...</p>
              </div>
            ) : reportData.entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found for the selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">S.No</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Main A/c</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">SubAccount</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Particulars</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Credit</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Debit</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Sale Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Purchase Qty</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Staff</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">User</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Entry Time</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700">Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.entries.map((entry, index) => (
                      <tr key={entry.id} className={`border-b ${getRowColor(entry)} hover:bg-opacity-75 transition-colors`}>
                        <td className="px-3 py-2 font-medium">{entry.sno}</td>
                        <td className="px-3 py-2">{format(new Date(entry.c_date), 'dd-MMM-yy')}</td>
                        <td className="px-3 py-2 font-medium text-blue-600">{entry.company_name}</td>
                        <td className="px-3 py-2">{entry.acc_name}</td>
                        <td className="px-3 py-2">{entry.sub_acc_name || '-'}</td>
                        <td className="px-3 py-2 max-w-xs truncate" title={entry.particulars}>
                          {entry.particulars}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-green-600">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-red-600">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {entry.sale_qty > 0 ? entry.sale_qty.toLocaleString() : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {entry.purchase_qty > 0 ? entry.purchase_qty.toLocaleString() : '-'}
                        </td>
                        <td className="px-3 py-2">{entry.staff}</td>
                        <td className="px-3 py-2">{entry.users}</td>
                        <td className="px-3 py-2">{format(new Date(entry.entry_time), 'HH:mm:ss')}</td>
                        <td className="px-3 py-2 text-center">
                          {entry.approved ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Row */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">Total Credit:</div>
                    <div className="text-lg font-bold text-yellow-900">₹{reportData.totalCredit.toLocaleString()}</div>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-pink-800">Total Debit:</div>
                    <div className="text-lg font-bold text-pink-900">₹{reportData.totalDebit.toLocaleString()}</div>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-purple-800">Closing Balance:</div>
                    <div className="text-lg font-bold text-purple-900">₹{reportData.closingBalance.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">Grand Total:</div>
                    <div className="text-lg font-bold text-blue-900">₹{reportData.grandTotal.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Company Balances Panel */}
        {showCompanyBalances && (
          <div className="lg:col-span-1">
            <Card title="Company Balances" subtitle="Closing balances by company" className="h-fit">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(reportData.companyBalances)
                  .sort(([,a], [,b]) => b - a)
                  .map(([companyName, balance]) => (
                    <div key={companyName} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate" title={companyName}>
                          {companyName}
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${
                        balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        ₹{Math.abs(balance).toLocaleString()}
                        {balance > 0 && ' CR'}
                        {balance < 0 && ' DR'}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Print Preview - Daily Report</h3>
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
                  <h2 className="text-lg font-semibold text-gray-700">Daily Report</h2>
                  <p className="text-gray-600">{format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}</p>
                  {selectedCompany && <p className="text-gray-600">Company: {selectedCompany}</p>}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Total Credit</div>
                    <div className="text-lg font-bold">₹{reportData.totalCredit.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Total Debit</div>
                    <div className="text-lg font-bold">₹{reportData.totalDebit.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Closing Balance</div>
                    <div className="text-lg font-bold">₹{reportData.closingBalance.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 border border-gray-300">
                    <div className="font-medium">Grand Total</div>
                    <div className="text-lg font-bold">₹{reportData.grandTotal.toLocaleString()}</div>
                  </div>
                </div>

                {/* Transactions Table */}
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left">S.No</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Date</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Company</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Main Account</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Sub Account</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Particulars</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Credit</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">Debit</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="border border-gray-300 px-2 py-1">{entry.sno}</td>
                        <td className="border border-gray-300 px-2 py-1">{format(new Date(entry.c_date), 'dd-MMM-yy')}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.company_name}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.acc_name}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.sub_acc_name || '-'}</td>
                        <td className="border border-gray-300 px-2 py-1">{entry.particulars}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right">
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">{entry.staff}</td>
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

export default DailyReport;