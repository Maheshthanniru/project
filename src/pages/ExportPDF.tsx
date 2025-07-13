import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Settings, Calendar, 
  Building, User, DollarSign, Eye, ChevronDown, 
  ChevronUp, RefreshCw, X, Filter, Search,
  TrendingUp, TrendingDown, BarChart3, FileDown
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';

interface PDFExportFilters {
  dateFrom: string;
  dateTo: string;
  company: string;
  account: string;
  subAccount: string;
  exportType: 'cashbook' | 'ledger' | 'balance' | 'vehicles' | 'drivers' | 'bankguarantees';
  includeSummary: boolean;
  includeCharts: boolean;
}

const ExportPDF: React.FC = () => {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState<PDFExportFilters>({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    company: '',
    account: '',
    subAccount: '',
    exportType: 'cashbook',
    includeSummary: true,
    includeCharts: false,
  });

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  // Dropdown data
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [subAccounts, setSubAccounts] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (filters.company) {
      loadAccountsByCompany();
    }
  }, [filters.company]);

  useEffect(() => {
    if (filters.company && filters.account) {
      loadSubAccountsByAccount();
    }
  }, [filters.company, filters.account]);

  useEffect(() => {
    generatePreview();
  }, [filters]);

  const loadDropdownData = async () => {
    try {
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const loadAccountsByCompany = async () => {
    if (!filters.company) {
      setAccounts([{ value: '', label: 'All Accounts' }]);
      return;
    }
    
    try {
      const accounts = await supabaseDB.getAccountsByCompany(filters.company);
      const accountsData = accounts.map(account => ({
        value: account.acc_name,
        label: account.acc_name
      }));
      setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const loadSubAccountsByAccount = async () => {
    if (!filters.company || !filters.account) {
      setSubAccounts([{ value: '', label: 'All Sub Accounts' }]);
      return;
    }
    
    try {
      const subAccounts = await supabaseDB.getSubAccountsByAccount(filters.company, filters.account);
      const subAccountsData = subAccounts.map(subAcc => ({
        value: subAcc.sub_acc,
        label: subAcc.sub_acc
      }));
      setSubAccounts([{ value: '', label: 'All Sub Accounts' }, ...subAccountsData]);
    } catch (error) {
      console.error('Error loading sub accounts:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const generatePreview = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let summaryData: any = {};

      switch (filters.exportType) {
        case 'cashbook':
          const entries = await supabaseDB.getCashBookEntries();
          data = entries.filter(entry => {
            if (filters.dateFrom && entry.c_date < filters.dateFrom) return false;
            if (filters.dateTo && entry.c_date > filters.dateTo) return false;
            if (filters.company && entry.company_name !== filters.company) return false;
            if (filters.account && entry.acc_name !== filters.account) return false;
            if (filters.subAccount && entry.sub_acc_name !== filters.subAccount) return false;
            return true;
          });
          
          summaryData = {
            totalRecords: data.length,
            totalCredit: data.reduce((sum, entry) => sum + (entry.credit || 0), 0),
            totalDebit: data.reduce((sum, entry) => sum + (entry.debit || 0), 0),
            balance: data.reduce((sum, entry) => sum + (entry.credit || 0) - (entry.debit || 0), 0),
          };
          break;

        case 'ledger':
          // TODO: Implement ledger data
          data = [];
          summaryData = { totalRecords: 0 };
          break;

        case 'balance':
          // TODO: Implement balance sheet data
          data = [];
          summaryData = { totalRecords: 0 };
          break;

        case 'vehicles':
          const vehicles = await supabaseDB.getVehicles();
          data = vehicles;
          summaryData = {
            totalVehicles: vehicles.length,
            expiredDocuments: vehicles.filter(v => {
              const today = new Date();
              const dates = [v.insurance_expiry, v.permit_expiry, v.fitness_expiry, v.puc_expiry];
              return dates.some(date => date && new Date(date) < today);
            }).length,
          };
          break;

        case 'drivers':
          const drivers = await supabaseDB.getDrivers();
          data = drivers;
          summaryData = {
            totalDrivers: drivers.length,
            expiredLicenses: drivers.filter(d => {
              const today = new Date();
              return d.license_expiry && new Date(d.license_expiry) < today;
            }).length,
          };
          break;

        case 'bankguarantees':
          const bankGuarantees = await supabaseDB.getBankGuarantees();
          data = bankGuarantees;
          summaryData = {
            totalBGs: bankGuarantees.length,
            totalCredit: bankGuarantees.reduce((sum, bg) => sum + (bg.credit || 0), 0),
            totalDebit: bankGuarantees.reduce((sum, bg) => sum + (bg.debit || 0), 0),
          };
          break;
      }

      setPreviewData(data.slice(0, 10)); // Show first 10 records as preview
      setSummary(summaryData);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.text('Thirumala Group', 20, 20);
      doc.setFontSize(14);
      doc.text(`${filters.exportType.charAt(0).toUpperCase() + filters.exportType.slice(1)} Report`, 20, 30);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 40);
      doc.text(`Date Range: ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')} - ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`, 20, 50);
      
      if (filters.company) {
        doc.text(`Company: ${filters.company}`, 20, 60);
      }
      
      let yPosition = 80;
      
      // Add summary if requested
      if (filters.includeSummary && Object.keys(summary).length > 0) {
        doc.setFontSize(12);
        doc.text('Summary', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        Object.entries(summary).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          doc.text(`${label}: ${value}`, 25, yPosition);
          yPosition += 5;
        });
        yPosition += 10;
      }
      
      // Add data table
      if (previewData.length > 0) {
        doc.setFontSize(12);
        doc.text('Data Preview', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(8);
        const headers = Object.keys(previewData[0] || {});
        let xPosition = 20;
        
        // Add headers
        headers.forEach(header => {
          doc.text(header, xPosition, yPosition);
          xPosition += 30;
        });
        yPosition += 5;
        
        // Add data (limited to fit on page)
        previewData.slice(0, 15).forEach((row: any) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          xPosition = 20;
          headers.forEach(header => {
            const value = row[header];
            doc.text(`${value || ''}`.substring(0, 20), xPosition, yPosition);
            xPosition += 30;
          });
          
          yPosition += 5;
        });
      }
      
      const filename = `thirumala-${filters.exportType}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`;
      doc.save(filename);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof PDFExportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
      company: '',
      account: '',
      subAccount: '',
      exportType: 'cashbook',
      includeSummary: true,
      includeCharts: false,
    });
  };

  const exportTypeOptions = [
    { value: 'cashbook', label: 'Cash Book Entries' },
    { value: 'ledger', label: 'Ledger Summary' },
    { value: 'balance', label: 'Balance Sheet' },
    { value: 'vehicles', label: 'Vehicle Management' },
    { value: 'drivers', label: 'Driver Management' },
    { value: 'bankguarantees', label: 'Bank Guarantees' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PDF Export</h1>
          <p className="text-gray-600">Generate comprehensive PDF reports with custom filters and formatting</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={RefreshCw}
            variant="secondary"
            onClick={generatePreview}
            disabled={loading}
          >
            Refresh Preview
          </Button>
          <Button
            icon={FileDown}
            variant="primary"
            onClick={exportToPDF}
            disabled={loading}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card title="Export Configuration" subtitle="Configure your PDF export settings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Date Range</h3>
            <Input
              label="From Date"
              type="date"
              value={filters.dateFrom}
              onChange={(value) => handleFilterChange('dateFrom', value)}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.dateTo}
              onChange={(value) => handleFilterChange('dateTo', value)}
            />
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Filters</h3>
            <Select
              label="Export Type"
              value={filters.exportType}
              onChange={(value) => handleFilterChange('exportType', value)}
              options={exportTypeOptions}
            />
            <Select
              label="Company"
              value={filters.company}
              onChange={(value) => handleFilterChange('company', value)}
              options={companies}
            />
            <Select
              label="Account"
              value={filters.account}
              onChange={(value) => handleFilterChange('account', value)}
              options={accounts}
            />
            <Select
              label="Sub Account"
              value={filters.subAccount}
              onChange={(value) => handleFilterChange('subAccount', value)}
              options={subAccounts}
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Export Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeSummary}
                  onChange={(e) => handleFilterChange('includeSummary', e.target.checked)}
                  className="mr-2"
                />
                Include Summary
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.includeCharts}
                  onChange={(e) => handleFilterChange('includeCharts', e.target.checked)}
                  className="mr-2"
                />
                Include Charts (Future)
              </label>
            </div>
            <Button
              variant="secondary"
              onClick={resetFilters}
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary */}
      {filters.includeSummary && Object.keys(summary).length > 0 && (
        <Card title="Summary" subtitle="Key statistics for the selected data">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {typeof value === 'number' && key.toLowerCase().includes('total') 
                    ? `₹${value.toLocaleString()}`
                    : value
                  }
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview */}
      <Card title="Data Preview" subtitle={`Showing first ${previewData.length} records`}>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating preview...</p>
          </div>
        ) : previewData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No data found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {Object.keys(previewData[0] || {}).map(header => (
                    <th key={header} className="px-3 py-2 text-left font-medium text-gray-700">
                      {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-gray-900">
                        {value || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExportPDF; 