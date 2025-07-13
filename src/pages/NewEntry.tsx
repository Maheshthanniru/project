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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Entry Form</h1>
          <p className="text-gray-600">Create new cash book entries with comprehensive details</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Row - Date and Staff */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <Input
              label="Date"
              type="date"
              value={entry.date}
              onChange={(value) => handleInputChange('date', value)}
              required
              className="font-medium"
            />
            
            <Select
              label="Staff"
              value={entry.staff}
              onChange={(value) => handleInputChange('staff', value)}
              options={users}
              placeholder="Select staff member..."
              required
            />

            <div className="md:col-span-2 flex items-end gap-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
                Entry #{currentDailyEntryNo}
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                Daily Entry #{currentDailyEntryNo}
              </div>
            </div>
          </div>

          {/* Company Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Select
                label="Company Name"
                value={entry.companyName}
                onChange={(value) => handleInputChange('companyName', value)}
                options={companies}
                placeholder="Select company..."
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => setShowNewCompany(true)}
                  className="flex-1"
                >
                  New Company
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDelete('company')}
                  className="px-3"
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Select
                label="Main Account"
                value={entry.accountName}
                onChange={(value) => handleInputChange('accountName', value)}
                options={accounts}
                placeholder="Select account..."
                disabled={!entry.companyName}
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => setShowNewAccount(true)}
                  disabled={!entry.companyName}
                  className="flex-1"
                >
                  New Main Account
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDelete('account')}
                  className="px-3"
                >
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Select
                label="Sub Account"
                value={entry.subAccount}
                onChange={(value) => handleInputChange('subAccount', value)}
                options={subAccounts}
                placeholder="Select sub account..."
                disabled={!entry.accountName}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Plus}
                  onClick={() => setShowNewSubAccount(true)}
                  disabled={!entry.accountName}
                  className="flex-1"
                >
                  New Sub Account
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDelete('subAccount')}
                  className="px-3"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Particulars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Particulars <span className="text-red-500">*</span>
            </label>
            <textarea
              value={entry.particulars}
              onChange={(e) => handleInputChange('particulars', e.target.value)}
              placeholder="Enter detailed transaction description..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Amount and Quantity Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              label="Sale Quantity"
              type="number"
              value={entry.saleQ}
              onChange={(value) => handleInputChange('saleQ', parseFloat(value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
            />

            <Input
              label="Purchase Quantity"
              type="number"
              value={entry.purchaseQ}
              onChange={(value) => handleInputChange('purchaseQ', parseFloat(value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
            />

            <Input
              label="Credit Amount"
              type="number"
              value={entry.credit}
              onChange={(value) => handleInputChange('credit', parseFloat(value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={entry.debit > 0}
              className={entry.credit > 0 ? 'border-green-300 bg-green-50' : ''}
            />

            <Input
              label="Debit Amount"
              type="number"
              value={entry.debit}
              onChange={(value) => handleInputChange('debit', parseFloat(value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={entry.credit > 0}
              className={entry.debit > 0 ? 'border-red-300 bg-red-50' : ''}
            />

            <div className="flex items-end">
              <div className="w-full p-3 bg-gray-100 rounded-lg border border-gray-300">
                <div className="text-sm font-medium text-gray-700">Balance</div>
                <div className={`text-lg font-bold ${
                  entry.credit > entry.debit ? 'text-green-600' : 
                  entry.debit > entry.credit ? 'text-red-600' : 'text-gray-600'
                }`}>
                  ₹{Math.abs(entry.credit - entry.debit).toLocaleString()}
                  {entry.credit > entry.debit && ' CR'}
                  {entry.debit > entry.credit && ' DR'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              icon={Save}
              disabled={loading}
              className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? 'Saving Entry...' : 'Save Entry'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
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
                setAccounts([]);
                setSubAccounts([]);
                updateDailyEntryNumber();
              }}
            >
              Clear Form
            </Button>

            <Button
              type="button"
              variant="secondary"
              icon={FileText}
              onClick={async () => {
                try {
                  const entries = await supabaseDB.getCashBookEntries();
                  const todayEntries = entries.filter(e => e.c_date === entry.date);
                  console.log(`Today's Entries (${entry.date}):`, todayEntries);
                  toast.success(`Found ${todayEntries.length} entries for ${format(new Date(entry.date), 'MMM dd, yyyy')}`);
                } catch (error) {
                  toast.error('Failed to fetch today\'s entries');
                }
              }}
            >
              View Today's Entries
            </Button>
          </div>
        </form>
      </Card>

      {/* New Company Modal */}
      {showNewCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              New Company
            </h3>
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={newCompanyName}
                onChange={setNewCompanyName}
                placeholder="Enter company name..."
                required
              />
              <Input
                label="Address"
                value={newCompanyAddress}
                onChange={setNewCompanyAddress}
                placeholder="Enter company address..."
              />
              <div className="flex gap-3">
                <Button onClick={handleCreateCompany} className="flex-1">
                  Create Company
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewCompany(false);
                    setNewCompanyName('');
                    setNewCompanyAddress('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showNewAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">New Main Account</h3>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Company: {entry.companyName}</div>
              </div>
              <Input
                label="Account Name"
                value={newAccountName}
                onChange={setNewAccountName}
                placeholder="Enter account name..."
                required
              />
              <div className="flex gap-3">
                <Button onClick={handleCreateAccount} className="flex-1">
                  Create Account
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewAccount(false);
                    setNewAccountName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Sub Account Modal */}
      {showNewSubAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">New Sub Account</h3>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                <div className="text-sm font-medium text-blue-800">Company: {entry.companyName}</div>
                <div className="text-sm font-medium text-blue-800">Account: {entry.accountName}</div>
              </div>
              <Input
                label="Sub Account Name"
                value={newSubAccountName}
                onChange={setNewSubAccountName}
                placeholder="Enter sub account name..."
                required
              />
              <div className="flex gap-3">
                <Button onClick={handleCreateSubAccount} className="flex-1">
                  Create Sub Account
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewSubAccount(false);
                    setNewSubAccountName('');
                  }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={confirmDelete} className="flex-1">
                Delete {deleteType}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
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