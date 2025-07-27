import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
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

        // Reduce batch size to prevent database overload
        const batchSize = 100; // Reduced to prevent rate limiting
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
          
          // Process batch sequentially to prevent database overload
          const batchResults = [];
          for (let i = 0; i < batch.length; i++) {
            const row = batch[i];
            const globalIndex = startIndex + i;
            
            try {
              // Ultra-flexible data mapping with extensive fallbacks
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
                if (!value || value === '') return format(new Date(), 'yyyy-MM-dd');
                try {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return format(new Date(), 'yyyy-MM-dd');
                  return format(date, 'yyyy-MM-dd');
                } catch {
                  return format(new Date(), 'yyyy-MM-dd');
                }
              };

              // Try multiple column name variations for each field
              const getFieldValue = (row: any, possibleNames: string[], defaultValue: any) => {
                for (const name of possibleNames) {
                  if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                    return row[name];
                  }
                }
                return defaultValue;
              };

              // Map CSV columns to database fields with ultra-flexible column names
              const entry = {
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
                ], format(new Date(), 'yyyy-MM-dd'))),
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

              // Add retry logic for database operations
              let retryCount = 0;
              const maxRetries = 3;
              let success = false;

              while (retryCount < maxRetries && !success) {
                try {
                  await supabaseDB.addCashBookEntry(entry);
                  success = true;
                } catch (dbError) {
                  retryCount++;
                  if (retryCount < maxRetries) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                  } else {
                    throw dbError;
                  }
                }
              }

              batchResults.push({ success: true, index: globalIndex });
            } catch (error) {
              console.error(`Database error importing row ${globalIndex + 1}:`, error);
              batchResults.push({ 
                success: false, 
                index: globalIndex, 
                error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}` 
              });
            }

            // Small delay between each record to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
          }

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
          
          // Reduced delay for faster processing
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        setImportResults({
          successCount,
          errorCount,
          errors: errors.slice(0, 10) // Show only first 10 errors
        });

        toast.success(`Import completed! ${successCount} entries imported, ${errorCount} failed`);
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
              icon={RefreshCw}
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-gray-900 mb-2">Upload CSV File</h4>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Upload any CSV file. The system will import ALL your data with automatic column mapping and default values for any missing fields. <strong>Recommended columns:</strong> Date, Company, Main Account, Sub Account, Particulars, Credit, Debit, Staff, Sale Qty, Purchase Qty, Address.
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
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    Choose CSV File
                  </label>
                  <Button
                    variant="secondary"
                    icon={Download}
                    onClick={downloadSampleCSV}
                  >
                    Download Sample CSV
                  </Button>
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
                    Processing {importProgress.current > 0 ? Math.round(importProgress.current / (importProgress.currentBatch || 1)) : 0} records per batch
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