import React, { useState, useEffect } from 'react';
import { 
  Edit, Search, Check, X, Eye, Lock, Unlock, Trash2, 
  History, Clock, User, Calendar, FileText, AlertTriangle,
  ChevronDown, ChevronUp, Filter, Download, RefreshCw, Building, Calculator
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [entryHistory, setEntryHistory] = useState<EditHistory[]>([]);
  const [allHistory, setAllHistory] = useState<EditHistory[]>([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Form data for editing
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [subAccounts, setSubAccounts] = useState<{ value: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  // Add dropdown data for edit form
  const [particularsOptions, setParticularsOptions] = useState<{ value: string; label: string }[]>([]);
  const [saleQuantityOptions, setSaleQuantityOptions] = useState<{ value: string; label: string }[]>([]);
  const [purchaseQuantityOptions, setPurchaseQuantityOptions] = useState<{ value: string; label: string }[]>([]);
  const [creditAmountOptions, setCreditAmountOptions] = useState<{ value: string; label: string }[]>([]);
  const [debitAmountOptions, setDebitAmountOptions] = useState<{ value: string; label: string }[]>([]);

  // Add filter state variables
  const [filterCompanyName, setFilterCompanyName] = useState('');
  const [filterAccountName, setFilterAccountName] = useState('');
  const [filterSubAccount, setFilterSubAccount] = useState('');
  const [filterParticulars, setFilterParticulars] = useState('');
  const [filterSaleQ, setFilterSaleQ] = useState('');
  const [filterPurchaseQ, setFilterPurchaseQ] = useState('');
  const [filterCredit, setFilterCredit] = useState('');
  const [filterDebit, setFilterDebit] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Add state for expanded entry
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [pinnedEntryId, setPinnedEntryId] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      await loadEntries();
      await loadDropdownData();
      await loadAllHistory();
    };
    
    initializeData();
  }, [searchTerm, dateFilter, statusFilter]);

  // Load accounts when company filter changes
  useEffect(() => {
    if (filterCompanyName) {
      loadAccountsByCompany(filterCompanyName);
    } else {
      setAccounts([]);
    }
  }, [filterCompanyName]);

  // Load sub accounts when account filter changes
  useEffect(() => {
    if (filterCompanyName && filterAccountName) {
      loadSubAccountsByAccount(filterCompanyName, filterAccountName);
    } else {
      setSubAccounts([]);
    }
  }, [filterCompanyName, filterAccountName]);

  const loadDropdownData = async () => {
    try {
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name
      }));
      setCompanies(companiesData);

      const users = await supabaseDB.getUsers();
      const usersData = users.filter(u => u.is_active).map(user => ({
        value: user.username,
        label: user.username
      }));
      setUsers(usersData);

      // Load unique values for dropdowns
      const uniqueParticulars = await supabaseDB.getUniqueParticulars();
      const particularsData = uniqueParticulars.map(particular => ({
        value: particular,
        label: particular
      }));
      setParticularsOptions(particularsData);

      const uniqueSaleQuantities = await supabaseDB.getUniqueSaleQuantities();
      const saleQuantityData = uniqueSaleQuantities.map(qty => ({
        value: qty.toString(),
        label: qty.toString()
      }));
      setSaleQuantityOptions(saleQuantityData);

      const uniquePurchaseQuantities = await supabaseDB.getUniquePurchaseQuantities();
      const purchaseQuantityData = uniquePurchaseQuantities.map(qty => ({
        value: qty.toString(),
        label: qty.toString()
      }));
      setPurchaseQuantityOptions(purchaseQuantityData);

      const uniqueCreditAmounts = await supabaseDB.getUniqueCreditAmounts();
      const creditAmountData = uniqueCreditAmounts.map(amount => ({
        value: amount.toString(),
        label: `₹${amount.toLocaleString()}`
      }));
      setCreditAmountOptions(creditAmountData);

      const uniqueDebitAmounts = await supabaseDB.getUniqueDebitAmounts();
      const debitAmountData = uniqueDebitAmounts.map(amount => ({
        value: amount.toString(),
        label: `₹${amount.toLocaleString()}`
      }));
      setDebitAmountOptions(debitAmountData);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const loadAccountsByCompany = async (companyName: string) => {
    try {
      const accounts = await supabaseDB.getAccountsByCompany(companyName);
      const accountsData = accounts.map(account => ({
        value: account.acc_name,
        label: account.acc_name
      }));
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const loadSubAccountsByAccount = async (companyName: string, accountName: string) => {
    try {
      const subAccounts = await supabaseDB.getSubAccountsByAccount(companyName, accountName);
      const subAccountsData = subAccounts.map(subAcc => ({
        value: subAcc.sub_acc,
        label: subAcc.sub_acc
      }));
      setSubAccounts(subAccountsData);
    } catch (error) {
      console.error('Error loading sub accounts:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const loadEntries = async () => {
    try {
      let allEntries = await supabaseDB.getCashBookEntries();
      
      // Apply search filter
      if (searchTerm) {
        allEntries = allEntries.filter(entry =>
          entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.acc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.company_name.toLowerCase().includes(searchTerm.toLowerCase())
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
          allEntries = allEntries.filter(entry => false);
          break;
        }
      }
      
      // Apply new filters
      if (filterCompanyName) {
        allEntries = allEntries.filter(entry => entry.company_name && entry.company_name.toLowerCase().includes(filterCompanyName.toLowerCase()));
      }
      if (filterAccountName) {
        allEntries = allEntries.filter(entry => entry.acc_name && entry.acc_name.toLowerCase().includes(filterAccountName.toLowerCase()));
      }
      if (filterSubAccount) {
        allEntries = allEntries.filter(entry => entry.sub_acc_name && entry.sub_acc_name.toLowerCase().includes(filterSubAccount.toLowerCase()));
      }
      if (filterParticulars) {
        allEntries = allEntries.filter(entry => entry.particulars && entry.particulars.toLowerCase().includes(filterParticulars.toLowerCase()));
      }
      if (filterSaleQ) {
        allEntries = allEntries.filter(entry => String(entry.sale_qty || '') === filterSaleQ);
      }
      if (filterPurchaseQ) {
        allEntries = allEntries.filter(entry => String(entry.purchase_qty || '') === filterPurchaseQ);
      }
      if (filterCredit) {
        allEntries = allEntries.filter(entry => String(entry.credit || '') === filterCredit);
      }
      if (filterDebit) {
        allEntries = allEntries.filter(entry => String(entry.debit || '') === filterDebit);
      }
      if (filterStaff) {
        allEntries = allEntries.filter(entry => entry.staff && entry.staff.toLowerCase().includes(filterStaff.toLowerCase()));
      }
      if (filterDate) {
        allEntries = allEntries.filter(entry => entry.c_date === filterDate);
      }
      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Failed to load entries');
    }
  };

  const loadAllHistory = async () => {
    try {
      // TODO: Implement activity history in Supabase
      setAllHistory([]);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history');
    }
  };

  const loadEntryHistory = async (entryId: string) => {
    try {
      // TODO: Implement edit history in Supabase
      setEntryHistory([]);
    } catch (error) {
      console.error('Error loading entry history:', error);
      toast.error('Failed to load entry history');
    }
  };

  const handleEdit = async (entry: any) => {
    // TODO: Implement locked check when Supabase schema supports it
    setSelectedEntry({ ...entry });
    setEditMode(true);
    // Load accounts and sub accounts for the selected entry
    if (entry.company_name) {
      await loadAccountsByCompany(entry.company_name);
    }
    if (entry.company_name && entry.acc_name) {
      await loadSubAccountsByAccount(entry.company_name, entry.acc_name);
    }
  };

  const handleSave = async () => {
    if (!selectedEntry) return;

    setLoading(true);
    try {
      // If the entry was approved or rejected, set it to pending on edit
      const updates = { ...selectedEntry };
      if (selectedEntry.approved === 'true' || selectedEntry.approved === 'false') {
        updates.approved = '';
      }
      const updatedEntry = await supabaseDB.updateCashBookEntry(
        selectedEntry.id,
        updates,
        user?.username || 'admin'
      );
      if (updatedEntry) {
        await loadEntries();
        await loadAllHistory();
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

    if (window.confirm(`Are you sure you want to delete entry #${entry.sno}?`)) {
      try {
        console.log('Attempting to delete entry:', entry.id, 'by user:', user?.username);
        const success = await supabaseDB.deleteCashBookEntry(entry.id, user?.username || 'admin');
        console.log('Delete result:', success);
        if (success) {
          await loadEntries();
          await loadAllHistory();
          toast.success('Entry deleted successfully!');
        } else {
          toast.error('Failed to delete entry - check console for details');
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setSelectedEntry(null);
    setAccounts([]);
    setSubAccounts([]);
  };

  const handleInputChange = async (field: string, value: any) => {
    setSelectedEntry((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Load dependent dropdowns
    if (field === 'company_name') {
      await loadAccountsByCompany(value);
      setSelectedEntry((prev: any) => ({ ...prev, acc_name: '', sub_acc_name: '' }));
    }
    if (field === 'acc_name') {
      await loadSubAccountsByAccount(selectedEntry.company_name, value);
      setSelectedEntry((prev: any) => ({ ...prev, sub_acc_name: '' }));
    }
  };

  const toggleLock = async (entry: any) => {
    if (!isAdmin) {
      toast.error('Only admins can lock/unlock records');
      return;
    }
    try {
      let result;
      if (entry.locked || entry.lock_record) {
        result = await supabaseDB.unlockEntry(entry.id, user?.username || 'admin');
      } else {
        result = await supabaseDB.lockEntry(entry.id, user?.username || 'admin');
      }
      if (result) {
        await loadEntries();
        await loadAllHistory && loadAllHistory();
        toast.success(`Entry ${entry.locked || entry.lock_record ? 'unlocked' : 'locked'} successfully!`);
      } else {
        toast.error('Failed to update lock status');
      }
    } catch (error) {
      toast.error('Error updating lock status');
    }
  };

  const toggleApproval = async (entry: any) => {
    if (!isAdmin) {
      toast.error('Only admins can approve entries');
      return;
    }

    try {
      const result = await supabaseDB.toggleApproval(entry.id);
      if (result) {
        await loadEntries();
        await loadAllHistory();
        toast.success('Entry approval toggled successfully!');
      } else {
        toast.error('Failed to toggle approval');
      }
    } catch (error) {
      console.error('Error toggling approval:', error);
      toast.error('Failed to toggle approval');
    }
  };

  const exportData = async (exportFormat: 'json' | 'excel' | 'pdf' | 'csv' = 'json') => {
    try {
      const data = await supabaseDB.exportData();
      
      if (exportFormat === 'excel' || exportFormat === 'csv') {
        // Export to Excel/CSV - use the current filtered entries instead of all data
        const currentEntries = entries.length > 0 ? entries : await supabaseDB.getCashBookEntries();
        
        // Debug: Log first entry to see date format
        if (currentEntries.length > 0) {
          console.log('Sample entry date format:', {
            c_date: currentEntries[0].c_date,
            type: typeof currentEntries[0].c_date,
            entry_time: currentEntries[0].entry_time
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
                      second: '2-digit'
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
            'Date': formattedDate,
            'Company': entry.company_name || '',
            'Main Account': entry.acc_name || '',
            'Sub Account': entry.sub_acc_name || '',
            'Particulars': entry.particulars || '',
            'Credit': entry.credit || 0,
            'Debit': entry.debit || 0,
            'Sale Qty': entry.sale_qty || 0,
            'Purchase Qty': entry.purchase_qty || 0,
            'Staff': entry.staff || '',
            'User': entry.users || '',
            'Entry Time': formattedEntryTime,
            'Approved': entry.approved ? 'Yes' : 'No',
            'Edited': entry.edited ? 'Yes' : 'No',
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
            headers.map(header => {
              const value = row[header];
              // Escape quotes and wrap in quotes
              const escapedValue = String(value).replace(/"/g, '""');
              return `"${escapedValue}"`;
            }).join(',')
          )
        ].join('\n');

        // Add BOM for Excel to properly recognize UTF-8 and date formats
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thirumala-entries-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${exportFormat.toUpperCase()} export completed!`);
      } else if (exportFormat === 'pdf') {
        // Export to PDF - use the current filtered entries
        const currentEntries = entries.length > 0 ? entries : await supabaseDB.getCashBookEntries();
        
        if (currentEntries.length === 0) {
          toast.error('No data to export');
          return;
        }

        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('Thirumala Group - Cash Book Entries', 20, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 30);
        doc.text(`Total Entries: ${currentEntries.length}`, 20, 40);
        
        let yPosition = 60;
        
        // Add cash book entries
        doc.setFontSize(14);
        doc.text('Cash Book Entries', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(8);
        const headers = ['S.No', 'Date', 'Company', 'Account', 'Particulars', 'Credit', 'Debit'];
        let xPosition = 20;
        
        // Add headers
        headers.forEach(header => {
          doc.text(header, xPosition, yPosition);
          xPosition += 25;
        });
        yPosition += 5;
        
        // Add data (limited to fit on page)
        currentEntries.slice(0, 25).forEach((entry: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          xPosition = 20;
          doc.text(String(entry.sno || ''), xPosition, yPosition);
          xPosition += 25;
          doc.text(String(entry.c_date || ''), xPosition, yPosition);
          xPosition += 25;
          doc.text(String(entry.company_name || '').substring(0, 12), xPosition, yPosition);
          xPosition += 25;
          doc.text(String(entry.acc_name || '').substring(0, 12), xPosition, yPosition);
          xPosition += 25;
          doc.text(String(entry.particulars || '').substring(0, 15), xPosition, yPosition);
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
          const totalCredit = currentEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
          const totalDebit = currentEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
          doc.text(`Total Credit: ₹${totalCredit.toLocaleString()}`, 25, yPosition);
          yPosition += 4;
          doc.text(`Total Debit: ₹${totalDebit.toLocaleString()}`, 25, yPosition);
          yPosition += 4;
          doc.text(`Balance: ₹${(totalCredit - totalDebit).toLocaleString()}`, 25, yPosition);
        }
        
        doc.save(`thirumala-entries-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
        toast.success('PDF export completed!');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      case 'LOCK': return 'text-orange-600 bg-orange-100';
      case 'UNLOCK': return 'text-yellow-600 bg-yellow-100';
      case 'APPROVE': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
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
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Form</h1>
          <p className="text-gray-600">Search, edit, and manage cash book entries with complete history tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={Download}
            variant="secondary"
            onClick={() => {
              const format = window.prompt('Enter export format (csv or pdf):', 'csv');
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
            icon={RefreshCw}
            variant="secondary"
            onClick={async () => {
              await loadEntries();
              await loadAllHistory();
              toast.success('Data refreshed!');
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="col-span-1">
            <Select
              label="Company Name"
              value={filterCompanyName}
              onChange={setFilterCompanyName}
              options={companies}
              placeholder="Select company..."
            />
          </div>
          <div className="col-span-1">
            <Select
              label="Account Name"
              value={filterAccountName}
              onChange={setFilterAccountName}
              options={accounts}
              placeholder="Select account..."
            />
          </div>
          <div className="col-span-1">
            <Select
              label="Sub Account"
              value={filterSubAccount}
              onChange={setFilterSubAccount}
              options={subAccounts}
              placeholder="Select sub account..."
            />
          </div>
          <div className="col-span-1">
            <Select
              label="Particulars"
              value={filterParticulars}
              onChange={setFilterParticulars}
              options={particularsOptions}
              placeholder="Select particulars..."
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Sale Qty"
              type="number"
              value={filterSaleQ}
              onChange={setFilterSaleQ}
              placeholder="Enter sale quantity"
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Purchase Qty"
              type="number"
              value={filterPurchaseQ}
              onChange={setFilterPurchaseQ}
              placeholder="Enter purchase quantity"
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Credit"
              type="number"
              value={filterCredit}
              onChange={setFilterCredit}
              placeholder="Enter credit amount"
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Debit"
              type="number"
              value={filterDebit}
              onChange={setFilterDebit}
              placeholder="Enter debit amount"
            />
          </div>
          <div className="col-span-1">
            <Select
              label="Staff"
              value={filterStaff}
              onChange={setFilterStaff}
              options={users}
              placeholder="Select staff..."
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Date"
              type="date"
              value={filterDate}
              onChange={setFilterDate}
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Search"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search entries..."
            />
          </div>
          <div className="col-span-1">
            <Select
              label="Status Filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </div>
          <div className="col-span-1 flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setStatusFilter('');
                setFilterCompanyName('');
                setFilterAccountName('');
                setFilterSubAccount('');
                setFilterParticulars('');
                setFilterSaleQ('');
                setFilterPurchaseQ('');
                setFilterCredit('');
                setFilterDebit('');
                setFilterStaff('');
                setFilterDate('');
              }}
              variant="secondary"
              className="w-full"
              icon={Filter}
            >
              Clear Filters
            </Button>
          </div>
          <div className="col-span-1 flex items-end">
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 w-full text-center">
              <strong>{entries.length}</strong> entries found
            </div>
          </div>
        </div>
      </Card>



      {/* Entries List - Flex Row Card Layout */}
      <Card title="Cash Book Entries" subtitle={`Manage and edit your transaction records`} className="p-6 mb-6">
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No entries found matching your criteria.</div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`group border rounded-xl shadow-md px-4 py-2 transition-shadow hover:shadow-lg bg-white relative flex flex-row items-center gap-3 ${entry.lock_record ? 'opacity-80 bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}`}
                style={{ cursor: 'pointer' }}
              >
                <span className="font-bold text-blue-700 min-w-[40px]">#{entry.sno}</span>
                <span className="text-sm text-gray-600 min-w-[140px]"><Calendar className="w-4 h-4 inline mr-1" /> {format(new Date(entry.c_date), 'MMM dd, yyyy')}</span>
                <span className="font-bold text-blue-900 bg-blue-50 rounded px-2 py-1" title={entry.company_name}><Building className="w-4 h-4 mr-1 inline" />{entry.company_name}</span>
                <span className="font-semibold text-indigo-900 bg-indigo-50 rounded px-2 py-1" title={entry.acc_name}><FileText className="w-4 h-4 mr-1 inline" />{entry.acc_name}</span>
                <span className="font-semibold text-purple-900 bg-purple-50 rounded px-2 py-1" title={entry.sub_acc_name}><User className="w-4 h-4 mr-1 inline" />{entry.sub_acc_name}</span>
                <span className="text-gray-800 font-medium max-w-[180px] truncate" title={entry.particulars}>{entry.particulars}</span>
                <span className="text-green-700 font-semibold"><Calculator className="w-4 h-4 inline" /> ₹{entry.credit.toLocaleString()}</span>
                <span className="text-red-700 font-semibold"><Calculator className="w-4 h-4 inline" /> ₹{entry.debit.toLocaleString()}</span>
                <span className="text-sm text-gray-700">{entry.staff}</span>
                {entry.lock_record && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Lock className="w-3 h-3 mr-1" />Locked</span>
                )}
                {entry.edited && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Edited ({entry.editCount}x)</span>
                )}
                {entry.approved ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Pending</span>
                )}
                {isAdmin && (
                  <Button size="sm" variant="secondary" icon={entry.lock_record ? Unlock : Lock} onClick={() => { toggleLock(entry); }}>{entry.lock_record ? 'Unlock' : 'Lock'}</Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => printVoucher(entry)}>
                  Voucher
                </Button>
                <Button size="sm" icon={Edit} onClick={() => { handleEdit(entry); }} disabled={entry.lock_record && !isAdmin}><span className="sr-only">Edit</span></Button>
                {isAdmin && (
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => { handleDelete(entry); }} disabled={entry.lock_record}><span className="sr-only">Delete</span></Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Entry History
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={X}
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-4">
                {entryHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No history found for this entry.</div>
                ) : (
                  entryHistory.map((history) => (
                    <div key={history.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(history.action)}`}>
                            {history.action}
                          </span>
                          <span className="font-medium text-gray-900">by {history.editedBy}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {history.editedAt ? format(new Date(history.editedAt), 'MMM dd, yyyy HH:mm:ss') : 'Unknown time'}
                        </div>
                      </div>

                      {history.changes && history.changes.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-700">Changes Made:</h5>
                          {history.changes.map((change, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                              <div className="font-medium text-gray-700 mb-1">{change.field}:</div>
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded">
                                  {String(change.oldValue)}
                                </span>
                                <span>→</span>
                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
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

      {/* Edit Modal - Use Two Column Grid and Sticky Save/Cancel Bar */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Entry' : 'View Entry'} #{selectedEntry.sno}
                </h3>
                <div className="flex items-center gap-2">
                  {!editMode && !selectedEntry.lock_record && (
                    <Button
                      size="sm"
                      icon={Edit}
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={X}
                    onClick={handleCancel}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <Input
                    label="Date"
                    type="date"
                    value={selectedEntry.c_date}
                    onChange={(value) => handleInputChange('c_date', value)}
                    disabled={!editMode || selectedEntry.lock_record}
                  />
                  <Select
                    label="Company Name"
                    value={selectedEntry.company_name}
                    onChange={(value) => handleInputChange('company_name', value)}
                    options={companies}
                    disabled={!editMode || selectedEntry.lock_record}
                  />
                  <Select
                    label="Staff"
                    value={selectedEntry.staff}
                    onChange={(value) => handleInputChange('staff', value)}
                    options={users}
                    disabled={!editMode || selectedEntry.lock_record}
                  />
                  <Select
                    label="Main Account"
                    value={selectedEntry.acc_name}
                    onChange={(value) => handleInputChange('acc_name', value)}
                    options={accounts}
                    disabled={!editMode || selectedEntry.lock_record}
                  />
                  <Select
                    label="Sub Account"
                    value={selectedEntry.sub_acc_name || ''}
                    onChange={(value) => handleInputChange('sub_acc_name', value)}
                    options={subAccounts}
                    disabled={!editMode || selectedEntry.lock_record}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Particulars
                    </label>
                    <textarea
                      value={selectedEntry.particulars || ''}
                      onChange={(e) => handleInputChange('particulars', e.target.value)}
                      disabled={!editMode || selectedEntry.lock_record}
                      rows={3}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-base min-h-12"
                    />
                  </div>
                  <Input
                    label="Sale Quantity"
                    type="number"
                    value={selectedEntry.sale_qty}
                    onChange={(value) => handleInputChange('sale_qty', parseFloat(value) || 0)}
                    disabled={!editMode || selectedEntry.lock_record}
                    className="min-h-12 text-base"
                    placeholder="Enter sale quantity"
                  />
                  <Input
                    label="Purchase Quantity"
                    type="number"
                    value={selectedEntry.purchase_qty || 0}
                    onChange={(value) => handleInputChange('purchase_qty', parseFloat(value) || 0)}
                    disabled={!editMode || selectedEntry.lock_record}
                    placeholder="Enter purchase quantity"
                  />
                  <Input
                    label="Credit Amount"
                    type="number"
                    value={selectedEntry.credit}
                    onChange={(value) => handleInputChange('credit', parseFloat(value) || 0)}
                    disabled={!editMode || selectedEntry.lock_record}
                    className={selectedEntry.credit > 0 ? 'border-green-300 bg-green-50' : ''}
                    placeholder="Enter credit amount"
                  />
                  <Input
                    label="Debit Amount"
                    type="number"
                    value={selectedEntry.debit}
                    onChange={(value) => handleInputChange('debit', parseFloat(value) || 0)}
                    disabled={!editMode || selectedEntry.lock_record}
                    className={selectedEntry.debit > 0 ? 'border-red-300 bg-red-50' : ''}
                    placeholder="Enter debit amount"
                  />
                </div>
              </div>
              {/* Entry Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg mt-8">
                <h4 className="font-medium text-gray-900 mb-3">Entry Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Entry Time:</span>
                    <div>{format(new Date(selectedEntry.entry_time), 'MMM dd, yyyy HH:mm:ss')}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created By:</span>
                    <div>{selectedEntry.users}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Edit Count:</span>
                    <div>{selectedEntry.e_count}</div>
                  </div>
                </div>
                {selectedEntry.edited && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-700">Last Edited:</span>
                    <div>on {format(new Date(selectedEntry.updated_at), 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                )}
              </div>
              {/* Sticky Save/Cancel Bar */}
              {editMode && (
                <div className="sticky bottom-0 left-0 right-0 bg-white py-4 flex gap-4 border-t border-gray-200 mt-8 z-10">
                  <Button
                    icon={Check}
                    onClick={handleSave}
                    disabled={!editMode || selectedEntry.lock_record || loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEntry;