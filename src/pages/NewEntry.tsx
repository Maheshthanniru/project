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
  saleQ: string;
  purchaseQ: string;
  credit: string;
  debit: string;
  staff: string;
  credit_mode: string;
  debit_mode: string;
  saleQChecked: boolean;
  purchaseQChecked: boolean;
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
    staff: user?.username || '',
    credit_mode: 'Offline',
    debit_mode: 'Offline',
    saleQChecked: false,
    purchaseQChecked: false,
  });

  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [subAccounts, setSubAccounts] = useState<{ value: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDailyEntryNo, setCurrentDailyEntryNo] = useState(0);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchRecentEntries = async () => {
      const entries = await supabaseDB.getCashBookEntries();
      setRecentEntries(
        entries
          .sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : a.sno;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : b.sno;
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

    const creditAmount = parseFloat(entry.credit) || 0;
    const debitAmount = parseFloat(entry.debit) || 0;

    if (creditAmount === 0 && debitAmount === 0) {
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
        credit: creditAmount,
        debit: debitAmount,
        company_name: entry.companyName,
        address: '', // Will be filled from company data
        staff: entry.staff,
        users: user?.username || '',
        sale_qty: entry.saleQChecked ? parseFloat(entry.saleQ) || 0 : 0,
        purchase_qty: entry.purchaseQChecked ? parseFloat(entry.purchaseQ) || 0 : 0,
        cb: 'CB', // Cash Book identifier
        credit_mode: entry.credit_mode,
        debit_mode: entry.debit_mode,
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
          saleQ: '',
          purchaseQ: '',
          credit: '',
          debit: '',
          staff: user?.username || '',
          credit_mode: 'Offline',
          debit_mode: 'Offline',
          saleQChecked: false,
          purchaseQChecked: false,
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
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Entry</h1>
            <p className="text-gray-600">Create new cash book entries with automatic daily entry numbering</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Daily Entry #</div>
            <div className="text-2xl font-bold text-blue-600">{currentDailyEntryNo}</div>
          </div>
        </div>

        {/* Main Form */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                value={entry.date}
                onChange={(value) => handleInputChange('date', value)}
                required
              />
              
              <div className="relative">
                <Select
                  label="Company Name"
                  value={entry.companyName}
                  onChange={(value) => handleInputChange('companyName', value)}
                  options={companies}
                  placeholder="Select company..."
                  required
                />
                <div className="absolute right-2 top-8 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowNewCompany(true)}
                    className="px-2"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  {entry.companyName && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete('company')}
                      className="px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <Select
                label="Staff"
                value={entry.staff}
                onChange={(value) => handleInputChange('staff', value)}
                options={users}
                placeholder="Select staff..."
                required
              />
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Select
                  label="Main Account"
                  value={entry.accountName}
                  onChange={(value) => handleInputChange('accountName', value)}
                  options={accounts}
                  placeholder="Select account..."
                  required
                  disabled={!entry.companyName}
                />
                <div className="absolute right-2 top-8 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowNewAccount(true)}
                    className="px-2"
                    disabled={!entry.companyName}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  {entry.accountName && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete('account')}
                      className="px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative">
                <Select
                  label="Sub Account"
                  value={entry.subAccount}
                  onChange={(value) => handleInputChange('subAccount', value)}
                  options={subAccounts}
                  placeholder="Select sub account..."
                  disabled={!entry.accountName}
                />
                <div className="absolute right-2 top-8 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowNewSubAccount(true)}
                    className="px-2"
                    disabled={!entry.accountName}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  {entry.subAccount && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete('subAccount')}
                      className="px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Particulars */}
            <Input
              label="Particulars"
              value={entry.particulars}
              onChange={(value) => handleInputChange('particulars', value)}
              placeholder="Enter transaction details..."
              required
            />

            {/* Amounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Credit"
                  value={entry.credit}
                  onChange={val => setEntry(prev => ({ ...prev, credit: val }))}
                  placeholder="Enter credit amount"
                  type="number"
                  min="0"
                />
                <Select
                  label="Credit Mode"
                  value={entry.credit_mode}
                  onChange={val => setEntry(prev => ({ ...prev, credit_mode: val }))}
                  options={[
                    { value: 'Online', label: 'Online' },
                    { value: 'Offline', label: 'Offline' },
                  ]}
                  className="mt-1"
                />
              </div>
              <div>
                <Input
                  label="Debit"
                  value={entry.debit}
                  onChange={val => setEntry(prev => ({ ...prev, debit: val }))}
                  placeholder="Enter debit amount"
                  type="number"
                  min="0"
                />
                <Select
                  label="Debit Mode"
                  value={entry.debit_mode}
                  onChange={val => setEntry(prev => ({ ...prev, debit_mode: val }))}
                  options={[
                    { value: 'Online', label: 'Online' },
                    { value: 'Offline', label: 'Offline' },
                  ]}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Quantity Checkboxes and Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={entry.saleQChecked}
                  onChange={e => setEntry(prev => ({ ...prev, saleQChecked: e.target.checked, saleQ: e.target.checked ? prev.saleQ : '' }))}
                  id="saleQChecked"
                />
                <label htmlFor="saleQChecked" className="text-sm">Sale Quantity</label>
                <Input
                  value={entry.saleQ}
                  onChange={val => setEntry(prev => ({ ...prev, saleQ: val }))}
                  placeholder="0"
                  type="number"
                  min="0"
                  disabled={!entry.saleQChecked}
                  className="w-24 ml-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={entry.purchaseQChecked}
                  onChange={e => setEntry(prev => ({ ...prev, purchaseQChecked: e.target.checked, purchaseQ: e.target.checked ? prev.purchaseQ : '' }))}
                  id="purchaseQChecked"
                />
                <label htmlFor="purchaseQChecked" className="text-sm">Purchase Quantity</label>
                <Input
                  value={entry.purchaseQ}
                  onChange={val => setEntry(prev => ({ ...prev, purchaseQ: val }))}
                  placeholder="0"
                  type="number"
                  min="0"
                  disabled={!entry.purchaseQChecked}
                  className="w-24 ml-2"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1 md:flex-none">
                {loading ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
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
                    staff: user?.username || '',
                    credit_mode: 'Offline',
                    debit_mode: 'Offline',
                    saleQChecked: false,
                    purchaseQChecked: false,
                  });
                  setAccounts([]);
                  setSubAccounts([]);
                }}
                className="flex-1 md:flex-none"
              >
                Reset Form
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Recent Entries Card */}
      <Card title="Recent Entries" className="mt-8 w-full max-w-4xl mx-auto">
        {recentEntries.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No recent entries found.</div>
        ) : (
          <table className="w-full text-xs border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-1">S.No</th>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Company</th>
                <th className="px-2 py-1">Account</th>
                <th className="px-2 py-1">Particulars</th>
                <th className="px-2 py-1">Credit</th>
                <th className="px-2 py-1">Debit</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry, idx) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-1 text-center">{entry.sno}</td>
                  <td className="px-2 py-1">{entry.c_date}</td>
                  <td className="px-2 py-1">{entry.company_name}</td>
                  <td className="px-2 py-1">{entry.acc_name}</td>
                  <td className="px-2 py-1">{entry.particulars}</td>
                  <td className="px-2 py-1 text-green-700">{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                  <td className="px-2 py-1 text-red-700">{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create Company Modal */}
      {showNewCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Company</h3>
            <div className="space-y-4">
              <Input
                label="Company Name"
                value={newCompanyName}
                onChange={(value) => setNewCompanyName(value)}
                placeholder="Enter company name..."
                required
              />
              <Input
                label="Address"
                value={newCompanyAddress}
                onChange={(value) => setNewCompanyAddress(value)}
                placeholder="Enter company address..."
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateCompany} className="flex-1">
                  Create
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowNewCompany(false)}
                  className="flex-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Account</h3>
            <div className="space-y-4">
              <Input
                label="Account Name"
                value={newAccountName}
                onChange={(value) => setNewAccountName(value)}
                placeholder="Enter account name..."
                required
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateAccount} className="flex-1">
                  Create
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowNewAccount(false)}
                  className="flex-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Sub Account</h3>
            <div className="space-y-4">
              <Input
                label="Sub Account Name"
                value={newSubAccountName}
                onChange={(value) => setNewSubAccountName(value)}
                placeholder="Enter sub account name..."
                required
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateSubAccount} className="flex-1">
                  Create
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowNewSubAccount(false)}
                  className="flex-1"
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
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button onClick={confirmDelete} variant="danger" className="flex-1">
                Delete
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
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