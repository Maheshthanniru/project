import { supabase } from './supabase';
import { FinancialCalculator } from './financialCalculations';

// Types
export interface Company {
  id: string;
  company_name: string;
  address: string;
  created_at: string;
}

export interface Account {
  id: string;
  company_name: string;
  acc_name: string;
  created_at: string;
}

export interface SubAccount {
  id: string;
  company_name: string;
  acc_name: string;
  sub_acc: string;
  created_at: string;
}

export interface CashBookEntry {
  id: string;
  sno: number;
  acc_name: string;
  sub_acc_name: string;
  particulars: string;
  c_date: string;
  credit: number;
  debit: number;
  credit_online: number;
  credit_offline: number;
  debit_online: number;
  debit_offline: number;
  lock_record: boolean;
  company_name: string;
  address: string;
  staff: string;
  users: string;
  entry_time: string;
  sale_qty: number;
  purchase_qty: number;
  approved: boolean;
  edited: boolean;
  e_count: number;
  cb: string;
  created_at: string;
  updated_at: string;
  credit_mode?: string;
  debit_mode?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  user_type_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankGuarantee {
  id: string;
  sno: number;
  bg_no: string;
  issue_date: string;
  exp_date: string;
  work_name: string;
  credit: number;
  debit: number;
  department: string;
  cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  sno: number;
  v_no: string;
  v_type: string | null;
  particulars: string | null;
  tax_exp_date: string | null;
  insurance_exp_date: string | null;
  fitness_exp_date: string | null;
  permit_exp_date: string | null;
  date_added: string | null;
  created_at: string | null;
  updated_at: string | null;
  rc_front_url?: string;
  rc_back_url?: string;
}

export interface Driver {
  id: string;
  sno: number;
  driver_name: string;
  license_no: string | null;
  exp_date: string | null;
  particulars: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
  license_front_url?: string | null;
  license_back_url?: string | null;
}

// Supabase Database Service
class SupabaseDatabase {
  // Company operations
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('company_name');
    
    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
    
    return data || [];
  }

  async addCompany(companyName: string, address: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        company_name: companyName,
        address: address
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`);
    }

    return data;
  }

  async deleteCompany(companyName: string): Promise<boolean> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('company_name', companyName);

    if (error) {
      console.error('Error deleting company:', error);
      return false;
    }

    return true;
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('company_main_accounts')
      .select('*')
      .order('acc_name');
    
    if (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
    
    return data || [];
  }

  async getAccountsByCompany(companyName: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('company_main_accounts')
      .select('*')
      .eq('company_name', companyName)
      .order('acc_name');
    
    if (error) {
      console.error('Error fetching accounts by company:', error);
      return [];
    }
    
    return data || [];
  }

  async addAccount(companyName: string, accountName: string): Promise<Account> {
    const { data, error } = await supabase
      .from('company_main_accounts')
      .insert({
        company_name: companyName,
        acc_name: accountName
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }

    return data;
  }

  async deleteAccount(accountName: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_main_accounts')
      .delete()
      .eq('acc_name', accountName);

    if (error) {
      console.error('Error deleting account:', error);
      return false;
    }

    return true;
  }

  // Sub Account operations
  async getSubAccounts(): Promise<SubAccount[]> {
    const { data, error } = await supabase
      .from('company_main_sub_acc')
      .select('*')
      .order('sub_acc');
    
    if (error) {
      console.error('Error fetching sub accounts:', error);
      return [];
    }
    
    return data || [];
  }

  async getSubAccountsByAccount(companyName: string, accountName: string): Promise<SubAccount[]> {
    const { data, error } = await supabase
      .from('company_main_sub_acc')
      .select('*')
      .eq('company_name', companyName)
      .eq('acc_name', accountName)
      .order('sub_acc');
    
    if (error) {
      console.error('Error fetching sub accounts by account:', error);
      return [];
    }
    
    return data || [];
  }

  async addSubAccount(companyName: string, accountName: string, subAccountName: string): Promise<SubAccount> {
    const { data, error } = await supabase
      .from('company_main_sub_acc')
      .insert({
        company_name: companyName,
        acc_name: accountName,
        sub_acc: subAccountName
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sub account: ${error.message}`);
    }

    return data;
  }

  async deleteSubAccount(subAccountName: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_main_sub_acc')
      .delete()
      .eq('sub_acc', subAccountName);

    if (error) {
      console.error('Error deleting sub account:', error);
      return false;
    }

    return true;
  }

  // Cash Book operations
  async getCashBookEntries(): Promise<CashBookEntry[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('*')
      .order('c_date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cash book entries:', error);
      return [];
    }
    
    return data || [];
  }

  async addCashBookEntry(entry: Omit<CashBookEntry, 'id' | 'sno' | 'entry_time' | 'approved' | 'edited' | 'e_count' | 'lock_record' | 'created_at' | 'updated_at'>): Promise<CashBookEntry> {
    // Validate financial entry
    const validation = FinancialCalculator.validateEntry(entry.credit, entry.debit);
    if (!validation.isValid) {
      throw new Error(`Invalid entry: ${validation.errors.join(', ')}`);
    }

    // Get next serial number
    const { data: lastEntry } = await supabase
      .from('cash_book')
      .select('sno')
      .order('sno', { ascending: false })
      .limit(1);

    const nextSno = lastEntry && lastEntry.length > 0 ? lastEntry[0].sno + 1 : 1;

    // Filter out undefined values to allow database defaults to work
    const filteredEntry = Object.fromEntries(
      Object.entries(entry).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from('cash_book')
      .insert({
        ...filteredEntry,
        sno: nextSno,
        entry_time: new Date().toISOString(),
        approved: '', // Set to pending by default
        edited: false,
        e_count: 0,
        lock_record: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cash book entry: ${error.message}`);
    }

    return data;
  }

  async updateCashBookEntry(id: string, updates: Partial<CashBookEntry>, editedBy?: string): Promise<CashBookEntry | null> {
    // Only pick fields that exist in the table
    const allowedFields = [
      'acc_name', 'sub_acc_name', 'particulars', 'credit', 'debit', 'company_name',
      'address', 'staff', 'users', 'entry_time', 'sale_qty', 'purchase_qty',
      'approved', 'cb', 'c_date', 'e_count', 'edited'
    ];
    const filteredUpdates: any = {};
    for (const key of allowedFields) {
      if (key in updates) filteredUpdates[key] = (updates as any)[key];
    }
    filteredUpdates.edited = true;
    filteredUpdates.updated_at = new Date().toISOString();

    // Fetch the old entry for audit logging
    const { data: oldEntry, error: fetchError } = await supabase
      .from('cash_book')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) {
      console.error('Error fetching old cash book entry for audit log:', fetchError);
    }

    const { data, error } = await supabase
      .from('cash_book')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cash book entry:', error);
      return null;
    }

    // Insert audit log if update succeeded and old entry was fetched
    if (oldEntry && data) {
      const auditLog = {
        cash_book_id: id,
        old_values: JSON.stringify(oldEntry),
        new_values: JSON.stringify(data),
        edited_by: editedBy || 'unknown',
        edited_at: new Date().toISOString(),
      };
      const { error: auditError } = await supabase
        .from('edit_cash_book')
        .insert(auditLog);
      if (auditError) {
        console.error('Error inserting audit log into edit_cash_book:', auditError);
      }
    }

    return data;
  }

  // Lock a cash book entry
  async lockEntry(id: string, lockedBy: string): Promise<CashBookEntry | null> {
    // Fetch the old entry for audit logging
    const { data: oldEntry, error: fetchError } = await supabase
      .from('cash_book')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) {
      console.error('Error fetching old cash book entry for lock:', fetchError);
    }

    const { data, error } = await supabase
      .from('cash_book')
      .update({ lock_record: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error locking cash book entry:', error);
      return null;
    }

    // Insert audit log if update succeeded and old entry was fetched
    if (oldEntry && data) {
      const auditLog = {
        cash_book_id: id,
        old_values: JSON.stringify(oldEntry),
        new_values: JSON.stringify(data),
        edited_by: lockedBy || 'unknown',
        edited_at: new Date().toISOString(),
        action: 'LOCK',
      };
      const { error: auditError } = await supabase
        .from('edit_cash_book')
        .insert(auditLog);
      if (auditError) {
        console.error('Error inserting lock audit log into edit_cash_book:', auditError);
      }
    }

    return data;
  }

  // Unlock a cash book entry
  async unlockEntry(id: string, unlockedBy: string): Promise<CashBookEntry | null> {
    // Fetch the old entry for audit logging
    const { data: oldEntry, error: fetchError } = await supabase
      .from('cash_book')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) {
      console.error('Error fetching old cash book entry for unlock:', fetchError);
    }

    const { data, error } = await supabase
      .from('cash_book')
      .update({ lock_record: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error unlocking cash book entry:', error);
      return null;
    }

    // Insert audit log if update succeeded and old entry was fetched
    if (oldEntry && data) {
      const auditLog = {
        cash_book_id: id,
        old_values: JSON.stringify(oldEntry),
        new_values: JSON.stringify(data),
        edited_by: unlockedBy || 'unknown',
        edited_at: new Date().toISOString(),
        action: 'UNLOCK',
      };
      const { error: auditError } = await supabase
        .from('edit_cash_book')
        .insert(auditLog);
      if (auditError) {
        console.error('Error inserting unlock audit log into edit_cash_book:', auditError);
      }
    }

    return data;
  }

  async deleteCashBookEntry(id: string, deletedBy: string): Promise<boolean> {
    console.log('deleteCashBookEntry called with id:', id, 'deletedBy:', deletedBy);
    
    try {
      // Fetch the old entry for backup
      const { data: oldEntry, error: fetchError } = await supabase
        .from('cash_book')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching old cash book entry for deletion:', fetchError);
        return false;
      }

      console.log('Found entry to delete:', oldEntry);

      // Try to insert into deleted_cash_book BEFORE deleting the record
      if (oldEntry) {
        try {
          const deletedRecord = {
            ...oldEntry,
            deleted_by: deletedBy || 'unknown',
            deleted_at: new Date().toISOString(),
          };
          
          console.log('Inserting into deleted_cash_book:', deletedRecord);
          
          const { error: insertError } = await supabase
            .from('deleted_cash_book')
            .insert(deletedRecord);
            
          if (insertError) {
            console.error('Error inserting into deleted_cash_book:', insertError);
            console.log('Continuing with delete without backup...');
            // Continue with delete even if backup fails
          } else {
            console.log('Successfully inserted into deleted_cash_book');
          }
        } catch (backupError) {
          console.error('Backup failed, continuing with delete:', backupError);
          // Continue with delete even if backup fails
        }
      }

      // Now delete the record
      console.log('Deleting from cash_book with id:', id);
      const { error } = await supabase
        .from('cash_book')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting cash book entry:', error);
        return false;
      }

      console.log('Successfully deleted from cash_book');
      return true;
    } catch (error) {
      console.error('Unexpected error in deleteCashBookEntry:', error);
      return false;
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('username');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data || [];
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
    
    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
    
    return data;
  }

  async createUser(user: Omit<, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  }

  // Bank Guarantee operations
  async getBankGuarantees(): Promise<BankGuarantee[]> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bank guarantees:', error);
      return [];
    }
    
    return data || [];
  }

  async addBankGuarantee(bg: Omit<BankGuarantee, 'id' | 'sno' | 'created_at' | 'updated_at'>): Promise<BankGuarantee> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(bg)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bank guarantee: ${error.message}`);
    }

    return data;
  }

  async updateBankGuarantee(id: string, updates: Partial<BankGuarantee>): Promise<BankGuarantee | null> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bank guarantee:', error);
      return null;
    }

    return data;
  }

  async deleteBankGuarantee(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bank guarantee:', error);
      return false;
    }

    return true;
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('v_no');
    
    if (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
    
    return data || [];
  }

  async addVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create vehicle: ${error.message}`);
    }

    return data;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return null;
    }

    return data;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vehicle:', error);
      return false;
    }

    return true;
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('driver_name');
    
    if (error) {
      console.error('Error fetching drivers:', error);
      return [];
    }
    
    return data || [];
  }

  async addDriver(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driver)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create driver: ${error.message}`);
    }

    return data;
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver:', error);
      return null;
    }

    return data;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting driver:', error);
      return false;
    }

    return true;
  }

  // Search operations
  async searchCashBookEntries(searchTerm: string, dateFilter?: string): Promise<CashBookEntry[]> {
    let query = supabase
      .from('cash_book')
      .select('*');

    if (searchTerm) {
      query = query.or(`particulars.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,acc_name.ilike.%${searchTerm}%`);
    }

    if (dateFilter) {
      query = query.eq('c_date', dateFilter);
    }

    const { data, error } = await query.order('c_date', { ascending: false });

    if (error) {
      console.error('Error searching cash book entries:', error);
      return [];
    }

    return data || [];
  }

  // Dashboard stats
  async getDashboardStats(date?: string) {
    const { data, error } = await supabase
      .from('cash_book')
      .select('credit, debit, c_date, credit_online, credit_offline, debit_online, debit_offline');

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalCredit: 0,
        totalDebit: 0,
        balance: 0,
        todayEntries: 0,
        onlineCredit: 0,
        offlineCredit: 0,
        onlineDebit: 0,
        offlineDebit: 0,
        totalOnline: 0,
        totalOffline: 0
      };
    }

    const entries = data || [];
    const today = date || new Date().toISOString().split('T')[0];
    
    const todayEntries = entries.filter(e => e.c_date === today);
    const totalCredit = todayEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const totalDebit = todayEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const balance = totalCredit - totalDebit;

    // Calculate online vs offline amounts using new fields
    const onlineCredit = todayEntries.reduce((sum, e) => sum + (e.credit_online || 0), 0);
    const offlineCredit = todayEntries.reduce((sum, e) => sum + (e.credit_offline || 0), 0);
    const onlineDebit = todayEntries.reduce((sum, e) => sum + (e.debit_online || 0), 0);
    const offlineDebit = todayEntries.reduce((sum, e) => sum + (e.debit_offline || 0), 0);

    const totalOnline = onlineCredit + onlineDebit;
    const totalOffline = offlineCredit + offlineDebit;

    return {
      totalCredit,
      totalDebit,
      balance,
      todayEntries: todayEntries.length,
      onlineCredit,
      offlineCredit,
      onlineDebit,
      offlineDebit,
      totalOnline,
      totalOffline
    };
  }

  // Toggle approval status
  async toggleApproval(id: string): Promise<boolean> {
    try {
      // First get the current entry
      const { data: currentEntry, error: fetchError } = await supabase
        .from('cash_book')
        .select('approved')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching entry for approval toggle:', fetchError);
        return false;
      }

      // Toggle the approval status
      const { error: updateError } = await supabase
        .from('cash_book')
        .update({ 
          approved: !currentEntry.approved,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error toggling approval:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleApproval:', error);
      return false;
    }
  }

  // Export data for backup
  async exportData(): Promise<any> {
    try {
      const [companies, accounts, subAccounts, entries, users, bankGuarantees, vehicles, drivers] = await Promise.all([
        this.getCompanies(),
        this.getAccounts(),
        this.getSubAccounts(),
        this.getCashBookEntries(),
        this.getUsers(),
        this.getBankGuarantees(),
        this.getVehicles(),
        this.getDrivers()
      ]);

      return {
        companies,
        accounts,
        subAccounts,
        entries,
        users,
        bankGuarantees,
        vehicles,
        drivers,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Get pending approvals count
  async getPendingApprovalsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false);

      if (error) {
        console.error('Error getting pending approvals count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getPendingApprovalsCount:', error);
      return 0;
    }
  }

  // Get entries by approval status
  async getEntriesByApprovalStatus(approved: boolean): Promise<CashBookEntry[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('*')
        .eq('approved', approved)
        .order('c_date', { ascending: false });

      if (error) {
        console.error('Error fetching entries by approval status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEntriesByApprovalStatus:', error);
      return [];
    }
  }

  // Get edited entries
  async getEditedEntries(): Promise<CashBookEntry[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('*')
        .eq('edited', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching edited entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEditedEntries:', error);
      return [];
    }
  }

  async getEditAuditLog(): Promise<any[]> {
    const { data, error } = await supabase
      .from('edit_cash_book')
      .select('*')
      .order('edited_at', { ascending: false });
    if (error) {
      console.error('Error fetching edit audit log:', error);
      return [];
    }
    return data || [];
  }

  async getDeletedCashBook(): Promise<any[]> {
    const { data, error } = await supabase
      .from('deleted_cash_book')
      .select('*')
      .order('deleted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching deleted cash book entries:', error);
      return [];
    }
    
    return data || [];
  }

  // Get unique values for dropdowns in Edit Entry page
  async getUniqueParticulars(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('particulars')
      .not('particulars', 'is', null)
      .not('particulars', 'eq', '');
    
    if (error) {
      console.error('Error fetching unique particulars:', error);
      return [];
    }
    
    const uniqueParticulars = [...new Set(data?.map(item => item.particulars).filter(Boolean))];
    return uniqueParticulars.sort();
  }

  async getUniqueSaleQuantities(): Promise<number[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('sale_qty')
      .not('sale_qty', 'is', null)
      .gt('sale_qty', 0);
    
    if (error) {
      console.error('Error fetching unique sale quantities:', error);
      return [];
    }
    
    const uniqueQuantities = [...new Set(data?.map(item => item.sale_qty).filter(Boolean))];
    return uniqueQuantities.sort((a, b) => a - b);
  }

  async getUniquePurchaseQuantities(): Promise<number[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('purchase_qty')
      .not('purchase_qty', 'is', null)
      .gt('purchase_qty', 0);
    
    if (error) {
      console.error('Error fetching unique purchase quantities:', error);
      return [];
    }
    
    const uniqueQuantities = [...new Set(data?.map(item => item.purchase_qty).filter(Boolean))];
    return uniqueQuantities.sort((a, b) => a - b);
  }

  async getUniqueCreditAmounts(): Promise<number[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('credit')
      .not('credit', 'is', null)
      .gt('credit', 0);
    
    if (error) {
      console.error('Error fetching unique credit amounts:', error);
      return [];
    }
    
    const uniqueAmounts = [...new Set(data?.map(item => item.credit).filter(Boolean))];
    return uniqueAmounts.sort((a, b) => a - b);
  }

  async getUniqueDebitAmounts(): Promise<number[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('debit')
      .not('debit', 'is', null)
      .gt('debit', 0);
    
    if (error) {
      console.error('Error fetching unique debit amounts:', error);
      return [];
    }
    
    const uniqueAmounts = [...new Set(data?.map(item => item.debit).filter(Boolean))];
    return uniqueAmounts.sort((a, b) => a - b);
  }
}

// Export singleton instance
export const supabaseDB = new SupabaseDatabase(); 