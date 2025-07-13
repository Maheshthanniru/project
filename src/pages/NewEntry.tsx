import React, { useState, useEffect } from 'react';
import { Save, Plus, Calculator, Building, FileText, User, Calendar, Trash2 } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface NewEntryForm {
  date: string;
  companyName: string;
  accountName: string;
  subAccount: string;
  particulars: string;
  saleQ: number;
  purchaseQ: number;
  credit: number;
  debit: number;
  staff: string;
}

const NewEntry: React.FC = () => {
  const { user } = useAuth();
  
  const [entry, setEntry] = useState<NewEntryForm>({
    date: format(new Date(), 'yyyy-MM-dd'),
    companyName: '',
    accountName: '',
    subAccount: '',
    particulars: '',
    saleQ: 0,
    purchaseQ: 0,
    credit: 0,
    debit: 0,
    staff: user?.username || '',
  });

  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [subAccounts, setSubAccounts] = useState<{ value: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDailyEntryNo, setCurrentDailyEntryNo] = useState(0);

  // Modal states for creating new items
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showNewSubAccount, setShowNewSubAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'company' | 'account' | 'subAccount'>('company');
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newSubAccountName, setNewSubAccountName] = useState('');

  useEffect(() => {
    loadDropdownData();
    updateDailyEntryNumber();
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

  const updateDailyEntryNumber = async () => {
    try {
      // Get today's entries count for daily entry number
      const todayEntries = await supabaseDB.getCashBookEntries();
      const todayCount = todayEntries.filter(dbEntry => dbEntry.c_date === entry.date).length;
      setCurrentDailyEntryNo(todayCount + 1);
    } catch (error) {
      console.error('Error updating daily entry number:', error);
      setCurrentDailyEntryNo(1);
    }
  };

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name
      }));
      setCompanies(companiesData);

      // Load users
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

  const loadAccountsByCompany = async () => {
    try {
      const accounts = await supabaseDB.getAccountsByCompany(entry.companyName);
      const accountsData = accounts.map(account => ({
        value: account.acc_name,
        label: account.acc_name
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
      const subAccounts = await supabaseDB.getSubAccountsByAccount(entry.companyName, entry.accountName);
      const subAccountsData = subAccounts.map(subAcc => ({
        value: subAcc.sub_acc,
        label: subAcc.sub_acc
      }));
      setSubAccounts(subAccountsData);
      setEntry(prev => ({ ...prev, subAccount: '' }));
    } catch (error) {
      console.error('Error loading sub accounts:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const handleInputChange = (field: keyof NewEntryForm, value: string | number) => {
    setEntry(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry.companyName || !entry.accountName || !entry.particulars) {
      toast.error('Please fill in required fields');
      return;
    }

    if (entry.credit === 0 && entry.debit === 0) {
      toast.error('Please enter either credit or debit amount');
      return;
    }

    setLoading(true);
    
    try {
      // Save to Supabase database
      const newEntry = await supabaseDB.addCashBookEntry({
        acc_name: entry.accountName,
        sub_acc_name: entry.subAccount,
        particulars: entry.particulars,
        c_date: entry.date,
        credit: entry.credit,
        debit: entry.debit,
        company_name: entry.companyName,
        address: '', // Will be filled from company data
        staff: entry.staff,
        users: user?.username || '',
        sale_qty: entry.saleQ,
        purchase_qty: entry.purchaseQ,
        cb: 'CB' // Cash Book identifier
      });

      toast.success(`Entry saved successfully! Entry #${newEntry.sno}`);
      
      // Reset form but keep the date
      const currentDate = entry.date;
      setEntry({
        date: currentDate,
        companyName: '',
        accountName: '',
        subAccount: '',
        particulars: '',
        saleQ: 0,
        purchaseQ: 0,
        credit: 0,
        debit: 0,
        staff: user?.username || '',
      });
      
      // Reset dropdowns
      setAccounts([]);
      setSubAccounts([]);
      
      // Update daily entry number for next entry
      updateDailyEntryNumber();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(`Failed to save entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const company = await supabaseDB.addCompany(newCompanyName.trim(), newCompanyAddress.trim());
      setCompanies(prev => [...prev, { value: company.company_name, label: company.company_name }]);
      setEntry(prev => ({ ...prev, companyName: company.company_name }));
      setNewCompanyName('');
      setNewCompanyAddress('');
      setShowNewCompany(false);
      toast.success('Company created successfully!');
    } catch (error) {
      toast.error('Failed to create company');
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim() || !entry.companyName) {
      toast.error('Account name and company selection are required');
      return;
    }

    try {
      const account = await supabaseDB.addAccount(entry.companyName, newAccountName.trim());
      setAccounts(prev => [...prev, { value: account.acc_name, label: account.acc_name }]);
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
      toast.error('Sub account name, company, and account selection are required');
      return;
    }

    try {
      const subAccount = await supabaseDB.addSubAccount(entry.companyName, entry.accountName, newSubAccountName.trim());
      setSubAccounts(prev => [...prev, { value: subAccount.sub_acc, label: subAccount.sub_acc }]);
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
              setCompanies(prev => prev.filter(c => c.value !== entry.companyName));
              setEntry(prev => ({ ...prev, companyName: '', accountName: '', subAccount: '' }));
              message = 'Company deleted successfully!';
            }
          }
          break;
        case 'account':
          if (entry.companyName && entry.accountName) {
            success = await supabaseDB.deleteAccount(entry.accountName);
            if (success) {
              setAccounts(prev => prev.filter(a => a.value !== entry.accountName));
              setEntry(prev => ({ ...prev, accountName: '', subAccount: '' }));
              message = 'Account deleted successfully!';
            }
          }
          break;
        case 'subAccount':
          if (entry.companyName && entry.accountName && entry.subAccount) {
            success = await supabaseDB.deleteSubAccount(entry.subAccount);
            if (success) {
              setSubAccounts(prev => prev.filter(s => s.value !== entry.subAccount));
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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Responsive form layout */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <form className="flex flex-col gap-4 md:gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form fields here, use w-full and responsive spacing */}
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <Button className="w-full md:w-auto">Save</Button>
              <Button className="w-full md:w-auto" variant="secondary">Reset</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewEntry;