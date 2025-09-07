import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import SearchableSelect from '../components/UI/SearchableSelect';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface LedgerSummaryFilters {
  betweenDates: boolean;
  fromDate: string;
  toDate: string;
  companyName: string;
  mainAccount: string;
  subAccount: string;
  staff: string;
}

interface AccountSummary {
  accountName: string;
  credit: number;
  debit: number;
  balance: number;
  transactionCount: number;
}

interface CompanySummary {
  companyName: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
  accounts: AccountSummary[];
}

interface SubAccountSummary {
  subAccount: string;
  mainAccount: string;
  credit: number;
  debit: number;
  balance: number;
  transactionCount: number;
}

const LedgerSummary: React.FC = () => {
  const { user } = useAuth();

  const [filters, setFilters] = useState<LedgerSummaryFilters>({
    betweenDates: true,
    fromDate: '2016-10-31',
    toDate: format(new Date(), 'yyyy-MM-dd'),
    companyName: '',
    mainAccount: '',
    subAccount: '',
    staff: '',
  });

  const [companySummaries, setCompanySummaries] = useState<CompanySummary[]>(
    []
  );
  const [mainAccountSummaries, setMainAccountSummaries] = useState<
    AccountSummary[]
  >([]);
  const [subAccountSummaries, setSubAccountSummaries] = useState<
    SubAccountSummary[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'company' | 'mainAccount' | 'subAccount' | 'subAccountGrand'
  >('company');

  // Dropdown data
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);
  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>(
    []
  );
  const [subAccounts, setSubAccounts] = useState<
    { value: string; label: string }[]
  >([]);
  const [staffList, setStaffList] = useState<
    { value: string; label: string }[]
  >([]);

  // Summary totals
  const [grandTotals, setGrandTotals] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
    recordCount: 0,
  });

  useEffect(() => {
    loadDropdownData();
    generateSummary();
  }, []);

  useEffect(() => {
    if (filters.companyName) {
      loadAccountsByCompany();
    }
  }, [filters.companyName]);

  useEffect(() => {
    if (filters.companyName && filters.mainAccount) {
      loadSubAccountsByAccount();
    }
  }, [filters.companyName, filters.mainAccount]);

  // Implement live filtering: call generateSummary automatically when filters change
  useEffect(() => {
    generateSummary();
    // eslint-disable-next-line
  }, [filters, activeTab]);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);

      // Load staff
      const users = await supabaseDB.getUsers();
      const usersData = users
        .filter(u => u.is_active)
        .map(user => ({
          value: user.username,
          label: user.username,
        }));
      setStaffList([{ value: '', label: 'All Staff' }, ...usersData]);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const loadAccountsByCompany = async () => {
    if (!filters.companyName) {
      setAccounts([{ value: '', label: 'All Accounts' }]);
      return;
    }

    try {
      const accounts = await supabaseDB.getDistinctAccountNamesByCompany(
        filters.companyName
      );
      const accountsData = accounts.map(account => ({
        value: account,
        label: account,
      }));
      setAccounts([{ value: '', label: 'All Accounts' }, ...accountsData]);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const loadSubAccountsByAccount = async () => {
    if (!filters.companyName || !filters.mainAccount) {
      setSubAccounts([{ value: '', label: 'All Sub Accounts' }]);
      return;
    }

    try {
      const subAccounts = await supabaseDB.getSubAccountsByAccountAndCompany(
        filters.mainAccount,
        filters.companyName
      );
      const subAccountsData = subAccounts.map(subAcc => ({
        value: subAcc,
        label: subAcc,
      }));
      setSubAccounts([
        { value: '', label: 'All Sub Accounts' },
        ...subAccountsData,
      ]);
    } catch (error) {
      console.error('Error loading sub accounts:', error);
      toast.error('Failed to load sub accounts');
    }
  };

  const generateSummary = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fast server-side filtering with pagination disabled for summaries
      const { data } = await supabaseDB.getFilteredCashBookEntries({
        companyName: filters.companyName || undefined,
        accountName: filters.mainAccount || undefined,
        subAccountName: filters.subAccount || undefined,
      }, 100000, 0);
      let entries = data || [];

      // Apply date filter
      if (filters.betweenDates) {
        entries = entries.filter(entry => {
          const entryDate = new Date(entry.c_date);
          const fromDate = new Date(filters.fromDate);
          const toDate = new Date(filters.toDate);
          return entryDate >= fromDate && entryDate <= toDate;
        });
      }

      // Apply other filters
      if (filters.companyName) {
        entries = entries.filter(
          entry => entry.company_name === filters.companyName
        );
      }
      if (filters.mainAccount) {
        entries = entries.filter(
          entry => entry.acc_name === filters.mainAccount
        );
      }
      if (filters.subAccount) {
        entries = entries.filter(
          entry => entry.sub_acc_name === filters.subAccount
        );
      }
      if (filters.staff) {
        entries = entries.filter(entry => entry.staff === filters.staff);
      }

      // Generate company-wise summary
      const companyMap = new Map<string, CompanySummary>();
      const accountMap = new Map<string, AccountSummary>();
      const subAccountMap = new Map<string, SubAccountSummary>();

      let totalCredit = 0;
      let totalDebit = 0;

      entries.forEach(entry => {
        totalCredit += entry.credit;
        totalDebit += entry.debit;

        // Company summary
        if (!companyMap.has(entry.company_name)) {
          companyMap.set(entry.company_name, {
            companyName: entry.company_name,
            totalCredit: 0,
            totalDebit: 0,
            balance: 0,
            accounts: [],
          });
        }
        const companySummary = companyMap.get(entry.company_name)!;
        companySummary.totalCredit += entry.credit;
        companySummary.totalDebit += entry.debit;
        companySummary.balance =
          companySummary.totalCredit - companySummary.totalDebit;

        // Account summary
        const accountKey = `${entry.company_name}-${entry.acc_name}`;
        if (!accountMap.has(accountKey)) {
          accountMap.set(accountKey, {
            accountName: entry.acc_name,
            credit: 0,
            debit: 0,
            balance: 0,
            transactionCount: 0,
          });
        }
        const accountSummary = accountMap.get(accountKey)!;
        accountSummary.credit += entry.credit;
        accountSummary.debit += entry.debit;
        accountSummary.balance = accountSummary.credit - accountSummary.debit;
        accountSummary.transactionCount++;

        // Sub Account summary
        if (entry.sub_acc_name) {
          const subAccountKey = `${entry.company_name}-${entry.acc_name}-${entry.sub_acc_name}`;
          if (!subAccountMap.has(subAccountKey)) {
            subAccountMap.set(subAccountKey, {
              subAccount: entry.sub_acc_name,
              mainAccount: entry.acc_name,
              credit: 0,
              debit: 0,
              balance: 0,
              transactionCount: 0,
            });
          }
          const subAccountSummary = subAccountMap.get(subAccountKey)!;
          subAccountSummary.credit += entry.credit;
          subAccountSummary.debit += entry.debit;
          subAccountSummary.balance =
            subAccountSummary.credit - subAccountSummary.debit;
          subAccountSummary.transactionCount++;
        }
      });

      // Convert maps to arrays and sort
      const companySummariesArray = Array.from(companyMap.values()).sort(
        (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
      );

      // Create company-specific summaries when company filter is active
      let mainAccountSummariesArray: AccountSummary[] = [];
      let subAccountSummariesArray: SubAccountSummary[] = [];
      
      if (filters.companyName) {
        // When company filter is active, create summaries only for the selected company
        const companyAccountMap = new Map<string, AccountSummary>();
        const companySubAccountMap = new Map<string, SubAccountSummary>();
        
        // Process only entries for the selected company
        entries.forEach(entry => {
          if (entry.company_name === filters.companyName) {
            // Account summary for this company
            const accountKey = entry.acc_name;
            if (!companyAccountMap.has(accountKey)) {
              companyAccountMap.set(accountKey, {
                accountName: entry.acc_name,
                credit: 0,
                debit: 0,
                balance: 0,
                transactionCount: 0,
              });
            }
            const accountSummary = companyAccountMap.get(accountKey)!;
            accountSummary.credit += entry.credit;
            accountSummary.debit += entry.debit;
            accountSummary.balance = accountSummary.credit - accountSummary.debit;
            accountSummary.transactionCount++;
            
            // Sub Account summary for this company
            if (entry.sub_acc_name) {
              const subAccountKey = entry.sub_acc_name;
              if (!companySubAccountMap.has(subAccountKey)) {
                companySubAccountMap.set(subAccountKey, {
                  subAccount: entry.sub_acc_name,
                  mainAccount: entry.acc_name,
                  credit: 0,
                  debit: 0,
                  balance: 0,
                  transactionCount: 0,
                });
              }
              const subAccountSummary = companySubAccountMap.get(subAccountKey)!;
              subAccountSummary.credit += entry.credit;
              subAccountSummary.debit += entry.debit;
              subAccountSummary.balance = subAccountSummary.credit - subAccountSummary.debit;
              subAccountSummary.transactionCount++;
            }
          }
        });
        
        mainAccountSummariesArray = Array.from(companyAccountMap.values()).sort(
          (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
        );
        
        subAccountSummariesArray = Array.from(companySubAccountMap.values()).sort(
          (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
        );
      } else {
        // When no company filter, use all data
        mainAccountSummariesArray = Array.from(accountMap.values()).sort(
          (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
        );
        
        subAccountSummariesArray = Array.from(subAccountMap.values()).sort(
          (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
        );
      }

      setCompanySummaries(companySummariesArray);
      setMainAccountSummaries(mainAccountSummariesArray);
      setSubAccountSummaries(subAccountSummariesArray);

      setGrandTotals({
        totalCredit,
        totalDebit,
        balance: totalCredit - totalDebit,
        recordCount: entries.length,
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    field: keyof LedgerSummaryFilters,
    value: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));

    // Reset dependent filters
    if (field === 'companyName') {
      setFilters(prev => ({ ...prev, mainAccount: '', subAccount: '' }));
    }
    if (field === 'mainAccount') {
      setFilters(prev => ({ ...prev, subAccount: '' }));
    }
  };

  const refreshData = () => {
    generateSummary();
    toast.success('Data refreshed successfully!');
  };

  const resetFilters = () => {
    setFilters({
      betweenDates: true,
      fromDate: '2016-10-31',
      toDate: format(new Date(), 'yyyy-MM-dd'),
      companyName: '',
      mainAccount: '',
      subAccount: '',
      staff: '',
    });
    toast.success('Filters reset');
  };

  const closeFilters = () => {
    // Just a placeholder for close functionality
    toast.success('Filters panel closed');
  };

  const exportToExcel = () => {
    let exportData: any[] = [];
    let filename = '';

    switch (activeTab) {
      case 'company':
        exportData = companySummaries.map(company => ({
          'Company Name': company.companyName,
          'Total Credit': company.totalCredit,
          'Total Debit': company.totalDebit,
          Balance: company.balance,
        }));
        filename = 'company-wise-summary';
        break;
      case 'mainAccount':
        exportData = mainAccountSummaries.map(account => ({
          'Account Name': account.accountName,
          Credit: account.credit,
          Debit: account.debit,
          Balance: account.balance,
          'Transaction Count': account.transactionCount,
        }));
        filename = 'main-account-summary';
        break;
      case 'subAccount':
      case 'subAccountGrand':
        exportData = subAccountSummaries.map(subAccount => ({
          'Sub Account': subAccount.subAccount,
          Credit: subAccount.credit,
          Debit: subAccount.debit,
          Balance: subAccount.balance,
          'Transaction Count': subAccount.transactionCount,
        }));
        filename = 'sub-account-summary';
        break;
    }

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => `"${row[header]}"`).join(',')
      ),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Summary exported successfully!');
  };

  const printSummary = () => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const currentData = getCurrentData();
    const title =
      activeTab === 'company'
        ? 'Company Summary'
        : activeTab === 'mainAccount'
          ? 'Main Account Summary'
          : 'Sub Account Summary';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ledger Summary - ${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1f2937; }
            .header p { margin: 5px 0; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            .text-right { text-align: right; }
            .text-green { color: #059669; }
            .text-red { color: #dc2626; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Thirumala Group</h1>
            <p>Ledger Summary Report</p>
            <p>${title}</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            ${filters.betweenDates ? `<p>Period: ${filters.fromDate} to ${filters.toDate}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>${activeTab === 'company' ? 'Company Name' : activeTab === 'mainAccount' ? 'Main Account' : 'Sub Account'}</th>
                <th class="text-right">Credit</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${currentData
                .map(
                  item => {
                    const name = activeTab === 'company' ? (item as CompanySummary).companyName : 
                                 activeTab === 'mainAccount' ? (item as AccountSummary).accountName : 
                                 (item as SubAccountSummary).subAccount;
                    const credit = activeTab === 'company' ? (item as CompanySummary).totalCredit : 
                                  (item as AccountSummary | SubAccountSummary).credit;
                    const debit = activeTab === 'company' ? (item as CompanySummary).totalDebit : 
                                 (item as AccountSummary | SubAccountSummary).debit;
                    const balance = item.balance;
                    
                    return `
                <tr>
                  <td>${name}</td>
                  <td class="text-right text-green">₹${credit.toLocaleString()}</td>
                  <td class="text-right text-red">₹${debit.toLocaleString()}</td>
                  <td class="text-right ${balance >= 0 ? 'text-green' : 'text-red'}">
                    ₹${Math.abs(balance).toLocaleString()}
                    ${balance >= 0 ? ' CR' : ' DR'}
                  </td>
                </tr>
              `;
                  }
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by Thirumala Group Business Management System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast.success('Print dialog opened');
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'company':
        return companySummaries;
      case 'mainAccount':
        return mainAccountSummaries;
      case 'subAccount':
      case 'subAccountGrand':
        return subAccountSummaries;
      default:
        return [];
    }
  };

  const renderSummaryTable = () => {
    const data = getCurrentData();

    if (activeTab === 'company') {
      return (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-4 py-3 text-left font-medium text-gray-700'>
                  {filters.companyName ? 'Company Details' : 'Company Name'}
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Credit
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Debit
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {companySummaries.map((company, index) => (
                <tr
                  key={company.companyName}
                  className={`border-b hover:bg-gray-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
                  <td className='px-4 py-3 font-medium text-blue-600'>
                    {company.companyName}
                  </td>
                  <td className='px-4 py-3 text-right font-medium text-green-600'>
                    ₹{company.totalCredit.toLocaleString()}
                  </td>
                  <td className='px-4 py-3 text-right font-medium text-red-600'>
                    ₹{company.totalDebit.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      company.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ₹{Math.abs(company.balance).toLocaleString()}
                    {company.balance >= 0 ? ' CR' : ' DR'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'mainAccount') {
      return (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-4 py-3 text-left font-medium text-gray-700'>
                  {filters.companyName ? `${filters.companyName} - Main Account` : 'Main Account'}
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Credit
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Debit
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {mainAccountSummaries.map((account, index) => (
                <tr
                  key={account.accountName}
                  className={`border-b hover:bg-gray-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
                  <td className='px-4 py-3 font-medium text-blue-600'>
                    {account.accountName}
                  </td>
                  <td className='px-4 py-3 text-right font-medium text-green-600'>
                    ₹{account.credit.toLocaleString()}
                  </td>
                  <td className='px-4 py-3 text-right font-medium text-red-600'>
                    ₹{account.debit.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ₹{Math.abs(account.balance).toLocaleString()}
                    {account.balance >= 0 ? ' CR' : ' DR'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'subAccount' || activeTab === 'subAccountGrand') {
      return (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-4 py-3 text-left font-medium text-gray-700'>
                  {filters.companyName ? `${filters.companyName} - Sub Account` : 'Sub Account'}
                </th>
                <th className='px-4 py-3 text-left font-medium text-gray-700'>
                  Main Account
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Credit
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Debit
                </th>
                <th className='px-4 py-3 text-right font-medium text-gray-700'>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {subAccountSummaries.map((subAccount, index) => (
                <tr
                  key={subAccount.subAccount}
                  className={`border-b hover:bg-gray-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
                  <td className='px-4 py-3 font-medium text-blue-600'>
                    {subAccount.subAccount}
                  </td>
                  <td className='px-4 py-3'>
                    {subAccount.mainAccount || '-'}
                  </td>
                  <td className='px-4 py-3 text-right font-medium text-green-600'>
                    ₹{subAccount.credit.toLocaleString()}
                  </td>
                  <td className='px-4 py-3 text-right font-medium text-red-600'>
                    ₹{subAccount.debit.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      subAccount.balance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ₹{Math.abs(subAccount.balance).toLocaleString()}
                    {subAccount.balance >= 0 ? ' CR' : ' DR'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Ledger Summary</h1>
          <p className='text-gray-600'>
            Comprehensive financial summary with company, account, and
            sub-account analysis
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {/*
          <Button
            
            variant="secondary"
            onClick={refreshData}
          >
            Refresh
          </Button>
          */}
          <Button variant='secondary' onClick={printSummary}>
            Print
          </Button>
          <Button variant='secondary' onClick={exportToExcel}>
            Export
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
        <div className='space-y-6'>
          {/* Date Range Section */}
          <div className='bg-white p-4 rounded-lg border border-gray-200'>
            <div className='flex items-center gap-2 mb-4'>
              <input
                type='checkbox'
                id='betweenDates'
                checked={filters.betweenDates}
                onChange={e =>
                  handleFilterChange('betweenDates', e.target.checked)
                }
                className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
              />
              <label
                htmlFor='betweenDates'
                className='text-sm font-medium text-gray-700'
              >
                Between Dates
              </label>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  From
                </label>
                <Input
                  type='date'
                  value={filters.fromDate}
                  onChange={value => handleFilterChange('fromDate', value)}
                  disabled={!filters.betweenDates}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  To
                </label>
                <Input
                  type='date'
                  value={filters.toDate}
                  onChange={value => handleFilterChange('toDate', value)}
                  disabled={!filters.betweenDates}
                />
              </div>
            </div>
          </div>

          {/* Filter Options */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <SearchableSelect
              label='Company Name'
              value={filters.companyName}
              onChange={value => handleFilterChange('companyName', value)}
              options={companies}
              placeholder='Search company...'
            />

            <SearchableSelect
              label='Main Account'
              value={filters.mainAccount}
              onChange={value => handleFilterChange('mainAccount', value)}
              options={accounts}
              placeholder='Search main account...'
              disabled={!filters.companyName}
            />

            <SearchableSelect
              label='Sub Account'
              value={filters.subAccount}
              onChange={value => handleFilterChange('subAccount', value)}
              options={subAccounts}
              placeholder='Search sub account...'
              disabled={!filters.mainAccount}
            />

            <SearchableSelect
              label='Staff'
              value={filters.staff}
              onChange={value => handleFilterChange('staff', value)}
              options={staffList}
              placeholder='Search staff...'
            />
          </div>

          {/* Action Buttons */}
          {/*
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateSummary}
              className="bg-green-600 hover:bg-green-700"
            >
              Refresh
            </Button>
            
            <Button
              variant="secondary"
              onClick={resetFilters}
            >
              Reset
            </Button>
            
            <Button
              variant="secondary"
              onClick={closeFilters}
            >
              Close
            </Button>
          </div>
          */}
        </div>
      </Card>

      {/* Summary Tabs */}
      <Card>
        {/* Company Filter Indicator */}
        {filters.companyName && (
          <div className='bg-blue-50 border-l-4 border-blue-400 p-4 mb-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-blue-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                </svg>
              </div>
              <div className='ml-3 flex-1'>
                <p className='text-sm text-blue-700'>
                  <strong>Company Filter Active:</strong> Showing data for <span className='font-semibold'>{filters.companyName}</span>
                </p>
                <p className='text-xs text-blue-600 mt-1'>
                  All tabs below show company-specific totals. Clear the company filter to see all companies.
                </p>
              </div>
              <div className='ml-3'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => {
                    setFilters(prev => ({ ...prev, companyName: '', mainAccount: '', subAccount: '' }));
                    toast.success('Company filter cleared');
                  }}
                  className='text-blue-600 hover:text-blue-800'
                >
                  Clear Company Filter
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8'>
            <button
              onClick={() => setActiveTab('company')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {filters.companyName ? `${filters.companyName} - Company Totals` : 'Companywise Totals'}
            </button>
            <button
              onClick={() => setActiveTab('mainAccount')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mainAccount'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {filters.companyName ? `${filters.companyName} - Main Account Totals` : 'MainAccountwise Totals'}
            </button>
            <button
              onClick={() => setActiveTab('subAccount')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subAccount'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {filters.companyName ? `${filters.companyName} - Sub Account Totals` : 'Sub Account wise totals'}
            </button>
            <button
              onClick={() => setActiveTab('subAccountGrand')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subAccountGrand'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {filters.companyName ? `${filters.companyName} - Sub Account Grand Totals` : 'Sub Account Wise Grand Totals'}
            </button>
          </nav>
        </div>

        <div className='p-6'>
          {loading ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-2 text-gray-600'>Generating summary...</p>
            </div>
          ) : (
            <>
              {renderSummaryTable()}

              {/* Summary Footer */}
              <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border'>
                <div className='bg-green-100 p-3 rounded-lg'>
                  <div className='text-sm font-medium text-green-800'>
                    Total Credit:
                  </div>
                  <div className='text-lg font-bold text-green-900'>
                    ₹{grandTotals.totalCredit.toLocaleString()}
                  </div>
                </div>
                <div className='bg-red-100 p-3 rounded-lg'>
                  <div className='text-sm font-medium text-red-800'>
                    Total Debit:
                  </div>
                  <div className='text-lg font-bold text-red-900'>
                    ₹{grandTotals.totalDebit.toLocaleString()}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    grandTotals.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      grandTotals.balance >= 0
                        ? 'text-blue-800'
                        : 'text-orange-800'
                    }`}
                  >
                    Balance:
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      grandTotals.balance >= 0
                        ? 'text-blue-900'
                        : 'text-orange-900'
                    }`}
                  >
                    ₹{Math.abs(grandTotals.balance).toLocaleString()}
                    {grandTotals.balance >= 0 ? ' CR' : ' DR'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LedgerSummary;
