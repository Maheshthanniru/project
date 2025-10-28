require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseState() {
  console.log('🔍 Checking current database state...');
  console.log('');

  try {
    // Get counts for all tables
    const [
      { count: companiesCount, error: companiesError },
      { count: mainAccountsCount, error: mainAccountsError },
      { count: subAccountsCount, error: subAccountsError },
      { count: staffCount, error: staffError },
      { count: bankGuaranteesCount, error: bankGuaranteesError },
      { count: vehiclesCount, error: vehiclesError },
      { count: driversCount, error: driversError },
      { count: cashBookCount, error: cashBookError },
      { count: deletedCashBookCount, error: deletedCashBookError },
      { count: editCashBookCount, error: editCashBookError }
    ] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('company_main_accounts').select('*', { count: 'exact', head: true }),
      supabase.from('company_main_sub_acc').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bank_guarantees').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('drivers').select('*', { count: 'exact', head: true }),
      supabase.from('cash_book').select('*', { count: 'exact', head: true }),
      supabase.from('deleted_cash_book').select('*', { count: 'exact', head: true }),
      supabase.from('edit_cash_book').select('*', { count: 'exact', head: true })
    ]);

    // Check for errors
    const errors = [
      { name: 'Companies', error: companiesError },
      { name: 'Main Accounts', error: mainAccountsError },
      { name: 'Sub Accounts', error: subAccountsError },
      { name: 'Staff', error: staffError },
      { name: 'Bank Guarantees', error: bankGuaranteesError },
      { name: 'Vehicles', error: vehiclesError },
      { name: 'Drivers', error: driversError },
      { name: 'Cash Book', error: cashBookError },
      { name: 'Deleted Cash Book', error: deletedCashBookError },
      { name: 'Edit Cash Book', error: editCashBookError }
    ].filter(item => item.error);

    if (errors.length > 0) {
      console.error('❌ Errors encountered while checking database:');
      errors.forEach(({ name, error }) => {
        console.error(`   ${name}: ${error.message}`);
      });
      return;
    }

    // Display results
    console.log('📊 Current Database State:');
    console.log('═'.repeat(50));
    
    // Core data tables
    console.log('📋 Core Data (will be preserved):');
    console.log(`   Companies: ${companiesCount || 0}`);
    console.log(`   Main Accounts: ${mainAccountsCount || 0}`);
    console.log(`   Sub Accounts: ${subAccountsCount || 0}`);
    console.log(`   Staff: ${staffCount || 0}`);
    console.log(`   Bank Guarantees: ${bankGuaranteesCount || 0}`);
    console.log(`   Vehicles: ${vehiclesCount || 0}`);
    console.log(`   Drivers: ${driversCount || 0}`);
    
    console.log('');
    console.log('💰 Cash Book Data (will be cleared):');
    console.log(`   Cash Book Entries: ${cashBookCount || 0}`);
    console.log(`   Deleted Cash Book Entries: ${deletedCashBookCount || 0}`);
    console.log(`   Edit Audit Logs: ${editCashBookCount || 0}`);
    
    console.log('');
    
    // Analysis
    const totalCashBookData = (cashBookCount || 0) + (deletedCashBookCount || 0) + (editCashBookCount || 0);
    const totalPreservedData = (companiesCount || 0) + (mainAccountsCount || 0) + (subAccountsCount || 0) + (staffCount || 0);
    
    if (totalCashBookData > 0) {
      console.log(`⚠️  Found ${totalCashBookData} cash book related records that will be deleted`);
      console.log(`✅ Found ${totalPreservedData} core data records that will be preserved`);
      console.log('');
      console.log('💡 To clear cash book entries, run: node clear-cashbook-only.cjs');
    } else {
      console.log('✅ No cash book entries found - database is already clean');
    }

    // Sample data preview
    if (cashBookCount > 0) {
      console.log('');
      console.log('📄 Sample Cash Book Entries (first 3):');
      const { data: sampleEntries } = await supabase
        .from('cash_book')
        .select('id, sno, company_name, acc_name, particulars, credit, debit, c_date')
        .order('sno', { ascending: true })
        .limit(3);
      
      if (sampleEntries && sampleEntries.length > 0) {
        sampleEntries.forEach((entry, index) => {
          console.log(`   ${index + 1}. S/N: ${entry.sno} | ${entry.company_name} | ${entry.acc_name} | ${entry.particulars} | ₹${entry.credit || 0} | ₹${entry.debit || 0} | ${entry.c_date}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Error checking database state:', error);
    process.exit(1);
  }
}

// Run the check
checkDatabaseState();
