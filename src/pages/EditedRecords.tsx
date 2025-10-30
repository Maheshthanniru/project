import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { AlertTriangle, RefreshCw } from 'lucide-react';
// Fix for jsPDF autotable type
// @ts-ignore
import 'jspdf-autotable';
type AuditLogEntry = {
  id: string;
  cash_book_id: string;
  old_values: string;
  new_values: string;
  edited_by: string;
  edited_at: string;
  action?: string;
};

const FIELDS = [
  { key: 'c_date', label: 'Date' },
  { key: 'company_name', label: 'Company' },
  { key: 'acc_name', label: 'Main A/c' },
  { key: 'sub_acc_name', label: 'SubAccount' },
  { key: 'particulars', label: 'Particulars' },
  { key: 'credit', label: 'Credit' },
  { key: 'debit', label: 'Debit' },
  { key: 'staff', label: 'Staff' },
  { key: 'users', label: 'User' },
  { key: 'entry_time', label: 'Entry Time' },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

type CashBookPartial = Partial<Record<FieldKey, any>>;

const PAGE_SIZE = 20;

const highlightClass = 'bg-yellow-100 font-semibold';

const getFieldDisplay = (field: FieldKey, value: any) => {
  if (field === 'credit' || field === 'debit') {
    return value ? `${Number(value).toLocaleString()}` : '-';
  }
  if (field === 'c_date' && value) {
    return !isNaN(new Date(value).getTime())
      ? format(new Date(value), 'dd/MM/yyyy')
      : value;
  }
  if (field === 'entry_time' && value) {
    return !isNaN(new Date(value).getTime())
      ? format(new Date(value), 'HH:mm:ss')
      : value;
  }
  // No cleaning needed - data comes clean from database
  return value || '-';
};

const getChangedFields = (oldObj: CashBookPartial, newObj: CashBookPartial) => {
  const changed: Record<FieldKey, boolean> = {} as Record<FieldKey, boolean>;
  for (const { key } of FIELDS) {
    if ((oldObj?.[key] ?? '') !== (newObj?.[key] ?? '')) {
      changed[key] = true;
    }
  }
  return changed;
};

const EditedRecords = () => {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Listen for dashboard refresh events to reload data when records are deleted
  useEffect(() => {
    const onRefresh = () => {
      console.log('[EditedRecords] Dashboard refresh triggered, reloading data...');
      loadData();
    };
    window.addEventListener('dashboard-refresh', onRefresh);
    return () => window.removeEventListener('dashboard-refresh', onRefresh);
  }, []);

  // Listen for dashboard refresh events to reload data
  useEffect(() => {
    const handleDashboardRefresh = () => {
      console.log('🔄 Dashboard refresh event received, reloading Edited Records data...');
      loadData();
    };

    window.addEventListener('dashboard-refresh', handleDashboardRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleDashboardRefresh);
  }, []);

  const loadData = async () => {
    if (isLoadingData) {
      console.log('⚠️ Already loading data, ignoring duplicate call');
      return;
    }
    
    setIsLoadingData(true);
    setLoading(true);
    
    try {
      console.log('🔄 Loading Edited Records data...');
      
      // Simple, clean data loading
      const [log, users] = await Promise.all([
        supabaseDB.getEditAuditLog(),
        supabaseDB.getUsers(),
      ]);
      
      setAuditLog((log || []) as AuditLogEntry[]);
      setUsers((users || []) as User[]);
      
      // No cleaning needed - deleted records come clean from deleted_cash_book table
      console.log(`✅ Loaded Edited Records data:`, {
        auditLog: (log || []).length,
        users: (users || []).length,
      });
      
      // Debug: Log the actual data structure
      if (log && log.length > 0) {
        console.log('📝 Sample audit log record:', log[0]);
        console.log('📝 Audit log record keys:', Object.keys(log[0]));
      }
      
      // Show consolidated message
      const editCount = (log || []).length;
      if (editCount > 0) {
          const isShowingRecords = (log || []).some(rec => rec.action === 'SHOWING_RECORDS' || rec.action === 'SHOWING_RECENT_ENTRIES');
          if (isShowingRecords) {
            toast.info(`Showing ${editCount} recent entries from cash_book (no edit history available yet)`);
          } else {
            toast.success(`Loaded ${editCount} edit records`);
          }
      } else {
        toast.info('No edit records found. This is normal if no records have been modified yet.');
      }
      
    } catch (error) {
      console.error('❌ Error loading Edited Records data:', error);
      setAuditLog([]);
      setUsers([]);
      toast.error('Failed to load Edited Records data. Please try again.');
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  // Map userId to username
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      map[u.id] = u.username;
    });
    return map;
  }, [users]);

  // Build dropdown of distinct edited dates (YYYY-MM-DD)
  const editedDateOptions = useMemo(() => {
    const dates = Array.from(
      new Set(
        auditLog
          .map(l => (l.edited_at ? String(l.edited_at).slice(0, 10) : ''))
          .filter(Boolean)
      )
    ).sort((a, b) => (a < b ? 1 : -1));
    return [{ value: '', label: 'All Dates' }, ...dates.map(d => ({ value: d, label: d }))];
  }, [auditLog]);

  // Filtered and searched log
  const filteredLog = useMemo(() => {
    console.log('🔍 Filtering audit log:', {
      totalAuditLog: auditLog.length,
      selectedDate,
      userFilter
    });
    
    const filtered = auditLog.filter(log => {
      const oldObj: CashBookPartial = log.old_values
        ? JSON.parse(log.old_values)
        : {};
      const newObj: CashBookPartial = log.new_values
        ? JSON.parse(log.new_values)
        : {};
      // Date-wise filter: match edited_at date (YYYY-MM-DD)
      const editedDate = log.edited_at ? String(log.edited_at).slice(0, 10) : '';
      const matchesDate = selectedDate === '' || editedDate === selectedDate;
      const matchesUser = userFilter === '' || log.edited_by === userFilter;
      // Exclude deletes from main table
      const isDelete = log.new_values == null && log.old_values != null;
      const result = matchesDate && matchesUser && !isDelete;
      
      if (!result) {
        console.log('🔍 Filtered out record:', {
          id: log.id,
          editedDate,
          selectedDate,
          matchesDate,
          editedBy: log.edited_by,
          userFilter,
          matchesUser,
          isDelete
        });
      }
      
      return result;
    });
    
    console.log('🔍 Filtered result:', filtered.length, 'records');
    return filtered;
  }, [auditLog, selectedDate, userFilter]);


  // Pagination
  const totalPages = Math.ceil(filteredLog.length / PAGE_SIZE);
  const paginatedLog = filteredLog.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredLog.map((log, idx) => {
      const oldObj = log.old_values ? JSON.parse(log.old_values) : {};
      const newObj = log.new_values ? JSON.parse(log.new_values) : {};
      return [
        idx + 1,
        ...FIELDS.map(f => getFieldDisplay(f.key, oldObj[f.key])),
        ...FIELDS.map(f => getFieldDisplay(f.key, newObj[f.key])),
        userMap[log.edited_by] || log.edited_by,
        log.edited_at && !isNaN(new Date(log.edited_at).getTime())
          ? format(new Date(log.edited_at), 'dd/MM/yyyy HH:mm')
          : '',
      ];
    });
    const header = [
      'S.No',
      ...FIELDS.map(f => f.label + ' (Before)'),
      ...FIELDS.map(f => f.label + ' (After)'),
      'Edited By',
      'Edited At',
    ];
    let csv = '\uFEFF' + header.join(',') + '\n';
    rows.forEach(row => {
      csv +=
        row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edit_audit_log.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Edit Audit Log</title>');
    printWindow.document.write(
      '<style>table { border-collapse: collapse; width: 100%; font-size: 12px; } th, td { border: 1px solid #ccc; padding: 4px; } th { background: #f9fafb; }</style>'
    );
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Edit Audit Log</h2>');
    printWindow.document.write('<table><thead><tr>');
    printWindow.document.write('<th>S.No</th>');
    FIELDS.forEach(f =>
      printWindow.document.write(`<th>${f.label} (Before)</th>`)
    );
    FIELDS.forEach(f =>
      printWindow.document.write(`<th>${f.label} (After)</th>`)
    );
    printWindow.document.write(
      '<th>Edited By</th><th>Edited At</th></tr></thead><tbody>'
    );
    filteredLog.forEach((log, idx) => {
      const oldObj = log.old_values ? JSON.parse(log.old_values) : {};
      const newObj = log.new_values ? JSON.parse(log.new_values) : {};
      printWindow.document.write('<tr>');
      printWindow.document.write(`<td>${idx + 1}</td>`);
      FIELDS.forEach(f =>
        printWindow.document.write(
          `<td>${getFieldDisplay(f.key, oldObj[f.key])}</td>`
        )
      );
      FIELDS.forEach(f =>
        printWindow.document.write(
          `<td>${getFieldDisplay(f.key, newObj[f.key])}</td>`
        )
      );
      printWindow.document.write(
        `<td>${userMap[log.edited_by] || log.edited_by}</td>`
      );
      printWindow.document.write(
        `<td>${log.edited_at && !isNaN(new Date(log.edited_at).getTime()) ? format(new Date(log.edited_at), 'dd/MM/yyyy HH:mm') : ''}</td>`
      );
      printWindow.document.write('</tr>');
    });
    printWindow.document.write('</tbody></table></body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleTestConnection = async () => {
    try {
      const isConnected = await supabaseDB.testDatabaseConnection();
      if (isConnected) {
        toast.success('Database connection successful!');
      } else {
        toast.error('Database connection failed!');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.error('Failed to test database connection');
    }
  };

  // Check if we're showing recent entries instead of actual edits
  const isShowingRecentEntries = filteredLog.some(rec => rec.action === 'SHOWING_RECENT_ENTRIES');
  const deletedLog = useMemo(() => {
    return auditLog.filter(log => log.new_values == null && log.old_values != null);
  }, [auditLog]);
  
  return (
    <Card
      title={isShowingRecentEntries ? 'Recent Records (No Edit History Available)' : 'Edited & Deleted Records'}
      subtitle={isShowingRecentEntries ? `Showing ${filteredLog.length} recent entries` : `Edits: ${filteredLog.length} | Deleted: ${deletedLog.length}`}
    >
      <div className='flex flex-wrap gap-3 mb-4 items-end'>
        <Select
          label='Edited Date'
          value={selectedDate}
          onChange={setSelectedDate}
          options={editedDateOptions}
          className='w-48'
        />
        <Select
          label='Edited By'
          value={userFilter}
          onChange={setUserFilter}
          options={[
            { value: '', label: 'All Users' },
            ...users.map(u => ({ value: u.id, label: u.username })),
          ]}
          className='w-48'
        />
        <Button 
          onClick={loadData} 
          variant='secondary' 
          size='sm'
          disabled={loading}
          className='flex items-center gap-2'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
        <Button
          variant='secondary'
          size='sm'
          onClick={async () => {
            console.log('🔍 Manual debug triggered for edit audit log...');
            await supabaseDB.debugEditAuditLog();
            toast.success('Edit audit log debug info logged to console');
          }}
          className='flex items-center gap-2'
        >
          <AlertTriangle className='w-4 h-4' />
          Debug
        </Button>
        <Button onClick={handleTestConnection} variant='secondary' size='sm'>
          Test Connection
        </Button>
        <Button onClick={handleExportExcel} variant='secondary' size='sm'>
          Export Excel
        </Button>
        <Button onClick={handlePrint} variant='secondary' size='sm'>
          Print
        </Button>
      </div>
      {loading ? (
        <div className='text-center py-8 text-blue-600 font-semibold'>
          Loading edit history...
        </div>
      ) : filteredLog.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-gray-500 mb-2'>
            No edit history found.
          </div>
          <div className='text-sm text-gray-400'>
            This is normal if no records have been edited yet.
          </div>
        </div>
      ) : (
        <>

          <div className='overflow-x-auto'>
          <table className='w-full text-xs table-fixed border border-gray-200'>
            <thead className='sticky top-0 bg-gray-50 z-10'>
              <tr className='border-b border-gray-200'>
                <th className='w-12 px-1 py-1 text-left font-medium text-gray-700'>
                  S.No
                </th>
                <th className='w-16 px-1 py-1 text-left font-medium text-gray-700'>
                  Type
                </th>
                {FIELDS.map(f => (
                  <th key={f.key} className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                    {f.label}
                  </th>
                ))}
                <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                  Edited By
                </th>
                <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                  Edited At
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLog.map((log, idx) => {
                const oldObj = log.old_values ? JSON.parse(log.old_values) : {};
                const newObj = log.new_values ? JSON.parse(log.new_values) : {};
                const changed = getChangedFields(oldObj, newObj);
                return (
                  <React.Fragment key={log.id}>
                    {/* Before Edit Row (no background color) */}
                    <tr className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='w-12 px-1 py-1 text-center text-xs' rowSpan={1}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className='w-16 px-1 py-1 font-semibold text-red-600 text-xs'>
                        {log.action === 'SHOWING_RECENT_ENTRIES' ? 'Entry' : 'Before'}
                      </td>
                      {FIELDS.map(f => (
                        <td
                          key={f.key + '-before'}
                          className='w-20 px-1 py-1 text-xs truncate'
                          title={getFieldDisplay(f.key, oldObj[f.key])}
                        >
                          {getFieldDisplay(f.key, oldObj[f.key])}
                        </td>
                      ))}
                      <td className='w-20 px-1 py-1 text-xs truncate' title={userMap[log.edited_by] || log.edited_by}>
                        {userMap[log.edited_by] || log.edited_by}
                      </td>
                      <td className='w-20 px-1 py-1 text-xs'>
                        {log.edited_at &&
                        !isNaN(new Date(log.edited_at).getTime())
                          ? format(new Date(log.edited_at), 'dd/MM/yyyy HH:mm')
                          : ''}
                      </td>
                    </tr>
                    {/* After Edit Row */}
                    <tr className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='w-12 px-1 py-1 text-center text-xs'></td>
                      <td className='w-16 px-1 py-1 font-semibold text-green-700 text-xs'>
                        {log.action === 'SHOWING_RECENT_ENTRIES' ? 'Details' : 'After'}
                      </td>
                      {FIELDS.map(f => (
                        <td
                          key={f.key + '-after'}
                          className={`w-20 px-1 py-1 text-xs truncate ${changed[f.key] ? highlightClass : ''}`}
                          title={getFieldDisplay(f.key, newObj[f.key])}
                        >
                          {getFieldDisplay(f.key, newObj[f.key])}
                        </td>
                      ))}
                      <td className='w-20 px-1 py-1 text-xs truncate' title={userMap[log.edited_by] || log.edited_by}>
                        {userMap[log.edited_by] || log.edited_by}
                      </td>
                      <td className='w-20 px-1 py-1 text-xs'>
                        {log.edited_at &&
                        !isNaN(new Date(log.edited_at).getTime())
                          ? format(new Date(log.edited_at), 'dd/MM/yyyy HH:mm')
                          : ''}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center items-center gap-2 mt-4'>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className='text-sm'>
                Page {page} of {totalPages}
              </span>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
          </div>
          {/* Deleted Records */}
          <div className='mt-6'>
            <h3 className='text-sm font-semibold mb-2'>Deleted Records</h3>
            {deletedLog.length === 0 ? (
              <div className='text-gray-500 text-xs'>No deleted records found.</div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-xs table-fixed border border-gray-200'>
                  <thead className='sticky top-0 bg-gray-50 z-10'>
                    <tr className='border-b border-gray-200'>
                      <th className='w-12 px-1 py-1 text-left font-medium text-gray-700'>S.No</th>
                      {FIELDS.map(f => (
                        <th key={'del-h-'+f.key} className='w-20 px-1 py-1 text-left font-medium text-gray-700'>
                          {f.label}
                        </th>
                      ))}
                      <th className='w-20 px-1 py-1 text-left font-medium text-gray-700'>Deleted By</th>
                      <th className='w-24 px-1 py-1 text-left font-medium text-gray-700'>Deleted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedLog.map((log, idx) => {
                      const oldObj = log.old_values ? JSON.parse(log.old_values) : {};
                      return (
                        <tr key={'del-r-'+log.id} className='border-b border-gray-100 hover:bg-red-50'>
                          <td className='w-12 px-1 py-1 text-center text-xs'>{idx + 1}</td>
                          {FIELDS.map(f => (
                            <td key={'del-c-'+f.key} className='w-20 px-1 py-1 text-xs truncate' title={getFieldDisplay(f.key, oldObj[f.key])}>
                              {getFieldDisplay(f.key, oldObj[f.key])}
                            </td>
                          ))}
                          <td className='w-20 px-1 py-1 text-xs truncate'>{userMap[log.edited_by] || log.edited_by}</td>
                          <td className='w-24 px-1 py-1 text-xs'>
                            {log.edited_at && !isNaN(new Date(log.edited_at).getTime()) ? format(new Date(log.edited_at), 'dd/MM/yyyy HH:mm') : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

    </Card>
  );
};

export default EditedRecords;
