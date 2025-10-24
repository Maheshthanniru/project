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
  status?: string;
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
      
      // Try with status filtering first, fallback to basic query if status column doesn't exist
      let { data, error } = await supabase
        .from('cash_book')
        .select('*')
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected')
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(start, end);

      // If status filtering fails, try without status filtering
      if (error && error.message.includes('status')) {
        console.log('⚠️ Status column not found, falling back to basic query');
        const fallbackResult = await supabase
          .from('cash_book')
          .select('*')
          .order('c_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(start, end);
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

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
      // Try with status filtering first, fallback to basic query if status column doesn't exist
      let { count, error } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

      // If status filtering fails, try without status filtering
      if (error && error.message.includes('status')) {
        console.log('⚠️ Status column not found, falling back to basic count query');
        const fallbackResult = await supabase
          .from('cash_book')
          .select('*', { count: 'exact', head: true });
        
        count = fallbackResult.count;
        error = fallbackResult.error;
      }

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
        .select('*', { count: 'exact' })
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

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
        .select('*', { count: 'exact' })
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

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

  // Server-side ledger summary functions for better performance
  async getLedgerSummaryData(filters: {
    fromDate?: string;
    toDate?: string;
    companyName?: string;
    accountName?: string;
    subAccountName?: string;
    staff?: string;
  }): Promise<{
    companySummaries: Array<{
      companyName: string;
      totalCredit: number;
      totalDebit: number;
      balance: number;
    }>;
    accountSummaries: Array<{
      accountName: string;
      credit: number;
      debit: number;
      balance: number;
      transactionCount: number;
    }>;
    subAccountSummaries: Array<{
      subAccount: string;
      mainAccount: string;
      credit: number;
      debit: number;
      balance: number;
      transactionCount: number;
    }>;
    grandTotals: {
      totalCredit: number;
      totalDebit: number;
      balance: number;
      recordCount: number;
    };
  }> {
    try {
      console.log('🔄 Fetching ledger summary data with server-side aggregation...');
      console.log('🔍 Filters:', filters);

      // Fetch all records using pagination to handle large datasets
      const allData: any[] = [];
      const batchSize = 10000; // Process in batches of 10k
      let offset = 0;
      let hasMore = true;

      console.log('🔄 Fetching all records in batches...');

      while (hasMore) {
        let query = supabase
          .from('cash_book')
          .select('company_name, acc_name, sub_acc_name, credit, debit, staff, c_date')
          .or('status.is.null,status.neq.deleted-pending,status.neq.rejected')
          .range(offset, offset + batchSize - 1);

        // Apply date filters
        if (filters.fromDate && filters.toDate) {
          query = query
            .gte('c_date', filters.fromDate)
            .lte('c_date', filters.toDate);
        }

        // Apply other filters
        if (filters.companyName) {
          query = query.eq('company_name', filters.companyName);
        }
        if (filters.accountName) {
          query = query.eq('acc_name', filters.accountName);
        }
        if (filters.subAccountName) {
          query = query.eq('sub_acc_name', filters.subAccountName);
        }
        if (filters.staff) {
          query = query.eq('staff', filters.staff);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error fetching ledger summary data:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allData.push(...data);
          offset += batchSize;
          console.log(`📊 Fetched batch: ${data.length} records (total so far: ${allData.length})`);
        } else {
          hasMore = false;
        }

        // If we got less than batch size, we've reached the end
        if (!data || data.length < batchSize) {
          hasMore = false;
        }
      }

      console.log(`✅ Successfully fetched ${allData.length} entries for summary calculation`);

      // Process data client-side for aggregation
      const companyMap = new Map<string, { totalCredit: number; totalDebit: number; balance: number }>();
      const accountMap = new Map<string, { credit: number; debit: number; balance: number; transactionCount: number }>();
      const subAccountMap = new Map<string, { mainAccount: string; credit: number; debit: number; balance: number; transactionCount: number }>();

      let totalCredit = 0;
      let totalDebit = 0;
      let recordCount = 0;

      allData.forEach(entry => {
        totalCredit += entry.credit;
        totalDebit += entry.debit;
        recordCount++;

        // Company aggregation
        if (!companyMap.has(entry.company_name)) {
          companyMap.set(entry.company_name, { totalCredit: 0, totalDebit: 0, balance: 0 });
        }
        const company = companyMap.get(entry.company_name)!;
        company.totalCredit += entry.credit;
        company.totalDebit += entry.debit;
        company.balance = company.totalCredit - company.totalDebit;

        // Account aggregation
        const accountKey = `${entry.company_name}-${entry.acc_name}`;
        if (!accountMap.has(accountKey)) {
          accountMap.set(accountKey, { credit: 0, debit: 0, balance: 0, transactionCount: 0 });
        }
        const account = accountMap.get(accountKey)!;
        account.credit += entry.credit;
        account.debit += entry.debit;
        account.balance = account.credit - account.debit;
        account.transactionCount++;

        // Sub-account aggregation
        if (entry.sub_acc_name) {
          const subAccountKey = `${entry.company_name}-${entry.acc_name}-${entry.sub_acc_name}`;
          if (!subAccountMap.has(subAccountKey)) {
            subAccountMap.set(subAccountKey, { 
              mainAccount: entry.acc_name, // Store the main account name
              credit: 0, 
              debit: 0, 
              balance: 0, 
              transactionCount: 0 
            });
          }
          const subAccount = subAccountMap.get(subAccountKey)!;
          subAccount.credit += entry.credit;
          subAccount.debit += entry.debit;
          subAccount.balance = subAccount.credit - subAccount.debit;
          subAccount.transactionCount++;
        }
      });

      // Convert maps to arrays and sort
      const companySummaries = Array.from(companyMap.entries())
        .map(([companyName, data]) => ({
          companyName,
          ...data
        }))
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

      const accountSummaries = Array.from(accountMap.entries())
        .map(([accountKey, data]) => ({
          accountName: accountKey.split('-').slice(1).join('-'), // Remove company prefix
          ...data
        }))
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

      const subAccountSummaries = Array.from(subAccountMap.entries())
        .map(([subAccountKey, data]) => ({
          subAccount: subAccountKey.split('-').slice(2).join('-'), // Remove company and account prefix
          mainAccount: data.mainAccount, // Include the main account name
          credit: data.credit,
          debit: data.debit,
          balance: data.balance,
          transactionCount: data.transactionCount
        }))
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

      const grandTotals = {
        totalCredit,
        totalDebit,
        balance: totalCredit - totalDebit,
        recordCount
      };

      console.log(`✅ Generated summary: ${companySummaries.length} companies, ${accountSummaries.length} accounts, ${subAccountSummaries.length} sub-accounts`);

      return {
        companySummaries,
        accountSummaries,
        subAccountSummaries,
        grandTotals
      };
    } catch (error) {
      console.error('❌ Error in getLedgerSummaryData:', error);
      throw error;
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
        .select('*', { count: 'exact' })
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

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
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected')
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

    // Try to insert with status column first, fallback to old method if status column doesn't exist
    let { data, error } = await supabase
      .from('cash_book')
      .insert({
        ...filteredEntry,
        sno: nextSno,
        entry_time: new Date().toISOString(),
        status: 'approved', // Set to approved by default
        approved: true, // Keep for backward compatibility
        edited: false,
        e_count: 0,
        lock_record: false,
      })
      .select()
      .single();

    // If status column doesn't exist, fallback to old method
    if (error && error.message.includes('status')) {
      console.log('⚠️ Status column not found, falling back to old entry creation method');
      const fallbackResult = await supabase
        .from('cash_book')
        .insert({
          ...filteredEntry,
          sno: nextSno,
          entry_time: new Date().toISOString(),
          approved: true,
          edited: false,
          e_count: 0,
          lock_record: false,
        })
        .select()
        .single();
      
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      throw new Error(`Failed to create cash book entry: ${error.message}`);
    }

    return data;
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
      console.log('🔄 Fetching dashboard stats for ALL records (not just 1000)...');
      
      // First get the total count
      const { count: totalCount, error: countError } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error getting total count:', countError);
        return this.getDashboardStatsFallback();
      }

      console.log(`📊 Total records in database: ${totalCount}`);

      if (totalCount === 0) {
        console.log('⚠️ No records found in database');
        return this.getDashboardStatsFallback();
      }

      // Try to use database aggregation for better performance - get sums directly from database
      let aggregatedData = null;
      let aggError = null;
      
      try {
        const result = await supabase.rpc('get_dashboard_totals');
        aggregatedData = result.data;
        aggError = result.error;
      } catch (error) {
        console.log('⚠️ Database function not available, will use fallback method');
        aggError = error;
      }

      let totalCredit = 0;
      let totalDebit = 0;
      let onlineCredit = 0;
      let offlineCredit = 0;
      let onlineDebit = 0;
      let offlineDebit = 0;

      if (aggError || !aggregatedData) {
        console.log('⚠️ Database aggregation not available, using optimized server-side fallback...');
        // Optimized fallback: Get only required fields for faster processing
        // Try with status filtering first, fallback to basic query if status column doesn't exist
        let { data: entriesData, error: entriesError } = await supabase
          .from('cash_book')
          .select('credit, debit, credit_online, credit_offline, debit_online, debit_offline')
          .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

        // If status filtering fails, try without status filtering
        if (entriesError && entriesError.message.includes('status')) {
          console.log('⚠️ Status column not found, falling back to basic dashboard query');
          const fallbackResult = await supabase
            .from('cash_book')
            .select('credit, debit, credit_online, credit_offline, debit_online, debit_offline');
          
          entriesData = fallbackResult.data;
          entriesError = fallbackResult.error;
        }
        
        if (entriesError) {
          console.error('❌ Error fetching entries for stats:', entriesError);
          return this.getDashboardStatsFallback();
        }
        
        const allEntries = entriesData || [];
        console.log(`📊 Processing ${allEntries.length} entries for dashboard stats (optimized method)`);
        
        if (allEntries.length > 0) {
          totalCredit = allEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
          totalDebit = allEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
          onlineCredit = allEntries.reduce((sum, e) => sum + (e.credit_online || 0), 0);
          offlineCredit = allEntries.reduce((sum, e) => sum + (e.credit_offline || 0), 0);
          onlineDebit = allEntries.reduce((sum, e) => sum + (e.debit_online || 0), 0);
          offlineDebit = allEntries.reduce((sum, e) => sum + (e.debit_offline || 0), 0);
        }
      } else {
        console.log('✅ Using database aggregation for dashboard stats');
        const totals = aggregatedData[0];
        totalCredit = totals.total_credit || 0;
        totalDebit = totals.total_debit || 0;
        onlineCredit = totals.total_credit_online || 0;
        offlineCredit = totals.total_credit_offline || 0;
        onlineDebit = totals.total_debit_online || 0;
        offlineDebit = totals.total_debit_offline || 0;
      }

      const balance = totalCredit - totalDebit;
      const totalTransactions = totalCount; // Use exact count from database
      const totalOnline = onlineCredit + onlineDebit;
      const totalOffline = offlineCredit + offlineDebit;

      // Get today's entries count
      const today = date || new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('cash_book')
        .select('*', { count: 'exact', head: true })
        .eq('c_date', today);
      
      const todayEntries = todayCount || 0;

      console.log(`✅ Dashboard stats calculated: ${totalTransactions} total transactions, ₹${totalCredit.toLocaleString()} credit, ₹${totalDebit.toLocaleString()} debit`);

      return {
        totalCredit,
        totalDebit,
        balance,
        totalTransactions,
        todayEntries: todayEntries,
        onlineCredit,
        offlineCredit,
        onlineDebit,
        offlineDebit,
        totalOnline,
        totalOffline,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return this.getDashboardStatsFallback();
    }
  }

  // Fallback method for dashboard stats
  private getDashboardStatsFallback() {
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
      console.log('🔄 Fetching company-wise closing balances...');
      
      // Use a more efficient approach - get only the fields we need
      let entries;
      const { data: initialEntries, error } = await supabase
        .from('cash_book')
        .select('company_name, credit, debit')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '')
        .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

      if (error) {
        console.error('Error fetching company data:', error);
        return [];
      }

      entries = initialEntries;
      console.log(`📊 Processing ${entries?.length || 0} entries for company balances`);
      
      if (!entries || entries.length === 0) {
        console.log('⚠️ No entries found with company names, trying fallback method...');
        
        // Fallback: Try without filters
        const { data: fallbackEntries, error: fallbackError } = await supabase
          .from('cash_book')
          .select('company_name, credit, debit')
          .limit(1000);

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return [];
        }

        console.log(`📊 Fallback found ${fallbackEntries?.length || 0} entries`);
        
        if (!fallbackEntries || fallbackEntries.length === 0) {
          console.log('⚠️ No entries found in database at all');
          return [];
        }

        // Use fallback entries
        entries = fallbackEntries;
      }

      // Group by company and calculate totals
      const companyTotals = new Map<string, {totalCredit: number, totalDebit: number}>();
      
      entries.forEach(entry => {
        if (entry.company_name) {
          const companyName = entry.company_name.trim();
          
          if (!companyTotals.has(companyName)) {
            companyTotals.set(companyName, { totalCredit: 0, totalDebit: 0 });
          }
          
          const totals = companyTotals.get(companyName)!;
          totals.totalCredit += entry.credit || 0;
          totals.totalDebit += entry.debit || 0;
        }
      });
      
      // Convert to array and calculate closing balances
      const companyBalances = Array.from(companyTotals.entries()).map(([companyName, totals]) => ({
        companyName,
        totalCredit: totals.totalCredit,
        totalDebit: totals.totalDebit,
        closingBalance: totals.totalCredit - totals.totalDebit
      }));
      
      // Sort by company name
      companyBalances.sort((a, b) => a.companyName.localeCompare(b.companyName));
      
      console.log(`✅ Company balances calculated for ${companyBalances.length} companies`);
      console.log('📊 Sample companies:', companyBalances.slice(0, 3));
      
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
      .select(
        'credit, debit, c_date, credit_online, credit_offline, debit_online, debit_offline'
      )
      .eq('c_date', date)
      .or('status.is.null,status.neq.deleted-pending,status.neq.rejected');

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

    const onlineCredit = entries.reduce(
      (sum, e) => sum + (e.credit_online || 0),
      0
    );
    const offlineCredit = entries.reduce(
      (sum, e) => sum + (e.credit_offline || 0),
      0
    );
    const onlineDebit = entries.reduce(
      (sum, e) => sum + (e.debit_online || 0),
      0
    );
    const offlineDebit = entries.reduce(
      (sum, e) => sum + (e.debit_offline || 0),
      0
    );

    const totalOnline = onlineCredit + onlineDebit;
    const totalOffline = offlineCredit + offlineDebit;

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

  // Get approval records with server-side filtering for better performance
  async getApprovalRecords(filters: {
    date?: string;
    company?: string;
    staff?: string;
    includeDeleted?: boolean;
  }): Promise<{
    entries: CashBookEntry[];
    deletedEntries: CashBookEntry[];
    rejectedEntries: CashBookEntry[];
    summary: {
      totalRecords: number;
      approvedRecords: number;
      pendingRecords: number;
      deletedRecords: number;
      rejectedRecords: number;
    };
  }> {
    try {
      console.log('🔄 Fetching approval records with server-side filtering...');
      console.log('🔍 Filters:', filters);

      // Debug: Check what records exist in the database
      const { data: debugAllData, error: debugAllError } = await supabase
        .from('cash_book')
        .select('id, company_name, particulars, approved, edited, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('🔍 Debug - All records in database:', debugAllData?.length || 0);
      if (debugAllData && debugAllData.length > 0) {
        console.log('🔍 Debug - Sample records:', debugAllData);
      }

      // Debug: Check records with status = deleted-pending or rejected
      const { data: debugUnapprovedData, error: debugUnapprovedError } = await supabase
        .from('cash_book')
        .select('id, company_name, particulars, status, created_at')
        .or('status.eq.deleted-pending,status.eq.rejected')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('🔍 Debug - Records needing approval in database:', debugUnapprovedData?.length || 0);
      if (debugUnapprovedData && debugUnapprovedData.length > 0) {
        console.log('🔍 Debug - Sample records needing approval:', debugUnapprovedData);
      } else {
        console.log('🔍 Debug - No records needing approval found in database');
      }

      // Main query for records that need approval (deleted-pending or rejected)
      // Try with status filtering first, fallback to old method if status column doesn't exist
      let query = supabase
        .from('cash_book')
        .select('*', { count: 'exact' })
        .or('status.eq.deleted-pending,status.eq.rejected');

      // If status column doesn't exist, fallback to old method
      let { data, error, count } = await query;
      
      if (error && error.message.includes('status')) {
        console.log('⚠️ Status column not found, falling back to old approval method');
        query = supabase
          .from('cash_book')
          .select('*', { count: 'exact' })
          .eq('approved', false);
        
        const fallbackResult = await query;
        data = fallbackResult.data;
        error = fallbackResult.error;
        count = fallbackResult.count;
      }

      console.log('🔍 Main query: SELECT * FROM cash_book WHERE approved = false');

      // Apply filters at database level
      if (filters.date) {
        query = query.eq('c_date', filters.date);
      }
      if (filters.company) {
        query = query.eq('company_name', filters.company);
      }
      if (filters.staff) {
        query = query.eq('staff', filters.staff);
      }

      // If no filters are applied, limit to recent records to avoid loading all 67k records
      if (!filters.date && !filters.company && !filters.staff) {
        console.log('⚠️ No filters applied, limiting to recent 1000 records for performance');
        query = query.limit(1000);
      }

      // Order by date and created_at for consistent results
      query = query
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Execute the final query
      const finalResult = await query;
      data = finalResult.data;
      error = finalResult.error;
      count = finalResult.count;

      if (error) {
        console.error('❌ Error fetching approval records:', error);
        throw error;
      }

      // Separate records into deleted-pending and rejected
      const approvalRecords = data || [];
      const deletedEntries = approvalRecords.filter(record => record.status === 'deleted-pending');
      const rejectedEntries = approvalRecords.filter(record => record.status === 'rejected');

      console.log(`📊 Record separation: ${approvalRecords.length} total, ${deletedEntries.length} deleted-pending, ${rejectedEntries.length} rejected`);

      console.log(`✅ Successfully fetched ${data?.length || 0} entries for approval (total available: ${count || 0})`);
      if (filters.includeDeleted) {
        console.log(`✅ Successfully fetched ${deletedEntries.length} deleted entries`);
      }

      // Get total counts including approved records for accurate summary
      let totalApprovedCount = 0;
      if (filters.date || filters.company || filters.staff) {
        // If filters are applied, get the actual count of approved records
        let approvedQuery = supabase
          .from('cash_book')
          .select('id', { count: 'exact' })
          .eq('approved', true);
        
        if (filters.date) {
          approvedQuery = approvedQuery.eq('c_date', filters.date);
        }
        if (filters.company) {
          approvedQuery = approvedQuery.eq('company_name', filters.company);
        }
        if (filters.staff) {
          approvedQuery = approvedQuery.eq('staff', filters.staff);
        }
        
        const { count: approvedCount } = await approvedQuery;
        totalApprovedCount = approvedCount || 0;
      }

      // Calculate summary
      const totalRecords = approvalRecords.length;
      const approvedRecords = totalApprovedCount;
      const pendingRecords = deletedEntries.length;
      const deletedRecords = deletedEntries.length;
      const rejectedRecords = rejectedEntries.length;

      console.log(`📊 Summary: ${totalRecords} total, ${pendingRecords} deleted-pending, ${rejectedRecords} rejected`);

      return {
        entries: deletedEntries, // Return deleted-pending entries in main list
        deletedEntries, // Return deleted entries separately
        rejectedEntries, // Return rejected entries separately
        summary: {
          totalRecords: approvalRecords.length,
          approvedRecords: totalApprovedCount,
          pendingRecords: deletedEntries.length,
          deletedRecords: deletedEntries.length,
          rejectedRecords: rejectedEntries.length
        }
      };
    } catch (error) {
      console.error('❌ Error in getApprovalRecords:', error);
      throw error;
    }
  }

  // Update some existing records to be unapproved for testing
  async updateRecordsForTesting(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating some records to be unapproved for testing...');
      
      // First check if there are any approved records
      const { data: approvedRecords, error: approvedError } = await supabase
        .from('cash_book')
        .select('id')
        .eq('status', 'approved')
        .limit(5);

      if (approvedError) {
        console.error('❌ Error checking approved records:', approvedError);
        return { success: false, error: 'Error checking records' };
      }

      if (!approvedRecords || approvedRecords.length === 0) {
        console.log('ℹ️ No approved records found. All records are already unapproved.');
        return { success: true, error: 'All records are already unapproved' };
      }

      const recordIds = approvedRecords.map(record => record.id);
      
      const { error: updateError } = await supabase
        .from('cash_book')
        .update({ status: 'deleted-pending' })
        .in('id', recordIds);

      if (updateError) {
        console.error('❌ Error updating records:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log(`✅ Successfully updated ${recordIds.length} records to unapproved`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updateRecordsForTesting:', error);
      return { success: false, error: 'Failed to update records' };
    }
  }

  // Create test records for approval (for debugging)
  async createTestApprovalRecords(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Creating test records for approval...');
      
      // First, get existing company names and staff to avoid foreign key violations
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('company_name')
        .limit(3);
      
      if (companiesError || !companies || companies.length === 0) {
        console.error('❌ Error fetching companies:', companiesError);
        return { success: false, error: 'No companies found in database' };
      }

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('username')
        .eq('is_active', true)
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.error('❌ Error fetching users:', usersError);
        return { success: false, error: 'No active users found in database' };
      }

      const companyName = companies[0].company_name;
      const staffName = users[0].username;

      console.log(`📋 Using company: ${companyName}, staff: ${staffName}`);

      const testRecords = [
        {
          sno: 999001,
          acc_name: 'Test Account 1',
          sub_acc_name: 'Test Sub Account 1',
          particulars: 'Test entry for approval 1',
          c_date: new Date().toISOString().split('T')[0],
          credit: 1000,
          debit: 0,
          company_name: companyName,
          staff: staffName,
          status: 'deleted-pending',
          approved: false,
          edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          sno: 999002,
          acc_name: 'Test Account 2',
          sub_acc_name: 'Test Sub Account 2',
          particulars: 'Test entry for approval 2',
          c_date: new Date().toISOString().split('T')[0],
          credit: 0,
          debit: 500,
          company_name: companyName,
          staff: staffName,
          status: 'deleted-pending',
          approved: false,
          edited: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          sno: 999003,
          acc_name: 'Test Account 3',
          sub_acc_name: 'Test Sub Account 3',
          particulars: 'REJECTED: Test entry marked for deletion',
          c_date: new Date().toISOString().split('T')[0],
          credit: 2000,
          debit: 0,
          company_name: companyName,
          staff: staffName,
          status: 'rejected',
          approved: false,
          edited: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const { error } = await supabase
        .from('cash_book')
        .insert(testRecords);

      if (error) {
        console.error('❌ Error creating test records:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully created test records for approval');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in createTestApprovalRecords:', error);
      return { success: false, error: 'Failed to create test records' };
    }
  }

  // Get single entry with full details for viewing/editing
  async getEntryById(id: string): Promise<CashBookEntry | null> {
    try {
      console.log(`🔄 Fetching entry details for ID: ${id}`);
      
      const { data, error } = await supabase
        .from('cash_book')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching entry details:', error);
        return null;
      }

      console.log(`✅ Successfully fetched entry details`);
      return data;
    } catch (error) {
      console.error('❌ Error in getEntryById:', error);
      return null;
    }
  }

  // Soft delete entry (mark as deleted-pending)
  async softDeleteEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Soft deleting entry: ${entryId}`);
      
      // Try to use the status column to track deletion, fallback to old method if status column doesn't exist
      let { error } = await supabase
        .from('cash_book')
        .update({ 
          status: 'deleted-pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      // If status column doesn't exist, fallback to old method
      if (error && error.message.includes('status')) {
        console.log('⚠️ Status column not found, falling back to old deletion method');
        const fallbackResult = await supabase
          .from('cash_book')
          .update({ 
            approved: false,
            edited: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId);
        
        error = fallbackResult.error;
      }

      if (error) {
        console.error('❌ Error soft deleting entry:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully soft deleted entry: ${entryId} (status=deleted-pending)`);
      
      // Verify the update worked
      const { data: verifyData, error: verifyError } = await supabase
        .from('cash_book')
        .select('id, status')
        .eq('id', entryId)
        .single();
      
      if (!verifyError && verifyData) {
        console.log(`🔍 Verification: Entry ${entryId} now has status=${verifyData.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error in softDeleteEntry:', error);
      return { success: false, error: 'Failed to soft delete entry' };
    }
  }

  // Permanent delete entry and create deleted record entry
  async permanentDeleteEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Permanently deleting entry: ${entryId}`);
      console.log(`🔍 Entry ID type: ${typeof entryId}, value: ${entryId}`);
      
      // First, get the entry details before deleting
      let { data: entryData, error: fetchError } = await supabase
        .from('cash_book')
        .select('*')
        .eq('id', entryId)
        .single();

      console.log(`🔍 Fetch result:`, { entryData: !!entryData, fetchError });

      if (fetchError || !entryData) {
        console.error('❌ Error fetching entry for deletion:', fetchError);
        console.error('❌ Entry ID that failed:', entryId);
        
        // Try alternative approach - use sno instead of id
        console.log('🔄 Trying alternative approach with sno...');
        const { data: altEntryData, error: altFetchError } = await supabase
          .from('cash_book')
          .select('*')
          .eq('sno', parseInt(entryId))
          .single();
        
        if (altFetchError || !altEntryData) {
          console.error('❌ Alternative approach also failed:', altFetchError);
          return { success: false, error: `Failed to fetch entry details: ${fetchError?.message || 'Entry not found'}` };
        }
        
        console.log('✅ Alternative approach succeeded with sno');
        entryData = altEntryData;
      }

      console.log('📋 Entry details before deletion:', entryData);

      // Create a deleted record entry with the same data but marked as deleted
      const deletedEntry = {
        ...entryData,
        id: undefined, // Let Supabase generate new ID
        sno: entryData.sno, // Keep original sno for reference
        approved: false,
        edited: true,
        particulars: `DELETED: ${entryData.particulars || 'No particulars'}`, // Mark as deleted
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert the deleted record entry
      const { error: insertError } = await supabase
        .from('cash_book')
        .insert(deletedEntry);

      if (insertError) {
        console.error('❌ Error creating deleted record entry:', insertError);
        return { success: false, error: 'Failed to create deleted record entry' };
      }

      console.log('✅ Created deleted record entry');

      // Now permanently delete the original entry
      const { error: deleteError } = await supabase
        .from('cash_book')
        .delete()
        .eq('id', entryId);

      if (deleteError) {
        console.error('❌ Error permanently deleting entry:', deleteError);
        return { success: false, error: 'Failed to permanently delete entry' };
      }

      console.log(`✅ Successfully permanently deleted entry: ${entryId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in permanentDeleteEntry:', error);
      return { success: false, error: 'Failed to permanently delete entry' };
    }
  }

  // Approve entry (set approved = true)
  async approveEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Approving entry: ${entryId}`);
      
      const { error } = await supabase
        .from('cash_book')
        .update({ 
          approved: true,
          edited: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        console.error('❌ Error approving entry:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully approved entry: ${entryId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in approveEntry:', error);
      return { success: false, error: 'Failed to approve entry' };
    }
  }

  // Approve deletion (permanently delete)
  async approveDeletion(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Approving deletion for entry: ${entryId}`);
      
      const { error } = await supabase
        .from('cash_book')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('❌ Error approving deletion:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully approved deletion for entry: ${entryId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in approveDeletion:', error);
      return { success: false, error: 'Failed to approve deletion' };
    }
  }

  // Reject deletion (restore record to normal state)
  async rejectDeletion(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Rejecting deletion for entry: ${entryId}`);
      
      // Set status to rejected (keep in approve records but don't restore)
      const { error } = await supabase
        .from('cash_book')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        console.error('❌ Error rejecting deletion:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully rejected deletion for entry: ${entryId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in rejectDeletion:', error);
      return { success: false, error: 'Failed to reject deletion' };
    }
  }

  // Approve specific entries (set to approved instead of toggle)
  async approveEntries(entryIds: string[]): Promise<{ success: number; failed: number }> {
    try {
      console.log(`🔄 Approving ${entryIds.length} entries...`);

      const { error } = await supabase
        .from('cash_book')
        .update({
          approved: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', entryIds);

      if (error) {
        console.error('❌ Error approving entries:', error);
        return { success: 0, failed: entryIds.length };
      }

      console.log(`✅ Successfully approved ${entryIds.length} entries`);
      return { success: entryIds.length, failed: 0 };
    } catch (error) {
      console.error('❌ Error in approveEntries:', error);
      return { success: 0, failed: entryIds.length };
    }
  }

  // Bulk update cash book entries
  async bulkUpdateCashBookEntries(operations: any[]): Promise<{ success: number; failed: number }> {
    try {
      console.log(`🔄 Processing ${operations.length} bulk operations...`);
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const operation of operations) {
        try {
          if (operation.type === 'create') {
            await this.addCashBookEntry(operation.data);
            successCount++;
          } else if (operation.type === 'update') {
            await this.updateCashBookEntry(operation.id, operation.data);
            successCount++;
          } else if (operation.type === 'delete') {
            await this.deleteCashBookEntry(operation.id, 'bulk_operation');
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error in bulk operation:`, error);
          failedCount++;
        }
      }
      
      console.log(`✅ Bulk operations completed: ${successCount} success, ${failedCount} failed`);
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('❌ Error in bulkUpdateCashBookEntries:', error);
      return { success: 0, failed: operations.length };
    }
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
      
      // First, get accounts from cash_book table (existing transactions)
      const { data: cashBookData, error: cashBookError } = await supabase
        .from('cash_book')
        .select('acc_name')
        .eq('company_name', companyName)
        .not('acc_name', 'is', null)
        .order('acc_name');

      if (cashBookError) {
        console.error('Error fetching account names from cash_book:', cashBookError);
      }

      // Then, get accounts from company_main_accounts table (manually created accounts)
      const { data: mainAccountsData, error: mainAccountsError } = await supabase
        .from('company_main_accounts')
        .select('acc_name')
        .eq('company_name', companyName)
        .not('acc_name', 'is', null)
        .order('acc_name');

      if (mainAccountsError) {
        console.error('Error fetching account names from company_main_accounts:', mainAccountsError);
      }

      // Combine both sources
      const cashBookAccounts = cashBookData?.map(item => item.acc_name) || [];
      const mainAccounts = mainAccountsData?.map(item => item.acc_name) || [];
      
      console.log(`📊 [DEBUG] Cash book accounts for company "${companyName}":`, cashBookAccounts.length, 'accounts');
      console.log(`📊 [DEBUG] Main accounts for company "${companyName}":`, mainAccounts.length, 'accounts');

      // Get unique accounts from both sources
      const allAccounts = [...cashBookAccounts, ...mainAccounts];
      const uniqueAccounts = [...new Set(allAccounts)];
      
      console.log(`📊 [DEBUG] Total unique accounts for company "${companyName}":`, uniqueAccounts.length, 'accounts');
      console.log(`📊 [DEBUG] Account names:`, uniqueAccounts);
      
      return uniqueAccounts.sort();
    } catch (error) {
      console.error('Error in getDistinctAccountNamesByCompany:', error);
      return [];
    }
  }

  async getSubAccountsByAccountName(accountName: string): Promise<string[]> {
    try {
      // First, get sub accounts from cash_book table (existing transactions)
      const { data: cashBookData, error: cashBookError } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .eq('acc_name', accountName)
        .not('sub_acc_name', 'is', null)
        .order('sub_acc_name');

      if (cashBookError) {
        console.error('Error fetching sub accounts from cash_book:', cashBookError);
      }

      // Then, get sub accounts from company_main_sub_acc table (manually created sub accounts)
      const { data: subAccountsData, error: subAccountsError } = await supabase
        .from('company_main_sub_acc')
        .select('sub_acc')
        .eq('acc_name', accountName)
        .not('sub_acc', 'is', null)
        .order('sub_acc');

      if (subAccountsError) {
        console.error('Error fetching sub accounts from company_main_sub_acc:', subAccountsError);
      }

      // Combine both sources
      const cashBookSubAccounts = cashBookData?.map(item => item.sub_acc_name) || [];
      const mainSubAccounts = subAccountsData?.map(item => item.sub_acc) || [];
      
      // Get unique sub accounts from both sources
      const allSubAccounts = [...cashBookSubAccounts, ...mainSubAccounts];
      const uniqueSubAccounts = [...new Set(allSubAccounts)];
      
      return uniqueSubAccounts.sort();
    } catch (error) {
      console.error('Error in getSubAccountsByAccountName:', error);
      return [];
    }
  }

  async getSubAccountsByAccountAndCompany(accountName: string, companyName: string): Promise<string[]> {
    try {
      // First, get sub accounts from cash_book table (existing transactions)
      const { data: cashBookData, error: cashBookError } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .eq('acc_name', accountName)
        .eq('company_name', companyName)
        .not('sub_acc_name', 'is', null)
        .order('sub_acc_name');

      if (cashBookError) {
        console.error('Error fetching sub accounts from cash_book:', cashBookError);
      }

      // Then, get sub accounts from company_main_sub_acc table (manually created sub accounts)
      const { data: subAccountsData, error: subAccountsError } = await supabase
        .from('company_main_sub_acc')
        .select('sub_acc')
        .eq('acc_name', accountName)
        .eq('company_name', companyName)
        .not('sub_acc', 'is', null)
        .order('sub_acc');

      if (subAccountsError) {
        console.error('Error fetching sub accounts from company_main_sub_acc:', subAccountsError);
      }

      // Combine both sources
      const cashBookSubAccounts = cashBookData?.map(item => item.sub_acc_name) || [];
      const mainSubAccounts = subAccountsData?.map(item => item.sub_acc) || [];
      
      // Get unique sub accounts from both sources
      const allSubAccounts = [...cashBookSubAccounts, ...mainSubAccounts];
      const uniqueSubAccounts = [...new Set(allSubAccounts)];
      
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

  // Get distinct sub-account names by company from both cash_book and company_main_sub_acc
  async getDistinctSubAccountNamesByCompany(companyName: string): Promise<string[]> {
    try {
      // First, get sub accounts from cash_book table (existing transactions)
      const { data: cashBookData, error: cashBookError } = await supabase
        .from('cash_book')
        .select('sub_acc_name')
        .eq('company_name', companyName)
        .not('sub_acc_name', 'is', null)
        .not('sub_acc_name', 'eq', '')
        .order('sub_acc_name');

      if (cashBookError) {
        console.error('Error fetching sub accounts from cash_book:', cashBookError);
      }

      // Then, get sub accounts from company_main_sub_acc table (manually created sub accounts)
      const { data: subAccountsData, error: subAccountsError } = await supabase
        .from('company_main_sub_acc')
        .select('sub_acc')
        .eq('company_name', companyName)
        .not('sub_acc', 'is', null)
        .not('sub_acc', 'eq', '')
        .order('sub_acc');

      if (subAccountsError) {
        console.error('Error fetching sub accounts from company_main_sub_acc:', subAccountsError);
      }

      // Combine both sources
      const cashBookSubAccounts = cashBookData?.map(item => item.sub_acc_name) || [];
      const mainSubAccounts = subAccountsData?.map(item => item.sub_acc) || [];
      
      // Get unique sub accounts from both sources
      const allSubAccounts = [...cashBookSubAccounts, ...mainSubAccounts];
      const uniqueSubAccounts = [...new Set(allSubAccounts)];
      
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
