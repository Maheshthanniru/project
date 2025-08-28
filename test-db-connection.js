const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase database connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Test 1: Basic connection test
    console.log('\n📊 Test 1: Basic connection test...');
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Check if tables exist
    console.log('\n📋 Test 2: Checking available tables...');
    const tables = ['companies', 'users', 'cash_book', 'bank_guarantees', 'vehicles'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }
    
    // Test 3: Try to fetch some data
    console.log('\n📈 Test 3: Fetching sample data...');
    
    // Try companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(5);
    
    if (companiesError) {
      console.log('❌ Companies fetch failed:', companiesError.message);
    } else {
      console.log(`✅ Companies: ${companies.length} records found`);
      if (companies.length > 0) {
        console.log('Sample company:', companies[0]);
      }
    }
    
    // Try users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Users fetch failed:', usersError.message);
    } else {
      console.log(`✅ Users: ${users.length} records found`);
      if (users.length > 0) {
        console.log('Sample user:', { 
          id: users[0].id, 
          username: users[0].username, 
          is_active: users[0].is_active 
        });
      }
    }
    
    // Try cash_book
    const { data: cashBook, error: cashBookError } = await supabase
      .from('cash_book')
      .select('*')
      .limit(5);
    
    if (cashBookError) {
      console.log('❌ Cash book fetch failed:', cashBookError.message);
    } else {
      console.log(`✅ Cash book: ${cashBook.length} records found`);
      if (cashBook.length > 0) {
        console.log('Sample cash book entry:', { 
          id: cashBook[0].id, 
          date: cashBook[0].date, 
          company: cashBook[0].company,
          credit: cashBook[0].credit,
          debit: cashBook[0].debit
        });
      }
    }
    
    console.log('\n🎉 Database connection test completed!');
    return true;
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ Database is accessible and working!');
    } else {
      console.log('\n❌ Database connection issues detected.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });

