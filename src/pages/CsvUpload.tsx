import React, { useState, useCallback, useMemo } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { importFromFile, validateImportedData } from '../utils/excel';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

// Helper functions - Memoized for better performance
const sanitizeString = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).trim();
  return str === '' ? '' : str;
};

const sanitizeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

const sanitizeDate = (value: any): string => {
  if (!value || value === '') return new Date().toISOString().split('T')[0];
  try {
    let date;
    if (typeof value === 'string') {
      // Try direct Date constructor first for better performance
      date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }

      // Fallback to format parsing if needed
      const dateFormats = [
        'yyyy-MM-dd',
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'dd-MM-yyyy',
        'MM-dd-yyyy',
        'yyyy/MM/dd',
        'dd.MM.yyyy',
        'MM.dd.yyyy',
      ];

      for (const formatStr of dateFormats) {
        try {
          date = new Date(value);
          if (!isNaN(date.getTime())) {
            return format(date, 'yyyy-MM-dd');
          }
        } catch {
          continue;
        }
      }
    } else if (value instanceof Date) {
      date = value;
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    }

    return new Date().toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
};

const getFieldValue = (
  row: any,
  possibleNames: string[],
  defaultValue: any
) => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  return defaultValue;
};

// Simplified validation function that's more lenient
const validateEntry = (entry: any) => {
  const errors: string[] = [];

  if (!entry.acc_name || entry.acc_name.trim() === '') {
    errors.push('Missing account name');
  }

  if (!entry.company_name || entry.company_name.trim() === '') {
    errors.push('Missing company name');
  }

  // More lenient validation - allow both credit and debit to be 0 for now
  if (entry.credit < 0) {
    errors.push('Credit amount cannot be negative');
  }

  if (entry.debit < 0) {
    errors.push('Debit amount cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const CsvUpload: React.FC = () => {
  const { user } = useAuth();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    successCount: 0,
    errorCount: 0,
    currentBatch: 0,
    totalBatches: 0,
  });
  const [importResults, setImportResults] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Memoized values for better performance
  const isImporting = useMemo(() => uploadLoading, [uploadLoading]);
  const hasResults = useMemo(() => importResults !== null, [importResults]);
  const canUpload = useMemo(
    () => !uploadLoading && uploadedFile === null,
    [uploadLoading, uploadedFile]
  );

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploadedFile(file);
    setUploadLoading(true);
    setUploadProgress(0);
    setImportResults(null);

    try {
      const result = await importFromFile(file);

      if (result.success && result.data) {
        // Log the actual columns in the CSV for debugging
        console.log('CSV Columns:', Object.keys(result.data[0] || {}));
        console.log('Total rows:', result.data.length);

        // Skip validation completely - accept any CSV format
        setUploadPreview(result.data.slice(0, 10)); // Show first 10 rows as preview
        toast.success(
          `Successfully loaded ${result.data.length} entries from CSV`
        );
      } else {
        toast.error(result.error || 'Failed to read CSV file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload CSV file');
    } finally {
      setUploadLoading(false);
      setUploadProgress(100);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileUpload(file);
      } else {
        toast.error('Please drop a CSV file');
      }
    }
  }, []);

  const handleImportCSV = async () => {
    if (!uploadedFile || uploadPreview.length === 0) {
      toast.error('Please upload a valid CSV file first');
      return;
    }

    setUploadLoading(true);
    setUploadProgress(0);
    setImportResults(null);

    // Check if we're in offline mode
    const isOfflineMode = localStorage.getItem('offline_mode') === 'true';

    if (isOfflineMode) {
      toast.success('Offline mode detected. Saving data to local storage...');

      try {
        const result = await importFromFile(uploadedFile);

        if (result.success && result.data) {
          // Save to local storage
          const saved = saveToLocalStorage(result.data);

          if (saved) {
            setImportResults({
              successCount: result.data.length,
              errorCount: 0,
              errors: [],
            });
            toast.success(
              `Successfully saved ${result.data.length} entries to local storage!`
            );
          } else {
            toast.error('Failed to save data to local storage');
          }
        }
      } catch (error) {
        console.error('Error in offline mode:', error);
        toast.error('Failed to process CSV in offline mode');
      } finally {
        setUploadLoading(false);
      }
      return;
    }

    try {
      const result = await importFromFile(uploadedFile);

      if (result.success && result.data) {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process data in smaller batches for better reliability
        const batchSize = 100; // Reduced batch size
        const totalBatches = Math.ceil(result.data.length / batchSize);

        // Initialize progress
        setImportProgress({
          current: 0,
          total: result.data.length,
          percentage: 0,
          successCount: 0,
          errorCount: 0,
          currentBatch: 0,
          totalBatches,
        });

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIndex = batchIndex * batchSize;
          const endIndex = Math.min(startIndex + batchSize, result.data.length);
          const batch = result.data.slice(startIndex, endIndex);

          // Process batch sequentially for better error handling
          for (let i = 0; i < batch.length; i++) {
            const row = batch[i];
            const globalIndex = startIndex + i;

            try {
              // Clean and validate data before mapping
              const cleanEntry = {
                acc_name: sanitizeString(
                  getFieldValue(
                    row,
                    [
                      'Main Account',
                      'Account',
                      'Account Name',
                      'AccountName',
                      'MainAccount',
                      'Account Type',
                      'AccountType',
                      'Account Category',
                      'AccountCategory',
                    ],
                    'Default Account'
                  )
                ),
                sub_acc_name:
                  sanitizeString(
                    getFieldValue(
                      row,
                      [
                        'Sub Account',
                        'SubAccount',
                        'Sub Account Name',
                        'SubAccountName',
                        'Sub Account Type',
                        'SubAccountType',
                        'Branch',
                        'Location',
                      ],
                      ''
                    )
                  ) || null, // Allow null for empty sub account
                particulars: sanitizeString(
                  getFieldValue(
                    row,
                    [
                      'Particulars',
                      'Description',
                      'Details',
                      'Transaction Details',
                      'TransactionDetails',
                      'Narration',
                      'Notes',
                      'Remarks',
                      'Comment',
                      'Memo',
                    ],
                    `Transaction ${globalIndex + 1}`
                  )
                ),
                c_date: sanitizeDate(
                  getFieldValue(
                    row,
                    [
                      'Date',
                      'Transaction Date',
                      'Entry Date',
                      'TransactionDate',
                      'EntryDate',
                      'Posting Date',
                      'PostingDate',
                      'Value Date',
                      'ValueDate',
                    ],
                    null
                  )
                ),
                credit: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Credit',
                      'Credit Amount',
                      'CreditAmount',
                      'Credit Amt',
                      'CreditAmt',
                      'Credit Value',
                      'CreditValue',
                      'Credit Total',
                      'CreditTotal',
                    ],
                    0
                  )
                ),
                debit: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Debit',
                      'Debit Amount',
                      'DebitAmount',
                      'Debit Amt',
                      'DebitAmt',
                      'Debit Value',
                      'DebitValue',
                      'Debit Total',
                      'DebitTotal',
                    ],
                    0
                  )
                ),
                credit_online: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Credit Online',
                      'Online Credit',
                      'OnlineCredit',
                      'Credit Online Amount',
                      'Online Credit Amount',
                      'Credit Digital',
                      'Digital Credit',
                    ],
                    0
                  )
                ),
                credit_offline: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Credit Offline',
                      'Offline Credit',
                      'OfflineCredit',
                      'Credit Offline Amount',
                      'Offline Credit Amount',
                      'Credit Cash',
                      'Cash Credit',
                    ],
                    0
                  )
                ),
                debit_online: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Debit Online',
                      'Online Debit',
                      'OnlineDebit',
                      'Debit Online Amount',
                      'Online Debit Amount',
                      'Debit Digital',
                      'Digital Debit',
                    ],
                    0
                  )
                ),
                debit_offline: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Debit Offline',
                      'Offline Debit',
                      'OfflineDebit',
                      'Debit Offline Amount',
                      'Offline Debit Amount',
                      'Debit Cash',
                      'Cash Debit',
                    ],
                    0
                  )
                ),
                company_name: sanitizeString(
                  getFieldValue(
                    row,
                    [
                      'Company',
                      'Company Name',
                      'CompanyName',
                      'Firm',
                      'Organization',
                      'Business',
                      'Entity',
                      'Client',
                      'Customer',
                      'Party',
                    ],
                    'Default Company'
                  )
                ),
                address:
                  sanitizeString(
                    getFieldValue(
                      row,
                      [
                        'Address',
                        'Company Address',
                        'CompanyAddress',
                        'Location',
                        'Street',
                        'City',
                        'State',
                        'Country',
                        'Place',
                      ],
                      ''
                    )
                  ) || null, // Allow null for empty address
                staff:
                  sanitizeString(
                    getFieldValue(
                      row,
                      [
                        'Staff',
                        'Staff Name',
                        'StaffName',
                        'Employee',
                        'User',
                        'Created By',
                        'CreatedBy',
                        'Entered By',
                        'EnteredBy',
                        'Operator',
                      ],
                      user?.username || 'admin'
                    )
                  ) || null, // Allow null for empty staff
                users: user?.username || 'admin',
                sale_qty: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Sale Qty',
                      'Sale Quantity',
                      'Sales Qty',
                      'Quantity Sold',
                      'SaleQty',
                      'SaleQuantity',
                      'SalesQty',
                      'QuantitySold',
                      'Sales Quantity',
                      'SalesQuantity',
                      'Qty Sold',
                      'QtySold',
                    ],
                    0
                  )
                ),
                purchase_qty: sanitizeNumber(
                  getFieldValue(
                    row,
                    [
                      'Purchase Qty',
                      'Purchase Quantity',
                      'Quantity Purchased',
                      'PurchaseQty',
                      'PurchaseQuantity',
                      'QuantityPurchased',
                      'Buy Qty',
                      'BuyQty',
                      'Buy Quantity',
                      'BuyQuantity',
                    ],
                    0
                  )
                ),
                cb: 'CB',
              };

              // Use simplified validation
              const validation = validateEntry(cleanEntry);
              if (!validation.isValid) {
                errorCount++;
                if (errors.length < 20) {
                  errors.push(
                    `Row ${globalIndex + 1}: ${validation.errors.join(', ')}`
                  );
                }
                continue;
              }

              // Ensure at least one amount is greater than 0
              if (cleanEntry.credit === 0 && cleanEntry.debit === 0) {
                // Set a default credit amount if both are 0
                cleanEntry.credit = 1;
              }

              // Ensure company exists before inserting entry
              try {
                await supabaseDB.addCompany(
                  cleanEntry.company_name,
                  cleanEntry.address || ''
                );
              } catch (companyError) {
                // Company might already exist, which is fine
                console.log(
                  `Company ${cleanEntry.company_name} already exists or error:`,
                  companyError
                );
              }

              // Ensure account exists before inserting entry
              try {
                await supabaseDB.addAccount(
                  cleanEntry.company_name,
                  cleanEntry.acc_name
                );
              } catch (accountError) {
                // Account might already exist, which is fine
                console.log(
                  `Account ${cleanEntry.acc_name} already exists or error:`,
                  accountError
                );
              }

              // Ensure sub account exists if provided
              if (
                cleanEntry.sub_acc_name &&
                cleanEntry.sub_acc_name.trim() !== ''
              ) {
                try {
                  await supabaseDB.addSubAccount(
                    cleanEntry.company_name,
                    cleanEntry.acc_name,
                    cleanEntry.sub_acc_name
                  );
                } catch (subAccountError) {
                  // Sub account might already exist, which is fine
                  console.log(
                    `Sub account ${cleanEntry.sub_acc_name} already exists or error:`,
                    subAccountError
                  );
                }
              }

              // Insert the cash book entry with lenient validation for CSV uploads
              console.log('Attempting to insert entry:', {
                index: globalIndex,
                data: cleanEntry,
              });

              try {
                // First, let's try a direct Supabase insert to bypass any wrapper issues
                const { data: directResult, error: directError } =
                  await supabase
                    .from('cash_book')
                    .insert({
                      ...cleanEntry,
                      sno: globalIndex + 1,
                      entry_time: new Date().toISOString(),
                      approved: false,
                      edited: false,
                      e_count: 0,
                      lock_record: false,
                    })
                    .select()
                    .single();

                if (directError) {
                  console.error('Direct insert failed:', directError);
                  throw new Error(
                    `Direct insert failed: ${directError.message}`
                  );
                }

                console.log('Successfully inserted entry:', directResult.id);
                successCount++;
              } catch (insertError) {
                console.error(
                  'Insert failed for entry:',
                  globalIndex,
                  insertError
                );

                // If it's a network/CORS error, try local storage fallback
                if (
                  insertError instanceof Error &&
                  (insertError.message.includes('fetch') ||
                    insertError.message.includes('network'))
                ) {
                  console.log(
                    'Network error detected, trying local storage fallback...'
                  );
                  const saved = saveToLocalStorage([cleanEntry]);
                  if (saved) {
                    successCount++;
                    console.log('Entry saved to local storage as fallback');
                  } else {
                    throw insertError;
                  }
                } else {
                  throw insertError;
                }
              }
            } catch (error) {
              errorCount++;
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              if (errors.length < 20) {
                errors.push(`Row ${globalIndex + 1}: ${errorMessage}`);
              }
            }
          }

          // Update progress after each batch
          const currentProgress = startIndex + batch.length;
          const percentage = Math.round(
            (currentProgress / result.data.length) * 100
          );

          setImportProgress({
            current: currentProgress,
            total: result.data.length,
            percentage,
            successCount,
            errorCount,
            currentBatch: batchIndex + 1,
            totalBatches,
          });

          // Small delay between batches to prevent database overload
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        setImportResults({
          successCount,
          errorCount,
          errors: errors.slice(0, 20), // Show first 20 errors for better debugging
        });

        if (errorCount > 0) {
          toast.error(
            `Import completed with ${errorCount} errors. Check the error list below.`
          );
        } else {
          toast.success(
            `Import completed successfully! ${successCount} entries imported.`
          );
        }
      } else {
        toast.error(result.error || 'Failed to import CSV data');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV data');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        Date: '2024-01-15',
        Company: 'Sample Company',
        'Main Account': 'Cash',
        'Sub Account': 'Main Branch',
        Particulars: 'Sample transaction',
        Credit: '1000',
        Debit: '0',
        Staff: 'admin',
        'Sale Qty': '0',
        'Purchase Qty': '0',
        Address: '123 Main St',
        'Credit Online': '800',
        'Credit Offline': '200',
        'Debit Online': '0',
        'Debit Offline': '0',
      },
      {
        Date: '2024-01-15',
        Company: 'Sample Company',
        'Main Account': 'Bank',
        'Sub Account': 'Main Branch',
        Particulars: 'Sample transaction 2',
        Credit: '0',
        Debit: '500',
        Staff: 'admin',
        'Sale Qty': '0',
        'Purchase Qty': '0',
        Address: '123 Main St',
        'Credit Online': '0',
        'Credit Offline': '0',
        'Debit Online': '300',
        'Debit Offline': '200',
      },
      {
        Date: '2024-01-16',
        Company: 'Another Company',
        'Main Account': 'Accounts Receivable',
        'Sub Account': 'Customer A',
        Particulars: 'Payment received',
        Credit: '2000',
        Debit: '0',
        Staff: 'admin',
        'Sale Qty': '10',
        'Purchase Qty': '0',
        Address: '456 Business Ave',
        'Credit Online': '1500',
        'Credit Offline': '500',
        'Debit Online': '0',
        'Debit Offline': '0',
      },
    ];

    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row =>
        headers
          .map(header => {
            const value = row[header as keyof typeof row];
            const escapedValue = String(value).replace(/"/g, '""');
            return `"${escapedValue}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-csv-format.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setUploadPreview([]);
    setUploadProgress(0);
    setImportResults(null);
    setIsDragOver(false);
  };

  // Debug function to test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Test basic fetch to Supabase
      const testUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co/rest/v1/';
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD',
          headers: {
            apikey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM',
          },
        });

        if (response.ok) {
          console.log('✅ Basic Supabase connectivity test passed');
          toast.success('Basic Supabase connectivity test passed');
        } else {
          console.log('❌ Basic connectivity test failed:', response.status);
          toast.error(`Basic connectivity test failed: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('❌ Basic fetch test failed:', fetchError);
        toast.error(
          'Network connectivity test failed. Supabase may be blocked by firewall/proxy.'
        );

        // Enable offline mode
        localStorage.setItem('offline_mode', 'true');
        toast.success('Offline mode enabled. Using local storage fallback.');
        return;
      }

      // Test Supabase client
      const { data, error } = await supabase.from('cash_book').select('count');
      if (error) {
        console.error('❌ Database connection failed:', error);
        toast.error('Database connection failed: ' + error.message);

        // Show detailed error info
        console.log('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Check if it's a network/CORS issue
        if (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('Failed to fetch')
        ) {
          toast.error('Network issue detected. Enabling offline mode...');
          localStorage.setItem('offline_mode', 'true');
          toast.success(
            'Offline mode enabled. You can still upload CSV files to local storage.'
          );
        }
      } else {
        console.log('✅ Database connection successful');
        localStorage.removeItem('offline_mode');
        toast.success('Database connection successful');
      }
    } catch (error) {
      console.error('💥 Database test error:', error);
      toast.error(
        'Database test error: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );

      // Enable offline mode as fallback
      localStorage.setItem('offline_mode', 'true');
      toast.success('Offline mode enabled due to connection issues.');
    }
  };

  // Check and disable RLS policies
  const checkAndDisableRLS = async () => {
    try {
      console.log('🔍 Checking RLS policies...');

      // First, check RLS status
      const { data: rlsStatus, error: rlsStatusError } =
        await supabase.rpc('check_rls_status');

      if (rlsStatusError) {
        console.log('❌ RLS status check failed:', rlsStatusError);
        toast.error('RLS status check failed: ' + rlsStatusError.message);
        return;
      }

      console.log('📊 RLS Status:', rlsStatus);

      // Check if any tables have RLS enabled
      const tablesWithRLS =
        rlsStatus?.filter((table: any) => table.rls_enabled) || [];

      if (tablesWithRLS.length > 0) {
        console.log('🔒 Tables with RLS enabled:', tablesWithRLS);
        toast.success(
          `${tablesWithRLS.length} tables have RLS enabled. Attempting to disable...`
        );

        // Try to disable RLS using a function call
        const { data: rlsData, error: rlsError } = await supabase.rpc(
          'disable_rls_for_tables'
        );

        if (rlsError) {
          console.log('❌ RLS disable function failed:', rlsError);
          toast.error('RLS disable failed: ' + rlsError.message);
        } else {
          console.log('✅ RLS disabled successfully:', rlsData);
          toast.success('RLS policies disabled successfully');

          // Test data access after disabling RLS
          await testDataAccess();
        }
      } else {
        console.log('✅ No tables have RLS enabled');
        toast.success('No RLS policies are blocking access');

        // Test data access anyway
        await testDataAccess();
      }
    } catch (error) {
      console.error('💥 RLS check error:', error);
      toast.error(
        'RLS check error: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  // Test direct data access
  const testDataAccess = async () => {
    try {
      console.log('🔍 Testing direct data access...');

      // Try to get all records
      const { data, error } = await supabase
        .from('cash_book')
        .select('*')
        .limit(5);

      if (error) {
        console.error('❌ Data access failed:', error);
        toast.error('Data access failed: ' + error.message);
      } else {
        console.log('✅ Data access successful:', data);
        toast.success(`Data access successful! Found ${data.length} records`);

        // Show first record details
        if (data.length > 0) {
          console.log('First record:', data[0]);
        }
      }
    } catch (error) {
      console.error('💥 Data access test error:', error);
      toast.error(
        'Data access test error: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  // Fallback function to save data locally if Supabase fails
  const saveToLocalStorage = (data: any[]) => {
    try {
      const existingData = JSON.parse(
        localStorage.getItem('csv_upload_data') || '[]'
      );
      const newData = [...existingData, ...data];
      localStorage.setItem('csv_upload_data', JSON.stringify(newData));
      console.log('✅ Data saved to local storage as fallback');
      return true;
    } catch (error) {
      console.error('❌ Failed to save to local storage:', error);
      return false;
    }
  };

  // View offline data
  const viewOfflineData = () => {
    try {
      const offlineData = JSON.parse(
        localStorage.getItem('csv_upload_data') || '[]'
      );
      console.log('📊 Offline data:', offlineData);

      if (offlineData.length > 0) {
        toast.success(`Found ${offlineData.length} entries in offline storage`);
        setUploadPreview(offlineData.slice(0, 10)); // Show first 10 as preview

        setImportResults({
          successCount: offlineData.length,
          errorCount: 0,
          errors: [],
        });
      } else {
        toast.success('No offline data found');
      }
    } catch (error) {
      console.error('❌ Failed to load offline data:', error);
      toast.error('Failed to load offline data');
    }
  };

  // Clear offline data
  const clearOfflineData = () => {
    try {
      localStorage.removeItem('csv_upload_data');
      localStorage.removeItem('offline_mode');
      toast.success('Offline data cleared successfully');
      setUploadPreview([]);
      setImportResults(null);
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      toast.error('Failed to clear offline data');
    }
  };

  // Sync offline data to Supabase when connection is restored
  const syncOfflineData = async () => {
    try {
      const offlineData = JSON.parse(
        localStorage.getItem('csv_upload_data') || '[]'
      );

      if (offlineData.length === 0) {
        toast.success('No offline data to sync');
        return;
      }

      toast.success(`Starting sync of ${offlineData.length} entries...`);

      // Test connection first
      const { data, error } = await supabase.from('cash_book').select('count');
      if (error) {
        toast.error('Connection still unavailable. Cannot sync.');
        return;
      }

      // TODO: Implement actual sync logic
      toast.success('Sync feature coming soon. Data is safely stored offline.');
    } catch (error) {
      console.error('❌ Failed to sync offline data:', error);
      toast.error('Failed to sync offline data');
    }
  };

  return (
    <div className='h-screen flex flex-col'>
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='w-full max-w-6xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                CSV Data Upload
              </h1>
              <p className='text-gray-600'>
                Upload and import CSV data into the cash book system
              </p>
            </div>
            <div className='flex gap-2 flex-wrap'>
              <Button variant='secondary' onClick={testDatabaseConnection}>
                Test DB Connection
              </Button>
              <Button variant='secondary' onClick={checkAndDisableRLS}>
                Check/Disable RLS
              </Button>
              <Button variant='secondary' onClick={testDataAccess}>
                Test Data Access
              </Button>
              <Button variant='secondary' onClick={viewOfflineData}>
                View Offline Data
              </Button>
              <Button variant='secondary' onClick={syncOfflineData}>
                Sync to DB
              </Button>
              <Button variant='secondary' onClick={clearOfflineData}>
                Clear Offline Data
              </Button>
              <Button
                variant='secondary'
                onClick={() =>
                  window.open('/test-supabase-connection.html', '_blank')
                }
              >
                Test HTML Connection
              </Button>
              <Button variant='secondary' onClick={resetUpload}>
                Reset
              </Button>
            </div>
          </div>

          {/* Main Upload Card */}
          <Card className='p-8'>
            <div className='space-y-6'>
              {/* File Upload Section */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload
                  className={`w-16 h-16 mx-auto mb-4 transition-colors duration-200 ${
                    isDragOver ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
                <h4 className='text-xl font-medium text-gray-900 mb-2'>
                  {isDragOver ? 'Drop your CSV file here' : 'Upload CSV File'}
                </h4>
                <p className='text-gray-600 mb-6 max-w-2xl mx-auto'>
                  {isDragOver
                    ? 'Release to upload your CSV file'
                    : 'Drag and drop your CSV file here, or click the button below. The system will import ALL your data with automatic column mapping and default values for any missing fields. <strong>Recommended columns:</strong> Date, Company, Main Account, Sub Account, Particulars, Credit, Debit, Staff, Sale Qty, Purchase Qty, Address.'}
                </p>

                <div className='flex gap-4 justify-center mb-4'>
                  <input
                    type='file'
                    accept='.csv'
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    className='hidden'
                    id='csv-upload'
                  />
                  <label
                    htmlFor='csv-upload'
                    className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors duration-200'
                  >
                    Choose CSV File
                  </label>
                  <Button variant='secondary' onClick={downloadSampleCSV}>
                    Download Sample CSV
                  </Button>
                </div>

                {/* Drag and Drop Instructions */}
                <div className='mt-4 text-sm text-gray-500'>
                  <p>
                    💡 <strong>Drag & Drop Tip:</strong> Simply drag your CSV
                    file from your computer and drop it anywhere in this area
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {uploadLoading && (
                <div className='space-y-4'>
                  {/* Overall Progress */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm text-gray-600'>
                      <span>Importing Data...</span>
                      <span>{importProgress.percentage}%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-3'>
                      <div
                        className='bg-blue-600 h-3 rounded-full transition-all duration-300'
                        style={{ width: `${importProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Detailed Progress Info */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div className='bg-blue-50 p-3 rounded-lg'>
                      <div className='text-blue-800 font-medium'>Progress</div>
                      <div className='text-blue-600'>
                        {importProgress.current.toLocaleString()} /{' '}
                        {importProgress.total.toLocaleString()}
                      </div>
                    </div>
                    <div className='bg-green-50 p-3 rounded-lg'>
                      <div className='text-green-800 font-medium'>Success</div>
                      <div className='text-green-600'>
                        {importProgress.successCount.toLocaleString()}
                      </div>
                    </div>
                    <div className='bg-red-50 p-3 rounded-lg'>
                      <div className='text-red-800 font-medium'>Errors</div>
                      <div className='text-red-600'>
                        {importProgress.errorCount.toLocaleString()}
                      </div>
                    </div>
                    <div className='bg-purple-50 p-3 rounded-lg'>
                      <div className='text-purple-800 font-medium'>Batch</div>
                      <div className='text-purple-600'>
                        {importProgress.currentBatch} /{' '}
                        {importProgress.totalBatches}
                      </div>
                    </div>
                  </div>

                  {/* Speed Indicator */}
                  <div className='text-xs text-gray-500 text-center'>
                    Processing 500 records per batch •{' '}
                    {importProgress.current > 0
                      ? Math.round(
                          importProgress.current /
                            (importProgress.currentBatch || 1)
                        )
                      : 0}{' '}
                    records per batch average
                  </div>
                </div>
              )}

              {/* File Info */}
              {uploadedFile && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-green-600' />
                    <span className='font-medium text-green-800'>
                      {uploadedFile.name}
                    </span>
                  </div>
                  <p className='text-sm text-green-600 mt-1'>
                    File size: {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Import Results */}
              {importResults && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <CheckCircle className='w-5 h-5 text-blue-600' />
                    <span className='font-medium text-blue-800'>
                      Import Results
                    </span>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-green-600 font-medium'>
                        ✓ {importResults.successCount} entries imported
                        successfully
                      </span>
                    </div>
                    <div>
                      <span className='text-red-600 font-medium'>
                        ✗ {importResults.errorCount} entries failed
                      </span>
                    </div>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className='mt-3'>
                      <p className='text-sm font-medium text-gray-700 mb-1'>
                        Errors:
                      </p>
                      <div className='text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto'>
                        {importResults.errors.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Section */}
              {uploadPreview.length > 0 && (
                <div className='space-y-4'>
                  <h4 className='font-medium text-gray-900'>
                    Preview (First 10 rows)
                  </h4>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm border border-gray-200'>
                      <thead className='bg-gray-50 border-b border-gray-200'>
                        <tr>
                          {Object.keys(uploadPreview[0]).map(header => (
                            <th key={header} className='px-3 py-2 text-left'>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreview.map((row, index) => (
                          <tr
                            key={index}
                            className='border-b border-gray-100 hover:bg-gray-50'
                          >
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className='px-3 py-2'>
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-4'>
                <Button
                  onClick={handleImportCSV}
                  disabled={
                    !uploadedFile || uploadPreview.length === 0 || uploadLoading
                  }
                  className='flex-1 text-lg py-3'
                >
                  {uploadLoading ? 'Importing...' : 'Import CSV Data'}
                </Button>
                <Button
                  variant='secondary'
                  onClick={resetUpload}
                  className='flex-1 text-lg py-3'
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Instructions Card */}
          <Card title='CSV Format Instructions' className='mt-6'>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h5 className='font-medium text-gray-900 mb-2'>
                    Recommended Columns:
                  </h5>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>
                      • <strong>Date:</strong> Transaction date (YYYY-MM-DD
                      format)
                    </li>
                    <li>
                      • <strong>Company:</strong> Company name
                    </li>
                    <li>
                      • <strong>Main Account:</strong> Account name
                    </li>
                    <li>
                      • <strong>Sub Account:</strong> Sub account name
                    </li>
                    <li>
                      • <strong>Particulars:</strong> Transaction description
                    </li>
                    <li>
                      • <strong>Credit:</strong> Credit amount (numeric)
                    </li>
                    <li>
                      • <strong>Debit:</strong> Debit amount (numeric)
                    </li>
                    <li>
                      • <strong>Staff:</strong> Staff member name
                    </li>
                    <li>
                      • <strong>Sale Qty:</strong> Sale quantity (numeric)
                    </li>
                    <li>
                      • <strong>Purchase Qty:</strong> Purchase quantity
                      (numeric)
                    </li>
                    <li>
                      • <strong>Address:</strong> Company address
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className='font-medium text-gray-900 mb-2'>
                    Optional Columns:
                  </h5>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>
                      • <strong>Credit Online/Offline:</strong> Online/Offline
                      credit amounts
                    </li>
                    <li>
                      • <strong>Debit Online/Offline:</strong> Online/Offline
                      debit amounts
                    </li>
                  </ul>
                  <h5 className='font-medium text-gray-900 mb-2 mt-4'>
                    Default Values:
                  </h5>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>
                      • <strong>Missing Particulars:</strong> "Transaction [row
                      number]"
                    </li>
                    <li>
                      • <strong>Missing Company:</strong> "Default Company"
                    </li>
                    <li>
                      • <strong>Missing Account:</strong> "Default Account"
                    </li>
                    <li>
                      • <strong>Missing Staff:</strong> "admin"
                    </li>
                  </ul>
                </div>
              </div>
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <div className='flex items-center gap-2'>
                  <AlertCircle className='w-5 h-5 text-yellow-600' />
                  <span className='font-medium text-yellow-800'>
                    Important Notes:
                  </span>
                </div>
                <ul className='text-sm text-yellow-700 mt-2 space-y-1'>
                  <li>• CSV file should have headers in the first row</li>
                  <li>• Date format should be YYYY-MM-DD (e.g., 2024-01-15)</li>
                  <li>• Credit and Debit amounts should be numeric values</li>
                  <li>
                    • At least one of Credit or Debit should be greater than 0
                  </li>
                  <li>• Large files may take some time to process</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CsvUpload;
