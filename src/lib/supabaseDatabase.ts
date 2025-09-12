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
    try {
      console.log('🔄 Fetching all companies from companies table...');
      
      // First get the total count
      const { count: totalCount, error: countError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total companies in companies table:', totalCount);
      
      // Load all companies with explicit high limit
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('company_name')
        .limit(10000); // Explicit high limit to get all companies

      if (error) {
        console.error('❌ Error fetching companies:', error);
        return [];
      }

      console.log('✅ Companies fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getCompanies:', error);
      return [];
    }
  }

  async getCompaniesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting companies count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting companies count:', error);
      return 0;
    }
  }

  async addCompany(companyName: string, address: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        company_name: companyName,
        address: address,
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
        acc_name: accountName,
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

  async getSubAccountsByAccount(
    companyName: string,
    accountName: string
  ): Promise<SubAccount[]> {
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

  async addSubAccount(
    companyName: string,
    accountName: string,
    subAccountName: string
  ): Promise<SubAccount> {
    const { data, error } = await supabase
      .from('company_main_sub_acc')
      .insert({
        company_name: companyName,
        acc_name: accountName,
        sub_acc: subAccountName,
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
  async getCashBookEntries(limit: number = 1000, offset: number = 0): Promise<CashBookEntry[]> {
    try {
      console.log(`🔄 Fetching cash book entries (limit: ${limit}, offset: ${offset})...`);
      
      // Use proper range calculation for Supabase
      const start = offset;
      const end = offset + limit - 1;
      
      const { data, error } = await supabase
        .from('cash_book')
        .select('*')
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error(`❌ Error fetching cash book entries (offset: ${offset}, limit: ${limit}):`, error);
        return [];
      }

      const resultCount = data?.length || 0;
      console.log(`✅ Fetched ${resultCount} entries (range: ${start}-${end})`);
      return data || [];
    } catch (error) {
      console.error('Error in getCashBookEntries:', error);
      return [];
    }
  }

  // Get total count for pagination
  async getCashBookEntriesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }

  // Get all cash book entries using pagination to bypass Supabase's 1000 record limit
  async getAllCashBookEntries(): Promise<CashBookEntry[]> {
    try {
      console.log('🔄 Fetching all cash book entries using improved pagination...');
      
      // First, get the total count
      const totalCount = await this.getCashBookEntriesCount();
      console.log(`📊 Total records in database: ${totalCount}`);
      
      if (totalCount === 0) {
        console.log('⚠️ No records found in database');
        return [];
      }
      
      let allEntries: CashBookEntry[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMoreData = true;
      let batchCount = 0;
      
      while (hasMoreData && offset < totalCount) {
        try {
          console.log(`🔄 Fetching batch ${batchCount + 1} (offset: ${offset}, limit: ${batchSize})...`);
          
          const batch = await this.getCashBookEntries(batchSize, offset);
          
          if (batch.length === 0) {
            console.log('⚠️ No more data returned, stopping pagination');
            hasMoreData = false;
          } else {
            allEntries = [...allEntries, ...batch];
            offset += batchSize;
            batchCount++;
            
            console.log(`📊 Batch ${batchCount}: ${batch.length} records, Total so far: ${allEntries.length}/${totalCount}`);
            
            // If we got less than batchSize, we've reached the end
            if (batch.length < batchSize) {
              console.log('✅ Reached end of data (got less than batch size)');
              hasMoreData = false;
            }
            
            // Safety check to prevent infinite loops
            if (allEntries.length >= totalCount) {
              console.log('✅ Reached total count, stopping pagination');
              hasMoreData = false;
            }
          }
        } catch (batchError) {
          console.error(`❌ Error in batch ${batchCount + 1}:`, batchError);
          // Continue with next batch instead of failing completely
          offset += batchSize;
          batchCount++;
          
          // If we've had too many errors, stop
          if (batchCount > 10) {
            console.error('❌ Too many batch errors, stopping pagination');
            hasMoreData = false;
          }
        }
      }
      
      console.log(`✅ Pagination complete: ${allEntries.length} records fetched in ${batchCount} batches`);
      
      if (allEntries.length !== totalCount) {
        console.warn(`⚠️ Warning: Expected ${totalCount} records but got ${allEntries.length}`);
      }
      
      return allEntries;
    } catch (error) {
      console.error('❌ Error in getAllCashBookEntries:', error);
      return [];
    }
  }

  // Get filtered cash book entries with pagination for better performance
  async getFilteredCashBookEntries(filters: {
    companyName?: string;
    accountName?: string;
    subAccountName?: string;
  }, limit: number = 1000, offset: number = 0): Promise<{ data: CashBookEntry[], total: number }> {
    try {
      console.log(`🔄 Fetching filtered cash book entries with pagination (limit: ${limit}, offset: ${offset})...`);
      console.log('🔍 Filters:', filters);
      
      let query = supabase
        .from('cash_book')
        .select('*', { count: 'exact' });

      // Apply filters at database level for better performance
      if (filters.companyName) {
        query = query.eq('company_name', filters.companyName);
        console.log(`🏢 Filtering by company: ${filters.companyName}`);
      }
      
      if (filters.accountName) {
        query = query.eq('acc_name', filters.accountName);
        console.log(`📄 Filtering by account: ${filters.accountName}`);
      }
      
      if (filters.subAccountName) {
        query = query.eq('sub_acc_name', filters.subAccountName);
        console.log(`👤 Filtering by sub-account: ${filters.subAccountName}`);
      }

      // Order by date for consistent results
      query = query.order('c_date', { ascending: false });

      // Apply pagination
      const start = offset;
      const end = offset + limit - 1;
      query = query.range(start, end);

      console.log('🔍 Executing paginated database query...');
      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching filtered entries:', error);
        return { data: [], total: 0 };
      }

      console.log(`📊 Filtered entries loaded: ${data?.length || 0} (Total available: ${count || 0})`);
      console.log('📊 Sample of returned entries:', data?.slice(0, 2).map(e => ({ 
        id: e.id, 
        company: e.company_name, 
        date: e.c_date 
      })));
      
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('❌ Error in getFilteredCashBookEntries:', error);
      return { data: [], total: 0 };
    }
  }

  // Get filtered cash book entries using server-side filtering for better performance (loads all at once)
  async getAllFilteredCashBookEntries(filters: {
    companyName?: string;
    accountName?: string;
    subAccountName?: string;
  }): Promise<CashBookEntry[]> {
    try {
      console.log('🔄 Fetching filtered cash book entries with server-side filtering...');
      console.log('🔍 Filters:', filters);
      console.log('🔍 About to query ALL 67k records with filters...');
      
      let query = supabase
        .from('cash_book')
        .select('*', { count: 'exact' });

      // Apply filters at database level for better performance
      if (filters.companyName) {
        query = query.eq('company_name', filters.companyName);
        console.log(`🏢 Filtering by company: ${filters.companyName}`);
      }
      
      if (filters.accountName) {
        query = query.eq('acc_name', filters.accountName);
        console.log(`📄 Filtering by account: ${filters.accountName}`);
      }
      
      if (filters.subAccountName) {
        query = query.eq('sub_acc_name', filters.subAccountName);
        console.log(`👤 Filtering by sub-account: ${filters.subAccountName}`);
      }

      // Order by date for consistent results
      query = query.order('c_date', { ascending: false });

      console.log('🔍 Executing database query...');
      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching filtered entries:', error);
        return [];
      }

      console.log(`📊 Filtered entries loaded: ${data?.length || 0} (Total available: ${count || 0})`);
      console.log('📊 Sample of returned entries:', data?.slice(0, 2).map(e => ({ 
        id: e.id, 
        company: e.company_name, 
        date: e.c_date 
      })));
      
      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllFilteredCashBookEntries:', error);
      return [];
    }
  }

  // Search entries with pagination
  async searchCashBookEntries(
    searchTerm: string = '',
    dateFilter: string = '',
    limit: number = 1000,
    offset: number = 0
  ): Promise<{ data: CashBookEntry[], total: number }> {
    try {
      console.log(`🔍 Searching entries with: "${searchTerm}", date: "${dateFilter}" (limit: ${limit}, offset: ${offset})`);
      
      let query = supabase
        .from('cash_book')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`acc_name.ilike.%${searchTerm}%,sub_acc_name.ilike.%${searchTerm}%,particulars.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
      }

      // Apply date filter
      if (dateFilter) {
        if (dateFilter.length === 4 && /^\d{4}$/.test(dateFilter)) {
          // Year filter
          query = query.gte('c_date', `${dateFilter}-01-01`).lte('c_date', `${dateFilter}-12-31`);
        } else if (dateFilter.includes('-')) {
          // Specific date filter
          query = query.eq('c_date', dateFilter);
        } else {
          // Partial date filter
          query = query.gte('c_date', `${dateFilter}`);
        }
      }

      // Apply pagination and ordering
      query = query
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error searching entries:', error);
        return { data: [], total: 0 };
      }

      console.log(`✅ Search completed: ${data?.length || 0} records found (total: ${count || 0})`);
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error in searchCashBookEntries:', error);
      return { data: [], total: 0 };
    }
  }

  // Get entries by date range with pagination
  async getCashBookEntriesByDateRange(
    startDate: string,
    endDate: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<{ data: CashBookEntry[], total: number }> {
    try {
      console.log(`📅 Fetching entries from ${startDate} to ${endDate} (limit: ${limit}, offset: ${offset})`);
      
      const { data, error, count } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact' })
        .gte('c_date', startDate)
        .lte('c_date', endDate)
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching entries by date range:', error);
        return { data: [], total: 0 };
      }

      console.log(`✅ Date range query completed: ${data?.length || 0} records found (total: ${count || 0})`);
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error in getCashBookEntriesByDateRange:', error);
      return { data: [], total: 0 };
    }
  }

  async addCashBookEntry(
    entry: Omit<
      CashBookEntry,
      | 'id'
      | 'sno'
      | 'entry_time'
      | 'approved'
      | 'edited'
      | 'e_count'
      | 'lock_record'
      | 'created_at'
      | 'updated_at'
    >,
    allowBothZero: boolean = false
  ): Promise<CashBookEntry> {
    // Validate financial entry with option to allow both zero amounts
    const validation = FinancialCalculator.validateEntry(
      entry.credit,
      entry.debit,
      allowBothZero
    );
    if (!validation.isValid) {
      throw new Error(`Invalid entry: ${validation.errors.join(', ')}`);
    }

    // Get next serial number
    const { data: lastEntry } = await supabase
      .from('cash_book')
      .select('sno')
      .order('sno', { ascending: false })
      .limit(1);

    const nextSno =
      lastEntry && lastEntry.length > 0 ? lastEntry[0].sno + 1 : 1;

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
        approved: false, // Set to pending by default (boolean)
        edited: false,
        e_count: 0,
        lock_record: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create cash book entry: ${error.message}`);
    }

    return data;
  }

  // Backwards-compatible wrapper used by hooks
  async createCashBookEntry(entry: Omit<
    CashBookEntry,
    | 'id'
    | 'sno'
    | 'entry_time'
    | 'approved'
    | 'edited'
    | 'e_count'
    | 'lock_record'
    | 'created_at'
    | 'updated_at'
  >): Promise<CashBookEntry> {
    return this.addCashBookEntry(entry);
  }

  // Fetch single cash book entry by id (used by hooks)
  async getCashBookEntry(id: string): Promise<CashBookEntry | null> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching cash book entry by id:', error);
      return null;
    }
    return data as CashBookEntry;
  }

  // Fetch entries by exact date (YYYY-MM-DD) (used by hooks)
  async getCashBookEntriesByDate(date: string): Promise<CashBookEntry[]> {
    const { data, error } = await supabase
      .from('cash_book')
      .select('*')
      .eq('c_date', date)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries by date:', error);
      return [];
    }
    return (data || []) as CashBookEntry[];
  }

  // Bulk insert/update operations for dual entry create (used by hooks)
  async bulkUpdateCashBookEntries(operations: Array<Partial<CashBookEntry>>): Promise<any> {
    try {
      if (!operations || operations.length === 0) return [];

      // Filter out undefined fields to respect DB defaults
      const sanitized = operations.map((op) =>
        Object.fromEntries(Object.entries(op).filter(([_, v]) => v !== undefined))
      );

      const { data, error } = await supabase
        .from('cash_book')
        .insert(sanitized)
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in bulkUpdateCashBookEntries:', error);
      throw error;
    }
  }

  async updateCashBookEntry(
    id: string,
    updates: Partial<CashBookEntry>,
    editedBy?: string
  ): Promise<CashBookEntry | null> {
    // Only pick fields that exist in the table
    const allowedFields = [
      'acc_name',
      'sub_acc_name',
      'particulars',
      'credit',
      'debit',
      'company_name',
      'address',
      'staff',
      'users',
      'entry_time',
      'sale_qty',
      'purchase_qty',
      'approved',
      'cb',
      'c_date',
      'e_count',
      'edited',
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
      console.error(
        'Error fetching old cash book entry for audit log:',
        fetchError
      );
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
        console.error(
          'Error inserting audit log into edit_cash_book:',
          auditError
        );
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
        console.error(
          'Error inserting lock audit log into edit_cash_book:',
          auditError
        );
      }
    }

    return data;
  }

  // Unlock a cash book entry
  async unlockEntry(
    id: string,
    unlockedBy: string
  ): Promise<CashBookEntry | null> {
    // Fetch the old entry for audit logging
    const { data: oldEntry, error: fetchError } = await supabase
      .from('cash_book')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) {
      console.error(
        'Error fetching old cash book entry for unlock:',
        fetchError
      );
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
        console.error(
          'Error inserting unlock audit log into edit_cash_book:',
          auditError
        );
      }
    }

    return data;
  }

  async deleteCashBookEntry(id: string, deletedBy: string): Promise<boolean> {
    console.log(
      'deleteCashBookEntry called with id:',
      id,
      'deletedBy:',
      deletedBy
    );

    try {
      // Fetch the old entry for backup
      const { data: oldEntry, error: fetchError } = await supabase
        .from('cash_book')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error(
          'Error fetching old cash book entry for deletion:',
          fetchError
        );
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
            console.error(
              'Error inserting into deleted_cash_book:',
              insertError
            );
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
      const { error } = await supabase.from('cash_book').delete().eq('id', id);

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

  async createUser(
    user: Omit<any, 'id' | 'created_at' | 'updated_at'>
  ): Promise<User> {
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
        updated_at: new Date().toISOString(),
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
    const { error } = await supabase.from('users').delete().eq('id', id);

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

  async addBankGuarantee(
    bg: Omit<BankGuarantee, 'id' | 'sno' | 'created_at' | 'updated_at'>
  ): Promise<BankGuarantee> {
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

  async updateBankGuarantee(
    id: string,
    updates: Partial<BankGuarantee>
  ): Promise<BankGuarantee | null> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
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

  async addVehicle(
    vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Vehicle> {
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

  async updateVehicle(
    id: string,
    updates: Partial<Vehicle>
  ): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
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
    const { error } = await supabase.from('vehicles').delete().eq('id', id);

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

  async addDriver(
    driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Driver> {
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

  async updateDriver(
    id: string,
    updates: Partial<Driver>
  ): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
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
    const { error } = await supabase.from('drivers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting driver:', error);
      return false;
    }

    return true;
  }



  // Dashboard stats - All time totals (fetches ALL records, not just 1000)
  async getDashboardStats(date?: string) {
    try {
      console.log('🔄 Fetching dashboard stats for ALL 67k+ records...');
      
      let totalCredit = 0;
      let totalDebit = 0;
      let totalTransactions = 0;

      // Method 1: Try RPC function first (most efficient for large datasets)
      try {
        console.log('📊 Trying RPC function for totals...');
        const result = await supabase.rpc('get_dashboard_totals');
        if (result.data && !result.error && result.data.length > 0) {
          const t = result.data[0];
          totalCredit = Number(t.total_credit) || 0;
          totalDebit = Number(t.total_debit) || 0;
          totalTransactions = Number(t.total_transactions) || 0;
          console.log(`✅ RPC result: ${totalTransactions.toLocaleString()} transactions, credit: ₹${totalCredit.toLocaleString()}, debit: ₹${totalDebit.toLocaleString()}`);
        } else {
          throw new Error('RPC function failed or returned no data');
        }
      } catch (rpcError) {
        console.error('RPC function failed, trying SQL aggregation:', rpcError);
        
        // Method 2: Try SQL aggregation with proper handling for large datasets
        try {
          console.log('📊 Trying SQL aggregation for totals...');
          
          // Get total count first
          const { count: totalCount, error: countError } = await supabase
            .from('cash_book')
            .select('*', { count: 'exact', head: true });

          if (countError) {
            console.error('Error getting total count:', countError);
            throw countError;
          }

          totalTransactions = totalCount || 0;
          console.log(`📊 Total records in database: ${totalTransactions}`);

          // Use SQL aggregation with proper Supabase syntax
          const { data: sumData, error: sumError } = await supabase
            .from('cash_book')
            .select('credit, debit')
            .limit(100000); // Get all records for aggregation

          if (sumError) {
            console.error('Error getting sum data:', sumError);
            throw sumError;
          }

          // Calculate totals from the fetched data
          if (sumData && sumData.length > 0) {
            totalCredit = sumData.reduce((sum, entry) => sum + (entry.credit || 0), 0);
            totalDebit = sumData.reduce((sum, entry) => sum + (entry.debit || 0), 0);
          }
          
          console.log(`✅ SQL aggregation result: credit: ₹${totalCredit.toLocaleString()}, debit: ₹${totalDebit.toLocaleString()}`);
          
        } catch (sqlError) {
          console.error('SQL aggregation failed, trying pagination method:', sqlError);
          
          // Method 3: Fallback to pagination (slower but works)
          console.log('📊 Using pagination method to fetch all records...');
          const allEntries = await this.getAllCashBookEntries();
          totalTransactions = allEntries.length;
          
          if (allEntries.length > 0) {
            totalCredit = allEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
            totalDebit = allEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
          }
          
          console.log(`✅ Pagination result: ${totalTransactions} records, credit: ₹${totalCredit.toLocaleString()}, debit: ₹${totalDebit.toLocaleString()}`);
        }
      }

      const balance = totalCredit - totalDebit;

      // Get today's entries count
      const today = date || new Date().toISOString().split('T')[0];
      let todayEntries = 0;
      
      try {
        const { count: todayCount } = await supabase
          .from('cash_book')
          .select('*', { count: 'exact', head: true })
          .eq('c_date', today);
        todayEntries = todayCount || 0;
      } catch (todayError) {
        console.error('Error getting today entries count:', todayError);
        todayEntries = 0;
      }

      console.log(`🎉 Dashboard stats calculated: ${totalTransactions.toLocaleString()} total transactions, ₹${totalCredit.toLocaleString()} credit, ₹${totalDebit.toLocaleString()} debit, balance: ₹${balance.toLocaleString()}`);

      return {
        totalCredit,
        totalDebit,
        balance,
        totalTransactions,
        todayEntries: todayEntries,
        // Set online/offline values to 0 since these columns don't exist in the current schema
        onlineCredit: 0,
        offlineCredit: 0,
        onlineDebit: 0,
        offlineDebit: 0,
        totalOnline: 0,
        totalOffline: 0,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return this.getDashboardStatsFallback();
    }
  }

  // Fallback method for dashboard stats
  private getDashboardStatsFallback() {
    console.warn('⚠️ Using fallback dashboard stats - check database connection and table structure');
    return {
      totalCredit: 0,
      totalDebit: 0,
      balance: 0,
      totalTransactions: 0,
      todayEntries: 0,
      onlineCredit: 0,
      offlineCredit: 0,
      onlineDebit: 0,
      offlineDebit: 0,
      totalOnline: 0,
      totalOffline: 0,
    };
  }

  // Get company-wise closing balances (optimized version)
  async getCompanyClosingBalances(): Promise<Array<{companyName: string, closingBalance: number, totalCredit: number, totalDebit: number}>> {
    try {
      console.log('🔄 Fetching company-wise closing balances (server-side)...');
      const { data, error } = await supabase
        .from('cash_book')
        .select('company_name, credit, debit')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '');
      if (error) {
        console.error('Error fetching company data:', error);
        return [];
      }
      if (!data || data.length === 0) return [];

      const totals: Record<string, { totalCredit: number; totalDebit: number }> = {};
      for (const row of data) {
        const name = (row as any).company_name?.trim();
        if (!name) continue;
        if (!totals[name]) totals[name] = { totalCredit: 0, totalDebit: 0 };
        totals[name].totalCredit += (row as any).credit || 0;
        totals[name].totalDebit += (row as any).debit || 0;
      }
      const companyBalances = Object.entries(totals)
        .map(([companyName, t]) => ({
          companyName,
          totalCredit: t.totalCredit,
          totalDebit: t.totalDebit,
          closingBalance: t.totalCredit - t.totalDebit,
        }))
        .sort((a, b) => a.companyName.localeCompare(b.companyName));
      return companyBalances;
    } catch (error) {
      console.error('Error fetching company closing balances:', error);
      return [];
    }
  }

  // Dashboard stats for specific date (if needed for date filtering)
  async getDashboardStatsForDate(date: string) {
    const { data, error } = await supabase
      .from('cash_book')
      .select('credit, debit, c_date')
      .eq('c_date', date);

    if (error) {
      console.error('Error fetching dashboard stats for date:', error);
      return {
        totalCredit: 0,
        totalDebit: 0,
        balance: 0,
        totalTransactions: 0,
        onlineCredit: 0,
        offlineCredit: 0,
        onlineDebit: 0,
        offlineDebit: 0,
        totalOnline: 0,
        totalOffline: 0,
      };
    }

    const entries = data || [];
    
    const totalCredit = entries.reduce(
      (sum, e) => sum + (e.credit || 0),
      0
    );
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const balance = totalCredit - totalDebit;
    const totalTransactions = entries.length;

    // Set online/offline values to 0 since these columns don't exist in the current schema
    const onlineCredit = 0;
    const offlineCredit = 0;
    const onlineDebit = 0;
    const offlineDebit = 0;
    const totalOnline = 0;
    const totalOffline = 0;

    return {
      totalCredit,
      totalDebit,
      balance,
      totalTransactions,
      onlineCredit,
      offlineCredit,
      onlineDebit,
      offlineDebit,
      totalOnline,
      totalOffline,
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
          updated_at: new Date().toISOString(),
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
      const [
        companies,
        accounts,
        subAccounts,
        entries,
        users,
        bankGuarantees,
        vehicles,
        drivers,
      ] = await Promise.all([
        this.getCompanies(),
        this.getAccounts(),
        this.getSubAccounts(),
        this.getCashBookEntries(),
        this.getUsers(),
        this.getBankGuarantees(),
        this.getVehicles(),
        this.getDrivers(),
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
        version: '1.0',
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
  async getEntriesByApprovalStatus(
    approved: boolean
  ): Promise<CashBookEntry[]> {
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
    try {
      console.log('[supabaseDatabase] Fetching deleted cash book entries...');
      const { data, error } = await supabase
        .from('deleted_cash_book')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error('Error fetching deleted cash book entries:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }

      console.log('[supabaseDatabase] Successfully fetched deleted entries:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('Exception in getDeletedCashBook:', err);
      return [];
    }
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

    const uniqueParticulars = [
      ...new Set(data?.map(item => item.particulars).filter(Boolean)),
    ];
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

    const uniqueQuantities = [
      ...new Set(data?.map(item => item.sale_qty).filter(Boolean)),
    ];
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

    const uniqueQuantities = [
      ...new Set(data?.map(item => item.purchase_qty).filter(Boolean)),
    ];
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

    const uniqueAmounts = [
      ...new Set(data?.map(item => item.credit).filter(Boolean)),
    ];
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

    const uniqueAmounts = [
      ...new Set(data?.map(item => item.debit).filter(Boolean)),
    ];
    return uniqueAmounts.sort((a, b) => a - b);
  }

  // New functions for dependent dropdowns
  async getDistinctAccountNames(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('acc_name')
        .not('acc_name', 'is', null)
        .order('acc_name');

      if (error) {
        console.error('Error fetching distinct account names:', error);
        return [];
      }

      const uniqueAccounts = [...new Set(data?.map(item => item.acc_name))];
      return uniqueAccounts.sort();
    } catch (error) {
      console.error('Error in getDistinctAccountNames:', error);
      return [];
    }
  }

  // Company-based filtering functions
  async getDistinctAccountNamesByCompany(companyName: string): Promise<string[]> {
    try {
      console.log(`🔍 [DEBUG] Fetching account names for company: "${companyName}"`);
      
      const { data, error } = await supabase
        .from('cash_book')
        .select('acc_name')
        .eq('company_name', companyName)
        .not('acc_name', 'is', null)
        .order('acc_name');

      if (error) {
        console.error('Error fetching distinct account names by company:', error);
        return [];
      }

      console.log(`📊 [DEBUG] Raw data for company "${companyName}":`, data?.length || 0, 'records');
      console.log(`📊 [DEBUG] Sample data:`, data?.slice(0, 5));

      const uniqueAccounts = [...new Set(data?.map(item => item.acc_name))];
      console.log(`📊 [DEBUG] Unique accounts for company "${companyName}":`, uniqueAccounts.length, 'accounts');
      console.log(`📊 [DEBUG] Account names:`, uniqueAccounts);
      
      return uniqueAccounts.sort();
    } catch (error) {
      console.error('Error in getDistinctAccountNamesByCompany:', error);
      return [];
    }
  }

  async getSubAccountsByAccountName(accountName: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .eq('acc_name', accountName)
        .not('sub_acc_name', 'is', null)
        .order('sub_acc_name');

      if (error) {
        console.error('Error fetching sub accounts by account name:', error);
        return [];
      }

      const uniqueSubAccounts = [...new Set(data?.map(item => item.sub_acc_name))];
      return uniqueSubAccounts.sort();
    } catch (error) {
      console.error('Error in getSubAccountsByAccountName:', error);
      return [];
    }
  }

  async getSubAccountsByAccountAndCompany(accountName: string, companyName: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .eq('acc_name', accountName)
        .eq('company_name', companyName)
        .not('sub_acc_name', 'is', null)
        .order('sub_acc_name');

      if (error) {
        console.error('Error fetching sub accounts by account and company:', error);
        return [];
      }

      const uniqueSubAccounts = [...new Set(data?.map(item => item.sub_acc_name))];
      return uniqueSubAccounts.sort();
    } catch (error) {
      console.error('Error in getSubAccountsByAccountAndCompany:', error);
      return [];
    }
  }

  async getParticularsBySubAccount(accountName: string, subAccountName: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('particulars')
        .eq('acc_name', accountName)
        .eq('sub_acc_name', subAccountName)
        .not('particulars', 'is', null)
        .order('particulars');

      if (error) {
        console.error('Error fetching particulars by sub account:', error);
        return [];
      }

      const uniqueParticulars = [...new Set(data?.map(item => item.particulars))];
      return uniqueParticulars.sort();
    } catch (error) {
      console.error('Error in getParticularsBySubAccount:', error);
      return [];
    }
  }

  // Get all distinct sub-account names from cash_book (all 67k records)
  async getDistinctSubAccountNames(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .not('sub_acc_name', 'is', null)
        .not('sub_acc_name', 'eq', '')
        .order('sub_acc_name');

      if (error) {
        console.error('Error fetching distinct sub-account names:', error);
        return [];
      }

      const uniqueSubAccounts = [...new Set(data?.map(item => item.sub_acc_name))];
      return uniqueSubAccounts.sort();
    } catch (error) {
      console.error('Error in getDistinctSubAccountNames:', error);
      return [];
    }
  }

  // Get distinct sub-account names by company from cash_book
  async getDistinctSubAccountNamesByCompany(companyName: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .eq('company_name', companyName)
        .not('sub_acc_name', 'is', null)
        .not('sub_acc_name', 'eq', '')
        .order('sub_acc_name');

      if (error) {
        console.error('Error fetching distinct sub-account names by company:', error);
        return [];
      }

      const uniqueSubAccounts = [...new Set(data?.map(item => item.sub_acc_name))];
      return uniqueSubAccounts.sort();
    } catch (error) {
      console.error('Error in getDistinctSubAccountNamesByCompany:', error);
      return [];
    }
  }

  // Debug function to check company names and account names in database
  async debugCompanyAccountData(): Promise<void> {
    try {
      console.log('🔍 [DEBUG] Starting company and account data analysis...');
      
      // Get all unique company names
      const { data: companyData, error: companyError } = await supabase
        .from('cash_book')
        .select('company_name')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '');
      
      if (companyError) {
        console.error('Error fetching company names:', companyError);
        return;
      }
      
      const uniqueCompanies = [...new Set(companyData?.map(item => item.company_name))].sort();
      console.log('📊 [DEBUG] All unique company names in database:', uniqueCompanies);
      
      // Check for BVR and BVT specifically
      const bvrData = companyData?.filter(item => 
        item.company_name?.toLowerCase().includes('bvr') || 
        item.company_name?.toLowerCase().includes('bvt')
      );
      console.log('📊 [DEBUG] BVR/BVT related company names:', bvrData?.map(item => item.company_name));
      
      // Get account names for BVR and BVT companies
      for (const company of uniqueCompanies) {
        if (company?.toLowerCase().includes('bvr') || company?.toLowerCase().includes('bvt')) {
          console.log(`🔍 [DEBUG] Checking accounts for company: "${company}"`);
          const accounts = await this.getDistinctAccountNamesByCompany(company);
          console.log(`📊 [DEBUG] Found ${accounts.length} accounts for "${company}":`, accounts);
        }
      }
      
    } catch (error) {
      console.error('Error in debugCompanyAccountData:', error);
    }
  }
}

// Export singleton instance
export const supabaseDB = new SupabaseDatabase();
