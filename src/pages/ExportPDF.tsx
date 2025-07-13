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
      <div className="max-w-5xl w-full mx-auto space-y-6">
        {/* Responsive export controls */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Export controls here */}
        </div>
        {/* Responsive table/card layout */}
        <Card className="overflow-x-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          {/* Table content here */}
        </Card>
      </div>
    </div>
  );
};

export default ExportPDF; 