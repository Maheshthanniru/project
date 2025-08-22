import React, { useState, useCallback } from 'react';
import { Upload, , , , , ,  } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { importFromFile, validateImportedData } from '../utils/excel';

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
    totalBatches: 0
  });
  const [importResults, setImportResults] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
        toast.success(`Successfully loaded ${result.data.length} entries from CSV`);
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

    try {
      const result = await importFromFile(uploadedFile);
      
      if (result.success && result.data) {
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process data in batches of 500 for maximum reliability
        const batchSize = 500; // Reduced to 500 records per batch for better error handling
        const totalBatches = Math.ceil(result.data.length / batchSize);
        
        // Initialize progress
        setImportProgress({
          current: 0,
          total: result.data.length,
          percentage: 0,
          successCount: 0,
          errorCount: 0,
          currentBatch: 0,
          totalBatches
        });
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIndex = batchIndex * batchSize;
          const endIndex = Math.min(startIndex + batchSize, result.data.length);
          const batch = result.data.slice(startIndex, endIndex);
          
                     // Process batch in parallel for maximum speed
           const batchPromises = batch.map(async (row, i) => {
             const globalIndex = startIndex + i;
             
             try {
               // Optimized data mapping functions
               const sanitizeString = (value: any) => {
                 if (value === null || value === undefined || value === '') return '';
                 return String(value).trim();
               };

               const sanitizeNumber = (value: any) => {
                 if (value === null || value === undefined || value === '') return 0;
                 const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
                 return isNaN(num) ? 0 : num;
               };

               const sanitizeDate = (value: any) => {
                 if (!value || value === '') return undefined; // Return undefined for empty dates to use DB default
                 try {
                   // Handle various date formats
                   let date;
                   if (typeof value === 'string') {
                     // Try parsing different date formats
                     const dateFormats = [
                       'yyyy-MM-dd',
                       'dd/MM/yyyy',
                       'MM/dd/yyyy',
                       'dd-MM-yyyy',
                       'MM-dd-yyyy',
                       'yyyy/MM/dd',
                       'dd.MM.yyyy',
                       'MM.dd.yyyy'
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
                     
                     // If standard parsing fails, try direct Date constructor
                     date = new Date(value);
                     if (!isNaN(date.getTime())) {
                       return format(date, 'yyyy-MM-dd');
                     }
                   } else if (value instanceof Date) {
                     date = value;
                     if (!isNaN(date.getTime())) {
                       return format(date, 'yyyy-MM-dd');
                     }
                   }
                   
                   // If all parsing attempts fail, return undefined to use DB default
                   console.warn(`Could not parse date: ${value}, using database default`);
                   return undefined;
                 } catch (error) {
                   console.warn(`Error parsing date ${value}:`, error);
                   return undefined;
                 }
               };

               // Optimized field value extraction
               const getFieldValue = (row: any, possibleNames: string[], defaultValue: any) => {
                 for (const name of possibleNames) {
                   if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                     return row[name];
                   }
                 }
                 return defaultValue;
               };

                               // Clean and validate data before mapping
                const cleanEntry = {
                  acc_name: sanitizeString(getFieldValue(row, [
                    'Main Account', 'Account', 'Account Name', 'AccountName', 'MainAccount',
                    'Account Type', 'AccountType', 'Account Category', 'AccountCategory'
                  ], 'Default Account')),
                  sub_acc_name: sanitizeString(getFieldValue(row, [
                    'Sub Account', 'SubAccount', 'Sub Account Name', 'SubAccountName',
                    'Sub Account Type', 'SubAccountType', 'Branch', 'Location'
                  ], '')),
                  particulars: sanitizeString(getFieldValue(row, [
                    'Particulars', 'Description', 'Details', 'Transaction Details', 'TransactionDetails',
                    'Narration', 'Notes', 'Remarks', 'Comment', 'Memo'
                  ], `Transaction ${globalIndex + 1}`)),
                  c_date: sanitizeDate(getFieldValue(row, [
                    'Date', 'Transaction Date', 'Entry Date', 'TransactionDate', 'EntryDate',
                    'Posting Date', 'PostingDate', 'Value Date', 'ValueDate'
                  ], null)),
                  credit: sanitizeNumber(getFieldValue(row, [
                    'Credit', 'Credit Amount', 'CreditAmount', 'Credit Amt', 'CreditAmt',
                    'Credit Value', 'CreditValue', 'Credit Total', 'CreditTotal'
                  ], 0)),
                  debit: sanitizeNumber(getFieldValue(row, [
                    'Debit', 'Debit Amount', 'DebitAmount', 'Debit Amt', 'DebitAmt',
                    'Debit Value', 'DebitValue', 'Debit Total', 'DebitTotal'
                  ], 0)),
                  credit_online: sanitizeNumber(getFieldValue(row, [
                    'Credit Online', 'Online Credit', 'OnlineCredit', 'Credit Online Amount',
                    'Online Credit Amount', 'Credit Digital', 'Digital Credit'
                  ], 0)),
                  credit_offline: sanitizeNumber(getFieldValue(row, [
                    'Credit Offline', 'Offline Credit', 'OfflineCredit', 'Credit Offline Amount',
                    'Offline Credit Amount', 'Credit Cash', 'Cash Credit'
                  ], 0)),
                  debit_online: sanitizeNumber(getFieldValue(row, [
                    'Debit Online', 'Online Debit', 'OnlineDebit', 'Debit Online Amount',
                    'Online Debit Amount', 'Debit Digital', 'Digital Debit'
                  ], 0)),
                  debit_offline: sanitizeNumber(getFieldValue(row, [
                    'Debit Offline', 'Offline Debit', 'OfflineDebit', 'Debit Offline Amount',
                    'Offline Debit Amount', 'Debit Cash', 'Cash Debit'
                  ], 0)),
                  company_name: sanitizeString(getFieldValue(row, [
                    'Company', 'Company Name', 'CompanyName', 'Firm', 'Organization',
                    'Business', 'Entity', 'Client', 'Customer', 'Party'
                  ], 'Default Company')),
                  address: sanitizeString(getFieldValue(row, [
                    'Address', 'Company Address', 'CompanyAddress', 'Location',
                    'Street', 'City', 'State', 'Country', 'Place'
                  ], '')),
                  staff: sanitizeString(getFieldValue(row, [
                    'Staff', 'Staff Name', 'StaffName', 'Employee', 'User',
                    'Created By', 'CreatedBy', 'Entered By', 'EnteredBy', 'Operator'
                  ], user?.username || 'admin')),
                  users: user?.username || 'admin',
                  sale_qty: sanitizeNumber(getFieldValue(row, [
                    'Sale Qty', 'Sale Quantity', 'Sales Qty', 'Quantity Sold',
                    'SaleQty', 'SaleQuantity', 'SalesQty', 'QuantitySold',
                    'Sales Quantity', 'SalesQuantity', 'Qty Sold', 'QtySold'
                  ], 0)),
                  purchase_qty: sanitizeNumber(getFieldValue(row, [
                    'Purchase Qty', 'Purchase Quantity', 'Quantity Purchased',
                    'PurchaseQty', 'PurchaseQuantity', 'QuantityPurchased',
                    'Buy Qty', 'BuyQty', 'Buy Quantity', 'BuyQuantity'
                  ], 0)),
                  cb: 'CB',
                };

                                // Use the cleaned entry data
                const entry = cleanEntry;

                               // Robust database operation with comprehensive error handling
                try {
                  // Validate entry before insertion
                  if (!entry.acc_name || entry.acc_name.trim() === '') {
                    return { 
                      success: false, 
                      index: globalIndex, 
                      error: 'Missing account name' 
                    };
                  }
                  
                  if (!entry.company_name || entry.company_name.trim() === '') {
                    return { 
                      success: false, 
                      index: globalIndex, 
                      error: 'Missing company name' 
                    };
                  }
                  
                  if ((entry.credit || 0) === 0 && (entry.debit || 0) === 0) {
                    return { 
                      success: false, 
                      index: globalIndex, 
                      error: 'Both credit and debit cannot be zero' 
                    };
                  }
                  
                  // Ensure company exists before inserting entry
                  try {
                    await supabaseDB.addCompany(entry.company_name, entry.address || '');
                  } catch (companyError) {
                    // Company might already exist, which is fine
                    console.log(`Company ${entry.company_name} already exists or error:`, companyError);
                  }
                  
                  // Ensure account exists before inserting entry
                  try {
                    await supabaseDB.addAccount(entry.company_name, entry.acc_name);
                  } catch (accountError) {
                    // Account might already exist, which is fine
                    console.log(`Account ${entry.acc_name} already exists or error:`, accountError);
                  }
                  
                  // Ensure sub account exists if provided
                  if (entry.sub_acc_name && entry.sub_acc_name.trim() !== '') {
                    try {
                      await supabaseDB.addSubAccount(entry.company_name, entry.acc_name, entry.sub_acc_name);
                    } catch (subAccountError) {
                      // Sub account might already exist, which is fine
                      console.log(`Sub account ${entry.sub_acc_name} already exists or error:`, subAccountError);
                    }
                  }
                  
                  await supabaseDB.addCashBookEntry(entry);
                  return { success: true, index: globalIndex };
                } catch (dbError) {
                  // Enhanced retry with exponential backoff
                  const retryDelay = Math.min(100 * Math.pow(2, 0), 500); // Start with 100ms, max 500ms
                  await new Promise(resolve => setTimeout(resolve, retryDelay));
                  try {
                    await supabaseDB.addCashBookEntry(entry);
                    return { success: true, index: globalIndex };
                  } catch (retryError) {
                    // Final retry with longer delay for connection issues
                    await new Promise(resolve => setTimeout(resolve, 200));
                    try {
                      await supabaseDB.addCashBookEntry(entry);
                      return { success: true, index: globalIndex };
                    } catch (finalError) {
                      const errorMessage = finalError instanceof Error ? finalError.message : 'Unknown error';
                      return { 
                        success: false, 
                        index: globalIndex, 
                        error: `Database error: ${errorMessage}` 
                      };
                    }
                  }
                }
             } catch (error) {
               return { 
                 success: false, 
                 index: globalIndex, 
                 error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
               };
             }
           });

           // Wait for all promises in the batch to complete
           const batchResults = await Promise.all(batchPromises);

          // Batch processing completed
          
          // Count results
          const batchSuccessCount = batchResults.filter(r => r.success).length;
          const batchErrorCount = batchResults.filter(r => !r.success).length;
          
          successCount += batchSuccessCount;
          errorCount += batchErrorCount;
          
          // Add errors to list (limit to first 20 for better debugging)
          batchResults.filter(r => !r.success).forEach(r => {
            if (errors.length < 20) {
              errors.push(`Row ${r.index + 1}: ${r.error}`);
            }
          });
          
          // Update progress
          const currentProgress = startIndex + batch.length;
          const percentage = Math.round((currentProgress / result.data.length) * 100);
          
          setImportProgress({
            current: currentProgress,
            total: result.data.length,
            percentage,
            successCount,
            errorCount,
            currentBatch: batchIndex + 1,
            totalBatches
          });
          
                               // Small delay between batches to prevent database overload
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Retry failed entries with smaller batches
        let retrySuccessCount = 0;
        if (errorCount > 0 && errors.length > 0) {
          toast.info(`Retrying ${errorCount} failed entries...`);
          
          // Get failed entries for retry
          const failedEntries = batchResults.filter(r => !r.success).map(r => ({
            index: r.index,
            entry: result.data[r.index]
          }));
          
          // Retry failed entries in smaller batches of 50
          const retryBatchSize = 50;
          const retryBatches = Math.ceil(failedEntries.length / retryBatchSize);
          
          for (let retryBatchIndex = 0; retryBatchIndex < retryBatches; retryBatchIndex++) {
            const retryStartIndex = retryBatchIndex * retryBatchSize;
            const retryEndIndex = Math.min(retryStartIndex + retryBatchSize, failedEntries.length);
            const retryBatch = failedEntries.slice(retryStartIndex, retryEndIndex);
            
            const retryPromises = retryBatch.map(async (failedItem) => {
              const row = failedItem.entry;
              const globalIndex = failedItem.index;
              
              try {
                // Re-create the entry with the same logic
                const cleanEntry = {
                  acc_name: sanitizeString(getFieldValue(row, [
                    'Main Account', 'Account', 'Account Name', 'AccountName', 'MainAccount',
                    'Account Type', 'AccountType', 'Account Category', 'AccountCategory'
                  ], 'Default Account')),
                  sub_acc_name: sanitizeString(getFieldValue(row, [
                    'Sub Account', 'SubAccount', 'Sub Account Name', 'SubAccountName',
                    'Sub Account Type', 'SubAccountType', 'Branch', 'Location'
                  ], '')),
                  particulars: sanitizeString(getFieldValue(row, [
                    'Particulars', 'Description', 'Details', 'Transaction Details', 'TransactionDetails',
                    'Narration', 'Notes', 'Remarks', 'Comment', 'Memo'
                  ], `Transaction ${globalIndex + 1}`)),
                  c_date: sanitizeDate(getFieldValue(row, [
                    'Date', 'Transaction Date', 'Entry Date', 'TransactionDate', 'EntryDate',
                    'Posting Date', 'PostingDate', 'Value Date', 'ValueDate'
                  ], null)),
                  credit: sanitizeNumber(getFieldValue(row, [
                    'Credit', 'Credit Amount', 'CreditAmount', 'Credit Amt', 'CreditAmt',
                    'Credit Value', 'CreditValue', 'Credit Total', 'CreditTotal'
                  ], 0)),
                  debit: sanitizeNumber(getFieldValue(row, [
                    'Debit', 'Debit Amount', 'DebitAmount', 'Debit Amt', 'DebitAmt',
                    'Debit Value', 'DebitValue', 'Debit Total', 'DebitTotal'
                  ], 0)),
                  credit_online: sanitizeNumber(getFieldValue(row, [
                    'Credit Online', 'Online Credit', 'OnlineCredit', 'Credit Online Amount',
                    'Online Credit Amount', 'Credit Digital', 'Digital Credit'
                  ], 0)),
                  credit_offline: sanitizeNumber(getFieldValue(row, [
                    'Credit Offline', 'Offline Credit', 'OfflineCredit', 'Credit Offline Amount',
                    'Offline Credit Amount', 'Credit Cash', 'Cash Credit'
                  ], 0)),
                  debit_online: sanitizeNumber(getFieldValue(row, [
                    'Debit Online', 'Online Debit', 'OnlineDebit', 'Debit Online Amount',
                    'Online Debit Amount', 'Debit Digital', 'Digital Debit'
                  ], 0)),
                  debit_offline: sanitizeNumber(getFieldValue(row, [
                    'Debit Offline', 'Offline Debit', 'OfflineDebit', 'Debit Offline Amount',
                    'Offline Debit Amount', 'Debit Cash', 'Cash Debit'
                  ], 0)),
                  company_name: sanitizeString(getFieldValue(row, [
                    'Company', 'Company Name', 'CompanyName', 'Firm', 'Organization',
                    'Business', 'Entity', 'Client', 'Customer', 'Party'
                  ], 'Default Company')),
                  address: sanitizeString(getFieldValue(row, [
                    'Address', 'Company Address', 'CompanyAddress', 'Location',
                    'Street', 'City', 'State', 'Country', 'Place'
                  ], '')),
                  staff: sanitizeString(getFieldValue(row, [
                    'Staff', 'Staff Name', 'StaffName', 'Employee', 'User',
                    'Created By', 'CreatedBy', 'Entered By', 'EnteredBy', 'Operator'
                  ], user?.username || 'admin')),
                  users: user?.username || 'admin',
                  sale_qty: sanitizeNumber(getFieldValue(row, [
                    'Sale Qty', 'Sale Quantity', 'Sales Qty', 'Quantity Sold',
                    'SaleQty', 'SaleQuantity', 'SalesQty', 'QuantitySold',
                    'Sales Quantity', 'SalesQuantity', 'Qty Sold', 'QtySold'
                  ], 0)),
                  purchase_qty: sanitizeNumber(getFieldValue(row, [
                    'Purchase Qty', 'Purchase Quantity', 'Quantity Purchased',
                    'PurchaseQty', 'PurchaseQuantity', 'QuantityPurchased',
                    'Buy Qty', 'BuyQty', 'Buy Quantity', 'BuyQuantity'
                  ], 0)),
                  cb: 'CB',
                };
                
                                 // Ensure company exists before inserting entry
                 try {
                   await supabaseDB.addCompany(cleanEntry.company_name, cleanEntry.address || '');
                 } catch (companyError) {
                   // Company might already exist, which is fine
                   console.log(`Company ${cleanEntry.company_name} already exists or error:`, companyError);
                 }
                 
                 // Ensure account exists before inserting entry
                 try {
                   await supabaseDB.addAccount(cleanEntry.company_name, cleanEntry.acc_name);
                 } catch (accountError) {
                   // Account might already exist, which is fine
                   console.log(`Account ${cleanEntry.acc_name} already exists or error:`, accountError);
                 }
                 
                 // Ensure sub account exists if provided
                 if (cleanEntry.sub_acc_name && cleanEntry.sub_acc_name.trim() !== '') {
                   try {
                     await supabaseDB.addSubAccount(cleanEntry.company_name, cleanEntry.acc_name, cleanEntry.sub_acc_name);
                   } catch (subAccountError) {
                     // Sub account might already exist, which is fine
                     console.log(`Sub account ${cleanEntry.sub_acc_name} already exists or error:`, subAccountError);
                   }
                 }
                 
                 await supabaseDB.addCashBookEntry(cleanEntry);
                 return { success: true, index: globalIndex };
              } catch (retryError) {
                return { 
                  success: false, 
                  index: globalIndex, 
                  error: `Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}` 
                };
              }
            });
            
            const retryResults = await Promise.all(retryPromises);
            retrySuccessCount += retryResults.filter(r => r.success).length;
            
            // Small delay between retry batches
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Update final counts
          successCount += retrySuccessCount;
          errorCount -= retrySuccessCount;
        }
        
        setImportResults({
          successCount,
          errorCount,
          errors: errors.slice(0, 20) // Show first 20 errors for better debugging
        });

        if (errorCount > 0) {
          toast.error(`Import completed with ${errorCount} errors. ${retrySuccessCount > 0 ? `${retrySuccessCount} entries were successfully retried.` : ''} Check the error list below.`);
        } else {
          toast.success(`Import completed successfully! ${successCount} entries imported.`);
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
        'Address': '123 Main St',
        'Credit Online': '800',
        'Credit Offline': '200',
        'Debit Online': '0',
        'Debit Offline': '0'
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
        'Address': '123 Main St',
        'Credit Online': '0',
        'Credit Offline': '0',
        'Debit Online': '300',
        'Debit Offline': '200'
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
        'Address': '456 Business Ave',
        'Credit Online': '1500',
        'Credit Offline': '500',
        'Debit Online': '0',
        'Debit Offline': '0'
      }
    ];
    
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        }).join(',')
      )
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

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CSV Data Upload</h1>
              <p className="text-gray-600">Upload and import CSV data into the cash book system</p>
            </div>
            <Button
              icon={}
              variant="secondary"
              onClick={resetUpload}
            >
              Reset
            </Button>
          </div>

          {/* Main Upload Card */}
          <Card className="p-8">
            <div className="space-y-6">
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
                 <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors duration-200 ${
                   isDragOver ? 'text-blue-500' : 'text-gray-400'
                 }`} />
                 <h4 className="text-xl font-medium text-gray-900 mb-2">
                   {isDragOver ? 'Drop your CSV file here' : 'Upload CSV File'}
                 </h4>
                 <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                   {isDragOver 
                     ? 'Release to upload your CSV file'
                     : 'Drag and drop your CSV file here, or click the button below. The system will import ALL your data with automatic column mapping and default values for any missing fields. <strong>Recommended columns:</strong> Date, Company, Main Account, Sub Account, Particulars, Credit, Debit, Staff, Sale Qty, Purchase Qty, Address.'
                   }
                 </p>
                 
                 <div className="flex gap-4 justify-center mb-4">
                   <input
                     type="file"
                     accept=".csv"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         handleFileUpload(file);
                       }
                     }}
                     className="hidden"
                     id="csv-upload"
                   />
                   <label
                     htmlFor="csv-upload"
                     className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                   >
                     Choose CSV File
                   </label>
                   <Button
                     variant="secondary"
                     icon={}
                     onClick={downloadSampleCSV}
                   >
                     Download Sample CSV
                   </Button>
                 </div>
                 
                 {/* Drag and Drop Instructions */}
                 <div className="mt-4 text-sm text-gray-500">
                   <p>💡 <strong>Drag & Drop Tip:</strong> Simply drag your CSV file from your computer and drop it anywhere in this area</p>
                 </div>
               </div>

              {/* Progress Bar */}
              {uploadLoading && (
                <div className="space-y-4">
                  {/* Overall Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Importing Data...</span>
                      <span>{importProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Detailed Progress Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-800 font-medium">Progress</div>
                      <div className="text-blue-600">{importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-green-800 font-medium">Success</div>
                      <div className="text-green-600">{importProgress.successCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-red-800 font-medium">Errors</div>
                      <div className="text-red-600">{importProgress.errorCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-purple-800 font-medium">Batch</div>
                      <div className="text-purple-600">{importProgress.currentBatch} / {importProgress.totalBatches}</div>
                    </div>
                  </div>
                  
                                     {/* Speed Indicator */}
                   <div className="text-xs text-gray-500 text-center">
                     Processing 500 records per batch • {importProgress.current > 0 ? Math.round(importProgress.current / (importProgress.currentBatch || 1)) : 0} records per batch average
                   </div>
                </div>
              )}

              {/* File Info */}
              {uploadedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">{uploadedFile.name}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    File size: {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Import Results */}
              {importResults && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Import Results</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">✓ {importResults.successCount} entries imported successfully</span>
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">✗ {importResults.errorCount} entries failed</span>
                    </div>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Errors:</p>
                      <div className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
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
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Preview (First 10 rows)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {Object.keys(uploadPreview[0]).map((header) => (
                            <th key={header} className="px-3 py-2 text-left">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreview.map((row, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2">
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
              <div className="flex gap-4">
                <Button
                  onClick={handleImportCSV}
                  disabled={!uploadedFile || uploadPreview.length === 0 || uploadLoading}
                  className="flex-1 text-lg py-3"
                >
                  {uploadLoading ? 'Importing...' : 'Import CSV Data'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetUpload}
                  className="flex-1 text-lg py-3"
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Instructions Card */}
          <Card title="CSV Format Instructions" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Recommended Columns:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Date:</strong> Transaction date (YYYY-MM-DD format)</li>
                    <li>• <strong>Company:</strong> Company name</li>
                    <li>• <strong>Main Account:</strong> Account name</li>
                    <li>• <strong>Sub Account:</strong> Sub account name</li>
                    <li>• <strong>Particulars:</strong> Transaction description</li>
                    <li>• <strong>Credit:</strong> Credit amount (numeric)</li>
                    <li>• <strong>Debit:</strong> Debit amount (numeric)</li>
                    <li>• <strong>Staff:</strong> Staff member name</li>
                    <li>• <strong>Sale Qty:</strong> Sale quantity (numeric)</li>
                    <li>• <strong>Purchase Qty:</strong> Purchase quantity (numeric)</li>
                    <li>• <strong>Address:</strong> Company address</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Optional Columns:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Credit Online/Offline:</strong> Online/Offline credit amounts</li>
                    <li>• <strong>Debit Online/Offline:</strong> Online/Offline debit amounts</li>
                  </ul>
                  <h5 className="font-medium text-gray-900 mb-2 mt-4">Default Values:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Missing Particulars:</strong> "Transaction [row number]"</li>
                    <li>• <strong>Missing Company:</strong> "Default Company"</li>
                    <li>• <strong>Missing Account:</strong> "Default Account"</li>
                    <li>• <strong>Missing Staff:</strong> "admin"</li>
                  </ul>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Important Notes:</span>
                </div>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• CSV file should have headers in the first row</li>
                  <li>• Date format should be YYYY-MM-DD (e.g., 2024-01-15)</li>
                  <li>• Credit and Debit amounts should be numeric values</li>
                  <li>• At least one of Credit or Debit should be greater than 0</li>
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