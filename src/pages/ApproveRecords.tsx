import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import SearchableSelect from '../components/UI/SearchableSelect';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Users,
  CheckCircle,
  X,
  AlertCircle,
  Trash2,
  Clock,
  AlertTriangle,
  RefreshCw,
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

  // Display date in dd/MM/yyyy for UI consistency with Daily Report
  const [displayDate, setDisplayDate] = useState<string>(format(new Date(), 'dd/MM/yyyy'));

  // Helpers to convert between display and internal formats
  const convertToInternalFormat = (ddMMyyyy: string): string => {
    if (!ddMMyyyy) return '';
    const parts = ddMMyyyy.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const convertToDisplayFormat = (yyyyMMdd: string): string => {
    if (!yyyyMMdd) return '';
    const parts = yyyyMMdd.split('-');
    if (parts.length !== 3) return '';
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const [entries, setEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [deletedEntries, setDeletedEntries] = useState<any[]>([]);
  const [filteredDeletedEntries, setFilteredDeletedEntries] = useState<any[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [viewEditing, setViewEditing] = useState(false);
  const [viewDraft, setViewDraft] = useState<any | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(filteredEntries.length / recordsPerPage);

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
    rejectedRecords: 0,
    pendingRecords: 0,
    selectedCount: 0,
  });
  const [deletedSummary, setDeletedSummary] = useState({
    totalRecords: 0,
    approvedDeleted: 0,
    rejectedDeleted: 0,
    pendingDeleted: 0,
  });

  useEffect(() => {
    console.log('[ApproveRecords] useEffect triggered, isAdmin:', isAdmin, 'user:', user);
    if (!isAdmin) {
      console.log('[ApproveRecords] User is not admin, setting access denied error');
      setFetchError('Access denied. Only admins can approve records.');
      toast.error('Access denied. Only admins can approve records.');
      return;
    }
    console.log('[ApproveRecords] User is admin, loading data...');
    loadDropdownData();
    loadEntries();
  }, [isAdmin]);

  useEffect(() => {
    const onRefresh = () => {
      // Add a small delay to ensure database operations are complete
      setTimeout(() => {
        console.log('[ApproveRecords] Dashboard refresh triggered, reloading entries...');
        loadEntries();
      }, 500);
    };
    window.addEventListener('dashboard-refresh', onRefresh);
    return () => window.removeEventListener('dashboard-refresh', onRefresh);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, filters]);

  useEffect(() => {
    updateSummary();
  }, [entries, deletedEntries, filters, selectedEntries]);

  // Keep display date in sync with internal filter date
  useEffect(() => {
    setDisplayDate(convertToDisplayFormat(filters.date) || format(new Date(), 'dd/MM/yyyy'));
  }, [filters.date]);

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


  const loadEntries = async () => {
    console.log('[ApproveRecords] loadEntries called');
    setLoading(true);
    setFetchError(null);
    
    try {
      console.log('[ApproveRecords] Starting to load entries...');
      // Server-side filtering for speed
      console.log('[ApproveRecords] Calling getFilteredCashBookEntries with filters:', filters);
      let { data: allEntries } = await supabaseDB.getFilteredCashBookEntries({
        companyName: filters.company || undefined,
      }, 1000, 0);
      console.log('[ApproveRecords] getFilteredCashBookEntries result:', allEntries);
      
      // Fallback to basic fetch if nothing returned (or undefined)
      if (!allEntries || allEntries.length === 0) {
        console.log('[ApproveRecords] No entries from filtered query, trying basic fetch...');
        allEntries = await supabaseDB.getCashBookEntries(1000, 0);
        console.log('[ApproveRecords] getCashBookEntries result:', allEntries);
      }
      console.log('[ApproveRecords] Final fetched entries:', allEntries?.length || 0, 'entries');

      // Debug: Check approval status of entries
      const pendingEntries = allEntries.filter(
        entry => {
          const approved = entry.approved;
          if (approved === null || approved === undefined) return true;
          if (typeof approved === 'boolean') return !approved;
          if (typeof approved === 'string') return approved === '' || approved === 'false';
          return false;
        }
      );
      console.log('[ApproveRecords] Pending entries:', pendingEntries);

      setEntries(allEntries);
      // Load deleted records as well
      console.log('[ApproveRecords] Fetching deleted records...');
      let deleted = await supabaseDB.getDeletedCashBook();
      console.log('[ApproveRecords] getDeletedCashBook result:', deleted);
      
      // Debug: Check approval status of deleted records
      if (deleted && deleted.length > 0) {
        console.log('[ApproveRecords] Deleted records approval status:');
        deleted.forEach((d, index) => {
          console.log(`[ApproveRecords] Deleted ${index}: id=${d.id}, approved=${d.approved}, type=${typeof d.approved}`);
        });
      }
      
      // Fallback: if none, attempt a direct minimal fetch to ensure visibility
      if (!deleted || deleted.length === 0) {
        console.log('[ApproveRecords] No deleted records from getDeletedCashBook, trying direct fetch...');
        try {
          const { data, error } = await supabase
            .from('deleted_cash_book')
            .select('*')
            .order('deleted_at', { ascending: false })
            .limit(1000);
          console.log('[ApproveRecords] Direct fetch result:', { data, error });
          if (error) {
            console.error('[ApproveRecords] Direct fetch error:', error);
            console.error('[ApproveRecords] Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          } else if (data) {
            deleted = data;
          }
        } catch (err) {
          console.error('[ApproveRecords] Exception in direct fetch:', err);
        }
      }
      console.log('[ApproveRecords] Final deleted entries:', deleted);
      setDeletedEntries(deleted || []);
      if (!allEntries || allEntries.length === 0) {
        setFetchError('No entries found in the database.');
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
    let filtered = [...entries];
    console.log(
      '[ApproveRecords] Applying filters:',
      filters,
      'Entries:',
      entries
    );

    // Date filter
    if (filters.date) {
      filtered = filtered.filter(entry => entry.c_date === filters.date);
    }

    // Company filter
    if (filters.company) {
      filtered = filtered.filter(
        entry => entry.company_name === filters.company
      );
    }

    // Staff filter
    if (filters.staff) {
      filtered = filtered.filter(entry => entry.staff === filters.staff);
    }

    // Base set for summary (date/company/staff), regardless of approval state
    const baseFiltered = filtered;

    // Only show pending records (not approved and not rejected) for main table
    const pendingFiltered = baseFiltered.filter(entry => {
      // Check if entry is truly pending (null, undefined, empty string, or 'false' string)
      // Exclude records that are explicitly approved (true or 'true') or rejected ('rejected')
      return (
        entry.approved === null ||
        entry.approved === undefined ||
        entry.approved === '' ||
        entry.approved === 'false' ||
        entry.approved === false
      ) && entry.approved !== 'rejected';
    });

    setFilteredEntries(pendingFiltered);
    setCurrentPage(1);
    if (pendingFiltered.length === 0) {
      setFetchError('No pending records found matching the selected filters.');
    } else {
      setFetchError(null);
    }

    // Apply same filters to deleted records
    let del = [...deletedEntries];
    if (filters.date) del = del.filter(d => d.c_date === filters.date);
    if (filters.company) del = del.filter(d => d.company_name === filters.company);
    if (filters.staff) del = del.filter(d => d.staff === filters.staff);
    // Show all deleted records that haven't been approved yet
    console.log('[ApproveRecords] Filtering deleted records...');
    console.log('[ApproveRecords] Total deleted records before filtering:', del.length);
    
    const pendingDeleted = del.filter(d => {
      const isPending = d.approved !== true && 
        d.approved !== 'true' && 
        d.approved !== 'rejected';
      console.log(`[ApproveRecords] Deleted record ${d.id}: approved=${d.approved}, type=${typeof d.approved}, isPending=${isPending}`);
      return isPending;
    });
    
    console.log('[ApproveRecords] Filtered deleted entries:', pendingDeleted);
    setFilteredDeletedEntries(pendingDeleted);

    // Summary will be updated by updateSummary function

    const totalDeleted = del.length;
    const approvedDeleted = del.filter(d => d.approved === true || d.approved === 'true').length;
    const rejectedDeleted = del.filter(d => d.approved === 'rejected').length;
    const pendingDeletedCount = totalDeleted - approvedDeleted - rejectedDeleted;
    setDeletedSummary({ totalRecords: totalDeleted, approvedDeleted, rejectedDeleted, pendingDeleted: pendingDeletedCount });
  };

  const updateSummary = () => {
    // Calculate summary from all entries (not just pending ones)
    let baseFiltered = [...entries];
    
    // Apply same filters as in applyFilters
    if (filters.date) {
      baseFiltered = baseFiltered.filter(entry => entry.c_date === filters.date);
    }
    if (filters.company) {
      baseFiltered = baseFiltered.filter(entry => entry.company_name === filters.company);
    }
    if (filters.staff) {
      baseFiltered = baseFiltered.filter(entry => entry.staff === filters.staff);
    }
    
    const approvedRecords = baseFiltered.filter(e => e.approved === true || e.approved === 'true').length;
    const rejectedRecords = baseFiltered.filter(e => e.approved === 'rejected').length;
    const totalRecords = baseFiltered.length;
    const pendingRecords = baseFiltered.filter(e => 
      (e.approved === null || 
      e.approved === undefined || 
      e.approved === '' ||
      e.approved === 'false' ||
      e.approved === false) && e.approved !== 'rejected'
    ).length;
    const selectedCount = selectedEntries.size;
    
    setSummary({
      totalRecords,
      approvedRecords,
      rejectedRecords,
      pendingRecords,
      selectedCount
    });

    // Calculate deleted records summary
    let deletedFiltered = [...deletedEntries];
    
    // Apply same filters to deleted records
    if (filters.date) {
      deletedFiltered = deletedFiltered.filter(d => d.c_date === filters.date);
    }
    if (filters.company) {
      deletedFiltered = deletedFiltered.filter(d => d.company_name === filters.company);
    }
    if (filters.staff) {
      deletedFiltered = deletedFiltered.filter(d => d.staff === filters.staff);
    }
    
    const approvedDeleted = deletedFiltered.filter(d => d.approved === true || d.approved === 'true').length;
    const rejectedDeleted = deletedFiltered.filter(d => d.approved === 'rejected').length;
    const totalDeleted = deletedFiltered.length;
    const pendingDeleted = deletedFiltered.filter(d => 
      (d.approved === null || 
      d.approved === undefined || 
      d.approved === '' ||
      d.approved === 'false' ||
      d.approved === false) && d.approved !== 'rejected'
    ).length;
    
    setDeletedSummary({
      totalRecords: totalDeleted,
      approvedDeleted,
      rejectedDeleted,
      pendingDeleted
    });
  };

  const handleFilterChange = (field: keyof ApprovalFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(filters.date);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    const internal = format(newDate, 'yyyy-MM-dd');
    setFilters(prev => ({
      ...prev,
      date: internal,
    }));
    setDisplayDate(convertToDisplayFormat(internal));
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
      
      // Directly set approved to true instead of toggling
      const { error } = await supabase
        .from('cash_book')
        .update({
          approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error approving record:', error);
        toast.error('Failed to approve record');
        return;
      }

      toast.success('Record approved successfully!');
      
      // Immediately remove the approved record from the local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      // Also reload to get updated data
      await loadEntries();
      
      // Trigger dashboard refresh
      localStorage.setItem('dashboard-refresh', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } catch (error) {
      console.error('Error approving record:', error);
      toast.error('Error approving record');
    } finally {
      setLoading(false);
    }
  };


  // Deleted records approve/reject handlers
  const handleDeletedApprove = async (id: string) => {
    try {
      setLoading(true);
      console.log('🗑️ Approving deleted record:', id);
      
      const { error } = await supabase
        .from('deleted_cash_book')
        .update({ approved: true })
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error approving deleted record:', error);
        throw error;
      }
      
      console.log('✅ Deleted record approved successfully');
      toast.success('Deleted record approved');
      
      // Update localStorage to mark the record as approved
      try {
        const deletedRecordsStr = localStorage.getItem('deleted_records');
        if (deletedRecordsStr) {
          const deletedRecords = JSON.parse(deletedRecordsStr);
          const updatedRecords = deletedRecords.map((record: any) => 
            record.id === id ? { ...record, approved: true } : record
          );
          localStorage.setItem('deleted_records', JSON.stringify(updatedRecords));
          console.log('✅ Updated localStorage with approved status');
        }
      } catch (error) {
        console.error('❌ Error updating localStorage:', error);
      }
      
      // Immediately remove the approved record from the local state and update summary
      setDeletedEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        // Update summary immediately after state change
        setTimeout(() => {
          updateSummary();
          // Also update deleted summary directly
          setDeletedSummary(prevSummary => ({
            ...prevSummary,
            totalRecords: prevSummary.totalRecords - 1,
            approvedDeleted: prevSummary.approvedDeleted + 1,
            pendingDeleted: prevSummary.pendingDeleted - 1
          }));
        }, 0);
        return updated;
      });
      
      // Update filtered list immediately
      setFilteredDeletedEntries(prev => prev.filter(entry => entry.id !== id));
      
      // Also reload to get updated data
      console.log('🔄 Reloading entries after approval...');
      await loadEntries();
      console.log('✅ Entries reloaded');
      
      // Trigger dashboard refresh
      localStorage.setItem('dashboard-refresh', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } catch (e) {
      console.error('Deleted approve error:', e);
      toast.error('Failed to approve deleted record');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletedReject = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('deleted_cash_book')
        .update({ approved: 'rejected' })
        .eq('id', id);
      if (error) throw error;
      toast.success('Deleted record rejected');
      
      // Update localStorage to mark the record as rejected
      try {
        const deletedRecordsStr = localStorage.getItem('deleted_records');
        if (deletedRecordsStr) {
          const deletedRecords = JSON.parse(deletedRecordsStr);
          const updatedRecords = deletedRecords.map((record: any) => 
            record.id === id ? { ...record, approved: 'rejected' } : record
          );
          localStorage.setItem('deleted_records', JSON.stringify(updatedRecords));
          console.log('✅ Updated localStorage with rejected status');
        }
      } catch (error) {
        console.error('❌ Error updating localStorage:', error);
      }
      
      // Immediately remove the rejected record from the local state and update summary
      setDeletedEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        // Update summary immediately after state change
        setTimeout(() => {
          updateSummary();
          // Also update deleted summary directly
          setDeletedSummary(prevSummary => ({
            ...prevSummary,
            totalRecords: prevSummary.totalRecords - 1,
            rejectedDeleted: prevSummary.rejectedDeleted + 1,
            pendingDeleted: prevSummary.pendingDeleted - 1
          }));
        }, 0);
        return updated;
      });
      
      // Update filtered list immediately
      setFilteredDeletedEntries(prev => prev.filter(entry => entry.id !== id));
      
      // Also reload to get updated data
      await loadEntries();
      
      // Trigger dashboard refresh
      localStorage.setItem('dashboard-refresh', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } catch (e) {
      console.error('Deleted reject error:', e);
      toast.error('Failed to reject deleted record');
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
      let approvedCount = 0;

      for (const entryId of selectedEntries) {
        const { error } = await supabase
          .from('cash_book')
          .update({
            approved: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entryId);

        if (!error) {
          approvedCount++;
        }
      }

      if (approvedCount > 0) {
        await loadEntries();
        setSelectedEntries(new Set());
        toast.success(`${approvedCount} entries approved successfully!`);
        
        // Trigger dashboard refresh
        localStorage.setItem('dashboard-refresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      } else {
        toast.error('Failed to approve entries');
      }
    } catch (error) {
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

    const companyEntries = filteredEntries.filter(
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
          const { error } = await supabase
            .from('cash_book')
            .update({
              approved: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entry.id);

          if (!error) {
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

    const staffEntries = filteredEntries.filter(
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
          const { error } = await supabase
            .from('cash_book')
            .update({
              approved: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entry.id);

          if (!error) {
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
    const pendingEntries = filteredEntries.filter(
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
        const { error } = await supabase
          .from('cash_book')
          .update({
            approved: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entry.id);

        if (!error) {
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
    const pendingEntries = filteredEntries.filter(
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
          const { error } = await supabase
            .from('cash_book')
            .update({
              approved: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entry.id);

          if (!error) {
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
              <p>Total Records: ${summary.totalRecords} | Approved: ${summary.approvedRecords} | Rejected: ${summary.rejectedRecords} | Pending: ${summary.pendingRecords}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Account</th>
                  <th>Sub Account</th>
                  <th>Particulars</th>
                  <th>Credit</th>
                  <th>Debit</th>
                </tr>
              </thead>
              <tbody>
                ${currentPageEntries
                  .map(
                    (entry, index) => `
                  <tr class="${entry.approved ? 'approved' : 'pending'}">
                    <td>${index + 1}</td>
                    <td>${format(new Date(entry.c_date), 'dd/MM/yyyy')}</td>
                    <td>${entry.company_name || ''}</td>
                    <td>${entry.acc_name || ''}</td>
                    <td>${entry.sub_acc_name || '-'}</td>
                    <td>${entry.particulars || ''}</td>
                    <td>${entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                    <td>${entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
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
              <p>Total Records: ${summary.totalRecords} | Approved: ${summary.approvedRecords} | Rejected: ${summary.rejectedRecords} | Pending: ${summary.pendingRecords}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Account</th>
                  <th>Sub Account</th>
                  <th>Particulars</th>
                  <th>Credit</th>
                  <th>Debit</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEntries
                  .map(
                    (entry, _) => `
                  <tr class="${entry.approved ? 'approved' : 'pending'}">
                    <td>${entry.sno}</td>
                    <td>${format(new Date(entry.c_date), 'dd/MM/yyyy')}</td>
                    <td>${entry.company_name || ''}</td>
                    <td>${entry.acc_name || ''}</td>
                    <td>${entry.sub_acc_name || '-'}</td>
                    <td>${entry.particulars || ''}</td>
                    <td>${entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                    <td>${entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
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
    return filteredEntries.slice(startIndex, endIndex);
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
              Date (dd/MM/yyyy)
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
                type='text'
                value={displayDate}
                placeholder='dd/MM/yyyy'
                onChange={value => {
                  setDisplayDate(value);
                  const internal = convertToInternalFormat(value);
                  if (internal) {
                    handleFilterChange('date', internal);
                  }
                }}
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
            <SearchableSelect
              label='Company'
              value={filters.company}
              onChange={value => handleFilterChange('company', value)}
              options={companies}
              placeholder='Search company...'
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
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <Card className='bg-gradient-to-r from-gray-500 to-gray-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-100 text-sm font-medium'>Total Records</p>
              <p className='text-2xl font-bold'>{summary.totalRecords}</p>
            </div>
            <FileText className='w-8 h-8 text-gray-200' />
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

        <Card className='bg-white text-gray-900'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-700 text-sm font-medium'>Rejected</p>
              <p className='text-2xl font-bold'>{summary.rejectedRecords}</p>
            </div>
            <X className='w-8 h-8 text-red-500' />
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

        <Card className='bg-gradient-to-r from-purple-500 to-purple-600 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100 text-sm font-medium'>Selected</p>
              <p className='text-2xl font-bold'>{summary.selectedCount}</p>
            </div>
            <Users className='w-8 h-8 text-purple-200' />
          </div>
        </Card>

        {/* Deleted Records Summary */}
        <Card className='bg-white text-gray-900'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-700 text-sm font-medium'>Deleted Pending</p>
              <p className='text-2xl font-bold'>{deletedSummary.pendingDeleted}</p>
            </div>
            <Trash2 className='w-8 h-8 text-red-500' />
          </div>
        </Card>
        <Card className='bg-white text-gray-900'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-700 text-sm font-medium'>Deleted Approved</p>
              <p className='text-2xl font-bold'>{deletedSummary.approvedDeleted}</p>
            </div>
            <CheckCircle className='w-8 h-8 text-green-500' />
          </div>
        </Card>
        <Card className='bg-white text-gray-900'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-red-700 text-sm font-medium'>Deleted Rejected</p>
              <p className='text-2xl font-bold'>{deletedSummary.rejectedDeleted}</p>
            </div>
            <X className='w-8 h-8 text-red-500' />
          </div>
        </Card>
      </div>

      {/* Records Table */}
      {!loading && !fetchError && (
        <Card
          title='Records for Approval'
          subtitle={`Showing ${getCurrentPageEntries().length} of ${filteredEntries.length} records`}
        >
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    <input
                      type='checkbox'
                      checked={
                        selectedEntries.size === filteredEntries.length &&
                        filteredEntries.length > 0
                      }
                      onChange={handleSelectAll}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    S.No
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Date
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Company
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Account
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Sub Account
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Particulars
                  </th>
                  <th className='px-3 py-2 text-right font-medium text-gray-700'>
                    Credit
                  </th>
                  <th className='px-3 py-2 text-right font-medium text-gray-700'>
                    Debit
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Staff
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    User
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Entry Date & Time
                  </th>
                  <th className='px-3 py-2 text-left font-medium text-gray-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageEntries().map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${
                      entry.approved !== true && entry.approved !== 'true' && entry.approved !== 'rejected'
                        ? 'bg-orange-50' // Orange background for pending records
                        : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
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
                    <td className='px-3 py-2'>
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
                    <td className='px-3 py-2 font-medium'>{index + 1}</td>
                    <td className='px-3 py-2'>
                      {format(new Date(entry.c_date), 'dd/MM/yyyy')}
                    </td>
                    <td className='px-3 py-2 font-medium text-blue-600'>
                      {entry.company_name}
                    </td>
                    <td className='px-3 py-2'>{entry.acc_name}</td>
                    <td className='px-3 py-2'>{entry.sub_acc_name || '-'}</td>
                    <td
                      className='px-3 py-2 max-w-xs truncate'
                      title={entry.particulars}
                    >
                      {entry.particulars}
                    </td>
                    <td className='px-3 py-2 text-right font-medium text-green-600'>
                      {entry.credit > 0
                        ? `₹${entry.credit.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className='px-3 py-2 text-right font-medium text-red-600'>
                      {entry.debit > 0
                        ? `₹${entry.debit.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className='px-3 py-2'>{entry.staff}</td>
                    <td className='px-3 py-2'>{entry.users}</td>
                    <td className='px-3 py-2'>
                      {`${format(new Date(entry.c_date), 'dd/MM/yyyy')} ${format(new Date(entry.entry_time), 'HH:mm:ss')}`}
                    </td>
                    <td className='px-3 py-2'>
                      <Button
                        variant='secondary'
                        onClick={() => {
                          handleDirectApprove(entry.id);
                        }}
                        disabled={entry.approved === true}
                        className='text-xs px-2 py-1'
                      >
                        Approve
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
                      filteredEntries.length
                    )}
                  </span>{' '}
                  of{' '}
                  <span className='font-semibold'>
                    {filteredEntries.length}
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

      {/* Deleted Records Approval */}
      {!loading && (
        <Card title='Deleted Records' subtitle={`Showing ${filteredDeletedEntries.length} of ${deletedSummary.totalRecords} deleted records`}>
          <div className='mb-4 flex gap-2'>
            <Button
              variant='secondary'
              size='sm'
              onClick={async () => {
                console.log('🔍 Debug: Checking deleted records...');
                console.log('🔍 Deleted entries from state:', deletedEntries);
                console.log('🔍 Filtered deleted entries:', filteredDeletedEntries);
                console.log('🔍 Deleted summary:', deletedSummary);
                
                // Try to fetch fresh data
                const freshDeleted = await supabaseDB.getDeletedCashBook();
                console.log('🔍 Fresh deleted records from DB:', freshDeleted);
                
                toast.success('Debug info logged to console');
              }}
              className='flex items-center gap-2'
            >
              <AlertTriangle className='w-4 h-4' />
              Debug Deleted Records
            </Button>
            <Button
              variant='secondary'
              size='sm'
              onClick={loadEntries}
              disabled={loading}
            >
              <RefreshCw className='w-4 h-4' />
              Refresh
            </Button>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs table-fixed'>
              <thead className='sticky top-0 bg-gray-50 z-10'>
                <tr className='border-b border-gray-200'>
                  <th className='w-12 px-1 py-1 text-left font-medium text-gray-700'>
                    S.No
                  </th>
                  <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                    Date
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Company
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Account
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Sub Account
                  </th>
                  <th className='w-32 px-1 py-1 text-left font-medium text-gray-700'>
                    Particulars
                  </th>
                  <th className='w-16 px-1 py-1 text-right font-medium text-gray-700'>
                    Credit
                  </th>
                  <th className='w-16 px-1 py-1 text-right font-medium text-gray-700'>
                    Debit
                  </th>
                  <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                    Staff
                  </th>
                  <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                    User
                  </th>
                  <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    Deleted At
                  </th>
                  <th className='w-20 px-1 py-1 text-center font-medium text-gray-700'>
                    Status
                  </th>
                  <th className='w-24 px-1 py-1 text-center font-medium text-gray-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeletedEntries.map((d, index) => (
                  <tr key={d.id} className={`border-b hover:bg-gray-50 transition-colors ${
                    d.approved !== true && d.approved !== 'true' && d.approved !== 'rejected' ? 'bg-orange-50' : ''
                  }`}>
                    <td className='w-12 px-1 py-1 font-medium text-xs'>{index + 1}</td>
                    <td className='w-16 px-1 py-1 text-xs'>
                      {format(new Date(d.c_date), 'dd/MM/yyyy')}
                    </td>
                    <td className='w-20 px-1 py-1 font-medium text-blue-600 text-xs truncate' title={d.company_name}>
                      {d.company_name}
                    </td>
                    <td className='w-20 px-1 py-1 text-xs truncate' title={d.acc_name?.replace(/\[DELETED\]\s*/g, '')}>
                      {d.acc_name?.replace(/\[DELETED\]\s*/g, '') || '-'}
                    </td>
                    <td className='w-20 px-1 py-1 text-xs truncate' title={d.sub_acc_name?.replace(/\[DELETED\]\s*/g, '')}>
                      {d.sub_acc_name?.replace(/\[DELETED\]\s*/g, '') || '-'}
                    </td>
                    <td className='w-32 px-1 py-1 text-xs truncate' title={d.particulars?.replace(/\[DELETED\]\s*/g, '')}>
                      {d.particulars?.replace(/\[DELETED\]\s*/g, '') || '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-right font-medium text-green-600 text-xs'>
                      {d.credit ? `₹${Number(d.credit).toLocaleString()}` : '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-right font-medium text-red-600 text-xs'>
                      {d.debit ? `₹${Number(d.debit).toLocaleString()}` : '-'}
                    </td>
                    <td className='w-16 px-1 py-1 text-xs truncate' title={d.staff}>
                      {d.staff}
                    </td>
                    <td className='w-16 px-1 py-1 text-xs truncate' title={d.users}>
                      {d.users}
                    </td>
                    <td className='w-20 px-1 py-1 text-xs'>
                      {format(new Date(d.deleted_at), 'HH:mm:ss')}
                    </td>
                    <td className='w-20 px-1 py-1 text-center'>
                      {d.approved === true || d.approved === 'true' ? (
                        <span className='inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'>
                          Approved
                        </span>
                      ) : d.approved === 'rejected' ? (
                        <span className='inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800'>
                          Rejected
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800'>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className='w-24 px-1 py-1 text-center'>
                      <div className='flex flex-row gap-1'>
                        <Button
                          variant='secondary'
                          onClick={() => {
                            handleDeletedApprove(d.id);
                          }}
                          disabled={d.approved === true || d.approved === 'true'}
                          className='text-xs px-1 py-0.5'
                        >
                          Approve
                        </Button>
                        <Button
                          variant='secondary'
                          onClick={() => {
                            handleDeletedReject(d.id);
                          }}
                          disabled={d.approved === 'rejected'}
                          className='text-xs px-2 py-1'
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* View/Edit Modal */}
      {viewOpen && viewEntry && (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg w-full max-w-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-semibold'>Entry Details</h3>
              <button onClick={() => setViewOpen(false)} className='text-gray-500'>✕</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Input label='Date' value={viewDraft?.c_date || ''} onChange={v => setViewDraft((p:any)=>({ ...p, c_date: v }))} disabled={!viewEditing} />
              <Input label='Company' value={viewDraft?.company_name || ''} onChange={v => setViewDraft((p:any)=>({ ...p, company_name: v }))} disabled={!viewEditing} />
              <Input label='Main Account' value={viewDraft?.acc_name || ''} onChange={v => setViewDraft((p:any)=>({ ...p, acc_name: v }))} disabled={!viewEditing} />
              <Input label='Sub Account' value={viewDraft?.sub_acc_name || ''} onChange={v => setViewDraft((p:any)=>({ ...p, sub_acc_name: v }))} disabled={!viewEditing} />
              <Input label='Particulars' value={viewDraft?.particulars || ''} onChange={v => setViewDraft((p:any)=>({ ...p, particulars: v }))} disabled={!viewEditing} />
              <Input label='Credit' value={viewDraft?.credit ?? ''} onChange={v => setViewDraft((p:any)=>({ ...p, credit: Number((parseFloat(v)||0).toFixed(2)) }))} disabled={!viewEditing} type='number' min='0' step='any' />
              <Input label='Debit' value={viewDraft?.debit ?? ''} onChange={v => setViewDraft((p:any)=>({ ...p, debit: Number((parseFloat(v)||0).toFixed(2)) }))} disabled={!viewEditing} type='number' min='0' step='any' />
              <Input label='Staff' value={viewDraft?.staff || ''} onChange={v => setViewDraft((p:any)=>({ ...p, staff: v }))} disabled={!viewEditing} />
            </div>
            <div className='flex justify-end gap-2 mt-4'>
              {!viewEditing ? (
                <>
                  <Button variant='secondary' onClick={() => setViewOpen(false)}>Close</Button>
                  <Button onClick={() => setViewEditing(true)}>Edit</Button>
                </>
              ) : (
                <>
                  <Button variant='secondary' onClick={() => { setViewEditing(false); setViewDraft({ ...viewEntry }); }}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      const saved = await supabaseDB.updateCashBookEntry(viewEntry.id, {
                        c_date: viewDraft.c_date,
                        company_name: viewDraft.company_name,
                        acc_name: viewDraft.acc_name,
                        sub_acc_name: viewDraft.sub_acc_name,
                        particulars: viewDraft.particulars,
                        credit: viewDraft.credit,
                        debit: viewDraft.debit,
                        staff: viewDraft.staff,
                      }, user?.username || 'admin');
                      if (saved) {
                        toast.success('Entry updated');
                        setViewEntry(saved);
                        setViewEditing(false);
                        await loadEntries();
                      } else {
                        toast.error('Failed to update');
                      }
                    } catch (e) {
                      toast.error('Update failed');
                    }
                  }}>Save</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveRecords;
