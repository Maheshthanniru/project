import React, { useState, useEffect } from 'react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { supabaseDB } from '../lib/supabaseDatabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface BalanceSheetFilters {
  companyName: string;
  betweenDates: boolean;
  fromDate: string;
  toDate: string;
  plYesNo: string;
  bothYesNo: string;
}

interface BalanceSheetAccount {
  accountName: string;
  credit: number;
  debit: number;
  balance: number;
  plYesNo: string;
  bothYesNo: string;
  result: string;
  isSelectedForPL?: boolean;
}

const BalanceSheet: React.FC = () => {
  const { user } = useAuth();

  const [filters, setFilters] = useState<BalanceSheetFilters>({
    companyName: '',
    betweenDates: true,
    fromDate: '2016-10-31',
    toDate: format(new Date(), 'yyyy-MM-dd'),
    plYesNo: '',
    bothYesNo: '',
  });

  const [balanceSheetData, setBalanceSheetData] = useState<
    BalanceSheetAccount[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  
  // State for P&L selection and custom content
  const [selectedAccountsForPL, setSelectedAccountsForPL] = useState<Set<string>>(new Set());
  const [customContent, setCustomContent] = useState('');

  // Dropdown data
  const [companies, setCompanies] = useState<
    { value: string; label: string }[]
  >([]);

  // Summary totals
  const [totals, setTotals] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balanceRs: 0,
  });

  const yesNoOptions = [
    { value: '', label: 'All' },
    { value: 'YES', label: 'YES' },
    { value: 'NO', label: 'NO' },
    { value: 'BOTH', label: 'BOTH' },
  ];

  useEffect(() => {
    loadDropdownData();
    generateBalanceSheet();
  }, []);

  useEffect(() => {
    generateBalanceSheet();
  }, [filters]);

  const loadDropdownData = async () => {
    try {
      // Load companies
      const companies = await supabaseDB.getCompanies();
      const companiesData = companies.map(company => ({
        value: company.company_name,
        label: company.company_name,
      }));
      setCompanies([{ value: '', label: 'All Companies' }, ...companiesData]);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const generateBalanceSheet = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get filtered entries - use getAllCashBookEntries to get all 67k records
      let entries = await supabaseDB.getAllCashBookEntries();

      // Apply date filter
      if (filters.betweenDates) {
        entries = entries.filter(entry => {
          const entryDate = new Date(entry.c_date);
          const fromDate = new Date(filters.fromDate);
          const toDate = new Date(filters.toDate);
          return entryDate >= fromDate && entryDate <= toDate;
        });
      }

      // Apply company filter
      if (filters.companyName) {
        entries = entries.filter(
          entry => entry.company_name === filters.companyName
        );
      }

      // Group by account name and calculate balances
      const accountMap = new Map<string, BalanceSheetAccount>();

      entries.forEach(entry => {
        if (!accountMap.has(entry.acc_name)) {
          accountMap.set(entry.acc_name, {
            accountName: entry.acc_name,
            credit: 0,
            debit: 0,
            balance: 0,
            plYesNo: getAccountPLStatus(entry.acc_name),
            bothYesNo: getAccountBothStatus(entry.acc_name),
            result: '',
          });
        }

        const account = accountMap.get(entry.acc_name)!;
        account.credit += entry.credit;
        account.debit += entry.debit;
        account.balance = account.credit - account.debit;
        account.result = account.balance >= 0 ? 'CREDIT' : 'DEBIT';
      });

      let balanceSheetAccounts = Array.from(accountMap.values());

      // Apply P&L filter
      if (filters.plYesNo) {
        balanceSheetAccounts = balanceSheetAccounts.filter(
          acc => acc.plYesNo === filters.plYesNo
        );
      }

      // Apply Both filter
      if (filters.bothYesNo) {
        balanceSheetAccounts = balanceSheetAccounts.filter(
          acc => acc.bothYesNo === filters.bothYesNo
        );
      }

      // Sort by account name
      balanceSheetAccounts.sort((a, b) =>
        a.accountName.localeCompare(b.accountName)
      );

      setBalanceSheetData(balanceSheetAccounts);

      // Calculate totals
      const totalCredit = balanceSheetAccounts.reduce(
        (sum, acc) => sum + acc.credit,
        0
      );
      const totalDebit = balanceSheetAccounts.reduce(
        (sum, acc) => sum + acc.debit,
        0
      );
      const balanceRs = totalCredit - totalDebit;

      setTotals({
        totalCredit,
        totalDebit,
        balanceRs,
      });
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      toast.error('Failed to generate balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const getAccountPLStatus = (accountName: string): string => {
    // Determine if account should be included in P&L
    const plAccounts = ['SALES', 'PURCHASE', 'EXPENSE', 'INCOME', 'REVENUE'];
    const isPlAccount = plAccounts.some(type =>
      accountName.toUpperCase().includes(type)
    );
    return isPlAccount ? 'YES' : 'NO';
  };

  const getAccountBothStatus = (accountName: string): string => {
    // Determine if account appears in both balance sheet and P&L
    const bothAccounts = ['CAPITAL', 'DRAWINGS', 'RESERVES'];
    const isBothAccount = bothAccounts.some(type =>
      accountName.toUpperCase().includes(type)
    );
    return isBothAccount ? 'BOTH' : 'NO';
  };

  const handleFilterChange = (field: keyof BalanceSheetFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePLSelectionChange = (accountName: string, isSelected: boolean) => {
    setSelectedAccountsForPL(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(accountName);
      } else {
        newSet.delete(accountName);
      }
      return newSet;
    });
  };

  const refreshData = () => {
    generateBalanceSheet();
    toast.success('Balance sheet refreshed successfully!');
  };

  const resetFilters = () => {
    setFilters({
      companyName: '',
      betweenDates: true,
      fromDate: '2016-10-31',
      toDate: format(new Date(), 'yyyy-MM-dd'),
      plYesNo: '',
      bothYesNo: '',
    });
    toast.success('Filters reset');
  };

  const updateBalanceSheetAndPL = () => {
    // This would update the balance sheet and P&L in the database
    toast.success('Balance sheet and P&L updated successfully!');
  };

  const exportToExcel = () => {
    const exportData = balanceSheetData.map(account => ({
      'Account Name': account.accountName,
      Credit: account.credit,
      Debit: account.debit,
      Balance: account.balance,
      'P&L Yes/No': account.plYesNo,
      'Both Yes/No': account.bothYesNo,
      Result: account.result,
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      ),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Balance sheet exported successfully!');
  };

  const printReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const printCustomReport = () => {
    // Separate accounts into P&L and Balance Sheet
    const plAccounts = balanceSheetData.filter(acc => selectedAccountsForPL.has(acc.accountName));
    const balanceSheetAccounts = balanceSheetData.filter(acc => !selectedAccountsForPL.has(acc.accountName));

    // Calculate totals
    const plTotals = {
      totalCredit: plAccounts.reduce((sum, acc) => sum + acc.credit, 0),
      totalDebit: plAccounts.reduce((sum, acc) => sum + acc.debit, 0),
      balance: plAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    };

    const bsTotals = {
      totalCredit: balanceSheetAccounts.reduce((sum, acc) => sum + acc.credit, 0),
      totalDebit: balanceSheetAccounts.reduce((sum, acc) => sum + acc.debit, 0),
      balance: balanceSheetAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Balance Sheet & Profit & Loss Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px; 
              background-color: white;
              font-size: 12px;
              line-height: 1.2;
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 { margin: 0; font-size: 18px; font-weight: bold; }
            .header h2 { margin: 3px 0; font-size: 12px; }
            .header h3 { margin: 2px 0; font-size: 14px; }
            .header p { margin: 2px 0; font-size: 11px; }
            .section { margin-bottom: 15px; }
            .section h3 { 
              background-color: #f0f0f0;
              color: #000; 
              padding: 5px 8px; 
              margin: 0 0 8px 0; 
              font-size: 14px;
              font-weight: bold;
              border: 1px solid #000;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px; 
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0;
              font-weight: bold; 
              color: #000;
              font-size: 11px;
            }
            td { font-size: 11px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-green { color: #000; }
            .text-red { color: #000; }
            .totals { 
              background-color: #f0f0f0;
              font-weight: bold; 
              color: #000;
            }
            .custom-content { 
              margin-top: 10px; 
              padding: 8px; 
              background-color: #f9f9f9;
              border: 1px solid #000;
              font-size: 11px;
            }
            .custom-content h4 { margin: 0 0 5px 0; color: #000; font-size: 12px; }
            .footer { 
              margin-top: 15px; 
              text-align: center; 
              color: #000; 
              font-size: 10px; 
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Balance Sheet & Profit & Loss Report</h1>
            <h2>Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}</h2>
            ${filters.companyName ? `<h3>Company: ${filters.companyName}</h3>` : ''}
            <p>Period: ${filters.fromDate} to ${filters.toDate}</p>
          </div>

          <div class="section">
            <h3>PROFIT & LOSS</h3>
            <table>
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th class="text-right">Credit</th>
                  <th class="text-right">Debit</th>
                  <th class="text-right">Balance</th>
                  <th class="text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                ${plAccounts.map(acc => `
                  <tr>
                    <td>${acc.accountName}</td>
                    <td class="text-right text-green">${acc.credit > 0 ? `₹${acc.credit.toLocaleString()}` : '-'}</td>
                    <td class="text-right text-red">${acc.debit > 0 ? `₹${acc.debit.toLocaleString()}` : '-'}</td>
                    <td class="text-right">${acc.balance > 0 ? `₹${acc.balance.toLocaleString()}` : '-'}</td>
                    <td class="text-center">${acc.result}</td>
                  </tr>
                `).join('')}
                <tr class="totals">
                  <td><strong>P&L TOTALS</strong></td>
                  <td class="text-right text-green"><strong>₹${plTotals.totalCredit.toLocaleString()}</strong></td>
                  <td class="text-right text-red"><strong>₹${plTotals.totalDebit.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>₹${plTotals.balance.toLocaleString()}</strong></td>
                  <td class="text-center"><strong>${plTotals.balance >= 0 ? 'PROFIT' : 'LOSS'}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>BALANCE SHEET</h3>
            <table>
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th class="text-right">Credit</th>
                  <th class="text-right">Debit</th>
                  <th class="text-right">Balance</th>
                  <th class="text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                ${balanceSheetAccounts.map(acc => `
                  <tr>
                    <td>${acc.accountName}</td>
                    <td class="text-right text-green">${acc.credit > 0 ? `₹${acc.credit.toLocaleString()}` : '-'}</td>
                    <td class="text-right text-red">${acc.debit > 0 ? `₹${acc.debit.toLocaleString()}` : '-'}</td>
                    <td class="text-right">${acc.balance > 0 ? `₹${acc.balance.toLocaleString()}` : '-'}</td>
                    <td class="text-center">${acc.result}</td>
                  </tr>
                `).join('')}
                <tr class="totals">
                  <td><strong>BALANCE SHEET TOTALS</strong></td>
                  <td class="text-right text-green"><strong>₹${bsTotals.totalCredit.toLocaleString()}</strong></td>
                  <td class="text-right text-red"><strong>₹${bsTotals.totalDebit.toLocaleString()}</strong></td>
                  <td class="text-right"><strong>₹${bsTotals.balance.toLocaleString()}</strong></td>
                  <td class="text-center"><strong>${bsTotals.balance >= 0 ? 'CREDIT' : 'DEBIT'}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          ${customContent ? `
            <div class="custom-content">
              <h4>Additional Information:</h4>
              <p>${customContent}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated by Thirumala Group Business Management System</p>
          </div>
        </body>
      </html>
    `;

    // Open PDF-like preview window
    const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (previewWindow) {
      previewWindow.document.write(printContent);
      previewWindow.document.close();
      previewWindow.focus();
      
      // Add print button to the preview window
      const printButton = `
        <div style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
          <button onclick="window.print()" style="
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">🖨️ Print Report</button>
          <button onclick="window.close()" style="
            background-color: #6b7280;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            margin-left: 10px;
          ">❌ Close</button>
        </div>
      `;
      
      // Insert the print button into the document
      previewWindow.document.body.insertAdjacentHTML('afterbegin', printButton);
    }
    
    toast.success('P&L Report preview opened! Use the Print button in the preview window to print.');
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <div className='max-w-6xl w-full mx-auto space-y-6'>
        {/* Responsive filter bar */}
        <div className='flex flex-col md:flex-row gap-4 items-end'>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Company
            </label>
            <select
              value={filters.companyName}
              onChange={e => handleFilterChange('companyName', e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {companies.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              From Date
            </label>
            <input
              type='date'
              value={filters.fromDate}
              onChange={e => handleFilterChange('fromDate', e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div className='flex-1'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              To Date
            </label>
            <input
              type='date'
              value={filters.toDate}
              onChange={e => handleFilterChange('toDate', e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div className='flex flex-row gap-2 mt-2 md:mt-0'>
            <Button variant='secondary' onClick={refreshData}>
              Refresh
            </Button>
            <Button variant='secondary' onClick={exportToExcel}>
              Export
            </Button>
            <Button variant='secondary' onClick={printReport}>
              Print
            </Button>
            <Button variant='primary' onClick={printCustomReport}>
              Print P&L Report
            </Button>
            <Button variant='secondary' onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {/* Custom Content Field */}
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Additional Information (will be included in P&L Report)
          </label>
          <textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder='Enter any additional information, notes, or comments for the report...'
            className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            rows={3}
          />
        </div>

        {/* Selection Summary */}
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-green-800'>P&L Selection Summary</h3>
              <p className='text-sm text-green-600'>
                {selectedAccountsForPL.size} account(s) selected for Profit & Loss section
              </p>
              <p className='text-sm text-green-600'>
                {balanceSheetData.length - selectedAccountsForPL.size} account(s) will appear in Balance Sheet section
              </p>
            </div>
            <div className='text-right'>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setSelectedAccountsForPL(new Set())}
                className='mr-2'
              >
                Clear All
              </Button>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => {
                  const allAccountNames = new Set(balanceSheetData.map(acc => acc.accountName));
                  setSelectedAccountsForPL(allAccountNames);
                }}
              >
                Select All
              </Button>
            </div>
          </div>
        </div>
        {/* Responsive table/card layout */}
        <Card className='overflow-x-auto p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
          {loading ? (
            <div className='text-center text-gray-500 py-8'>Loading...</div>
          ) : balanceSheetData.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>
              No accounts found for these filters.
            </div>
          ) : (
            <table className='min-w-full text-sm'>
              <thead className='bg-blue-100'>
                <tr>
                  <th className='px-3 py-2 text-center'>P&L</th>
                  <th className='px-3 py-2 text-left'>Account Name</th>
                  <th className='px-3 py-2 text-right'>Credit</th>
                  <th className='px-3 py-2 text-right'>Debit</th>
                  <th className='px-3 py-2 text-right'>Balance</th>
                  <th className='px-3 py-2 text-center'>Result</th>
                </tr>
              </thead>
              <tbody>
                {balanceSheetData.map((acc, idx) => (
                  <tr
                    key={acc.accountName}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} ${selectedAccountsForPL.has(acc.accountName) ? 'ring-2 ring-green-300 bg-green-50' : ''}`}
                  >
                    <td className='px-3 py-2 text-center'>
                      <input
                        type='checkbox'
                        checked={selectedAccountsForPL.has(acc.accountName)}
                        onChange={(e) => handlePLSelectionChange(acc.accountName, e.target.checked)}
                        className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                      />
                    </td>
                    <td className='px-3 py-2'>{acc.accountName}</td>
                    <td className='px-3 py-2 text-right text-green-700'>
                      {acc.credit > 0 ? `₹${acc.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className='px-3 py-2 text-right text-red-700'>
                      {acc.debit > 0 ? `₹${acc.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className='px-3 py-2 text-right font-semibold'>
                      {acc.balance > 0
                        ? `₹${acc.balance.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className='px-3 py-2 text-center font-bold'>
                      {acc.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BalanceSheet;
