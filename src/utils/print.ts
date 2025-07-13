import { format } from 'date-fns';

export interface PrintOptions {
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'Letter' | 'Legal';
  margins?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  includeHeader?: boolean;
  includeFooter?: boolean;
  headerText?: string;
  footerText?: string;
}

export const printTable = (
  data: any[],
  columns: { key: string; label: string; width?: string }[],
  options: PrintOptions = {}
) => {
  const {
    title = 'Report',
    subtitle = '',
    orientation = 'portrait',
    paperSize = 'A4',
    margins = { top: '1in', right: '0.5in', bottom: '1in', left: '0.5in' },
    includeHeader = true,
    includeFooter = true,
    headerText = 'Thirumala Group Business Management System',
    footerText = `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
  } = options;

  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }

  // Generate CSS
  const css = `
    @media print {
      @page {
        size: ${paperSize} ${orientation};
        margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
      }
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    
    .print-header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .print-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
    
    .print-subtitle {
      font-size: 16px;
      color: #666;
      margin: 5px 0 0 0;
    }
    
    .print-header-text {
      font-size: 14px;
      color: #333;
      margin: 10px 0 0 0;
    }
    
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .print-table th {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
    }
    
    .print-table td {
      border: 1px solid #d1d5db;
      padding: 6px 8px;
      font-size: 10px;
    }
    
    .print-table tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .print-footer {
      text-align: center;
      border-top: 1px solid #333;
      padding-top: 10px;
      margin-top: 20px;
      font-size: 10px;
      color: #666;
    }
    
    .print-summary {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }
    
    .print-summary h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #333;
    }
    
    .print-summary-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 11px;
    }
    
    .print-summary-label {
      font-weight: bold;
      color: #555;
    }
    
    .print-summary-value {
      color: #333;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-bold {
      font-weight: bold;
    }
    
    .text-green {
      color: #059669;
    }
    
    .text-red {
      color: #dc2626;
    }
    
    .text-orange {
      color: #ea580c;
    }
  `;

  // Generate table HTML
  const tableRows = data.map(row => {
    const cells = columns.map(col => {
      const value = row[col.key];
      let displayValue = value;
      
      // Format numbers
      if (typeof value === 'number') {
        if (col.key.toLowerCase().includes('amount') || 
            col.key.toLowerCase().includes('credit') || 
            col.key.toLowerCase().includes('debit') ||
            col.key.toLowerCase().includes('balance')) {
          displayValue = `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        } else {
          displayValue = value.toLocaleString('en-IN');
        }
      }
      
      // Format dates
      if (col.key.toLowerCase().includes('date') && value) {
        try {
          displayValue = format(new Date(value), 'dd/MM/yyyy');
        } catch (e) {
          displayValue = value;
        }
      }
      
      return `<td>${displayValue || ''}</td>`;
    }).join('');
    
    return `<tr>${cells}</tr>`;
  }).join('');

  const tableHeaders = columns.map(col => 
    `<th style="width: ${col.width || 'auto'}">${col.label}</th>`
  ).join('');

  // Generate summary if data has totals
  let summaryHTML = '';
  if (data.length > 0) {
    const numericColumns = columns.filter(col => 
      col.key.toLowerCase().includes('amount') || 
      col.key.toLowerCase().includes('credit') || 
      col.key.toLowerCase().includes('debit') ||
      col.key.toLowerCase().includes('balance')
    );
    
    if (numericColumns.length > 0) {
      const totals = numericColumns.map(col => {
        const total = data.reduce((sum, row) => {
          const value = parseFloat(row[col.key]) || 0;
          return sum + value;
        }, 0);
        return { label: col.label, total };
      });
      
      summaryHTML = `
        <div class="print-summary">
          <h3>Summary</h3>
          ${totals.map(item => `
            <div class="print-summary-row">
              <span class="print-summary-label">Total ${item.label}:</span>
              <span class="print-summary-value">₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          `).join('')}
          <div class="print-summary-row">
            <span class="print-summary-label">Total Records:</span>
            <span class="print-summary-value">${data.length}</span>
          </div>
        </div>
      `;
    }
  }

  // Complete HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      ${includeHeader ? `
        <div class="print-header">
          <h1 class="print-title">${title}</h1>
          ${subtitle ? `<p class="print-subtitle">${subtitle}</p>` : ''}
          <p class="print-header-text">${headerText}</p>
        </div>
      ` : ''}
      
      ${summaryHTML}
      
      <table class="print-table">
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      ${includeFooter ? `
        <div class="print-footer">
          <p>${footerText}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;

  // Write to print window
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};

// Specialized print functions for different report types
export const printCashBook = (data: any[], options: PrintOptions = {}) => {
  const columns = [
    { key: 'sno', label: 'S.No', width: '60px' },
    { key: 'date', label: 'Date', width: '100px' },
    { key: 'companyName', label: 'Company', width: '150px' },
    { key: 'accountName', label: 'Account', width: '150px' },
    { key: 'subAccount', label: 'Sub Account', width: '150px' },
    { key: 'particulars', label: 'Particulars', width: '200px' },
    { key: 'credit', label: 'Credit', width: '100px' },
    { key: 'debit', label: 'Debit', width: '100px' },
    { key: 'staff', label: 'Staff', width: '100px' },
    { key: 'approved', label: 'Status', width: '80px' }
  ];

  return printTable(data, columns, {
    title: 'Cash Book Report',
    subtitle: 'Financial Transaction Details',
    ...options
  });
};

export const printLedger = (data: any[], options: PrintOptions = {}) => {
  const columns = [
    { key: 'accountName', label: 'Account Name', width: '200px' },
    { key: 'credit', label: 'Credit', width: '120px' },
    { key: 'debit', label: 'Debit', width: '120px' },
    { key: 'balance', label: 'Balance', width: '120px' },
    { key: 'yesNo', label: 'Category', width: '100px' }
  ];

  return printTable(data, columns, {
    title: 'Ledger Report',
    subtitle: 'Account-wise Summary',
    ...options
  });
};

export const printBalanceSheet = (data: any[], options: PrintOptions = {}) => {
  const columns = [
    { key: 'accountName', label: 'Account Name', width: '250px' },
    { key: 'credit', label: 'Credit', width: '120px' },
    { key: 'debit', label: 'Debit', width: '120px' },
    { key: 'balance', label: 'Balance', width: '120px' },
    { key: 'yesNo', label: 'P&L', width: '80px' },
    { key: 'result', label: 'Result', width: '100px' }
  ];

  return printTable(data, columns, {
    title: 'Balance Sheet',
    subtitle: 'Financial Position Report',
    ...options
  });
};

export const printVehicles = (data: any[], options: PrintOptions = {}) => {
  const columns = [
    { key: 'sno', label: 'S.No', width: '60px' },
    { key: 'v_no', label: 'Vehicle No', width: '120px' },
    { key: 'v_type', label: 'Type', width: '150px' },
    { key: 'particulars', label: 'Particulars', width: '200px' },
    { key: 'tax_exp_date', label: 'Tax Expiry', width: '100px' },
    { key: 'insurance_exp_date', label: 'Insurance Expiry', width: '120px' },
    { key: 'fitness_exp_date', label: 'Fitness Expiry', width: '120px' },
    { key: 'permit_exp_date', label: 'Permit Expiry', width: '120px' }
  ];

  return printTable(data, columns, {
    title: 'Vehicle Management Report',
    subtitle: 'Fleet and Document Status',
    ...options
  });
};

export const printBankGuarantees = (data: any[], options: PrintOptions = {}) => {
  const columns = [
    { key: 'sno', label: 'S.No', width: '60px' },
    { key: 'bg_no', label: 'BG No', width: '150px' },
    { key: 'issue_date', label: 'Issue Date', width: '100px' },
    { key: 'exp_date', label: 'Expiry Date', width: '100px' },
    { key: 'work_name', label: 'Work Name', width: '250px' },
    { key: 'credit', label: 'Credit', width: '100px' },
    { key: 'debit', label: 'Debit', width: '100px' },
    { key: 'department', label: 'Department', width: '150px' }
  ];

  return printTable(data, columns, {
    title: 'Bank Guarantees Report',
    subtitle: 'BG Tracking and Management',
    ...options
  });
};

export const printDrivers = (data: any[], options: PrintOptions = {}) => {
  const columns = [
    { key: 'sno', label: 'S.No', width: '60px' },
    { key: 'driver_name', label: 'Driver Name', width: '200px' },
    { key: 'license_no', label: 'License No', width: '150px' },
    { key: 'exp_date', label: 'License Expiry', width: '120px' },
    { key: 'phone', label: 'Phone', width: '120px' },
    { key: 'address', label: 'Address', width: '250px' },
    { key: 'particulars', label: 'Particulars', width: '200px' }
  ];

  return printTable(data, columns, {
    title: 'Drivers Report',
    subtitle: 'Driver Information and License Status',
    ...options
  });
}; 