import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { RotateCcw, Trash2 } from 'lucide-react';
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
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabaseDB.getEditAuditLog(),
      supabaseDB.getUsers(),
      supabaseDB.getDeletedCashBook(),
    ])
      .then(([log, users, deleted]) => {
        console.log('📊 Edited Records - Loaded data:', {
          auditLog: log?.length || 0,
          users: users?.length || 0,
          deletedRecords: deleted?.length || 0
        });
        console.log('🗑️ Deleted records data:', deleted);
        console.log('🔍 Deleted records type:', typeof deleted);
        console.log('🔍 Deleted records is array:', Array.isArray(deleted));
        if (deleted && deleted.length > 0) {
          console.log('📝 First deleted record:', deleted[0]);
        }
        setAuditLog(log as AuditLogEntry[]);
        setUsers(users as User[]);
        setDeletedRecords(deleted as any[]);
      })
      .catch((error) => {
        console.error('❌ Error loading Edited Records data:', error);
        toast.error('Failed to load edit audit log');
      })
      .finally(() => setLoading(false));
  }, []);

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
    return auditLog.filter(log => {
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
      return matchesDate && matchesUser && !isDelete;
    });
  }, [auditLog, selectedDate, userFilter]);

  // Deleted records log (from getDeletedCashBook - these are raw cash book records with [DELETED] prefix)
  const deletedLog = useMemo(() => {
    console.log('🔍 Processing deleted records:', deletedRecords);
    // The deletedRecords from getDeletedCashBook() are already filtered records with [DELETED] prefix
    // So we can return them directly
    return deletedRecords;
  }, [deletedRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredLog.length / PAGE_SIZE);
  const paginatedLog = filteredLog.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Restore deleted record
  const handleRestoreRecord = async (record: any) => {
    if (!window.confirm(`Are you sure you want to restore entry #${record.sno}?`)) {
      return;
    }

    setRestoring(record.id);
    try {
      console.log('🔄 Restoring deleted record:', record.id);
      
      const success = await supabaseDB.restoreCashBookEntry(record.id);

      if (success) {
        // Refresh the deleted records list
        const deleted = await supabaseDB.getDeletedCashBook();
        setDeletedRecords(deleted as any[]);
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

  // Permanently delete record
  const handlePermanentDelete = async (record: any) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete entry #${record.sno}? This cannot be undone.`)) {
      return;
    }

    setDeleting(record.id);
    try {
      console.log('🗑️ Permanently deleting record:', record.id);
      
      const success = await supabaseDB.permanentlyDeleteCashBookEntry(record.id);

      if (success) {
        // Refresh the deleted records list
        const deleted = await supabaseDB.getDeletedCashBook();
        setDeletedRecords(deleted as any[]);
        toast.success(`Entry #${record.sno} permanently deleted!`);
        
        // Trigger dashboard refresh
        localStorage.setItem('dashboard-refresh', Date.now().toString());
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      } else {
        toast.error('Failed to permanently delete record');
      }
      
    } catch (error) {
      console.error('Error permanently deleting record:', error);
      toast.error('Failed to permanently delete record');
    } finally {
      setDeleting(null);
    }
  };

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

  return (
    <Card
      title='Edited Records (Audit Log)'
      subtitle={`Showing ${filteredLog.length} edits`}
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
        <div className='text-center py-8 text-gray-500'>
          No edit history found.
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-base border border-gray-200'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-4 py-2'>S.No</th>
                <th className='px-4 py-2'>Type</th>
                {FIELDS.map(f => (
                  <th key={f.key} className='px-4 py-2'>
                    {f.label}
                  </th>
                ))}
                <th className='px-4 py-2'>Edited By</th>
                <th className='px-4 py-2'>Edited At</th>
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
                      <td className='px-2 py-1 text-center' rowSpan={1}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className='px-2 py-1 font-semibold text-red-600'>
                        Before
                      </td>
                      {FIELDS.map(f => (
                        <td
                          key={f.key + '-before'}
                          className={'px-2 py-1'}
                        >
                          {getFieldDisplay(f.key, oldObj[f.key])}
                        </td>
                      ))}
                      <td className='px-2 py-1'>
                        {userMap[log.edited_by] || log.edited_by}
                      </td>
                      <td className='px-2 py-1'>
                        {log.edited_at &&
                        !isNaN(new Date(log.edited_at).getTime())
                          ? format(new Date(log.edited_at), 'dd/MM/yyyy HH:mm')
                          : ''}
                      </td>
                    </tr>
                    {/* After Edit Row */}
                    <tr className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-2 py-1 text-center'></td>
                      <td className='px-2 py-1 font-semibold text-green-700'>
                        After
                      </td>
                      {FIELDS.map(f => (
                        <td
                          key={f.key + '-after'}
                          className={`px-2 py-1 ${changed[f.key] ? highlightClass : ''}`}
                        >
                          {getFieldDisplay(f.key, newObj[f.key])}
                        </td>
                      ))}
                      <td className='px-2 py-1'>
                        {userMap[log.edited_by] || log.edited_by}
                      </td>
                      <td className='px-2 py-1'>
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
      )}

      {/* Deleted Records Table */}
      <div className='mt-10'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-red-700 flex items-center gap-2'>
            🗑️ Deleted Records ({deletedLog.length})
          </h3>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='secondary'
              onClick={async () => {
                setLoading(true);
                try {
                  console.log('🔄 Manually refreshing deleted records...');
                  const deleted = await supabaseDB.getDeletedCashBook();
                  console.log('🔄 Refresh result:', deleted);
                  console.log('🔄 Refresh result length:', deleted?.length || 0);
                  setDeletedRecords(deleted as any[]);
                  toast.success(`Refreshed ${deleted?.length || 0} deleted records`);
                } catch (error) {
                  console.error('❌ Refresh error:', error);
                  toast.error('Failed to refresh deleted records');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className='flex items-center gap-1'
            >
              Refresh
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={async () => {
                console.log('🔍 Manual debug triggered...');
                await supabaseDB.debugDeletedRecords();
                toast.success('Debug info logged to console');
              }}
              className='flex items-center gap-1'
            >
              Debug
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={async () => {
                console.log('🧪 Testing getDeletedCashBook function...');
                try {
                  const deletedRecords = await supabaseDB.getDeletedCashBook();
                  console.log('🧪 getDeletedCashBook result:', deletedRecords);
                  console.log('🧪 Result type:', typeof deletedRecords);
                  console.log('🧪 Result length:', deletedRecords?.length || 0);
                  if (deletedRecords && deletedRecords.length > 0) {
                    console.log('🧪 First record:', deletedRecords[0]);
                    toast.success(`Found ${deletedRecords.length} deleted records`);
                  } else {
                    toast.error('No deleted records found');
                  }
                } catch (error) {
                  console.error('❌ Test error:', error);
                  toast.error('Test failed - check console');
                }
              }}
              className='flex items-center gap-1'
            >
              Test
            </Button>
          </div>
        </div>
        {deletedLog.length === 0 ? (
          <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='text-lg font-medium mb-2'>No deleted records found</div>
            <div className='text-sm'>Deleted records from Edit Entry will appear here</div>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs border border-gray-200'>
              <thead className='bg-red-50 border-b border-gray-200'>
                <tr>
                  <th className='px-2 py-1'>S.No</th>
                  {FIELDS.map(f => (
                    <th key={f.key + '-before'} className='px-2 py-1'>
                      {f.label}
                    </th>
                  ))}
                  <th className='px-2 py-1'>Deleted By</th>
                  <th className='px-2 py-1'>Deleted At</th>
                  <th className='px-2 py-1'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedLog.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className='border-b border-gray-100 hover:bg-red-50'
                  >
                    <td className='px-2 py-1 text-center'>{idx + 1}</td>
                    {FIELDS.map(f => (
                      <td key={f.key + '-before'} className='px-2 py-1'>
                        {getFieldDisplay(f.key, rec[f.key])}
                      </td>
                    ))}
                    <td className='px-2 py-1'>{rec.deleted_by || rec.users || 'Unknown'}</td>
                    <td className='px-2 py-1'>
                      {rec.deleted_at &&
                      !isNaN(new Date(rec.deleted_at).getTime())
                        ? format(new Date(rec.deleted_at), 'dd/MM/yyyy HH:mm')
                        : rec.updated_at &&
                        !isNaN(new Date(rec.updated_at).getTime())
                        ? format(new Date(rec.updated_at), 'dd/MM/yyyy HH:mm')
                        : ''}
                    </td>
                    <td className='px-2 py-1'>
                      <div className='flex gap-1 justify-center'>
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() => handleRestoreRecord(rec)}
                          disabled={restoring === rec.id}
                          className='flex items-center gap-1 text-green-700 hover:text-green-800'
                          title='Restore Record'
                        >
                          <RotateCcw className='w-3 h-3' />
                          Restore
                        </Button>
                        <Button
                          size='sm'
                          variant='danger'
                          onClick={() => handlePermanentDelete(rec)}
                          disabled={deleting === rec.id}
                          className='flex items-center gap-1'
                          title='Permanently Delete'
                        >
                          <Trash2 className='w-3 h-3' />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EditedRecords;
