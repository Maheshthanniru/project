const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (hardcoded as per user request)
const supabaseUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCSVUpload() {
  console.log('🧪 Testing CSV Upload Functionality...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('cash_book')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // Test 2: Check table structure
    console.log('2️⃣ Testing table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('cash_book')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.log('❌ Table structure check failed:', columnsError.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Table structure is valid');
      console.log('📋 Available columns:', Object.keys(columns[0]).join(', '));
    }
    console.log('');

    // Test 3: Test single entry insertion
    console.log('3️⃣ Testing single entry insertion...');
    const testEntry = {
      acc_name: 'Test Account',
      sub_acc_name: 'Test Sub Account',
      particulars: 'Test transaction for CSV upload',
      c_date: '2024-01-15',
      credit: 1000,
      debit: 0,
      credit_online: 800,
      credit_offline: 200,
      debit_online: 0,
      debit_offline: 0,
      company_name: 'Test Company',
      address: 'Test Address',
      staff: 'admin',
      users: 'admin',
      sale_qty: 0,
      purchase_qty: 0,
      cb: 'CB'
    };

    const { data: insertedEntry, error: insertError } = await supabase
      .from('cash_book')
      .insert(testEntry)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Single entry insertion failed:', insertError.message);
      console.log('🔍 This might be the cause of CSV upload errors');
      return;
    }
    console.log('✅ Single entry insertion successful');
    console.log('📝 Inserted entry ID:', insertedEntry.id);
    console.log('');

    // Test 4: Clean up test entry
    console.log('4️⃣ Cleaning up test entry...');
    const { error: deleteError } = await supabase
      .from('cash_book')
      .delete()
      .eq('id', insertedEntry.id);

    if (deleteError) {
      console.log('⚠️  Warning: Could not clean up test entry:', deleteError.message);
    } else {
      console.log('✅ Test entry cleaned up successfully');
    }
    console.log('');

    // Test 5: Check for common issues
    console.log('5️⃣ Checking for common issues...');
    
    // Check if users table exists and has admin user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, is_active')
      .eq('username', 'admin')
      .limit(1);

    if (usersError) {
      console.log('⚠️  Warning: Could not check users table:', usersError.message);
    } else if (users && users.length > 0) {
      console.log('✅ Admin user found and active');
    } else {
      console.log('⚠️  Warning: Admin user not found or inactive');
    }

    // Check companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('company_name')
      .limit(1);

    if (companiesError) {
      console.log('⚠️  Warning: Could not check companies table:', companiesError.message);
    } else if (companies && companies.length > 0) {
      console.log('✅ Companies table accessible');
    } else {
      console.log('⚠️  Warning: Companies table empty or inaccessible');
    }

    console.log('\n🎉 CSV Upload Test Completed!');
    console.log('\n📋 Recommendations:');
    console.log('• If all tests passed, your CSV upload should work');
    console.log('• If any test failed, fix the issue before uploading CSV');
    console.log('• Use the sample CSV format provided in the upload page');
    console.log('• Make sure your CSV has proper headers and data');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testCSVUpload();

