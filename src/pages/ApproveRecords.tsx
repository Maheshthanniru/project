import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Users,
  CheckCircle,
  X,
  Eye,
  Download,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ApprovalFilters {
  date: string;
  company: string;
  staff: string;
  showUnfiltered: boolean;
}

const ApproveRecords: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [filters, setFilters] = useState<ApprovalFilters>({
    date: format(new Date(), 'yyyy-MM-dd'),
    company: '',
    staff: '',
    showUnfiltered: false,
  });

  const [entries, setEntries] = useState<any[]>([]);
  const [deletedEntries, setDeletedEntries] = useState<any[]>([]);
  const [rejectedEntries, setRejectedEntries] = useState<any[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set()
  );
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Add debounce timer for filter changes
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(entries.length / recordsPerPage);

  // Dropdown data
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [staffList, setStaffList] = useState<
    { value: string; label: string }[]
  >([]);

  // Summary data
  const [summary, setSummary] = useState({
    totalRecords: 0,
    approvedRecords: 0,
    pendingRecords: 0,
    deletedRecords: 0,
    rejectedRecords: 0,
    selectedCount: 0,
  });

  useEffect(() => {
    if (!isAdmin) {
      setFetchError('Access denied. Only admins can approve records.');
      toast.error('Access denied. Only admins can approve records.');
      return;
    }
    loadDropdownData();
    loadEntries();
  }, [isAdmin]);

  // Remove this useEffect since we're now doing server-side filtering
  // The filtering is handled directly in loadEntries() when filters change

  useEffect(() => {
    updateSummary();
  }, [entries, selectedEntries]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);

      // Load staff
      const users = await supabaseDB.getUsers();
      const usersData = users
        .filter(u => u.is_active)
        .map(user => ({
          value: user.username,
          label: user.username,
        }));
      setStaffList([{ value: '', label: 'All Staff' }, ...usersData]);
    } catch (error) {
      setFetchError('Failed to load dropdown data');
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const updateRecordsForTesting = async () => {
    try {
      console.log('🔄 Updating records for testing...');
      const result = await supabaseDB.updateRecordsForTesting();
      if (result.success) {
        toast.success('Records updated for testing successfully!');
        await loadEntries(); // Reload the entries
      } else {
        toast.error(result.error || 'Failed to update records');
      }
    } catch (error) {
      console.error('Error updating records:', error);
      toast.error('Failed to update records');
    }
  };

  const createTestRecords = async () => {
    try {
      console.log('🔄 Creating test records for approval...');
      const result = await supabaseDB.createTestApprovalRecords();
      if (result.success) {
        toast.success('Test records created successfully!');
        await loadEntries(); // Reload the entries
      } else {
        toast.error(result.error || 'Failed to create test records');
      }
    } catch (error) {
      console.error('Error creating test records:', error);
      toast.error('Failed to create test records');
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log('🔄 Loading approval records with server-side optimization...');
      
      // Use server-side filtering for better performance
      const result = await supabaseDB.getApprovalRecords({
        date: filters.date || undefined,
        company: filters.company || undefined,
        staff: filters.staff || undefined,
        includeDeleted: true, // Always include deleted records
      });

      console.log('✅ Approval records loaded:', result);
      console.log('🔍 Deleted entries received:', result.deletedEntries?.length || 0);
      console.log('🔍 Deleted entries data:', result.deletedEntries);

      setEntries(result.entries);
      setDeletedEntries(result.deletedEntries);
      setRejectedEntries(result.rejectedEntries || []);
      
      // Update summary with server-calculated values
      setSummary(prev => ({
        ...prev,
        totalRecords: result.summary.totalRecords,
        approvedRecords: result.summary.approvedRecords,
        pendingRecords: result.summary.pendingRecords,
        deletedRecords: result.summary.deletedRecords,
        rejectedRecords: result.summary.rejectedRecords,
      }));

      if (!result.entries || result.entries.length === 0) {
        setFetchError('No entries found matching the current filters.');
      } else {
        setFetchError(null);
      }
    } catch (error) {
      setFetchError('Failed to load entries from the database.');
      console.error('[ApproveRecords] Error loading entries:', error);
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Since we're now doing server-side filtering, we just need to reload the data
    // when filters change. The filtering is handled in loadEntries().
    console.log('[ApproveRecords] Filters changed, reloading data...', filters);
    
    setFilterLoading(true);
    
    // Add a small delay to prevent rapid successive calls
    setTimeout(() => {
      loadEntries().finally(() => {
        setFilterLoading(false);
      });
    }, 100);
  };

  const updateSummary = () => {
    // Summary is now calculated server-side, we just need to update the selected count
    setSummary(prev => ({
      ...prev,
      selectedCount: selectedEntries.size,
    }));
  };

  const handleFilterChange = (field: keyof ApprovalFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear existing timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Set new timeout to apply filters after user stops typing
    filterTimeoutRef.current = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms delay
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(filters.date);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setFilters(prev => ({
      ...prev,
      date: format(newDate, 'yyyy-MM-dd'),
    }));
  };

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleViewEntry = async (entryId: string) => {
    try {
      const entry = await supabaseDB.getEntryById(entryId);
      if (entry) {
        setSelectedEntry(entry);
        setEditFormData({ ...entry });
        setIsEditing(false);
        setShowEntryModal(true);
      } else {
        toast.error('Failed to load entry details');
      }
    } catch (error) {
      console.error('Error loading entry details:', error);
      toast.error('Failed to load entry details');
    }
  };

  const handleEditEntry = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editFormData) return;
      
      const result = await supabaseDB.updateCashBookEntry(editFormData.id, editFormData);
      
      if (!result) {
        toast.error('Failed to update entry');
        return;
      }
      
      toast.success('Entry updated successfully');
      setIsEditing(false);
      
      // Reload entries to reflect changes
      await loadEntries();
      
      // Update the selected entry with new data
      setSelectedEntry(editFormData);
      
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(selectedEntry);
  };

  const handleFormChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      const result = await supabaseDB.approveEntry(entryId);
      if (result.success) {
        toast.success('Entry approved successfully');
        await loadEntries(); // Reload to update the list
      } else {
        toast.error(result.error || 'Failed to approve entry');
      }
    } catch (error) {
      console.error('Error approving entry:', error);
      toast.error('Failed to approve entry');
    }
  };

  const handleApproveDeletion = async (entryId: string) => {
    try {
      const result = await supabaseDB.approveDeletion(entryId);
      if (result.success) {
        toast.success('Deletion approved successfully');
        await loadEntries(); // Reload to update the list
      } else {
        toast.error(result.error || 'Failed to approve deletion');
      }
    } catch (error) {
      console.error('Error approving deletion:', error);
      toast.error('Failed to approve deletion');
    }
  };

  const handleRejectDeletion = async (entryId: string) => {
    try {
      const result = await supabaseDB.rejectDeletion(entryId);
      if (result.success) {
        toast.success('Deletion rejected - record restored to Edit Entry');
        await loadEntries(); // Reload to update the list
      } else {
        toast.error(result.error || 'Failed to reject deletion');
      }
    } catch (error) {
      console.error('Error rejecting deletion:', error);
      toast.error('Failed to reject deletion');
    }
  };

  const handleSelectAll = () => {
    const currentPageEntries = getCurrentPageEntries();
    const allSelected = currentPageEntries.every(entry =>
      selectedEntries.has(entry.id)
    );

    const newSelected = new Set(selectedEntries);

    if (allSelected) {
      // Deselect all on current page
      currentPageEntries.forEach(entry => newSelected.delete(entry.id));
    } else {
      // Select all on current page
      currentPageEntries.forEach(entry => newSelected.add(entry.id));
    }

    setSelectedEntries(newSelected);
  };

  const handleDirectApprove = async (entryId: string) => {
    try {
      setLoading(true);
      const success = await supabaseDB.toggleApproval(entryId);
      if (success) {
      toast.success('Record approved successfully!');
      await loadEntries(); // Reload to get updated data
      
      // Trigger dashboard refresh
      localStorage.setItem('dashboard-refresh', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      } else {
        toast.error('Failed to approve record');
      }
    } catch (error) {
      console.error('Error approving record:', error);
      toast.error('Error approving record');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectReject = async (entryId: string) => {
    try {
      setLoading(true);
      // For rejection, we'll set approved to false
      const { error } = await supabase
        .from('cash_book')
        .update({ approved: false })
        .eq('id', entryId);

      if (error) {
        throw error;
      }

      toast.success('Record rejected successfully!');
      await loadEntries(); // Reload to get updated data
      
      // Trigger dashboard refresh
      localStorage.setItem('dashboard-refresh', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } catch (error) {
      console.error('Error rejecting record:', error);
      toast.error('Error rejecting record');
    } finally {
      setLoading(false);
    }
  };

  const approveSelected = async () => {
    if (selectedEntries.size === 0) {
      toast.error('Please select entries to approve');
      return;
    }

    setLoading(true);
    try {
      console.log(`🔄 Approving ${selectedEntries.size} selected entries...`);
      
      // Use the new approveEntries function for better performance
      const result = await supabaseDB.approveEntries(Array.from(selectedEntries));

      if (result.success > 0) {
        await loadEntries(); // Reload data to reflect changes
        setSelectedEntries(new Set()); // Clear selection
        toast.success(`${result.success} entries approved successfully!`);
        
        // Trigger dashboard refresh
        localStorage.setItem('dashboard-refresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
        
        if (result.failed > 0) {
          toast.error(`${result.failed} entries failed to approve`);
        }
      } else {
        toast.error('Failed to approve entries');
      }
    } catch (error) {
      console.error('Error approving entries:', error);
      toast.error('Failed to approve entries');
    } finally {
      setLoading(false);
    }
  };

  const approveAllCompanywise = async () => {
    if (!filters.company) {
      toast.error('Please select a company first');
      return;
    }

    const companyEntries = entries.filter(
      entry =>
        entry.company_name === filters.company && entry.approved !== 'true'
    );

    if (companyEntries.length === 0) {
      toast.error('No pending entries found for this company');
      return;
    }

    if (
      window.confirm(
        `Approve all ${companyEntries.length} pending entries for ${filters.company}?`
      )
    ) {
      setLoading(true);
      try {
        let approvedCount = 0;

        for (const entry of companyEntries) {
          const result = await supabaseDB.toggleApproval(entry.id);
          if (result) {
            approvedCount++;
          }
        }

        if (approvedCount > 0) {
          await loadEntries();
          setSelectedEntries(new Set());
          toast.success(
            `${approvedCount} entries approved for ${filters.company}!`
          );
          
          // Trigger dashboard refresh
          localStorage.setItem('dashboard-refresh', Date.now().toString());
          window.dispatchEvent(new CustomEvent('dashboard-refresh'));
        }
      } catch (error) {
        toast.error('Failed to approve company entries');
      } finally {
        setLoading(false);
      }
    }
  };

  const approveAllStaffwise = async () => {
    if (!filters.staff) {
      toast.error('Please select staff first');
      return;
    }

    const staffEntries = entries.filter(
      entry => entry.staff === filters.staff && entry.approved !== 'true'
    );

    if (staffEntries.length === 0) {
      toast.error('No pending entries found for this staff member');
      return;
    }

    if (
      window.confirm(
        `Approve all ${staffEntries.length} pending entries for ${filters.staff}?`
      )
    ) {
      setLoading(true);
      try {
        let approvedCount = 0;

        for (const entry of staffEntries) {
          const result = await supabaseDB.toggleApproval(entry.id);
          if (result) {
            approvedCount++;
          }
        }

        if (approvedCount > 0) {
          await loadEntries();
          setSelectedEntries(new Set());
          toast.success(
            `${approvedCount} entries approved for ${filters.staff}!`
          );
          
          // Trigger dashboard refresh
          localStorage.setItem('dashboard-refresh', Date.now().toString());
          window.dispatchEvent(new CustomEvent('dashboard-refresh'));
        }
      } catch (error) {
        toast.error('Failed to approve staff entries');
      } finally {
        setLoading(false);
      }
    }
  };

  const approveAllWithoutConfirmation = async () => {
    const pendingEntries = entries.filter(
      entry => entry.approved !== 'true'
    );

    if (pendingEntries.length === 0) {
      toast.error('No pending entries to approve');
      return;
    }

    setLoading(true);
    try {
      let approvedCount = 0;

      for (const entry of pendingEntries) {
        const result = await supabaseDB.toggleApproval(entry.id);
        if (result) {
          approvedCount++;
        }
      }

      if (approvedCount > 0) {
        await loadEntries();
        setSelectedEntries(new Set());
        toast.success(
          `${approvedCount} entries approved without confirmation!`
        );
      }
    } catch (error) {
      toast.error('Failed to approve entries');
    } finally {
      setLoading(false);
    }
  };

  const approveAllWithConfirmation = async () => {
    const pendingEntries = entries.filter(
      entry => entry.approved !== 'true'
    );

    if (pendingEntries.length === 0) {
      toast.error('No pending entries to approve');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to approve all ${pendingEntries.length} pending entries?`
      )
    ) {
      setLoading(true);
      try {
        let approvedCount = 0;

        for (const entry of pendingEntries) {
          const result = await supabaseDB.toggleApproval(entry.id);
          if (result) {
            approvedCount++;
          }
        }

        if (approvedCount > 0) {
          await loadEntries();
          setSelectedEntries(new Set());
          toast.success(`${approvedCount} entries approved with confirmation!`);
          
          // Trigger dashboard refresh
          localStorage.setItem('dashboard-refresh', Date.now().toString());
          window.dispatchEvent(new CustomEvent('dashboard-refresh'));
        }
      } catch (error) {
        toast.error('Failed to approve entries');
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelApprove = async () => {
    if (selectedEntries.size === 0) {
      toast.error('Please select entries to reject');
      return;
    }
    setLoading(true);
    try {
      let rejectedCount = 0;
      for (const entryId of selectedEntries) {
        const { data, error } = await supabase
          .from('cash_book')
          .update({ approved: 'false', updated_at: new Date().toISOString() })
          .eq('id', entryId)
          .select()
          .single();
        console.log('Reject update result:', { data, error });
        if (!error && data) {
          rejectedCount++;
        }
      }
      if (rejectedCount > 0) {
        await loadEntries();
        setSelectedEntries(new Set());
        toast.success(`${rejectedCount} entries rejected successfully!`);
        
        // Trigger dashboard refresh
        localStorage.setItem('dashboard-refresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      } else {
        toast.error('Failed to reject entries');
      }
    } catch (error) {
      toast.error('Failed to reject entries');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    try {
      // Create a print-friendly version of the current page
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      const currentPageEntries = getCurrentPageEntries();
      const title = `Approve Records - ${filters.date}`;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                @page { margin: 1in; }
              }
              body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin: 0; }
              .subtitle { font-size: 16px; color: #666; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .approved { background-color: #d1fae5; }
              .pending { background-color: #fef3c7; }
              .summary { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Thirumala Group</h1>
              <p class="subtitle">Approve Records Report</p>
              <p>Date: ${filters.date} | Company: ${filters.company || 'All'} | Staff: ${filters.staff || 'All'}</p>
            </div>

            <div class="summary">
              <h3>Summary</h3>
              <p>Total Records: ${summary.totalRecords} | Approved: ${summary.approvedRecords} | Pending: ${summary.pendingRecords}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Account</th>
                  <th>Particulars</th>
                  <th>Credit</th>
                  <th>Debit</th>
                  <th>Staff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${currentPageEntries
                  .map(
                    (entry, index) => `
                  <tr class="${entry.approved ? 'approved' : 'pending'}">
                    <td>${entry.sno}</td>
                    <td>${entry.c_date}</td>
                    <td>${entry.company_name || ''}</td>
                    <td>${entry.acc_name || ''}</td>
                    <td>${entry.particulars || ''}</td>
                    <td>${entry.credit || 0}</td>
                    <td>${entry.debit || 0}</td>
                    <td>${entry.staff || ''}</td>
                    <td>${entry.approved ? 'Approved' : 'Pending'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated by Thirumala Group Business Management System</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast.success('Print dialog opened');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to open print dialog');
    }
  };

  const printAll = () => {
    try {
      // Create a print-friendly version of all filtered records
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      const title = `All Approve Records - ${filters.date}`;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                @page { margin: 1in; }
              }
              body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin: 0; }
              .subtitle { font-size: 16px; color: #666; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .approved { background-color: #d1fae5; }
              .pending { background-color: #fef3c7; }
              .summary { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
              .page-break { page-break-before: always; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Thirumala Group</h1>
              <p class="subtitle">All Approve Records Report</p>
              <p>Date: ${filters.date} | Company: ${filters.company || 'All'} | Staff: ${filters.staff || 'All'}</p>
            </div>

            <div class="summary">
              <h3>Summary</h3>
              <p>Total Records: ${summary.totalRecords} | Approved: ${summary.approvedRecords} | Pending: ${summary.pendingRecords}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Account</th>
                  <th>Particulars</th>
                  <th>Credit</th>
                  <th>Debit</th>
                  <th>Staff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${entries
                  .map(
                    (entry, index) => `
                  <tr class="${entry.approved ? 'approved' : 'pending'}">
                    <td>${entry.sno}</td>
                    <td>${entry.c_date}</td>
                    <td>${entry.company_name || ''}</td>
                    <td>${entry.acc_name || ''}</td>
                    <td>${entry.particulars || ''}</td>
                    <td>${entry.credit || 0}</td>
                    <td>${entry.debit || 0}</td>
                    <td>${entry.staff || ''}</td>
                    <td>${entry.approved ? 'Approved' : 'Pending'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated by Thirumala Group Business Management System</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast.success('Print all dialog opened');
    } catch (error) {
      console.error('Print all error:', error);
      toast.error('Failed to open print all dialog');
    }
  };

  const closeWindow = () => {
    // Close the current window/tab
    window.close();
  };

  const getCurrentPageEntries = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return entries.slice(startIndex, endIndex);
  };

  const getRowColor = (entry: any) => {
    if (entry.approved === true || entry.approved === 'true')
      return 'bg-green-50 border-green-200';
    return 'bg-yellow-50 border-yellow-300';
  };

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Access Denied
          </h2>
          <p className='text-gray-600'>
            Only administrators can access the approval system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {loading && (
        <div className='text-center py-8 text-blue-600 font-semibold'>
          Loading records...
        </div>
      )}
      {filterLoading && !loading && (
        <div className='text-center py-4 text-blue-500 text-sm'>
          Updating filters...
        </div>
      )}
      {fetchError && !loading && (
        <div className='text-center py-8 text-red-600 font-semibold'>
          {fetchError}
        </div>
      )}
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Approve Records</h1>
          <p className='text-gray-600'>
            Review and approve pending cash book entries
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button variant='secondary' onClick={updateRecordsForTesting}>
            Update Records for Testing
          </Button>
          <Button variant='secondary' onClick={createTestRecords}>
            Create Test Records
          </Button>
          <Button variant='secondary' onClick={loadEntries}>
            Refresh
          </Button>
          <Button variant='secondary' onClick={printReport}>
            Print
          </Button>
          <Button variant='secondary' onClick={printAll}>
            Print All
          </Button>
          <Button variant='secondary' onClick={closeWindow}>
            Close
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 gap-y-4'>
          {/* Date Navigation */}
          <div className='md:col-span-2 w-full'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date
            </label>
            <div className='flex items-center gap-2 w-full'>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => navigateDate('prev')}
                className='px-3'
              >
                Previous
              </Button>
              <Input
                type='date'
                value={filters.date}
                onChange={value => handleFilterChange('date', value)}
                className='flex-1 w-full'
              />
              <Button
                size='sm'
                variant='secondary'
                onClick={() => navigateDate('next')}
                className='px-3'
              >
                Next
              </Button>
            </div>
          </div>
          {/* Company Filter */}
          <div className='w-full'>
            <Select
              label='Company'
              value={filters.company}
              onChange={value => handleFilterChange('company', value)}
              options={companies}
              className='w-full'
            />
          </div>
          {/* Staff Filter */}
          <div className='w-full'>
            <Select
              label='Staff'
              value={filters.staff}
              onChange={value => handleFilterChange('staff', value)}
              options={staffList}
              className='w-full'
            />
          </div>
          {/* Record Count */}
          <div className='flex items-end w-full'>
            <div className='text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 w-full text-center'>
              <strong>{summary.totalRecords}</strong> records
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Actions */}
      <Card className='bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'>
        <div className='grid grid-cols-1 md:grid-cols-6 gap-3'>
          <Button
            onClick={approveAllCompanywise}
            className='bg-blue-600 hover:bg-blue-700 text-sm'
            disabled={!filters.company || loading}
          >
            Approve All Companywise
          </Button>

          <Button
            onClick={approveAllStaffwise}
            className='bg-purple-600 hover:bg-purple-700 text-sm'
            disabled={!filters.staff || loading}
          >
            Approve All Staffwise
          </Button>

          <Button
            onClick={approveAllWithoutConfirmation}
            className='bg-orange-600 hover:bg-orange-700 text-sm'
            disabled={loading}
          >
            Approve All Without Confirmation
          </Button>

          <Button
            onClick={approveAllWithConfirmation}
            className='bg-green-600 hover:bg-green-700 text-sm'
            disabled={loading}
          >
            Approve All With Confirmation
          </Button>

          <Button
            onClick={cancelApprove}
            variant='secondary'
            className='text-sm'
          >
            Cancel Approve
          </Button>

          <Button
            onClick={approveSelected}
            className='bg-indigo-600 hover:bg-indigo-700 text-sm'
            disabled={selectedEntries.size === 0 || loading}
          >
            Approve Selected ({selectedEntries.size})
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
        <Card className='bg-gradient-to-r from-blue-500 to-blue-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100 text-sm font-medium'>Total Records</p>
              <p className='text-2xl font-bold'>{summary.totalRecords}</p>
            </div>
            <FileText className='w-8 h-8 text-blue-200' />
          </div>
        </Card>

        <Card className='bg-white text-gray-900'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-700 text-sm font-medium'>Approved</p>
              <p className='text-2xl font-bold'>{summary.approvedRecords}</p>
            </div>
            <CheckCircle className='w-8 h-8 text-green-500' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-orange-500 to-orange-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-orange-100 text-sm font-medium'>Pending</p>
              <p className='text-2xl font-bold'>{summary.pendingRecords}</p>
            </div>
            <Clock className='w-8 h-8 text-orange-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-red-500 to-red-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-100 text-sm font-medium'>Deleted Pending</p>
              <p className='text-2xl font-bold'>{summary.deletedRecords}</p>
            </div>
            <Trash2 className='w-8 h-8 text-red-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-gray-500 to-gray-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-100 text-sm font-medium'>Rejected</p>
              <p className='text-2xl font-bold'>{summary.rejectedRecords}</p>
            </div>
            <X className='w-8 h-8 text-gray-200' />
          </div>
        </Card>

        <Card className='bg-gradient-to-r from-purple-500 to-purple-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100 text-sm font-medium'>Selected</p>
              <p className='text-2xl font-bold'>{summary.selectedCount}</p>
            </div>
            <Users className='w-8 h-8 text-purple-200' />
          </div>
        </Card>
      </div>

      {/* Records Table */}
      {!loading && !fetchError && (
        <Card
          title='Deleted Records - Pending Approval'
          subtitle={`Showing ${getCurrentPageEntries().length} of ${entries.length} deleted records`}
        >
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <input
                      type='checkbox'
                      checked={
                        selectedEntries.size === entries.length &&
                        entries.length > 0
                      }
                      onChange={handleSelectAll}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Company
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Staff
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {getCurrentPageEntries().map(entry => (
                  <tr
                    key={entry.id}
                    className={`${getRowColor(entry)} cursor-pointer hover:bg-gray-50 transition-colors`}
                    onClick={e => {
                      // Don't trigger row click if clicking on checkbox or buttons
                      if (
                        (e.target as HTMLElement).closest(
                          'input[type="checkbox"]'
                        ) ||
                        (e.target as HTMLElement).closest('button')
                      ) {
                        return;
                      }
                      handleSelectEntry(entry.id);
                    }}
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <input
                        type='checkbox'
                        checked={selectedEntries.has(entry.id)}
                        onChange={e => {
                          e.stopPropagation(); // Prevent row click
                          handleSelectEntry(entry.id);
                        }}
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {entry.c_date}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.company_name}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.staff}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.credit > 0
                        ? `₹${entry.credit.toLocaleString()}`
                        : `₹${entry.debit.toLocaleString()}`}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.credit > 0 ? 'Credit' : 'Debit'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.status === 'deleted-pending' ? (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                          Deleted - Pending Approval
                        </span>
                      ) : entry.status === 'rejected' ? (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                          Rejected
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800'>
                          {entry.status || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleApproveDeletion(entry.id);
                        }}
                        className='mr-2'
                        disabled={entry.status !== 'deleted-pending'}
                      >
                        Approve Deletion
                      </Button>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleRejectDeletion(entry.id);
                        }}
                        className='mr-2'
                        disabled={entry.status !== 'deleted-pending'}
                      >
                        Reject Deletion
                      </Button>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleViewEntry(entry.id);
                        }}
                        className='mr-2'
                        size='sm'
                      >
                        <Eye className='w-4 h-4 mr-1' />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between mt-4 px-2 py-3 sm:px-6'>
            <div className='flex-1 flex justify-between sm:hidden'>
              <Button
                variant='secondary'
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant='secondary'
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
              <div className='flex-1 text-sm text-center'>
                <p className='text-sm text-gray-700'>
                  Showing{' '}
                  <span className='font-semibold'>
                    {currentPage * recordsPerPage - recordsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className='font-semibold'>
                    {Math.min(
                      currentPage * recordsPerPage,
                      entries.length
                    )}
                  </span>{' '}
                  of{' '}
                  <span className='font-semibold'>
                    {entries.length}
                  </span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav
                  className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
                  aria-label='Pagination'
                >
                  <Button
                    variant='secondary'
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className='rounded-l-md'
                  >
                    Previous
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className='rounded-r-md'
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Deleted Records Table */}
      {!loading && !fetchError && deletedEntries.length > 0 && (
        <Card
          title='Deleted Records for Approval'
          subtitle={`Showing ${deletedEntries.length} deleted records`}
        >
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <input
                      type='checkbox'
                      checked={
                        selectedEntries.size === deletedEntries.length &&
                        deletedEntries.length > 0
                      }
                      onChange={() => {
                        if (selectedEntries.size === deletedEntries.length) {
                          setSelectedEntries(new Set());
                        } else {
                          setSelectedEntries(new Set(deletedEntries.map(entry => entry.id)));
                        }
                      }}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Company
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Staff
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {deletedEntries.map(entry => (
                  <tr
                    key={entry.id}
                    className='bg-red-50 hover:bg-red-100 transition-colors'
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <input
                        type='checkbox'
                        checked={selectedEntries.has(entry.id)}
                        onChange={e => {
                          e.stopPropagation();
                          handleSelectEntry(entry.id);
                        }}
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {entry.c_date}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.company_name}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.staff}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.credit > 0
                        ? `₹${entry.credit.toLocaleString()}`
                        : `₹${entry.debit.toLocaleString()}`}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.credit > 0 ? 'Credit' : 'Debit'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.approved === false && entry.edited === true
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.approved === false && entry.edited === true 
                          ? 'Deleted - Pending Approval' 
                          : 'Deleted - Pending Approval'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleViewEntry(entry.id);
                        }}
                        className='mr-2'
                        size='sm'
                      >
                        <Eye className='w-4 h-4 mr-1' />
                        View
                      </Button>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleApproveDeletion(entry.id);
                        }}
                        className='mr-2'
                        size='sm'
                      >
                        Approve Deletion
                      </Button>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleRejectDeletion(entry.id);
                        }}
                        size='sm'
                      >
                        Reject Deletion
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rejected Records Table */}
      {!loading && !fetchError && rejectedEntries.length > 0 && (
        <Card
          title='Rejected Records'
          subtitle={`Showing ${rejectedEntries.length} rejected records`}
        >
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <input
                      type='checkbox'
                      checked={
                        rejectedEntries.length > 0 &&
                        rejectedEntries.every(entry =>
                          selectedEntries.has(entry.id)
                        )
                      }
                      onChange={handleSelectAll}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Company
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Staff
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {rejectedEntries.map(entry => (
                  <tr
                    key={entry.id}
                    className='bg-yellow-50 hover:bg-yellow-100 transition-colors'
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <input
                        type='checkbox'
                        checked={selectedEntries.has(entry.id)}
                        onChange={e => {
                          e.stopPropagation();
                          handleSelectEntry(entry.id);
                        }}
                        className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {entry.c_date}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.company_name}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.staff}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {entry.credit > 0
                        ? `₹${entry.credit.toLocaleString()}`
                        : `₹${entry.debit.toLocaleString()}`}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                        Rejected
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleViewEntry(entry.id);
                        }}
                        className='mr-2'
                        size='sm'
                      >
                        <Eye className='w-4 h-4 mr-1' />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Entry Details Modal */}
      {showEntryModal && selectedEntry && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-2xl font-bold text-gray-900'>Entry Details</h2>
              <Button
                variant='secondary'
                onClick={() => setShowEntryModal(false)}
                size='sm'
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Basic Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Basic Information</h3>
                <div className='space-y-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>S.No</label>
                    {isEditing ? (
                      <Input
                        value={editFormData?.sno || ''}
                        onChange={(value) => handleFormChange('sno', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.sno}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Date</label>
                    {isEditing ? (
                      <Input
                        type='date'
                        value={editFormData?.c_date || ''}
                        onChange={(value) => handleFormChange('c_date', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.c_date}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Company Name</label>
                    {isEditing ? (
                      <Input
                        value={editFormData?.company_name || ''}
                        onChange={(value) => handleFormChange('company_name', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.company_name}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Staff</label>
                    {isEditing ? (
                      <Input
                        value={editFormData?.staff || ''}
                        onChange={(value) => handleFormChange('staff', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.staff}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Entry Time</label>
                    <p className='text-sm text-gray-900'>{selectedEntry.entry_time}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Account Information</h3>
                <div className='space-y-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Main Account</label>
                    {isEditing ? (
                      <Input
                        value={editFormData?.acc_name || ''}
                        onChange={(value) => handleFormChange('acc_name', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.acc_name}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Sub Account</label>
                    {isEditing ? (
                      <Input
                        value={editFormData?.sub_acc_name || ''}
                        onChange={(value) => handleFormChange('sub_acc_name', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.sub_acc_name}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Particulars</label>
                    {isEditing ? (
                      <Input
                        value={editFormData?.particulars || ''}
                        onChange={(value) => handleFormChange('particulars', value)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>{selectedEntry.particulars}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Financial Information</h3>
                <div className='space-y-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Credit</label>
                    {isEditing ? (
                      <Input
                        type='number'
                        value={editFormData?.credit || ''}
                        onChange={(value) => handleFormChange('credit', parseFloat(value) || 0)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-green-600 font-semibold'>₹{selectedEntry.credit.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Debit</label>
                    {isEditing ? (
                      <Input
                        type='number'
                        value={editFormData?.debit || ''}
                        onChange={(value) => handleFormChange('debit', parseFloat(value) || 0)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-red-600 font-semibold'>₹{selectedEntry.debit.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Credit Online</label>
                    {isEditing ? (
                      <Input
                        type='number'
                        value={editFormData?.credit_online || ''}
                        onChange={(value) => handleFormChange('credit_online', parseFloat(value) || 0)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>₹{selectedEntry.credit_online.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Credit Offline</label>
                    {isEditing ? (
                      <Input
                        type='number'
                        value={editFormData?.credit_offline || ''}
                        onChange={(value) => handleFormChange('credit_offline', parseFloat(value) || 0)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>₹{selectedEntry.credit_offline.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Debit Online</label>
                    {isEditing ? (
                      <Input
                        type='number'
                        value={editFormData?.debit_online || ''}
                        onChange={(value) => handleFormChange('debit_online', parseFloat(value) || 0)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>₹{selectedEntry.debit_online.toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Debit Offline</label>
                    {isEditing ? (
                      <Input
                        type='number'
                        value={editFormData?.debit_offline || ''}
                        onChange={(value) => handleFormChange('debit_offline', parseFloat(value) || 0)}
                        className='w-full'
                      />
                    ) : (
                      <p className='text-sm text-gray-900'>₹{selectedEntry.debit_offline.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Status Information</h3>
                <div className='space-y-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Approval Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEntry.approved === true ? 'bg-green-100 text-green-800' :
                      selectedEntry.approved === false ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedEntry.approved === true ? 'Approved' :
                       selectedEntry.approved === false ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Lock Record</label>
                    <p className='text-sm text-gray-900'>{selectedEntry.lock_record ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Edited</label>
                    <p className='text-sm text-gray-900'>{selectedEntry.edited ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Created At</label>
                    <p className='text-sm text-gray-900'>{new Date(selectedEntry.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Updated At</label>
                    <p className='text-sm text-gray-900'>{new Date(selectedEntry.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowEntryModal(false);
                  setIsEditing(false);
                }}
              >
                Close
              </Button>
              {isEditing ? (
                <>
                  <Button
                    variant='secondary'
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEditEntry}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  <Edit className='w-4 h-4 mr-2' />
                  Edit Entry
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveRecords;
