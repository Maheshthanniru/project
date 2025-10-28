// Test script to verify dashboard deleted records count is working
// Run with: node test-dashboard-deleted-count.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletedRecordsCount() {
  console.log('🧪 Testing deleted records count for dashboard...\n');

  try {
    // Test 1: Check if deleted_cash_book table exists and is accessible
    console.log('1️⃣ Testing deleted_cash_book table access...');
    const { count: deletedCount, error: deletedError } = await supabase
      .from('deleted_cash_book')
      .select('*', { count: 'exact', head: true });

    if (deletedError) {
      console.error('❌ Error accessing deleted_cash_book:', deletedError);
      console.log('💡 This means the table either doesn\'t exist or has RLS issues');
      return;
    }

    console.log(`✅ Successfully accessed deleted_cash_book table`);
    console.log(`📊 Deleted records count: ${deletedCount || 0}`);

    // Test 2: Check if we can fetch actual records
    console.log('\n2️⃣ Testing record fetching...');
    const { data: deletedRecords, error: fetchError } = await supabase
      .from('deleted_cash_book')
      .select('id, company_name, acc_name, deleted_at, approved')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching deleted records:', fetchError);
    } else {
      console.log(`✅ Successfully fetched ${deletedRecords?.length || 0} deleted records`);
      if (deletedRecords && deletedRecords.length > 0) {
        console.log('📋 Sample records:');
        deletedRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ${record.company_name} - ${record.acc_name} (${record.deleted_at})`);
        });
      }
    }

    // Test 3: Simulate dashboard stats calculation
    console.log('\n3️⃣ Testing dashboard stats calculation...');
    const { data: stats, error: statsError } = await supabase
      .from('deleted_cash_book')
      .select('*', { count: 'exact', head: true });

    if (statsError) {
      console.error('❌ Error calculating dashboard stats:', statsError);
    } else {
      console.log(`✅ Dashboard stats calculation successful`);
      console.log(`📊 Deleted records for dashboard: ${stats?.length || 0}`);
    }

    // Test 4: Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'deleted_cash_book' })
      .catch(() => {
        console.log('ℹ️ RPC function not available, skipping policy check');
        return { data: null, error: null };
      });

    if (policyError) {
      console.log('ℹ️ Could not check RLS policies (this is normal)');
    } else if (policies) {
      console.log(`✅ Found ${policies.length} RLS policies for deleted_cash_book`);
    }

    console.log('\n🎉 Test completed! If you see no errors above, the dashboard should now show deleted records count.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testDeletedRecordsCount();


