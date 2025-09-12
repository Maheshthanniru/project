// Test script to verify dashboard stats are working correctly
import { supabaseDB } from './src/lib/supabaseDatabase.js';

async function testDashboardStats() {
  console.log('🧪 Testing Dashboard Stats Function...\n');
  
  try {
    // Test the dashboard stats function
    console.log('1. Testing getDashboardStats()...');
    const stats = await supabaseDB.getDashboardStats();
    
    console.log('📊 Dashboard Stats Results:');
    console.log(`   Total Credit: ₹${stats.totalCredit.toLocaleString()}`);
    console.log(`   Total Debit: ₹${stats.totalDebit.toLocaleString()}`);
    console.log(`   Net Balance: ₹${stats.balance.toLocaleString()}`);
    console.log(`   Total Transactions: ${stats.totalTransactions.toLocaleString()}`);
    console.log(`   Today's Entries: ${stats.todayEntries.toLocaleString()}`);
    
    // Verify the calculations
    const calculatedBalance = stats.totalCredit - stats.totalDebit;
    const balanceMatches = Math.abs(stats.balance - calculatedBalance) < 0.01;
    
    console.log('\n✅ Verification:');
    console.log(`   Balance calculation correct: ${balanceMatches ? '✅' : '❌'}`);
    console.log(`   Expected balance: ₹${calculatedBalance.toLocaleString()}`);
    console.log(`   Actual balance: ₹${stats.balance.toLocaleString()}`);
    
    // Test with a specific date
    console.log('\n2. Testing getDashboardStatsForDate()...');
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await supabaseDB.getDashboardStatsForDate(today);
    
    console.log(`📊 Today's Stats (${today}):`);
    console.log(`   Total Credit: ₹${todayStats.totalCredit.toLocaleString()}`);
    console.log(`   Total Debit: ₹${todayStats.totalDebit.toLocaleString()}`);
    console.log(`   Net Balance: ₹${todayStats.balance.toLocaleString()}`);
    console.log(`   Total Transactions: ${todayStats.totalTransactions.toLocaleString()}`);
    
    // Test company balances
    console.log('\n3. Testing getCompanyClosingBalances()...');
    const companyBalances = await supabaseDB.getCompanyClosingBalances();
    
    console.log(`📊 Company Balances (${companyBalances.length} companies):`);
    companyBalances.slice(0, 5).forEach(company => {
      console.log(`   ${company.companyName}: ₹${company.closingBalance.toLocaleString()}`);
    });
    
    if (companyBalances.length > 5) {
      console.log(`   ... and ${companyBalances.length - 5} more companies`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDashboardStats();

