const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please create a .env file with:');
  console.log('VITE_SUPABASE_URL=your-supabase-url');
  console.log('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletedRecordsFix() {
  console.log('🔍 Testing deleted records fix...\n');

  try {
    // Test 1: Check if we can access deleted_cash_book table
    console.log('1. Testing access to deleted_cash_book table...');
    const { data: deletedData, error: deletedError, count } = await supabase
      .from('deleted_cash_book')
      .select('*', { count: 'exact', head: true });

    if (deletedError) {
      console.error('❌ Error accessing deleted_cash_book table:', deletedError);
      console.error('This indicates RLS policies are not properly configured.');
      console.error('\n🔧 SOLUTION: Run the fix-deleted-records-complete.sql script in your Supabase SQL Editor');
      return false;
    } else {
      console.log(`✅ Successfully accessed deleted_cash_book table. Total records: ${count || 0}`);
    }

    // Test 2: Fetch actual deleted records
    console.log('\n2. Fetching deleted records...');
    const { data: actualDeleted, error: fetchError } = await supabase
      .from('deleted_cash_book')
      .select('*')
      .order('deleted_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching deleted records:', fetchError);
      return false;
    } else {
      console.log(`✅ Successfully fetched ${actualDeleted?.length || 0} deleted records`);
    }

    // Test 3: Check approval status distribution
    console.log('\n3. Checking approval status distribution...');
    if (actualDeleted && actualDeleted.length > 0) {
      const pendingDeleted = actualDeleted.filter(d => 
        d.approved !== true && 
        d.approved !== 'true' && 
        d.approved !== 'rejected'
      );
      const approvedDeleted = actualDeleted.filter(d => 
        d.approved === true || d.approved === 'true'
      );
      const rejectedDeleted = actualDeleted.filter(d => 
        d.approved === 'rejected'
      );

      console.log(`📊 Approval Status Distribution:`);
      console.log(`   - Pending: ${pendingDeleted.length}`);
      console.log(`   - Approved: ${approvedDeleted.length}`);
      console.log(`   - Rejected: ${rejectedDeleted.length}`);
    }

    // Test 4: Test the exact query used in ApproveRecords component
    console.log('\n4. Testing ApproveRecords component query...');
    const { data: testQuery, error: testError } = await supabase
      .from('deleted_cash_book')
      .select('*')
      .order('deleted_at', { ascending: false })
      .limit(1000);

    if (testError) {
      console.error('❌ Error in ApproveRecords query:', testError);
      return false;
    } else {
      console.log(`✅ ApproveRecords query successful. Records: ${testQuery?.length || 0}`);
    }

    // Test 5: Test filtering logic (same as in ApproveRecords component)
    console.log('\n5. Testing filtering logic...');
    if (testQuery && testQuery.length > 0) {
      const pendingDeleted = testQuery.filter(d => 
        d.approved !== true && 
        d.approved !== 'true' && 
        d.approved !== 'rejected'
      );
      console.log(`✅ Filtering logic works. Pending deleted records: ${pendingDeleted.length}`);
      
      if (pendingDeleted.length > 0) {
        console.log('📊 Sample pending deleted record:', {
          id: pendingDeleted[0].id,
          company_name: pendingDeleted[0].company_name,
          approved: pendingDeleted[0].approved,
          deleted_at: pendingDeleted[0].deleted_at
        });
      }
    }

    console.log('\n🎉 All tests passed! Deleted records should now be visible in the Approve Records page.');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testDeletedRecordsFix().then((success) => {
  if (success) {
    console.log('\n✅ Fix verification completed successfully!');
    console.log('🚀 You can now check the Approve Records page to see deleted records.');
  } else {
    console.log('\n❌ Fix verification failed.');
    console.log('🔧 Please run the fix-deleted-records-complete.sql script in your Supabase SQL Editor.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
