import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SearchableSelect from '../components/UI/SearchableSelect';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Trash2,
  RotateCcw,
  Search,
  Calendar,
  Building,
  User,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface DeletedRecord {
  id: string;
  sno: number;
  acc_name: string;
  sub_acc_name: string | null;
  particulars: string | null;
  c_date: string;
  credit: number;
  debit: number;
  company_name: string;
  staff: string | null;
  users: string | null;
  deleted_by: string;
  deleted_at: string;
  approved: boolean;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

const DeletedRecords: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  
  // Dropdown options
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [dates, setDates] = useState<{ value: string; label: string }[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);

  useEffect(() => {
    loadDeletedRecords();
    loadDropdownData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [deletedRecords, searchTerm, selectedDate, selectedCompany, selectedUser]);

  const loadDeletedRecords = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading deleted records...');
      
      // First, run debug to see what's in the database
      await supabaseDB.debugDeletedRecords();
      
      const records = await supabaseDB.getDeletedCashBook();
      console.log('📋 Raw records from getDeletedCashBook:', records);
      
      // Clean up any remaining [DELETED] text (but preserve deleted_by and deleted_at)
      const cleanedRecords = records.map(record => ({
        ...record,
        acc_name: record.acc_name ? record.acc_name.replace(/\[DELETED\]\s*/g, '').trim() : record.acc_name,
        particulars: record.particulars ? record.particulars.replace(/\[DELETED\]\s*/g, '').trim() : record.particulars,
        company_name: record.company_name ? record.company_name.replace(/\[DELETED\]\s*/g, '').trim() : record.company_name,
        sub_acc_name: record.sub_acc_name ? record.sub_acc_name.replace(/\[DELETED\]\s*/g, '').trim() : record.sub_acc_name,
        // Ensure deleted_by and deleted_at are preserved
        deleted_by: record.deleted_by || record.users || record.staff || 'Unknown',
        deleted_at: record.deleted_at || record.updated_at || record.created_at || new Date().toISOString()
      }));
      
      setDeletedRecords(cleanedRecords as DeletedRecord[]);
      console.log(`✅ Loaded ${records.length} deleted records`);
      
      if (records.length === 0) {
        console.log('⚠️ No deleted records found. This could mean:');
        console.log('1. No records have been deleted yet');
        console.log('2. The delete function is not working properly');
        console.log('3. The database query is not finding the records');
        toast.warning('No deleted records found. Try deleting a record first.');
      } else {
        toast.success(`Loaded ${records.length} deleted records`);
      }
    } catch (error) {
      console.error('Error loading deleted records:', error);
      toast.error('Failed to load deleted records');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companiesData = await supabaseDB.getCompanies();
      const companiesOptions = companiesData.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesOptions]);

      // Load users
      const usersData = await supabaseDB.getUsers();
      const usersOptions = usersData.map(user => ({
        value: user.username,
        label: user.username,
      }));
      setUsers([{ value: '', label: 'All Users' }, ...usersOptions]);

      // Load unique dates from deleted records
      const { data: dateData } = await supabase
        .from('deleted_cash_book')
        .select('deleted_at')
        .order('deleted_at', { ascending: false });
      
      const uniqueDates = [...new Set(
        dateData?.map(record => record.deleted_at?.split('T')[0]).filter(Boolean) || []
      )];
      
      const dateOptions = uniqueDates.map(date => ({
        value: date,
        label: format(new Date(date), 'dd/MM/yyyy'),
      }));
      setDates([{ value: '', label: 'All Dates' }, ...dateOptions]);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...deletedRecords];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.acc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.sub_acc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.staff?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.users?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(record => 
        record.deleted_at?.startsWith(selectedDate)
      );
    }

    // Company filter
    if (selectedCompany) {
      filtered = filtered.filter(record => 
        record.company_name === selectedCompany
      );
    }

    // User filter
    if (selectedUser) {
      filtered = filtered.filter(record => 
        record.deleted_by === selectedUser
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const restoreRecord = async (record: DeletedRecord) => {
    if (!isAdmin) {
      toast.error('Only admins can restore deleted records');
      return;
    }

    if (!window.confirm(`Are you sure you want to restore entry #${record.sno}?`)) {
      return;
    }

    setRestoring(record.id);
    try {
      console.log('🔄 Restoring deleted record:', record.id);
      
      // Use the new restore function from supabaseDatabase
      const success = await supabaseDB.restoreCashBookEntry(record.id);

      if (success) {
        // Refresh the list
        await loadDeletedRecords();
        toast.success(`Entry #${record.sno} restored successfully!`);
        
        // Trigger dashboard refresh
        localStorage.setItem('dashboard-refresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      } else {
        toast.error('Failed to restore record');
      }
      
    } catch (error) {
      console.error('Error restoring record:', error);
      toast.error('Failed to restore record');
    } finally {
      setRestoring(null);
    }
  };

  const permanentlyDeleteRecord = async (record: DeletedRecord) => {
    if (!isAdmin) {
      toast.error('Only admins can permanently delete records');
      return;
    }

    if (!window.confirm(`Are you sure you want to PERMANENTLY delete entry #${record.sno}? This cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Permanently deleting record:', record.id);
      
      // Use the new permanent delete function from supabaseDatabase
      const success = await supabaseDB.permanentlyDeleteCashBookEntry(record.id);

      if (success) {
        // Refresh the list
        await loadDeletedRecords();
        toast.success(`Entry #${record.sno} permanently deleted!`);
      } else {
        toast.error('Failed to permanently delete record');
      }
      
    } catch (error) {
      console.error('Error permanently deleting record:', error);
      toast.error('Failed to permanently delete record');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => ({
      'S.No': record.sno,
      'Date': format(new Date(record.c_date), 'dd-MMM-yyyy'),
      'Company': record.company_name,
      'Main Account': record.acc_name,
      'Sub Account': record.sub_acc_name || '',
      'Particulars': record.particulars,
      'Credit': record.credit,
      'Debit': record.debit,
      'Staff': record.staff,
      'User': record.users,
      'Deleted By': record.deleted_by,
      'Deleted At': format(new Date(record.deleted_at), 'dd/MM/yyyy HH:mm'),
      'Approved': record.approved ? 'Yes' : 'No',
      'Edited': record.edited ? 'Yes' : 'No',
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
    a.download = `deleted-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Deleted records exported successfully!');
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const getStatusIcon = (record: DeletedRecord) => {
    if (record.approved) {
      return <CheckCircle className="w-4 h-4 text-green-600" title="Approved" />;
    } else if (record.edited) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" title="Edited" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" title="Pending" />;
    }
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <div className='w-full px-4 space-y-6'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <Trash2 className='w-6 h-6 text-red-600' />
              Deleted Records
            </h1>
            <p className='text-gray-600 mt-1'>
              View and manage deleted cash book entries
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='secondary'
              onClick={loadDeletedRecords}
              disabled={loading}
              className='flex items-center gap-2'
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant='outline'
              onClick={async () => {
                console.log('🔍 Manual debug triggered...');
                await supabaseDB.debugDeletedRecords();
                toast.info('Debug info logged to console');
              }}
              className='flex items-center gap-2'
            >
              <AlertTriangle className='w-4 h-4' />
              Debug
            </Button>
            <Button
              variant='secondary'
              onClick={exportToExcel}
              disabled={filteredRecords.length === 0}
              className='flex items-center gap-2'
            >
              <Download className='w-4 h-4' />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className='bg-gradient-to-r from-red-50 to-orange-50 border-red-200'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Search
              </label>
              <div className='relative'>
                <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search entries...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500'
                />
              </div>
            </div>
            <div>
              <SearchableSelect
                label='Date'
                value={selectedDate}
                onChange={setSelectedDate}
                options={dates}
                placeholder='Select date...'
              />
            </div>
            <div>
              <SearchableSelect
                label='Company'
                value={selectedCompany}
                onChange={setSelectedCompany}
                options={companies}
                placeholder='Select company...'
              />
            </div>
            <div>
              <SearchableSelect
                label='Deleted By'
                value={selectedUser}
                onChange={setSelectedUser}
                options={users}
                placeholder='Select user...'
              />
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-center'>
            <div className='bg-red-100 rounded-lg p-4'>
              <div className='text-red-800 font-semibold text-sm'>Total Deleted</div>
              <div className='text-2xl font-bold text-red-900'>{deletedRecords.length}</div>
            </div>
            <div className='bg-yellow-100 rounded-lg p-4'>
              <div className='text-yellow-800 font-semibold text-sm'>Filtered</div>
              <div className='text-2xl font-bold text-yellow-900'>{filteredRecords.length}</div>
            </div>
            <div className='bg-green-100 rounded-lg p-4'>
              <div className='text-green-800 font-semibold text-sm'>Approved</div>
              <div className='text-2xl font-bold text-green-900'>
                {filteredRecords.filter(r => r.approved).length}
              </div>
            </div>
            <div className='bg-orange-100 rounded-lg p-4'>
              <div className='text-orange-800 font-semibold text-sm'>Edited</div>
              <div className='text-2xl font-bold text-orange-900'>
                {filteredRecords.filter(r => r.edited).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Records Table */}
        <Card className='overflow-x-auto'>
          {loading ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto'></div>
              <p className='mt-2 text-gray-600'>Loading deleted records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              {deletedRecords.length === 0 ? (
                <div>
                  <Trash2 className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p className='text-lg font-medium'>No deleted records found</p>
                  <p className='text-sm'>All records are currently active</p>
                </div>
              ) : (
                <div>
                  <Search className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p className='text-lg font-medium'>No records match your filters</p>
                  <p className='text-sm'>Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className='mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
                <div className='text-lg font-semibold'>
                  Deleted Records ({filteredRecords.length})
                </div>
                <div className='text-sm text-gray-600'>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length}
                </div>
              </div>

              <table className='w-full text-xs table-fixed'>
                <thead className='bg-red-50 border-b border-red-200'>
                  <tr>
                    <th className='w-12 px-1 py-1 text-left font-medium text-gray-700'>S.No</th>
                    <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>Date</th>
                    <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>Company</th>
                    <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>Main A/c</th>
                    <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>Sub Account</th>
                    <th className='w-32 px-1 py-1 text-left font-medium text-gray-700'>Particulars</th>
                    <th className='w-16 px-1 py-1 text-right font-medium text-gray-700'>Credit</th>
                    <th className='w-16 px-1 py-1 text-right font-medium text-gray-700'>Debit</th>
                    <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>Staff</th>
                    <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>Deleted By</th>
                    <th className='w-24 px-1 py-1 text-left font-medium text-gray-700'>Deleted At</th>
                    <th className='w-20 px-1 py-1 text-center font-medium text-gray-700'>Status</th>
                    <th className='w-24 px-1 py-1 text-center font-medium text-gray-700'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      className={`border-b border-gray-100 hover:bg-red-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-red-25'
                      }`}
                    >
                      <td className='w-12 px-1 py-1 font-medium text-xs'>{record.sno}</td>
                      <td className='w-16 px-1 py-1 text-xs'>{format(new Date(record.c_date), 'dd/MM/yyyy')}</td>
                      <td className='w-20 px-1 py-1 text-xs truncate' title={record.company_name}>{record.company_name}</td>
                      <td className='w-20 px-1 py-1 text-xs truncate' title={record.acc_name}>{record.acc_name}</td>
                      <td className='w-20 px-1 py-1 text-xs truncate' title={record.sub_acc_name}>{record.sub_acc_name || '-'}</td>
                      <td className='w-32 px-1 py-1 text-xs truncate' title={record.particulars || ''}>
                        {record.particulars || '-'}
                      </td>
                      <td className='w-16 px-1 py-1 text-right text-green-700 text-xs'>
                        {record.credit > 0 ? `₹${record.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className='w-16 px-1 py-1 text-right text-red-700 text-xs'>
                        {record.debit > 0 ? `₹${record.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className='w-16 px-1 py-1 text-xs truncate' title={record.staff}>{record.staff || '-'}</td>
                      <td className='w-20 px-1 py-1 font-medium text-red-700 text-xs'>{record.deleted_by || record.users || record.staff || '-'}</td>
                      <td className='w-24 px-1 py-1 text-gray-600 text-xs'>
                        {record.deleted_at ? format(new Date(record.deleted_at), 'dd/MM/yyyy HH:mm') : 
                         record.updated_at ? format(new Date(record.updated_at), 'dd/MM/yyyy HH:mm') : '-'}
                      </td>
                      <td className='w-20 px-1 py-1 text-center'>
                        {getStatusIcon(record)}
                      </td>
                      <td className='w-24 px-1 py-1 text-center'>
                        <div className='flex gap-0.5 justify-center'>
                          <Button
                            size='sm'
                            variant='secondary'
                            onClick={() => restoreRecord(record)}
                            disabled={restoring === record.id || !isAdmin}
                            className='p-1 text-green-700 hover:text-green-800'
                            title='Restore Record'
                          >
                            <RotateCcw className='w-3 h-3' />
                            <span className='sr-only'>Restore</span>
                          </Button>
                          <Button
                            size='sm'
                            variant='danger'
                            onClick={() => permanentlyDeleteRecord(record)}
                            disabled={!isAdmin}
                            className='p-1'
                            title='Permanently Delete'
                          >
                            <Trash2 className='w-3 h-3' />
                            <span className='sr-only'>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
                  <div className='text-sm text-gray-600'>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DeletedRecords;
