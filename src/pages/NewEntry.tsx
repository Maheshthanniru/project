import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { importFromFile, validateImportedData } from '../utils/excel';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Building,
  Clock,
  Search,
  RefreshCw,
} from 'lucide-react';

interface NewEntryForm {
  date: string;
  companyName: string;
  accountName: string;
  subAccount: string;
  particulars: string;
  saleQ: string;
  purchaseQ: string;
  credit: string;
  debit: string;
  creditOnline: string;
  creditOffline: string;
  debitOnline: string;
  debitOffline: string;
  staff: string;
  quantityChecked: boolean;
}

const NewEntry: React.FC = () => {
  const { user } = useAuth();

  const [entry, setEntry] = useState<NewEntryForm>({
    date: format(new Date(), 'yyyy-MM-dd'),
    companyName: '',
    accountName: '',
    subAccount: '',
    particulars: '',
    saleQ: '',
    purchaseQ: '',
    credit: '',
    debit: '',
    creditOnline: '',
    creditOffline: '',
    debitOnline: '',
    debitOffline: '',
    staff: user?.username || '',
    quantityChecked: false,
  });

  const [dualEntryEnabled, setDualEntryEnabled] = useState(false);
  const [dualEntry, setDualEntry] = useState<NewEntryForm>({
    date: format(new Date(), 'yyyy-MM-dd'),
    companyName: '',
    accountName: '',
    subAccount: '',
    particulars: '',
    saleQ: '',
    purchaseQ: '',
    credit: '',
    debit: '',
    creditOnline: '',
    creditOffline: '',
    debitOnline: '',
    debitOffline: '',
    staff: user?.username || '',
    quantityChecked: false,
  });

  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>(
    []
  );
  const [subAccounts, setSubAccounts] = useState<
    { value: string; label: string }[]
  >([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDailyEntryNo, setCurrentDailyEntryNo] = useState(0);
  const [totalEntryCount, setTotalEntryCount] = useState(0);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  // Modal states for creating new items
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showNewSubAccount, setShowNewSubAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<
    'company' | 'account' | 'subAccount'
  >('company');

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newSubAccountName, setNewSubAccountName] = useState('');

  // Database connection test
  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Test basic connectivity
      const { data, error } = await supabase.from('companies').select('count');
      if (error) {
        console.error('❌ Database connection failed:', error);
        toast.error('Database connection failed: ' + error.message);
        return false;
      }

      console.log('✅ Database connection successful');
      toast.success('Database connection successful');
      return true;
    } catch (error) {
      console.error('💥 Database test error:', error);
      toast.error(
        'Database test error: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
      return false;
    }
  };

  // CSV Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
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
  const [importErrors, setImportErrors] = useState<string[]>([]);

  useEffect(() => {
    loadDropdownData();
    updateDailyEntryNumber();
    updateTotalEntryCount();
  }, []);

  useEffect(() => {
    updateDailyEntryNumber();
  }, [entry.date]);

  useEffect(() => {
    if (entry.companyName) {
      loadAccountsByCompany();
    }
  }, [entry.companyName]);

  useEffect(() => {
    if (entry.companyName && entry.accountName) {
      loadSubAccountsByAccount();
    }
  }, [entry.companyName, entry.accountName]);

  useEffect(() => {
    const fetchRecentEntries = async () => {
      const entries = await supabaseDB.getCashBookEntries();
      setRecentEntries(
        entries
          .sort((a, b) => {
            const aTime = a.created_at
              ? new Date(a.created_at).getTime()
              : a.sno;
            const bTime = b.created_at
              ? new Date(b.created_at).getTime()
              : b.sno;
            return bTime - aTime;
          })
          .slice(0, 5)
      );
    };
    fetchRecentEntries();
  }, []);

  const updateDailyEntryNumber = async () => {
    try {
      // Get today's entries count for daily entry number
      const todayEntries = await supabaseDB.getCashBookEntries();
      const todayCount = todayEntries.filter(
        dbEntry => dbEntry.c_date === entry.date
      ).length;
      setCurrentDailyEntryNo(todayCount + 1);
    } catch (error) {
      console.error('Error updating daily entry number:', error);
      setCurrentDailyEntryNo(1);
    }
  };

  const updateTotalEntryCount = async () => {
    try {
      const allEntries = await supabaseDB.getCashBookEntries();
      setTotalEntryCount(allEntries.length);
    } catch (error) {
      console.error('Error updating total entry count:', error);
      setTotalEntryCount(0);
    }
  };

  const loadDropdownData = async () => {
    try {
      console.log('🔍 Loading dropdown data...');

      // Load companies
      const companies = await supabaseDB.getCompanies();
      console.log('📊 Companies loaded:', companies.length);
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies(companiesData);

      // Load users
      const users = await supabaseDB.getUsers();
      console.log('👥 Users loaded:', users.length);
      const usersData = users
        .filter(u => u.is_active)
        .map(user => ({
          value: user.username,
          label: user.username,
        }));
      setUsers(usersData);

      console.log('✅ Dropdown data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data. Check console for details.');

      // If it's a network/RLS issue, show specific message
      if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Network issue detected. Please check your connection.');
      }
    }
  };

  const loadAccountsByCompany = async () => {
    try {
      const accounts = await supabaseDB.getAccountsByCompany(entry.companyName);
      const accountsData = accounts.map(account => ({
        value: account.acc_name,
        label: account.acc_name,
      }));
      setAccounts(accountsData);
      setEntry(prev => ({ ...prev, accountName: '', subAccount: '' }));
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const loadSubAccountsByAccount = async () => {
    try {
      const subAccounts = await supabaseDB.getSubAccountsByAccount(
        entry.companyName,
        entry.accountName
      );
      const subAccountsData = subAccounts.map(subAcc => ({
        value: subAcc.sub_acc,
        label: subAcc.sub_acc,
      }));
      setSubAccounts(subAccountsData);
      setEntry(prev => ({ ...prev, subAccount: '' }));
    } catch (error) {
      console.error('Error loading sub accounts:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const handleInputChange = (
    field: keyof NewEntryForm,
    value: string | number
  ) => {
    setEntry(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate main entry
    if (!entry.companyName || !entry.accountName || !entry.particulars) {
      toast.error('Please fill in required fields');
      return;
    }
    const mainCredit = parseFloat(entry.credit) || 0;
    const mainDebit = parseFloat(entry.debit) || 0;
    if (mainCredit === 0 && mainDebit === 0) {
      toast.error('Please enter either credit or debit amount in main entry');
      return;
    }
    // If dual entry enabled, validate dual entry
    let dualCredit = 0,
      dualDebit = 0;
    if (dualEntryEnabled) {
      if (
        !dualEntry.companyName ||
        !dualEntry.accountName ||
        !dualEntry.particulars
      ) {
        toast.error('Please fill in all required fields in Dual Entry');
        return;
      }
      dualCredit = parseFloat(dualEntry.credit) || 0;
      dualDebit = parseFloat(dualEntry.debit) || 0;
      if (dualCredit === 0 && dualDebit === 0) {
        toast.error('Please enter either credit or debit amount in Dual Entry');
        return;
      }
    }
    setLoading(true);
    try {
      // Save main entry
      const mainCreditNum = parseFloat(entry.credit) || 0;
      const mainDebitNum = parseFloat(entry.debit) || 0;
      const newEntry = await supabaseDB.addCashBookEntry({
        acc_name: entry.accountName,
        sub_acc_name: entry.subAccount,
        particulars: entry.particulars,
        c_date: entry.date,
        credit: mainCreditNum,
        debit: mainDebitNum,
        credit_online: 0,
        credit_offline: 0,
        debit_online: 0,
        debit_offline: 0,
        company_name: entry.companyName,
        address: '',
        staff: entry.staff,
        users: user?.username || '',
        sale_qty: entry.quantityChecked ? parseFloat(entry.saleQ) || 0 : 0,
        purchase_qty: entry.quantityChecked
          ? parseFloat(entry.purchaseQ) || 0
          : 0,
        cb: 'CB',
      });
      // If dual entry, save dual entry as the opposite (e.g. if main is debit, dual is credit)
      if (dualEntryEnabled) {
        const dualCreditNum = parseFloat(dualEntry.credit) || 0;
        const dualDebitNum = parseFloat(dualEntry.debit) || 0;
        await supabaseDB.addCashBookEntry({
          acc_name: dualEntry.accountName,
          sub_acc_name: dualEntry.subAccount,
          particulars: dualEntry.particulars,
          c_date: dualEntry.date,
          credit: dualCreditNum,
          debit: dualDebitNum,
          credit_online: 0,
          credit_offline: 0,
          debit_online: 0,
          debit_offline: 0,
          company_name: dualEntry.companyName,
          address: '',
          staff: dualEntry.staff,
          users: user?.username || '',
          sale_qty: dualEntry.quantityChecked
            ? parseFloat(dualEntry.saleQ) || 0
            : 0,
          purchase_qty: dualEntry.quantityChecked
            ? parseFloat(dualEntry.purchaseQ) || 0
            : 0,
          cb: 'CB',
        });
      }
      toast.success(
        `Entry${dualEntryEnabled ? ' (Dual)' : ''} saved successfully!`
      );
      // Reset forms
      const currentDate = entry.date;
      setEntry({
        date: currentDate,
        companyName: '',
        accountName: '',
        subAccount: '',
        particulars: '',
        saleQ: '',
        purchaseQ: '',
        credit: '',
        debit: '',
        creditOnline: '',
        creditOffline: '',
        debitOnline: '',
        debitOffline: '',
        staff: user?.username || '',
        quantityChecked: false,
      });
      setAccounts([]);
      setSubAccounts([]);
      setDualEntry({
        date: currentDate,
        companyName: '',
        accountName: '',
        subAccount: '',
        particulars: '',
        saleQ: '',
        purchaseQ: '',
        credit: '',
        debit: '',
        creditOnline: '',
        creditOffline: '',
        debitOnline: '',
        debitOffline: '',
        staff: user?.username || '',
        quantityChecked: false,
      });
      setDualEntryEnabled(false);
      updateDailyEntryNumber();
      await updateTotalEntryCount();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(
        `Failed to save entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      console.log('Creating company:', {
        name: newCompanyName.trim(),
        address: newCompanyAddress.trim(),
      });
      const company = await supabaseDB.addCompany(
        newCompanyName.trim(),
        newCompanyAddress.trim()
      );
      console.log('Company created successfully:', company);
      setCompanies(prev => [
        ...prev,
        { value: company.company_name, label: company.company_name },
      ]);
      setEntry(prev => ({ ...prev, companyName: company.company_name }));
      setNewCompanyName('');
      setNewCompanyAddress('');
      setShowNewCompany(false);
      toast.success('Company created successfully!');
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error(
        `Failed to create company: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim() || !entry.companyName) {
      toast.error('Account name and company selection are required');
      return;
    }

    try {
      const account = await supabaseDB.addAccount(
        entry.companyName,
        newAccountName.trim()
      );
      setAccounts(prev => [
        ...prev,
        { value: account.acc_name, label: account.acc_name },
      ]);
      setEntry(prev => ({ ...prev, accountName: account.acc_name }));
      setNewAccountName('');
      setShowNewAccount(false);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const handleCreateSubAccount = async () => {
    if (!newSubAccountName.trim() || !entry.companyName || !entry.accountName) {
      toast.error(
        'Sub account name, company, and account selection are required'
      );
      return;
    }

    try {
      const subAccount = await supabaseDB.addSubAccount(
        entry.companyName,
        entry.accountName,
        newSubAccountName.trim()
      );
      setSubAccounts(prev => [
        ...prev,
        { value: subAccount.sub_acc, label: subAccount.sub_acc },
      ]);
      setEntry(prev => ({ ...prev, subAccount: subAccount.sub_acc }));
      setNewSubAccountName('');
      setShowNewSubAccount(false);
      toast.success('Sub account created successfully!');
    } catch (error) {
      toast.error('Failed to create sub account');
    }
  };

  const handleDelete = (type: 'company' | 'account' | 'subAccount') => {
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      let success = false;
      let message = '';

      switch (deleteType) {
        case 'company':
          if (entry.companyName) {
            success = await supabaseDB.deleteCompany(entry.companyName);
            if (success) {
              setCompanies(prev =>
                prev.filter(c => c.value !== entry.companyName)
              );
              setEntry(prev => ({
                ...prev,
                companyName: '',
                accountName: '',
                subAccount: '',
              }));
              message = 'Company deleted successfully!';
            }
          }
          break;
        case 'account':
          if (entry.companyName && entry.accountName) {
            success = await supabaseDB.deleteAccount(entry.accountName);
            if (success) {
              setAccounts(prev =>
                prev.filter(a => a.value !== entry.accountName)
              );
              setEntry(prev => ({ ...prev, accountName: '', subAccount: '' }));
              message = 'Account deleted successfully!';
            }
          }
          break;
        case 'subAccount':
          if (entry.companyName && entry.accountName && entry.subAccount) {
            success = await supabaseDB.deleteSubAccount(entry.subAccount);
            if (success) {
              setSubAccounts(prev =>
                prev.filter(s => s.value !== entry.subAccount)
              );
              setEntry(prev => ({ ...prev, subAccount: '' }));
              message = 'Sub account deleted successfully!';
            }
          }
          break;
      }

      if (success) {
        toast.success(message);
      } else {
        toast.error(`Failed to delete ${deleteType}. It may be in use.`);
      }
    } catch (error) {
      toast.error(`Error deleting ${deleteType}`);
    }

    setShowDeleteModal(false);
    updateTotalEntryCount(); // Update total entry count after deletion
  };

  // CSV Upload Functions
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploadedFile(file);
    setUploadLoading(true);
    setUploadProgress(0);

    try {
      const result = await importFromFile(file);

      if (result.success && result.data) {
        // Log the actual columns in the CSV for debugging
        console.log('CSV Columns:', Object.keys(result.data[0] || {}));
        console.log('Total rows:', result.data.length);

        // Skip validation completely - accept any CSV format

        setUploadPreview(result.data.slice(0, 5)); // Show first 5 rows as preview
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

  const handleImportCSV = async () => {
    if (!uploadedFile || uploadPreview.length === 0) {
      toast.error('Please upload a valid CSV file first');
      return;
    }

    setUploadLoading(true);
    setUploadProgress(0);
    setImportErrors([]);

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
          totalBatches,
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
                if (value === null || value === undefined || value === '')
                  return '';
                return String(value).trim();
              };

              const sanitizeNumber = (value: any) => {
                if (value === null || value === undefined || value === '')
                  return 0;
                const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
                return isNaN(num) ? 0 : num;
              };

              const sanitizeDate = (value: any) => {
                if (!value || value === '')
                  return format(new Date(), 'yyyy-MM-dd');
                try {
                  const date = new Date(value);
                  if (isNaN(date.getTime()))
                    return format(new Date(), 'yyyy-MM-dd');
                  return format(date, 'yyyy-MM-dd');
                } catch {
                  return format(new Date(), 'yyyy-MM-dd');
                }
              };

              // Try multiple column name variations for each field
              const getFieldValue = (
                row: any,
                possibleNames: string[],
                defaultValue: any
              ) => {
                for (const name of possibleNames) {
                  if (
                    row[name] !== undefined &&
                    row[name] !== null &&
                    row[name] !== ''
                  ) {
                    return row[name];
                  }
                }
                return defaultValue;
              };

              // Map CSV columns to database fields with ultra-flexible column names
              const entry = {
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
                sub_acc_name: sanitizeString(
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
                ),
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
                    format(new Date(), 'yyyy-MM-dd')
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
                address: sanitizeString(
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
                ),
                staff: sanitizeString(
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
                ),
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
                    await new Promise(resolve =>
                      setTimeout(resolve, 1000 * retryCount)
                    );
                  } else {
                    throw dbError;
                  }
                }
              }

              batchResults.push({ success: true, index: globalIndex });
            } catch (error) {
              console.error(
                `Database error importing row ${globalIndex + 1}:`,
                error
              );
              batchResults.push({
                success: false,
                index: globalIndex,
                error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          batchResults
            .filter(r => !r.success)
            .forEach(r => {
              if (errors.length < 20) {
                errors.push(`Row ${r.index + 1}: ${r.error}`);
              }
            });

          // Update progress
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

          // Reduced delay for faster processing
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        toast.success(
          `Import completed! ${successCount} entries imported, ${errorCount} failed`
        );
        setImportErrors(errors);
        setShowUploadModal(false);
        setUploadedFile(null);
        setUploadPreview([]);

        // Refresh data
        updateTotalEntryCount();
        const entries = await supabaseDB.getCashBookEntries();
        setRecentEntries(
          entries
            .sort((a, b) => {
              const aTime = a.created_at
                ? new Date(a.created_at).getTime()
                : a.sno;
              const bTime = b.created_at
                ? new Date(b.created_at).getTime()
                : b.sno;
              return bTime - aTime;
            })
            .slice(0, 5)
        );
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

  return (
    <div className='h-screen flex flex-col'>
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='w-full max-w-6xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>New Entry</h1>
              <p className='text-gray-600'>
                Create new cash book entries with automatic daily entry
                numbering
              </p>
            </div>
            <div className='text-right'>
              <div className='flex flex-col items-end gap-2'>
                <div className='flex items-center gap-4'>
                  <div>
                    <div className='text-sm text-gray-600'>Total Entries</div>
                    <div className='text-2xl font-bold text-purple-600'>
                      {totalEntryCount.toLocaleString()}
                    </div>
                  </div>
                  <div className='w-px h-8 bg-gray-300'></div>
                  <div>
                    <div className='text-sm text-gray-600'>Daily Entry #</div>
                    <div className='text-2xl font-bold text-blue-600'>
                      {currentDailyEntryNo}
                    </div>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='secondary'
                    onClick={testDatabaseConnection}
                    className='text-sm'
                  >
                    Test DB
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={loadDropdownData}
                    className='text-sm'
                    icon={RefreshCw}
                  >
                    Refresh Data
                  </Button>
                  <Button
                    icon={Upload}
                    variant='secondary'
                    onClick={() => setShowUploadModal(true)}
                  >
                    Upload CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <Card className='p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Dual Entry Toggle */}
              <div className='flex items-center mb-4'>
                <input
                  type='checkbox'
                  id='dualEntryEnabled'
                  checked={dualEntryEnabled}
                  onChange={e => setDualEntryEnabled(e.target.checked)}
                  className='mr-2'
                />
                <label
                  htmlFor='dualEntryEnabled'
                  className='text-sm font-medium'
                >
                  Enable Dual Entry
                </label>
              </div>
              {/* Basic Information */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                <Input
                  label='Date'
                  type='date'
                  value={entry.date}
                  onChange={value => handleInputChange('date', value)}
                  required
                />

                <div className='space-y-2'>
                  <Select
                    label='Company Name'
                    value={entry.companyName}
                    onChange={value => handleInputChange('companyName', value)}
                    options={companies}
                    placeholder='Select company...'
                    required
                  />
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      onClick={() => setShowNewCompany(true)}
                      className='flex-1'
                    >
                      <Building className='w-4 h-4 mr-1' />
                      Add Company
                    </Button>
                    {entry.companyName && (
                      <Button
                        type='button'
                        size='sm'
                        variant='danger'
                        onClick={() => handleDelete('company')}
                        className='flex-1'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                <Select
                  label='Staff'
                  value={entry.staff}
                  onChange={value => handleInputChange('staff', value)}
                  options={users}
                  placeholder='Select staff...'
                  required
                />
              </div>

              {/* Account Information */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Select
                    label='Main Account'
                    value={entry.accountName}
                    onChange={value => handleInputChange('accountName', value)}
                    options={accounts}
                    placeholder='Select account...'
                    required
                    disabled={!entry.companyName}
                  />
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      onClick={() => setShowNewAccount(true)}
                      className='flex-1'
                      disabled={!entry.companyName}
                    >
                      <FileText className='w-4 h-4 mr-1' />
                      Add Account
                    </Button>
                    {entry.accountName && (
                      <Button
                        type='button'
                        size='sm'
                        variant='danger'
                        onClick={() => handleDelete('account')}
                        className='flex-1'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Select
                    label='Sub Account'
                    value={entry.subAccount}
                    onChange={value => handleInputChange('subAccount', value)}
                    options={subAccounts}
                    placeholder='Select sub account...'
                    disabled={!entry.accountName}
                  />
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      onClick={() => setShowNewSubAccount(true)}
                      className='flex-1'
                      disabled={!entry.accountName}
                    >
                      <FileText className='w-4 h-4 mr-1' />
                      Add Sub Account
                    </Button>
                    {entry.subAccount && (
                      <Button
                        type='button'
                        size='sm'
                        variant='danger'
                        onClick={() => handleDelete('subAccount')}
                        className='flex-1'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Particulars */}
              <Input
                label='Particulars'
                value={entry.particulars}
                onChange={value => handleInputChange('particulars', value)}
                placeholder='Enter transaction details...'
                required
              />

              {/* Amounts */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Input
                  label='Credit'
                  value={entry.credit}
                  onChange={val => setEntry(prev => ({ ...prev, credit: val }))}
                  placeholder='Enter credit amount'
                  type='number'
                  min='0'
                />
                <Input
                  label='Debit'
                  value={entry.debit}
                  onChange={val => setEntry(prev => ({ ...prev, debit: val }))}
                  placeholder='Enter debit amount'
                  type='number'
                  min='0'
                />
              </div>

              {/* Combined Quantity Checkbox and Inputs */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={entry.quantityChecked}
                    onChange={e =>
                      setEntry(prev => ({
                        ...prev,
                        quantityChecked: e.target.checked,
                        saleQ: e.target.checked ? prev.saleQ : '',
                        purchaseQ: e.target.checked ? prev.purchaseQ : '',
                      }))
                    }
                    id='quantityChecked'
                  />
                  <label
                    htmlFor='quantityChecked'
                    className='text-sm font-medium'
                  >
                    Quantity Details
                  </label>
                </div>

                {entry.quantityChecked && (
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    <Input
                      label='Sale Quantity'
                      value={entry.saleQ}
                      onChange={val =>
                        setEntry(prev => ({ ...prev, saleQ: val }))
                      }
                      placeholder='0'
                      type='number'
                      min='0'
                    />
                    <Input
                      label='Purchase Quantity'
                      value={entry.purchaseQ}
                      onChange={val =>
                        setEntry(prev => ({ ...prev, purchaseQ: val }))
                      }
                      placeholder='0'
                      type='number'
                      min='0'
                    />
                  </div>
                )}
              </div>

              {/* Dual Entry Section */}
              {dualEntryEnabled && (
                <div className='border-2 border-blue-300 rounded-lg p-4 mt-4 bg-blue-50'>
                  <h3 className='text-lg font-bold mb-4 text-blue-700'>
                    Dual Entry
                  </h3>
                  {/* Basic Information */}
                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                    <Input
                      label='Date'
                      type='date'
                      value={dualEntry.date}
                      onChange={value =>
                        setDualEntry(prev => ({ ...prev, date: value }))
                      }
                      required
                    />
                    <Select
                      label='Company Name'
                      value={dualEntry.companyName}
                      onChange={value =>
                        setDualEntry(prev => ({ ...prev, companyName: value }))
                      }
                      options={companies}
                      placeholder='Select company...'
                      required
                    />
                    <Select
                      label='Staff'
                      value={dualEntry.staff}
                      onChange={value =>
                        setDualEntry(prev => ({ ...prev, staff: value }))
                      }
                      options={users}
                      placeholder='Select staff...'
                      required
                    />
                  </div>
                  {/* Account Information */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2'>
                    <Select
                      label='Main Account'
                      value={dualEntry.accountName}
                      onChange={value =>
                        setDualEntry(prev => ({ ...prev, accountName: value }))
                      }
                      options={accounts}
                      placeholder='Select account...'
                      required
                      disabled={!dualEntry.companyName}
                    />
                    <Select
                      label='Sub Account'
                      value={dualEntry.subAccount}
                      onChange={value =>
                        setDualEntry(prev => ({ ...prev, subAccount: value }))
                      }
                      options={subAccounts}
                      placeholder='Select sub account...'
                      disabled={!dualEntry.accountName}
                    />
                  </div>
                  {/* Particulars */}
                  <Input
                    label='Particulars'
                    value={dualEntry.particulars}
                    onChange={value =>
                      setDualEntry(prev => ({ ...prev, particulars: value }))
                    }
                    placeholder='Enter transaction details...'
                    required
                    className='mt-2'
                  />
                  {/* Amounts */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2'>
                    <Input
                      label='Credit'
                      value={dualEntry.credit}
                      onChange={val =>
                        setDualEntry(prev => ({ ...prev, credit: val }))
                      }
                      placeholder='Enter credit amount'
                      type='number'
                      min='0'
                    />
                    <Input
                      label='Debit'
                      value={dualEntry.debit}
                      onChange={val =>
                        setDualEntry(prev => ({ ...prev, debit: val }))
                      }
                      placeholder='Enter debit amount'
                      type='number'
                      min='0'
                    />
                  </div>
                  {/* Combined Quantity Checkbox and Inputs for Dual Entry */}
                  <div className='space-y-4 mt-2'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={dualEntry.quantityChecked}
                        onChange={e =>
                          setDualEntry(prev => ({
                            ...prev,
                            quantityChecked: e.target.checked,
                            saleQ: e.target.checked ? prev.saleQ : '',
                            purchaseQ: e.target.checked ? prev.purchaseQ : '',
                          }))
                        }
                        id='dualQuantityChecked'
                      />
                      <label
                        htmlFor='dualQuantityChecked'
                        className='text-sm font-medium'
                      >
                        Quantity Details
                      </label>
                    </div>

                    {dualEntry.quantityChecked && (
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                        <Input
                          label='Sale Quantity'
                          value={dualEntry.saleQ}
                          onChange={val =>
                            setDualEntry(prev => ({ ...prev, saleQ: val }))
                          }
                          placeholder='0'
                          type='number'
                          min='0'
                        />
                        <Input
                          label='Purchase Quantity'
                          value={dualEntry.purchaseQ}
                          onChange={val =>
                            setDualEntry(prev => ({ ...prev, purchaseQ: val }))
                          }
                          placeholder='0'
                          type='number'
                          min='0'
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-4 pt-4'>
                <Button
                  type='submit'
                  disabled={loading}
                  className='flex-1 lg:flex-none text-lg py-3'
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setEntry({
                      date: entry.date,
                      companyName: '',
                      accountName: '',
                      subAccount: '',
                      particulars: '',
                      saleQ: '',
                      purchaseQ: '',
                      credit: '',
                      debit: '',
                      creditOnline: '',
                      creditOffline: '',
                      debitOnline: '',
                      debitOffline: '',
                      staff: user?.username || '',
                      quantityChecked: false,
                    });
                    setAccounts([]);
                    setSubAccounts([]);
                  }}
                  className='flex-1 lg:flex-none text-lg py-3'
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Recent Entries Card */}
        <Card title='Recent Entries' className='mt-8 w-full max-w-6xl mx-auto'>
          {recentEntries.length === 0 ? (
            <div className='text-center text-gray-500 py-4'>
              No recent entries found.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm border border-gray-200'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-3 py-2 text-left'>S.No</th>
                    <th className='px-3 py-2 text-left'>Date</th>
                    <th className='px-3 py-2 text-left'>Company</th>
                    <th className='px-3 py-2 text-left'>Account</th>
                    <th className='px-3 py-2 text-left'>Particulars</th>
                    <th className='px-3 py-2 text-left'>Credit</th>
                    <th className='px-3 py-2 text-left'>Debit</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className='border-b border-gray-100 hover:bg-gray-50'
                    >
                      <td className='px-3 py-2 text-center'>{entry.sno}</td>
                      <td className='px-3 py-2'>{entry.c_date}</td>
                      <td className='px-3 py-2'>{entry.company_name}</td>
                      <td className='px-3 py-2'>{entry.acc_name}</td>
                      <td className='px-3 py-2'>{entry.particulars}</td>
                      <td className='px-3 py-2 text-green-700 font-medium'>
                        {entry.credit > 0
                          ? `₹${entry.credit.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className='px-3 py-2 text-red-700 font-medium'>
                        {entry.debit > 0
                          ? `₹${entry.debit.toLocaleString()}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Company Modal */}
      {showNewCompany && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold mb-4'>Create New Company</h3>
            <div className='space-y-4'>
              <Input
                label='Company Name'
                value={newCompanyName}
                onChange={value => setNewCompanyName(value)}
                placeholder='Enter company name...'
                required
              />
              <Input
                label='Address'
                value={newCompanyAddress}
                onChange={value => setNewCompanyAddress(value)}
                placeholder='Enter company address...'
              />
              <div className='flex gap-2'>
                <Button onClick={handleCreateCompany} className='flex-1'>
                  Create
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => setShowNewCompany(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showNewAccount && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold mb-4'>Create New Account</h3>
            <div className='space-y-4'>
              <Input
                label='Account Name'
                value={newAccountName}
                onChange={value => setNewAccountName(value)}
                placeholder='Enter account name...'
                required
              />
              <div className='flex gap-2'>
                <Button onClick={handleCreateAccount} className='flex-1'>
                  Create
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => setShowNewAccount(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sub Account Modal */}
      {showNewSubAccount && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold mb-4'>
              Create New Sub Account
            </h3>
            <div className='space-y-4'>
              <Input
                label='Sub Account Name'
                value={newSubAccountName}
                onChange={value => setNewSubAccountName(value)}
                placeholder='Enter sub account name...'
                required
              />
              <div className='flex gap-2'>
                <Button onClick={handleCreateSubAccount} className='flex-1'>
                  Create
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => setShowNewSubAccount(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Upload CSV Data</h3>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                  setUploadPreview([]);
                }}
              >
                Close
              </Button>
            </div>

            <div className='space-y-6'>
              {/* File Upload Section */}
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <h4 className='text-lg font-medium text-gray-900 mb-2'>
                  Upload CSV File
                </h4>
                <p className='text-gray-600 mb-4'>
                  Upload any CSV file. The system will import ALL your data with
                  automatic column mapping and default values for any missing
                  fields. <strong>Recommended columns:</strong> Date, Company,
                  Main Account, Sub Account, Particulars, Credit, Debit, Staff,
                  Sale Qty, Purchase Qty, Address.
                </p>
                <div className='flex gap-2 justify-center'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => {
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
                        },
                      ];

                      const headers = Object.keys(sampleData[0]);
                      const csvContent = [
                        headers.join(','),
                        ...sampleData.map(row =>
                          headers
                            .map(header => {
                              const value = row[header as keyof typeof row];
                              const escapedValue = String(value).replace(
                                /"/g,
                                '""'
                              );
                              return `"${escapedValue}"`;
                            })
                            .join(',')
                        ),
                      ].join('\n');

                      const blob = new Blob([csvContent], {
                        type: 'text/csv;charset=utf-8;',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sample-csv-format.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download Sample CSV
                  </Button>
                </div>

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
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                >
                  Choose CSV File
                </label>
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
                    Processing{' '}
                    {importProgress.current > 0
                      ? Math.round(
                          importProgress.current /
                            (importProgress.currentBatch || 1)
                        )
                      : 0}{' '}
                    records per batch
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

              {/* Preview Section */}
              {uploadPreview.length > 0 && (
                <div className='space-y-4'>
                  <h4 className='font-medium text-gray-900'>
                    Preview (First 5 rows)
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
                          <tr key={index} className='border-b border-gray-100'>
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

              {/* Import Errors */}
              {importErrors.length > 0 && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <AlertCircle className='w-5 h-5 text-red-600' />
                    <span className='font-medium text-red-800'>
                      Import Errors (First 20)
                    </span>
                  </div>
                  <div className='text-sm text-red-700 max-h-40 overflow-y-auto'>
                    {importErrors.map((error, index) => (
                      <div key={index} className='mb-1'>
                        {error}
                      </div>
                    ))}
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
                  className='flex-1'
                >
                  {uploadLoading ? 'Importing...' : 'Import CSV Data'}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedFile(null);
                    setUploadPreview([]);
                    setImportErrors([]);
                  }}
                  className='flex-1'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold mb-4'>Confirm Delete</h3>
            <p className='text-gray-600 mb-4'>
              Are you sure you want to delete this {deleteType}? This action
              cannot be undone.
            </p>
            <div className='flex gap-2'>
              <Button
                onClick={confirmDelete}
                variant='danger'
                className='flex-1'
              >
                Delete
              </Button>
              <Button
                variant='secondary'
                onClick={() => setShowDeleteModal(false)}
                className='flex-1'
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewEntry;
