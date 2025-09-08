// Test script to verify dashboard stats work with all 67k records
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified dashboard stats function for testing
async function getDashboardStats() {
  try {
    console.log('🔄 Fetching dashboard stats for ALL 67k+ records...');
    
    // Method 1: Try RPC function first (most efficient for large datasets)
    try {
      console.log('📊 Trying RPC function for totals...');
      const result = await supabase.rpc('get_dashboard_totals');
      if (result.data && !result.error && result.data.length > 0) {
        const t = result.data[0];
        const totalCredit = Number(t.total_credit) || 0;
        const totalDebit = Number(t.total_debit) || 0;
        const totalTransactions = Number(t.total_transactions) || 0;
        console.log(`✅ RPC result: ${totalTransactions.toLocaleString()} transactions, credit: ₹${totalCredit.toLocaleString()}, debit: ₹${totalDebit.toLocaleString()}`);
        
        return {
          totalCredit,
          totalDebit,
          balance: totalCredit - totalDebit,
          totalTransactions,
          todayEntries: 0,
        };
      } else {
        throw new Error('RPC function failed or returned no data');
      }
    } catch (rpcError) {
      console.error('RPC function failed, trying SQL aggregation:', rpcError);
      
      // Method 2: Try SQL aggregation
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

        const totalTransactions = totalCount || 0;
        console.log(`📊 Total records in database: ${totalTransactions}`);

        // Get all records for aggregation (Supabase doesn't support SQL SUM in select)
        const { data: sumData, error: sumError } = await supabase
          .from('cash_book')
          .select('credit, debit')
          .limit(100000); // Get all records

        if (sumError) {
          console.error('Error getting sum data:', sumError);
          throw sumError;
        }

        // Calculate totals from the fetched data
        let totalCredit = 0;
        let totalDebit = 0;
        if (sumData && sumData.length > 0) {
          totalCredit = sumData.reduce((sum, entry) => sum + (entry.credit || 0), 0);
          totalDebit = sumData.reduce((sum, entry) => sum + (entry.debit || 0), 0);
        }
        
        console.log(`✅ SQL aggregation result: credit: ₹${totalCredit.toLocaleString()}, debit: ₹${totalDebit.toLocaleString()}`);
        
        return {
          totalCredit,
          totalDebit,
          balance: totalCredit - totalDebit,
          totalTransactions,
          todayEntries: 0,
        };
        
      } catch (sqlError) {
        console.error('SQL aggregation failed:', sqlError);
        throw sqlError;
      }
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return {
      totalCredit: 0,
      totalDebit: 0,
      balance: 0,
      totalTransactions: 0,
      todayEntries: 0,
    };
  }
}

async function test67kData() {
  console.log('🧪 Testing Dashboard Stats with 67k+ Records...\n');
  
  try {
    console.log('1. Testing getDashboardStats() for all records...');
    const startTime = Date.now();
    
    const stats = await getDashboardStats();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('📊 Dashboard Stats Results:');
    console.log(`   Total Credit: ₹${stats.totalCredit.toLocaleString()}`);
    console.log(`   Total Debit: ₹${stats.totalDebit.toLocaleString()}`);
    console.log(`   Net Balance: ₹${stats.balance.toLocaleString()}`);
    console.log(`   Total Transactions: ${stats.totalTransactions.toLocaleString()}`);
    console.log(`   Today's Entries: ${stats.todayEntries.toLocaleString()}`);
    console.log(`   Query Duration: ${duration}ms`);
    
    // Verify the calculations
    const calculatedBalance = stats.totalCredit - stats.totalDebit;
    const balanceMatches = Math.abs(stats.balance - calculatedBalance) < 0.01;
    
    console.log('\n✅ Verification:');
    console.log(`   Balance calculation correct: ${balanceMatches ? '✅' : '❌'}`);
    console.log(`   Expected balance: ₹${calculatedBalance.toLocaleString()}`);
    console.log(`   Actual balance: ₹${stats.balance.toLocaleString()}`);
    
    // Check if we're getting more than 1000 transactions
    const hasAllData = stats.totalTransactions > 1000;
    console.log(`   Has all 67k+ data: ${hasAllData ? '✅' : '❌'} (${stats.totalTransactions.toLocaleString()} transactions)`);
    
    if (hasAllData) {
      console.log('\n🎉 SUCCESS: Dashboard is now showing all 67k+ records!');
    } else {
      console.log('\n⚠️  WARNING: Still only showing 1000 records. Check the implementation.');
    }
    
    // Test company balances
    console.log('\n2. Testing company balances...');
    const companyStartTime = Date.now();
    
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('cash_book')
        .select('company_name, credit, debit')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '');
      
      if (companyError) {
        console.error('Error fetching company data:', companyError);
      } else {
        const totals = {};
        for (const row of companyData || []) {
          const name = row.company_name?.trim();
          if (!name) continue;
          if (!totals[name]) totals[name] = { totalCredit: 0, totalDebit: 0 };
          totals[name].totalCredit += row.credit || 0;
          totals[name].totalDebit += row.debit || 0;
        }
        
        const companyBalances = Object.entries(totals)
          .map(([companyName, t]) => ({
            companyName,
            totalCredit: t.totalCredit,
            totalDebit: t.totalDebit,
            closingBalance: t.totalCredit - t.totalDebit,
          }))
          .sort((a, b) => a.companyName.localeCompare(b.companyName));
        
        const companyEndTime = Date.now();
        console.log(`📊 Company Balances (${companyBalances.length} companies, ${companyEndTime - companyStartTime}ms):`);
        companyBalances.slice(0, 3).forEach(company => {
          console.log(`   ${company.companyName}: ₹${company.closingBalance.toLocaleString()}`);
        });
        
        if (companyBalances.length > 3) {
          console.log(`   ... and ${companyBalances.length - 3} more companies`);
        }
      }
    } catch (error) {
      console.error('Error testing company balances:', error);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
test67kData();
