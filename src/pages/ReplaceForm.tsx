import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface ReplaceFormData {
  oldCompanyName: string;
  newCompanyName: string;
  oldAccountName: string;
  oldSubAccount: string;
  newAccountName: string;
  newSubAccount: string;
}

const ReplaceForm: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  const [replaceData, setReplaceData] = useState<ReplaceFormData>({
    oldCompanyName: '',
    newCompanyName: '',
    oldAccountName: '',
    oldSubAccount: '',
    newAccountName: '',
    newSubAccount: '',
  });

  const [entries, setEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Dropdown data
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>([]);
  const [subAccounts, setSubAccounts] = useState<{ value: string; label: string }[]>([]);
  const [newAccounts, setNewAccounts] = useState<{ value: string; label: string }[]>([]);
  const [newSubAccounts, setNewSubAccounts] = useState<{ value: string; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);

  // Summary data
  const [summary, setSummary] = useState({
    totalRecords: 0,
    affectedRecords: 0,
    totalCredit: 0,
    totalDebit: 0});

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Only admins can use the replace form.');
      return;
    }
    loadDropdownData();
    loadEntries();
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [entries, replaceData]);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companiesList = await supabaseDB.getCompanies();
      const companiesData = companiesList.map(company => ({ value: company.company_name, label: company.company_name }));
      setCompanies(companiesData);

      // Load all unique account names
      const accounts = await supabaseDB.getAccounts();
      const allAccounts = Array.from(new Set(accounts.map(acc => acc.acc_name)))
        .map(acc => ({ value: acc, label: acc }));
      setAccounts(allAccounts);
      setNewAccounts(allAccounts);

      // Load all unique sub accounts
      const subAccounts = await supabaseDB.getSubAccounts();
      const allSubAccounts = Array.from(new Set(subAccounts.map(sub => sub.sub_acc)))
        .map(sub => ({ value: sub, label: sub }));
      setSubAccounts(allSubAccounts);
      setNewSubAccounts(allSubAccounts);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const allEntries = await supabaseDB.getCashBookEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Filter by company name
    if (replaceData.oldCompanyName) {
      filtered = filtered.filter(entry => entry.company_name === replaceData.oldCompanyName);
    }

    // Filter by old account name
    if (replaceData.oldAccountName) {
      filtered = filtered.filter(entry => entry.acc_name === replaceData.oldAccountName);
    }

    // Filter by old sub account
    if (replaceData.oldSubAccount) {
      filtered = filtered.filter(entry => entry.sub_acc_name === replaceData.oldSubAccount);
    }

    setFilteredEntries(filtered);
    updateSummary(filtered);
  };

  const updateSummary = (entries: any[]) => {
    const totalRecords = entries.length;
    const affectedRecords = entries.filter(entry => 
      (replaceData.oldAccountName && entry.acc_name === replaceData.oldAccountName) ||
      (replaceData.oldSubAccount && entry.sub_acc_name === replaceData.oldSubAccount) ||
      (replaceData.oldCompanyName && entry.company_name === replaceData.oldCompanyName)
    ).length;
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);

    setSummary({
      totalRecords,
      affectedRecords,
      totalCredit,
      totalDebit});
  };

  const handleInputChange = (field: keyof ReplaceFormData, value: string) => {
    setReplaceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreview = () => {
    if (!replaceData.oldAccountName && !replaceData.oldSubAccount && !replaceData.oldCompanyName) {
      toast.error('Please select at least one field to replace');
      return;
    }

    if (!replaceData.newAccountName && !replaceData.newSubAccount && !replaceData.newCompanyName) {
      toast.error('Please select at least one new value');
      return;
    }

    setPreviewMode(true);
    applyFilters();
    toast.success(`Preview: ${summary.affectedRecords} records will be affected`);
  };

  const handlePreviewCompanyName = () => {
    if (!replaceData.oldCompanyName) {
      toast.error('Please select an old company name');
      return;
    }

    const matchingEntries = entries.filter(entry => entry.company_name === replaceData.oldCompanyName);
    
    if (matchingEntries.length === 0) {
      toast.error(`No records found with company name "${replaceData.oldCompanyName}"`);
      return;
    }

    setFilteredEntries(matchingEntries);
    setPreviewMode(true);
    toast.success(`Preview: ${matchingEntries.length} records will be affected`);
  };

  const handleReplaceAccountName = async () => {
    if (!replaceData.oldAccountName || !replaceData.newAccountName) {
      toast.error('Please select both old and new account names');
      return;
    }

    if (window.confirm(`Replace "${replaceData.oldAccountName}" with "${replaceData.newAccountName}" in ${summary.affectedRecords} records?`)) {
      setLoading(true);
      try {
        let updatedCount = 0;
        
        for (const entry of filteredEntries) {
          if (entry.acc_name === replaceData.oldAccountName) {
            const result = await supabaseDB.updateCashBookEntry(
              entry.id, 
              { acc_name: replaceData.newAccountName }, 
              user?.username
            );
            if (result) updatedCount++;
          }
        }

        if (updatedCount > 0) {
          await loadEntries();
          toast.success(`${updatedCount} account names replaced successfully!`);
          setReplaceData(prev => ({ ...prev, oldAccountName: '', newAccountName: '' }));
          setPreviewMode(false);
        }
      } catch (error) {
        toast.error('Failed to replace account names');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReplaceSubAccount = async () => {
    if (!replaceData.oldSubAccount || !replaceData.newSubAccount) {
      toast.error('Please select both old and new sub account names');
      return;
    }

    if (window.confirm(`Replace "${replaceData.oldSubAccount}" with "${replaceData.newSubAccount}" in ${summary.affectedRecords} records?`)) {
      setLoading(true);
      try {
        let updatedCount = 0;
        
        for (const entry of filteredEntries) {
          if (entry.sub_acc_name === replaceData.oldSubAccount) {
            const result = await supabaseDB.updateCashBookEntry(
              entry.id, 
              { sub_acc_name: replaceData.newSubAccount }, 
              user?.username
            );
            if (result) updatedCount++;
          }
        }

        if (updatedCount > 0) {
          await loadEntries();
          toast.success(`${updatedCount} sub account names replaced successfully!`);
          setReplaceData(prev => ({ ...prev, oldSubAccount: '', newSubAccount: '' }));
          setPreviewMode(false);
        } else {
          toast.error('No records were updated');
        }
      } catch (error) {
        console.error('Error replacing sub account names:', error);
        toast.error('Failed to replace sub account names');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReplaceCompanyName = async () => {
    if (!replaceData.oldCompanyName || !replaceData.newCompanyName) {
      toast.error('Please select both old and new company names');
      return;
    }

    console.log('Starting company name replacement...');
    console.log('Old company name:', replaceData.oldCompanyName);
    console.log('New company name:', replaceData.newCompanyName);
    console.log('Total entries in database:', entries.length);

    // Debug: Show all unique company names in the database
    const uniqueCompanies = [...new Set(entries.map(entry => entry.company_name).filter(Boolean))];
    console.log('All unique company names in database:', uniqueCompanies);
    
    // Get all entries that match the old company name from the full database
    const matchingEntries = entries.filter(entry => {
      const entryCompany = entry.company_name?.trim();
      const oldCompany = replaceData.oldCompanyName?.trim();
      return entryCompany === oldCompany;
    });
    
    console.log('Matching entries found:', matchingEntries.length);
    console.log('Sample matching entries:', matchingEntries.slice(0, 3));
    
    if (matchingEntries.length === 0) {
      toast.error(`No records found with company name "${replaceData.oldCompanyName}"`);
      return;
    }

    if (window.confirm(`Replace "${replaceData.oldCompanyName}" with "${replaceData.newCompanyName}" in ${matchingEntries.length} records?`)) {
      setLoading(true);
      try {
        // First, check if the new company name exists in the companies table
        const allCompanies = await supabaseDB.getCompanies();
        const newCompanyExists = allCompanies.some(company => 
          company.company_name.trim() === replaceData.newCompanyName.trim()
        );

        // If the new company doesn't exist, add it to the companies table
        if (!newCompanyExists) {
          console.log(`Adding new company "${replaceData.newCompanyName}" to companies table...`);
          try {
            await supabaseDB.addCompany(replaceData.newCompanyName, '');
            console.log(`Successfully added company "${replaceData.newCompanyName}"`);
          } catch (error) {
            console.error('Error adding new company:', error);
            toast.error(`Failed to add new company "${replaceData.newCompanyName}". Please try again.`);
            setLoading(false);
            return;
          }
        } else {
          console.log(`Company "${replaceData.newCompanyName}" already exists in companies table`);
        }

        let updatedCount = 0;
        
        console.log('Starting to update records...');
        
        for (const entry of matchingEntries) {
          console.log(`Updating entry ${entry.id} with company name: ${entry.company_name}`);
          
          const result = await supabaseDB.updateCashBookEntry(
            entry.id, 
            { company_name: replaceData.newCompanyName }, 
            user?.username
          );
          
          console.log(`Update result for entry ${entry.id}:`, result);
          
          if (result) {
            updatedCount++;
            console.log(`Successfully updated entry ${entry.id}`);
          } else {
            console.log(`Failed to update entry ${entry.id}`);
          }
        }

        console.log(`Total updated: ${updatedCount} out of ${matchingEntries.length}`);

        if (updatedCount > 0) {
          await loadEntries();
          await loadDropdownData(); // Refresh dropdown data to include new company
          toast.success(`${updatedCount} company names replaced successfully!`);
          setReplaceData(prev => ({ ...prev, oldCompanyName: '', newCompanyName: '' }));
          setPreviewMode(false);
        } else {
          toast.error('No records were updated. Please check the console for details.');
        }
      } catch (error) {
        console.error('Error replacing company names:', error);
        toast.error('Failed to replace company names');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setReplaceData({
      oldCompanyName: '',
      newCompanyName: '',
      oldAccountName: '',
      oldSubAccount: '',
      newAccountName: '',
      newSubAccount: '',
    });
    setPreviewMode(false);
    setFilteredEntries([]);
    toast.success('Form reset');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access the replace form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Replace Form</h1>
          <p className="text-gray-600">Bulk replace account names and sub-accounts across all records</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            
            variant="secondary"
            onClick={loadEntries}
          >
            Refresh
          </Button>
          <Button
            
            variant="secondary"
            onClick={resetForm}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Replace Form */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="space-y-6">
          {/* Company Name Replacement */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Replace Company Name</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Old Company Name"
                  value={replaceData.oldCompanyName}
                  onChange={(value) => handleInputChange('oldCompanyName', value)}
                  options={[{ value: '', label: 'Select old company...' }, ...companies]}
                />
              </div>
              <div>
                <Input
                  label="New Company Name"
                  value={replaceData.newCompanyName}
                  onChange={(value) => handleInputChange('newCompanyName', value)}
                  placeholder="Enter new company name"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleReplaceCompanyName}
                disabled={!replaceData.oldCompanyName || !replaceData.newCompanyName || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Replace Company Name
              </Button>
              <Button
                
                variant="secondary"
                onClick={handlePreviewCompanyName}
                disabled={!replaceData.oldCompanyName || loading}
                className="ml-2 bg-blue-600 hover:bg-blue-700"
              >
                Preview
              </Button>
            </div>
          </div>

          {/* Account Name Replacement */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Replace Account Name</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Old AccountName"
                  value={replaceData.oldAccountName}
                  onChange={(value) => handleInputChange('oldAccountName', value)}
                  options={[{ value: '', label: 'Select old account...' }, ...accounts]}
                />
              </div>
              <div>
                <Input
                  label="New AccountName"
                  value={replaceData.newAccountName}
                  onChange={(value) => handleInputChange('newAccountName', value)}
                  placeholder="Enter new account name"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleReplaceAccountName}
                disabled={!replaceData.oldAccountName || !replaceData.newAccountName || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Replace Account Name
              </Button>
            </div>
          </div>

          {/* Sub Account Replacement */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Replace Sub Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Old SubAccount"
                  value={replaceData.oldSubAccount}
                  onChange={(value) => handleInputChange('oldSubAccount', value)}
                  options={[{ value: '', label: 'Select old sub account...' }, ...subAccounts]}
                />
              </div>
              <div>
                <Input
                  label="New SubAccount"
                  value={replaceData.newSubAccount}
                  onChange={(value) => handleInputChange('newSubAccount', value)}
                  placeholder="Enter new sub account name"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleReplaceSubAccount}
                disabled={!replaceData.oldSubAccount || !replaceData.newSubAccount || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Replace Sub Account
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Records</p>
              <p className="text-2xl font-bold">{summary.totalRecords}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Affected Records</p>
              <p className="text-2xl font-bold">{summary.affectedRecords}</p>
            </div>
            <Replace className="w-8 h-8 text-orange-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Credit</p>
              <p className="text-xl font-bold">₹{summary.totalCredit.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Debit</p>
              <p className="text-xl font-bold">₹{summary.totalDebit.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </Card>
      </div>

      {/* Preview Table */}
      {previewMode && filteredEntries.length > 0 && (
        <Card title="Preview of Affected Records" subtitle={`${filteredEntries.length} records will be modified`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">S.No</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Current Account</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Current SubAccount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Particulars</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Credit</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Debit</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(0, 50).map((entry, index) => (
                  <tr key={entry.id} className={`border-b hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}>
                    <td className="px-3 py-2 font-medium">{entry.sno}</td>
                    <td className="px-3 py-2">{format(new Date(entry.c_date), 'dd-MMM-yy')}</td>
                    <td className="px-3 py-2 font-medium text-blue-600">
                      <span className={replaceData.oldCompanyName === entry.company_name ? 'bg-yellow-200 px-2 py-1 rounded' : ''}>
                        {entry.company_name}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={replaceData.oldAccountName === entry.acc_name ? 'bg-yellow-200 px-2 py-1 rounded' : ''}>
                        {entry.acc_name}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={replaceData.oldSubAccount === entry.sub_acc_name ? 'bg-yellow-200 px-2 py-1 rounded' : ''}>
                        {entry.sub_acc_name || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-xs truncate" title={entry.particulars}>
                      {entry.particulars}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-green-600">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEntries.length > 50 && (
              <div className="mt-4 text-center text-gray-500">
                Showing first 50 of {filteredEntries.length} records
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReplaceForm;