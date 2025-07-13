import React, { useState, useEffect } from 'react';
import { 
  Edit, Search, Check, X, Eye, Lock, Unlock, Trash2, 
  History, Clock, User, Calendar, FileText, AlertTriangle,
  ChevronDown, ChevronUp, Filter, Download, RefreshCw
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

  useEffect(() => {
    const initializeData = async () => {
      await loadEntries();
      await loadDropdownData();
      await loadAllHistory();
    };
    
    initializeData();
  }, [searchTerm, dateFilter, statusFilter]);

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
    await loadAccountsByCompany(entry.company_name);
    await loadSubAccountsByAccount(entry.company_name, entry.acc_name);
  };

  const handleSave = async () => {
    if (!selectedEntry) return;

    setLoading(true);
    try {
      const updatedEntry = await supabaseDB.updateCashBookEntry(
        selectedEntry.id, 
        selectedEntry, 
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
        const success = await supabaseDB.deleteCashBookEntry(entry.id);
        if (success) {
          await loadEntries();
          await loadAllHistory();
          toast.success('Entry deleted successfully!');
        } else {
          toast.error('Failed to delete entry');
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry');
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

    // TODO: Implement lock/unlock functionality in Supabase
    toast.success('Lock/unlock functionality not yet implemented in Supabase');
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

  const exportData = async (exportFormat: 'json' | 'excel' | 'pdf' = 'json') => {
    try {
      const data = await supabaseDB.exportData();
      
      if (exportFormat === 'excel') {
        // Export to Excel - use the current filtered entries instead of all data
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
        toast.success('Excel export completed!');
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Form</h1>
          <p className="text-gray-600">Search, edit, and manage cash book entries with complete history tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={History}
            variant="secondary"
            onClick={() => setShowAllActivity(!showAllActivity)}
          >
            Activity Log
          </Button>
          <div className="flex items-center gap-2">
            <Button
              icon={Download}
              variant="secondary"
              onClick={() => exportData('excel')}
            >
              Export Excel
            </Button>
            <Button
              icon={Download}
              variant="secondary"
              onClick={() => exportData('pdf')}
            >
              Export PDF
            </Button>
          </div>
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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Date Filter"
              type="date"
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>
          <div className="flex-1">
            <Select
              label="Status Filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </div>
          <div className="flex-1 flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setStatusFilter('');
              }}
              variant="secondary"
              className="w-full"
              icon={Filter}
            >
              Clear Filters
            </Button>
          </div>
          <div className="flex-1 flex items-end">
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 w-full text-center">
              <strong>{entries.length}</strong> entries found
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Log Modal */}
      {showAllActivity && (
        <Card title="Complete Activity History" subtitle="All system activities and changes">
          <div className="max-h-96 overflow-y-auto space-y-3">
            {allHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No activity history found.</div>
            ) : (
              allHistory.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <span className="font-medium text-gray-900">Entry #{activity.sno}</span>
                        <span className="text-sm text-gray-500">by {activity.editedBy}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {activity.editedAt ? format(new Date(activity.editedAt), 'MMM dd, yyyy HH:mm:ss') : 'Unknown time'}
                      </div>

                      {activity.changes && activity.changes.length > 0 && (
                        <div className="space-y-1">
                          {activity.changes.map((change, index) => (
                            <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                              <strong>{change.field}:</strong> 
                              <span className="text-red-600 ml-1">{String(change.oldValue)}</span> 
                              → 
                              <span className="text-green-600 ml-1">{String(change.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setShowAllActivity(false)}>
              Close
            </Button>
          </div>
        </Card>
      )}

      {/* Entries List */}
      <Card title="Cash Book Entries" subtitle={`Manage and edit your transaction records`}>
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No entries found matching your criteria.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg ${
                  entry.locked ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                } hover:shadow-sm transition-shadow`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900">#{entry.sno}</h4>
                        <span className="text-sm font-medium text-blue-600">{entry.company_name}</span>
                        <span className="text-sm text-gray-500">→ {entry.acc_name}</span>
                        {entry.sub_acc_name && (
                          <span className="text-sm text-gray-500">→ {entry.sub_acc_name}</span>
                        )}
                        
                        {/* Status badges */}
                        {entry.locked && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </span>
                        )}
                        {entry.edited && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Edited ({entry.editCount}x)
                          </span>
                        )}
                        {entry.approved ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{entry.particulars}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <div>{format(new Date(entry.c_date), 'MMM dd, yyyy')}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Staff:</span>
                          <div>{entry.staff}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Credit:</span>
                          <div className="text-green-600 font-medium">₹{entry.credit.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Debit:</span>
                          <div className="text-red-600 font-medium">₹{entry.debit.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Sale Q:</span>
                          <div>{entry.sale_qty}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Purchase Q:</span>
                          <div>{entry.purchase_qty || 0}</div>
                        </div>
                      </div>

                      {entry.lastEditedBy && (
                        <div className="mt-2 text-xs text-gray-500">
                          Last edited by {entry.lastEditedBy} on {format(new Date(entry.lastEditedAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={expandedEntry === entry.id ? ChevronUp : ChevronDown}
                        onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                      >
                        Details
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={History}
                        onClick={() => {
                          loadEntryHistory(entry.id);
                          setShowHistory(true);
                        }}
                      >
                        History
                      </Button>

                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={entry.locked ? Unlock : Lock}
                          onClick={() => toggleLock(entry)}
                        >
                          {entry.locked ? 'Unlock' : 'Lock'}
                        </Button>
                      )}

                      {isAdmin && !entry.approved && (
                        <Button
                          size="sm"
                          variant="success"
                          icon={Check}
                          onClick={() => toggleApproval(entry)}
                        >
                          Approve
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Eye}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        View
                      </Button>
                      
                      <Button
                        size="sm"
                        icon={Edit}
                        onClick={() => handleEdit(entry)}
                        disabled={entry.locked && !isAdmin}
                      >
                        Edit
                      </Button>

                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => handleDelete(entry)}
                          disabled={entry.locked}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedEntry === entry.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">Entry Details</h5>
                          <div className="space-y-1">
                            <div><strong>Entry ID:</strong> {entry.id}</div>
                            <div><strong>Entry Time:</strong> {format(new Date(entry.entry_time), 'MMM dd, yyyy HH:mm:ss')}</div>
                            <div><strong>User:</strong> {entry.user}</div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="font-medium text-green-900 mb-2">Financial Summary</h5>
                          <div className="space-y-1">
                            <div><strong>Credit:</strong> ₹{entry.credit.toLocaleString()}</div>
                            <div><strong>Debit:</strong> ₹{entry.debit.toLocaleString()}</div>
                            <div><strong>Balance:</strong> ₹{(entry.credit - entry.debit).toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h5 className="font-medium text-purple-900 mb-2">Status Information</h5>
                          <div className="space-y-1">
                            <div><strong>Approved:</strong> {entry.approved ? 'Yes' : 'No'}</div>
                            <div><strong>Locked:</strong> {entry.locked ? 'Yes' : 'No'}</div>
                            <div><strong>Edit Count:</strong> {entry.editCount}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

      {/* Edit Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Entry' : 'View Entry'} #{selectedEntry.sno}
                </h3>
                <div className="flex items-center gap-2">
                  {!editMode && !selectedEntry.locked && (
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

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    value={selectedEntry.c_date}
                    onChange={(value) => handleInputChange('c_date', value)}
                    disabled={!editMode}
                  />
                  
                  <Select
                    label="Company Name"
                    value={selectedEntry.company_name}
                    onChange={(value) => handleInputChange('company_name', value)}
                    options={companies}
                    disabled={!editMode}
                  />
                  
                  <Select
                    label="Staff"
                    value={selectedEntry.staff}
                    onChange={(value) => handleInputChange('staff', value)}
                    options={users}
                    disabled={!editMode}
                  />
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Main Account"
                    value={selectedEntry.acc_name}
                    onChange={(value) => handleInputChange('acc_name', value)}
                    options={accounts}
                    disabled={!editMode}
                  />
                  
                  <Select
                    label="Sub Account"
                    value={selectedEntry.sub_acc_name || ''}
                    onChange={(value) => handleInputChange('sub_acc_name', value)}
                    options={subAccounts}
                    disabled={!editMode}
                  />
                </div>

                {/* Particulars */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Particulars
                  </label>
                  <textarea
                    value={selectedEntry.particulars || ''}
                    onChange={(e) => handleInputChange('particulars', e.target.value)}
                    disabled={!editMode}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Sale Quantity"
                    type="number"
                    value={selectedEntry.sale_qty}
                    onChange={(value) => handleInputChange('sale_qty', parseFloat(value) || 0)}
                    disabled={!editMode}
                  />

                  <Input
                    label="Purchase Quantity"
                    type="number"
                    value={selectedEntry.purchase_qty || 0}
                    onChange={(value) => handleInputChange('purchase_qty', parseFloat(value) || 0)}
                    disabled={!editMode}
                  />
                  
                  <Input
                    label="Credit Amount"
                    type="number"
                    value={selectedEntry.credit}
                    onChange={(value) => handleInputChange('credit', parseFloat(value) || 0)}
                    disabled={!editMode}
                    className={selectedEntry.credit > 0 ? 'border-green-300 bg-green-50' : ''}
                  />
                  
                  <Input
                    label="Debit Amount"
                    type="number"
                    value={selectedEntry.debit}
                    onChange={(value) => handleInputChange('debit', parseFloat(value) || 0)}
                    disabled={!editMode}
                    className={selectedEntry.debit > 0 ? 'border-red-300 bg-red-50' : ''}
                  />
                </div>

                {/* Entry Metadata */}
                <div className="bg-gray-50 p-4 rounded-lg">
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

                {editMode && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Button
                      icon={Check}
                      onClick={handleSave}
                      disabled={loading}
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
        </div>
      )}
    </div>
  );
};

export default EditEntry;