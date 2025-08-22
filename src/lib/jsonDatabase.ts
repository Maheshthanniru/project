import { format } from 'date-fns';
import { FinancialCalculator } from './financialCalculations';

// JSON Database Structure
export interface Company {
  id: string;
  companyName: string;
  address: string;
  createdAt: string;
}

export interface Account {
  id: string;
  companyName: string;
  accountName: string;
  createdAt: string;
}

export interface SubAccount {
  id: string;
  companyName: string;
  accountName: string;
  subAccount: string;
  createdAt: string;
}

export interface CashBookEntry {
  id: string;
  sno: number;
  dailyEntryNo: number; // New field for daily entry numbering
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
  user: string;
  entryTime: string;
  approved: boolean;
  edited: boolean;
  editCount: number;
  locked: boolean;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface EditHistory {
  id: string;
  entryId: string;
  sno: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'UNLOCK' | 'APPROVE';
  editedBy: string;
  editedAt: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  originalData: Partial<CashBookEntry>;
  newData: Partial<CashBookEntry>;
  reason?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  userType: 'Admin' | 'Operator';
  isActive: boolean;
  createdAt: string;
}

// JSON Database Class
class JsonDatabase {
  private companies: Company[] = [];
  private accounts: Account[] = [];
  private subAccounts: SubAccount[] = [];
  private cashBookEntries: CashBookEntry[] = [];
  private editHistory: EditHistory[] = [];
  private users: User[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    // Load from localStorage or initialize with default data
    const savedData = localStorage.getItem('thirumala_database');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.companies = data.companies || [];
      this.accounts = data.accounts || [];
      this.subAccounts = data.subAccounts || [];
      this.cashBookEntries = data.cashBookEntries || [];
      this.editHistory = data.editHistory || [];
      this.users = data.users || [];
    } else {
      this.initializeDefaultData();
    }
  }

  private saveToStorage() {
    const data = {
      companies: this.companies,
      accounts: this.accounts,
      subAccounts: this.subAccounts,
      cashBookEntries: this.cashBookEntries,
      editHistory: this.editHistory,
      users: this.users};
    localStorage.setItem('thirumala_database', JSON.stringify(data));
  }

  private initializeDefaultData() {
    // Initialize with sample data from your images
    this.companies = [
      {
        id: '1',
        companyName: 'BR AND BVT',
        address: 'GJL',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        companyName: 'TT 2022-2023 (TCJ)',
        address: 'GAJWEL',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        companyName: 'SRINIVASA COTTON',
        address: 'MEDAK',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        companyName: 'TIRUMALA AUTO FI',
        address: 'GAJWEL',
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        companyName: 'BUKKA SAI VIVEK A',
        address: 'GAJWEL',
        createdAt: new Date().toISOString(),
      },
      {
        id: '6',
        companyName: 'RAMESH BUKKA A/',
        address: 'GAJWEL',
        createdAt: new Date().toISOString(),
      },
    ];

    this.accounts = [
      { id: '1', companyName: 'BR AND BVT', accountName: 'BBB', createdAt: new Date().toISOString() },
      { id: '2', companyName: 'TT 2022-2023 (TCJ)', accountName: 'BALE PARTIES A/C', createdAt: new Date().toISOString() },
      { id: '3', companyName: 'SRINIVASA COTTON', accountName: 'BANK A/C', createdAt: new Date().toISOString() },
      { id: '4', companyName: 'TIRUMALA AUTO FI', accountName: 'INTEREST A/C', createdAt: new Date().toISOString() },
      { id: '5', companyName: 'TIRUMALA AUTO FI', accountName: 'LOAN A/C', createdAt: new Date().toISOString() },
      { id: '6', companyName: 'BUKKA SAI VIVEK A', accountName: 'BANK A/C', createdAt: new Date().toISOString() },
      { id: '7', companyName: 'RAMESH BUKKA A/', accountName: 'ANAMATH A/C', createdAt: new Date().toISOString() },
    ];

    this.subAccounts = [
      { id: '1', companyName: 'BR AND BVT', accountName: 'BBB', subAccount: 'HH', createdAt: new Date().toISOString() },
      { id: '2', companyName: 'TT 2022-2023 (TCJ)', accountName: 'BALE PARTIES A/C', subAccount: 'JAYALAKSHMI COTTON JK', createdAt: new Date().toISOString() },
      { id: '3', companyName: 'SRINIVASA COTTON', accountName: 'BANK A/C', subAccount: 'AB GAJWEL CURRENT A NHGB', createdAt: new Date().toISOString() },
      { id: '4', companyName: 'TIRUMALA AUTO FI', accountName: 'LOAN A/C', subAccount: 'RAJU NEELA A/C', createdAt: new Date().toISOString() },
      { id: '5', companyName: 'BUKKA SAI VIVEK A', accountName: 'BANK A/C', subAccount: 'UNION BANK GJL A/C', createdAt: new Date().toISOString() },
      { id: '6', companyName: 'TIRUMALA AUTO FI', accountName: 'LOAN A/C', subAccount: 'GANGIREDDY SWAMY A/C', createdAt: new Date().toISOString() },
      { id: '7', companyName: 'RAMESH BUKKA A/', accountName: 'ANAMATH A/C', subAccount: 'VEERESHAM M A/C', createdAt: new Date().toISOString() },
    ];

    this.users = [
      { id: '1', username: 'admin', email: 'admin@thirumala.com', userType: 'Admin', isActive: true, createdAt: new Date().toISOString() },
      { id: '2', username: 'operator', email: 'operator@thirumala.com', userType: 'Operator', isActive: true, createdAt: new Date().toISOString() },
      { id: '3', username: 'RAMESH', email: 'ramesh@thirumala.com', userType: 'Operator', isActive: true, createdAt: new Date().toISOString() },
      { id: '4', username: 'TC DOUBLE', email: 'tc@thirumala.com', userType: 'Operator', isActive: true, createdAt: new Date().toISOString() },
      { id: '5', username: 'RAM', email: 'ram@thirumala.com', userType: 'Operator', isActive: true, createdAt: new Date().toISOString() },
    ];

    this.cashBookEntries = [
      {
        id: '1',
        sno: 1,
        dailyEntryNo: 1,
        date: '2025-07-03',
        companyName: 'BR AND BVT',
        accountName: 'BBB',
        subAccount: 'HH',
        particulars: 'HH',
        saleQ: 0,
        purchaseQ: 0,
        credit: 10.00,
        debit: 0.00,
        staff: 'TC DOUBLE',
        user: 'admin',
        entryTime: new Date().toISOString(),
        approved: false,
        edited: false,
        editCount: 0,
        locked: false},
      {
        id: '2',
        sno: 2,
        dailyEntryNo: 1,
        date: '2025-07-01',
        companyName: 'TT 2022-2023 (TCJ)',
        accountName: 'BALE PARTIES A/C',
        subAccount: 'JAYALAKSHMI COTTON JK',
        particulars: 'JAYALAKSHMI COTTON JK',
        saleQ: 0,
        purchaseQ: 0,
        credit: 0.00,
        debit: 10.00,
        staff: 'TC DOUBLE',
        user: 'operator',
        entryTime: new Date().toISOString(),
        approved: true,
        edited: false,
        editCount: 0,
        locked: false},
      {
        id: '3',
        sno: 3,
        dailyEntryNo: 1,
        date: '2025-06-20',
        companyName: 'SRINIVASA COTTON',
        accountName: 'BANK A/C',
        subAccount: 'AB GAJWEL CURRENT A NHGB',
        particulars: 'AB GAJWEL CURRENT A NHGB',
        saleQ: 0,
        purchaseQ: 0,
        credit: 0.00,
        debit: 1.00,
        staff: 'D',
        user: 'RAM',
        entryTime: new Date().toISOString(),
        approved: false,
        edited: false,
        editCount: 0,
        locked: false},
      {
        id: '4',
        sno: 4,
        dailyEntryNo: 2,
        date: '2025-06-20',
        companyName: 'TIRUMALA AUTO FI',
        accountName: 'LOAN A/C',
        subAccount: 'RAJU NEELA A/C',
        particulars: 'CD NO 501 INT AMOUNT VIVEK P PAY',
        saleQ: 0,
        purchaseQ: 0,
        credit: 60000.00,
        debit: 0.00,
        staff: 'D',
        user: 'RAM',
        entryTime: new Date().toISOString(),
        approved: true,
        edited: false,
        editCount: 0,
        locked: false},
      {
        id: '5',
        sno: 5,
        dailyEntryNo: 3,
        date: '2025-06-20',
        companyName: 'BUKKA SAI VIVEK A',
        accountName: 'BANK A/C',
        subAccount: 'UNION BANK GJL A/C',
        particulars: 'UPI TRFR FROM NEELA RAJU',
        saleQ: 0,
        purchaseQ: 0,
        credit: 0.00,
        debit: 60000.00,
        staff: 'D',
        user: 'RAM',
        entryTime: new Date().toISOString(),
        approved: false,
        edited: true,
        editCount: 1,
        locked: false},
      {
        id: '6',
        sno: 6,
        dailyEntryNo: 4,
        date: '2025-06-20',
        companyName: 'TIRUMALA AUTO FI',
        accountName: 'LOAN A/C',
        subAccount: 'GANGIREDDY SWAMY A/C',
        particulars: 'CD NO 467 INT AMOUNT MV G PAY',
        saleQ: 0,
        purchaseQ: 0,
        credit: 9000.00,
        debit: 0.00,
        staff: 'D',
        user: 'RAM',
        entryTime: new Date().toISOString(),
        approved: true,
        edited: false,
        editCount: 0,
        locked: false},
      {
        id: '7',
        sno: 7,
        dailyEntryNo: 5,
        date: '2025-06-20',
        companyName: 'RAMESH BUKKA A/',
        accountName: 'ANAMATH A/C',
        subAccount: 'VEERESHAM M A/C',
        particulars: 'UPI TRFR FROM GANGIREDDY SWAMY',
        saleQ: 0,
        purchaseQ: 0,
        credit: 0.00,
        debit: 9000.00,
        staff: 'D',
        user: 'RAM',
        entryTime: new Date().toISOString(),
        approved: false,
        edited: false,
        editCount: 0,
        locked: false},
    ];

    this.editHistory = [];
    this.saveToStorage();
  }

  // Get next daily entry number for a specific date
  getNextDailyEntryNumber(date: string): number {
    const entriesForDate = this.cashBookEntries.filter(entry => entry.date === date);
    if (entriesForDate.length === 0) {
      return 1; // Start from 1 for new day
    }
    
    // Find the highest daily entry number for this date and add 1
    const maxDailyEntryNo = Math.max(...entriesForDate.map(entry => entry.dailyEntryNo || 0));
    return maxDailyEntryNo + 1;
  }

  // Get current daily entry number for display (what the next entry will be)
  getCurrentDailyEntryNumber(date: string): number {
    return this.getNextDailyEntryNumber(date);
  }

  // History tracking
  private addToHistory(
    entryId: string,
    sno: number,
    action: EditHistory['action'],
    editedBy: string,
    originalData: Partial<CashBookEntry>,
    newData: Partial<CashBookEntry>,
    changes: EditHistory['changes'] = [],
    reason?: string
  ) {
    const historyEntry: EditHistory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      entryId,
      sno,
      action,
      editedBy,
      editedAt: new Date().toISOString(),
      changes,
      originalData,
      newData,
      reason};
    this.editHistory.unshift(historyEntry);
    this.saveToStorage();
  }

  // Get edit history for a specific entry
  getEditHistory(entryId?: string): EditHistory[] {
    if (entryId) {
      return this.editHistory.filter(h => h.entryId === entryId);
    }
    return this.editHistory;
  }

  // Get all activity history
  getAllActivityHistory(): EditHistory[] {
    return this.editHistory.sort((a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime());
  }

  // Company operations
  getCompanies(): Company[] {
    return this.companies;
  }

  addCompany(companyName: string, address: string): Company {
    const newCompany: Company = {
      id: Date.now().toString(),
      companyName,
      address,
      createdAt: new Date().toISOString(),
    };
    this.companies.push(newCompany);
    this.saveToStorage();
    return newCompany;
  }

  deleteCompany(id: string): boolean {
    const index = this.companies.findIndex(c => c.id === id);
    if (index !== -1) {
      this.companies.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Account operations
  getAccounts(): Account[] {
    return this.accounts;
  }

  getAccountsByCompany(companyName: string): Account[] {
    return this.accounts.filter(acc => acc.companyName === companyName);
  }

  addAccount(companyName: string, accountName: string): Account {
    const newAccount: Account = {
      id: Date.now().toString(),
      companyName,
      accountName,
      createdAt: new Date().toISOString(),
    };
    this.accounts.push(newAccount);
    this.saveToStorage();
    return newAccount;
  }

  deleteAccount(id: string): boolean {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      this.accounts.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Sub Account operations
  getSubAccounts(): SubAccount[] {
    return this.subAccounts;
  }

  getSubAccountsByAccount(companyName: string, accountName: string): SubAccount[] {
    return this.subAccounts.filter(
      sub => sub.companyName === companyName && sub.accountName === accountName
    );
  }

  addSubAccount(companyName: string, accountName: string, subAccount: string): SubAccount {
    const newSubAccount: SubAccount = {
      id: Date.now().toString(),
      companyName,
      accountName,
      subAccount,
      createdAt: new Date().toISOString(),
    };
    this.subAccounts.push(newSubAccount);
    this.saveToStorage();
    return newSubAccount;
  }

  deleteSubAccount(id: string): boolean {
    const index = this.subAccounts.findIndex(s => s.id === id);
    if (index !== -1) {
      this.subAccounts.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Cash Book operations with financial validation
  getCashBookEntries(): CashBookEntry[] {
    return this.cashBookEntries.sort((a, b) => b.sno - a.sno);
  }

  addCashBookEntry(entry: Omit<CashBookEntry, 'id' | 'sno' | 'dailyEntryNo' | 'entryTime' | 'approved' | 'edited' | 'editCount' | 'locked'>): CashBookEntry {
    // Validate financial entry
    const validation = FinancialCalculator.validateEntry(entry.credit, entry.debit);
    if (!validation.isValid) {
      throw new Error(`Invalid entry: ${validation.errors.join(', ')}`);
    }

    // Ensure precise calculations
    const credit = FinancialCalculator.toCents(entry.credit) / 100;
    const debit = FinancialCalculator.toCents(entry.debit) / 100;

    // Get next daily entry number for the specified date
    const dailyEntryNo = this.getNextDailyEntryNumber(entry.date);

    const newEntry: CashBookEntry = {
      ...entry,
      credit,
      debit,
      id: Date.now().toString(),
      sno: this.cashBookEntries.length + 1,
      dailyEntryNo,
      entryTime: new Date().toISOString(),
      approved: false,
      edited: false,
      editCount: 0,
      locked: false};
    this.cashBookEntries.push(newEntry);
    
    // Add to history
    this.addToHistory(
      newEntry.id,
      newEntry.sno,
      'CREATE',
      entry.user,
      {},
      newEntry
    );
    
    this.saveToStorage();
    return newEntry;
  }

  updateCashBookEntry(id: string, updates: Partial<CashBookEntry>, editedBy?: string): CashBookEntry | null {
    const index = this.cashBookEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      const originalEntry = { ...this.cashBookEntries[index] };
      
      // Validate financial updates if credit/debit are being changed
      if (updates.credit !== undefined || updates.debit !== undefined) {
        const newCredit = updates.credit !== undefined ? updates.credit : originalEntry.credit;
        const newDebit = updates.debit !== undefined ? updates.debit : originalEntry.debit;
        
        const validation = FinancialCalculator.validateEntry(newCredit, newDebit);
        if (!validation.isValid) {
          throw new Error(`Invalid update: ${validation.errors.join(', ')}`);
        }

        // Ensure precise calculations
        if (updates.credit !== undefined) {
          updates.credit = FinancialCalculator.toCents(updates.credit) / 100;
        }
        if (updates.debit !== undefined) {
          updates.debit = FinancialCalculator.toCents(updates.debit) / 100;
        }
      }
      
      // Calculate changes
      const changes: EditHistory['changes'] = [];
      Object.keys(updates).forEach(key => {
        const oldValue = (originalEntry as any)[key];
        const newValue = (updates as any)[key];
        if (oldValue !== newValue) {
          changes.push({
            field: key,
            oldValue,
            newValue});
        }
      });

      this.cashBookEntries[index] = {
        ...this.cashBookEntries[index],
        ...updates,
        edited: true,
        editCount: this.cashBookEntries[index].editCount + 1,
        lastEditedBy: editedBy,
        lastEditedAt: new Date().toISOString(),
      };

      // Add to history
      this.addToHistory(
        id,
        this.cashBookEntries[index].sno,
        'UPDATE',
        editedBy || 'system',
        originalEntry,
        this.cashBookEntries[index],
        changes
      );

      this.saveToStorage();
      return this.cashBookEntries[index];
    }
    return null;
  }

  deleteCashBookEntry(id: string, deletedBy: string): boolean {
    const index = this.cashBookEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      const deletedEntry = { ...this.cashBookEntries[index] };
      
      // Add to history before deletion
      this.addToHistory(
        id,
        deletedEntry.sno,
        'DELETE',
        deletedBy,
        deletedEntry,
        {}
      );

      this.cashBookEntries.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  lockEntry(id: string, lockedBy: string): CashBookEntry | null {
    const entry = this.updateCashBookEntry(id, { locked: true }, lockedBy);
    if (entry) {
      this.addToHistory(
        id,
        entry.sno,
        'LOCK',
        lockedBy,
        { locked: false },
        { locked: true }
      );
    }
    return entry;
  }

  unlockEntry(id: string, unlockedBy: string): CashBookEntry | null {
    const entry = this.updateCashBookEntry(id, { locked: false }, unlockedBy);
    if (entry) {
      this.addToHistory(
        id,
        entry.sno,
        'UNLOCK',
        unlockedBy,
        { locked: true },
        { locked: false }
      );
    }
    return entry;
  }

  approveEntry(id: string, approvedBy: string): CashBookEntry | null {
    const entry = this.updateCashBookEntry(id, { approved: true }, approvedBy);
    if (entry) {
      this.addToHistory(
        id,
        entry.sno,
        'APPROVE',
        approvedBy,
        { approved: false },
        { approved: true }
      );
    }
    return entry;
  }

  // User operations
  getUsers(): User[] {
    return this.users;
  }

  getUserByUsername(username: string): User | null {
    return this.users.find(user => user.username === username) || null;
  }

  // Search and filter operations
  searchCashBookEntries(searchTerm: string, dateFilter?: string): CashBookEntry[] {
    let filtered = this.cashBookEntries;

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.subAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.staff.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(entry => entry.date === dateFilter);
    }

    return filtered.sort((a, b) => b.sno - a.sno);
  }

  // Statistics with precise calculations
  getDashboardStats(date?: string) {
    const entries = date 
      ? this.cashBookEntries.filter(entry => entry.date === date)
      : this.cashBookEntries;

    const totalCredit = FinancialCalculator.sum(entries.map(entry => entry.credit));
    const totalDebit = FinancialCalculator.sum(entries.map(entry => entry.debit));
    const balance = FinancialCalculator.calculateBalance(totalCredit, totalDebit);
    const pendingApprovals = this.cashBookEntries.filter(entry => !entry.approved).length;

    return {
      totalCredit,
      totalDebit,
      balance,
      totalTransactions: entries.length,
      pendingApprovals};
  }

  // Financial reconciliation
  getFinancialReconciliation() {
    const entries = this.cashBookEntries.map(entry => ({
      credit: entry.credit,
      debit: entry.debit
    }));
    
    return FinancialCalculator.reconcileAccounts(entries);
  }

  // Export data
  exportData() {
    return {
      companies: this.companies,
      accounts: this.accounts,
      subAccounts: this.subAccounts,
      cashBookEntries: this.cashBookEntries,
      editHistory: this.editHistory,
      users: this.users,
      reconciliation: this.getFinancialReconciliation(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Import data
  importData(data: any) {
    if (data.companies) this.companies = data.companies;
    if (data.accounts) this.accounts = data.accounts;
    if (data.subAccounts) this.subAccounts = data.subAccounts;
    if (data.cashBookEntries) this.cashBookEntries = data.cashBookEntries;
    if (data.editHistory) this.editHistory = data.editHistory;
    if (data.users) this.users = data.users;
    this.saveToStorage();
  }
}

// Export singleton instance
export const jsonDB = new JsonDatabase();