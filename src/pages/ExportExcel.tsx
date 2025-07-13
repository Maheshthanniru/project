import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, Calendar, Building, Filter, 
  RefreshCw, CheckSquare, Square, AlertCircle, 
  TrendingUp, TrendingDown, Users, Truck, CreditCard, Eye
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { exportToExcel, formatDataForExcel } from '../utils/excel';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportOptions {
  reportType: 'cashbook' | 'ledger' | 'balancesheet' | 'vehicles' | 'bankguarantees' | 'drivers' | 'dailyreport' | 'ledgersummary';
  dateRange: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';
  fromDate: string;
  toDate: string;
  companyFilter: string;
  accountFilter: string;
  includeHeaders: boolean;
  includeTotals: boolean;
  format: 'xlsx' | 'csv' | 'pdf';
}

const ExportExcel: React.FC = () => {
  const { user } = useAuth();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    reportType: 'cashbook',
    dateRange: 'thisMonth',
    fromDate: format(new Date().setDate(1), 'yyyy-MM-dd'), // First day of current month
    toDate: format(new Date(), 'yyyy-MM-dd'),
    companyFilter: '',
    accountFilter: '',
    includeHeaders: true,
    includeTotals: true,
    format: 'xlsx'
  });

  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (exportOptions.reportType === 'cashbook' && exportOptions.companyFilter) {
      loadAccountsByCompany();
    }
  }, [exportOptions.companyFilter, exportOptions.reportType]);

  const loadDropdownData = async () => {
    try {
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);

      const accounts = await supabaseDB.getAccounts();
      const accountsData = accounts.map(account => ({
        value: account.acc_name,
        label: account.acc_name
      }));
      setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const loadAccountsByCompany = async () => {
    if (exportOptions.companyFilter) {
      try {
        const accounts = await supabaseDB.getAccountsByCompany(exportOptions.companyFilter);
        const accountsData = accounts.map(account => ({
          value: account.acc_name,
          label: account.acc_name
        }));
        setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);
      } catch (error) {
        console.error('Error loading accounts by company:', error);
        toast.error('Failed to load accounts');
      }
    } else {
      loadDropdownData();
    }
  };

  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (exportOptions.dateRange) {
      case 'today':
        return { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
      case 'yesterday':
        return { from: format(yesterday, 'yyyy-MM-dd'), to: format(yesterday, 'yyyy-MM-dd') };
      case 'thisWeek':
        return { from: format(thisWeekStart, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
      case 'thisMonth':
        return { from: format(thisMonthStart, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
      case 'custom':
        return { from: exportOptions.fromDate, to: exportOptions.toDate };
      default:
        return { from: exportOptions.fromDate, to: exportOptions.toDate };
    }
  };

  const getDataForExport = async () => {
    const dateRange = getDateRange();
    
    switch (exportOptions.reportType) {
      case 'cashbook':
        let entries = await supabaseDB.getCashBookEntries();
        entries = entries.filter(entry => 
          entry.c_date >= dateRange.from && entry.c_date <= dateRange.to
        );
        
        if (exportOptions.companyFilter) {
          entries = entries.filter(entry => entry.company_name === exportOptions.companyFilter);
        }
        if (exportOptions.accountFilter) {
          entries = entries.filter(entry => entry.acc_name === exportOptions.accountFilter);
        }
        
        return formatDataForExcel(entries, 'cashbook');
        
      case 'ledger':
        const ledgerData = await supabaseDB.getCashBookEntries();
        const filteredLedgerData = ledgerData.filter(entry => 
          entry.c_date >= dateRange.from && entry.c_date <= dateRange.to
        );
        return formatDataForExcel(filteredLedgerData, 'ledger');
        
      case 'balancesheet':
        const balanceData = await supabaseDB.getCashBookEntries();
        const filteredBalanceData = balanceData.filter(entry => 
          entry.c_date >= dateRange.from && entry.c_date <= dateRange.to
        );
        return formatDataForExcel(filteredBalanceData, 'balancesheet');
        
      case 'vehicles':
        const vehicleData = await supabaseDB.getVehicles();
        return formatDataForExcel(vehicleData, 'vehicles');
        
      case 'bankguarantees':
        const bgData = await supabaseDB.getBankGuarantees();
        return formatDataForExcel(bgData, 'bankguarantees');
        
      case 'drivers':
        const driverData = await supabaseDB.getDrivers();
        return formatDataForExcel(driverData, 'drivers');
        
      default:
        return [];
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export as CSV');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        // Escape quotes and commas
        if (typeof val === 'string') {
          return '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      csvRows.push(values.join(','));
    });
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exported successfully! File: ${filename}.csv`);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await getDataForExport();
      if (data.length === 0) {
        toast.error('No data found for the selected criteria');
        return;
      }
      const dateRange = getDateRange();
      const filename = `${exportOptions.reportType}-${dateRange.from}-to-${dateRange.to}`;
      if (exportOptions.format === 'pdf') {
        exportToPDF(data, filename, exportOptions.reportType);
      } else if (exportOptions.format === 'csv') {
        exportToCSV(data, filename);
      } else {
        const result = exportToExcel(data, filename, exportOptions.reportType);
        if (result.success) {
          toast.success(`Export completed! File: ${filename}.xlsx`);
        } else {
          toast.error('Export failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = (data: any[], filename: string, reportType: string) => {
    try {
      if (!data || data.length === 0) {
        toast.error('No data to export as PDF');
        return;
      }
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(18);
      doc.text('Thirumala Group', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 105, 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated on ${format(new Date(), 'dd-MMM-yyyy HH:mm')}`, 105, 40, { align: 'center' });
      const headers = Object.keys(data[0] || {});
      const tableData = data.map(row => headers.map(header => row[header]));
      toast('PDF debug: headers=' + JSON.stringify(headers) + ', rows=' + tableData.length);
      console.log('PDF export headers:', headers);
      console.log('PDF export tableData:', tableData);
      if (headers.length === 0 || tableData.length === 0) {
        doc.text('No data available for this report.', 105, 60, { align: 'center' });
      } else {
        try {
          autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 50,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              lineColor: [44, 62, 80],
              lineWidth: 0.2,
            },
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: 255,
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { top: 50 },
            tableLineColor: [44, 62, 80],
            tableLineWidth: 0.2,
          });
        } catch (tableError) {
          doc.text('Error rendering table: ' + String(tableError), 105, 60, { align: 'center' });
          toast.error('PDF table error: ' + String(tableError));
          console.error('autoTable error:', tableError);
        }
      }
      doc.save(`${filename}.pdf`);
      toast.success(`PDF exported successfully! File: ${filename}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed. Please try again.');
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const data = await getDataForExport();
      setPreviewData(data.slice(0, 10)); // Show first 10 records
      setShowPreview(true);
      toast.success(`Preview: ${data.length} records found`);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (field: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'cashbook': return FileText;
      case 'ledger': return TrendingUp;
      case 'balancesheet': return TrendingDown;
      case 'vehicles': return Truck;
      case 'bankguarantees': return CreditCard;
      case 'drivers': return Users;
      default: return FileText;
    }
  };

  const reportTypes = [
    { value: 'cashbook', label: 'Cash Book Entries', icon: FileText },
    { value: 'ledger', label: 'Ledger Report', icon: TrendingUp },
    { value: 'balancesheet', label: 'Balance Sheet', icon: TrendingDown },
    { value: 'vehicles', label: 'Vehicles', icon: Truck },
    { value: 'bankguarantees', label: 'Bank Guarantees', icon: CreditCard },
    { value: 'drivers', label: 'Drivers', icon: Users },
    { value: 'dailyreport', label: 'Daily Report', icon: Calendar },
    { value: 'ledgersummary', label: 'Ledger Summary', icon: Building }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Responsive export controls */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Report Type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <Select
              value={exportOptions.reportType}
              onChange={(value) => handleOptionChange('reportType', value)}
              options={reportTypes.map(type => ({
                value: type.value,
                label: type.label
              }))}
            />
          </div>

          {/* Date Range */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <Select
              value={exportOptions.dateRange}
              onChange={(value) => handleOptionChange('dateRange', value)}
              options={dateRangeOptions}
            />
          </div>

          {/* Custom Date Range */}
          {exportOptions.dateRange === 'custom' && (
            <>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <Input
                  type="date"
                  value={exportOptions.fromDate}
                  onChange={(value) => handleOptionChange('fromDate', value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <Input
                  type="date"
                  value={exportOptions.toDate}
                  onChange={(value) => handleOptionChange('toDate', value)}
                />
              </div>
            </>
          )}

          {/* Company Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Filter
            </label>
            <Select
              value={exportOptions.companyFilter}
              onChange={(value) => handleOptionChange('companyFilter', value)}
              options={companies}
            />
          </div>

          {/* Account Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Filter
            </label>
            <Select
              value={exportOptions.accountFilter}
              onChange={(value) => handleOptionChange('accountFilter', value)}
              options={accounts}
            />
          </div>

          {/* Export Format */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <Select
              value={exportOptions.format}
              onChange={(value) => handleOptionChange('format', value)}
              options={[
                { value: 'xlsx', label: 'Excel (.xlsx)' },
                { value: 'csv', label: 'CSV (.csv)' },
                { value: 'pdf', label: 'PDF (.pdf)' }
              ]}
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportOptions.includeHeaders}
                onChange={(e) => handleOptionChange('includeHeaders', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include Headers</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportOptions.includeTotals}
                onChange={(e) => handleOptionChange('includeTotals', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include Totals</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Button
            icon={Download}
            onClick={handleExport}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Exporting...' : `Export to ${exportOptions.format.toUpperCase()}`}
          </Button>
          <Button
            icon={Eye}
            variant="secondary"
            onClick={handlePreview}
            disabled={loading}
          >
            Preview Data
          </Button>
        </div>

        {/* Preview Panel */}
        <Card title="Export Preview" subtitle="Preview your export data" className="overflow-x-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          {showPreview && previewData.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Showing first {previewData.length} rows
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0] || {}).map((key) => (
                        <th key={key} className="px-2 py-1 text-left font-medium text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-2 py-1 text-gray-900">
                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Click "Preview Data" to see a sample of your export</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ExportExcel; 