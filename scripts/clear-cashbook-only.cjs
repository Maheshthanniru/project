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

async function clearCashBookEntriesOnly() {
  console.log('🗑️  Starting cash book entries cleanup...');
  console.log('⚠️  This will delete ALL cash book entries but preserve:');
  console.log('   - Companies');
  console.log('   - Main Accounts');
  console.log('   - Sub Accounts');
  console.log('   - Staff/Users');
  console.log('   - Bank Guarantees');
  console.log('   - Vehicles');
  console.log('   - Drivers');
  console.log('');

  try {
    // Get counts before deletion for verification
    console.log('📊 Getting current data counts...');
    
    const [
      { count: companiesCount },
      { count: mainAccountsCount },
      { count: subAccountsCount },
      { count: staffCount },
      { count: bankGuaranteesCount },
      { count: vehiclesCount },
      { count: driversCount },
      { count: cashBookCount }
    ] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('company_main_accounts').select('*', { count: 'exact', head: true }),
      supabase.from('company_main_sub_acc').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bank_guarantees').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('drivers').select('*', { count: 'exact', head: true }),
      supabase.from('cash_book').select('*', { count: 'exact', head: true })
    ]);

    console.log('📈 Current data counts:');
    console.log(`   Companies: ${companiesCount || 0}`);
    console.log(`   Main Accounts: ${mainAccountsCount || 0}`);
    console.log(`   Sub Accounts: ${subAccountsCount || 0}`);
    console.log(`   Staff: ${staffCount || 0}`);
    console.log(`   Bank Guarantees: ${bankGuaranteesCount || 0}`);
    console.log(`   Vehicles: ${vehiclesCount || 0}`);
    console.log(`   Drivers: ${driversCount || 0}`);
    console.log(`   Cash Book Entries: ${cashBookCount || 0}`);
    console.log('');

    // Delete cash book entries and related audit data
    console.log('1️⃣  Deleting cash book entries...');
    const { error: cashBookError } = await supabase
      .from('cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record
    
    if (cashBookError) {
      console.error('❌ Error deleting cash book entries:', cashBookError);
      throw cashBookError;
    } else {
      console.log('✅ Cash book entries deleted');
    }

    console.log('2️⃣  Deleting deleted cash book entries (audit trail)...');
    const { error: deletedCashBookError } = await supabase
      .from('deleted_cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deletedCashBookError) {
      console.error('❌ Error deleting deleted cash book entries:', deletedCashBookError);
      throw deletedCashBookError;
    } else {
      console.log('✅ Deleted cash book entries cleared');
    }

    console.log('3️⃣  Deleting edit audit logs...');
    const { error: editAuditError } = await supabase
      .from('edit_cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (editAuditError) {
      console.error('❌ Error deleting edit audit logs:', editAuditError);
      throw editAuditError;
    } else {
      console.log('✅ Edit audit logs deleted');
    }

    // Reset the cash book serial number sequence
    console.log('4️⃣  Resetting cash book serial number sequence...');
    const { error: sequenceError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;'
    });
    
    if (sequenceError) {
      console.log('⚠️  Could not reset sequence (this is usually not critical):', sequenceError.message);
    } else {
      console.log('✅ Cash book sequence reset to start from 1');
    }

    // Verify data preservation
    console.log('5️⃣  Verifying data preservation...');
    
    const [
      { count: companiesCountAfter },
      { count: mainAccountsCountAfter },
      { count: subAccountsCountAfter },
      { count: staffCountAfter },
      { count: bankGuaranteesCountAfter },
      { count: vehiclesCountAfter },
      { count: driversCountAfter },
      { count: cashBookCountAfter }
    ] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('company_main_accounts').select('*', { count: 'exact', head: true }),
      supabase.from('company_main_sub_acc').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bank_guarantees').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('drivers').select('*', { count: 'exact', head: true }),
      supabase.from('cash_book').select('*', { count: 'exact', head: true })
    ]);

    console.log('📊 Data counts after cleanup:');
    console.log(`   Companies: ${companiesCountAfter || 0} ${companiesCountAfter === companiesCount ? '✅' : '❌'}`);
    console.log(`   Main Accounts: ${mainAccountsCountAfter || 0} ${mainAccountsCountAfter === mainAccountsCount ? '✅' : '❌'}`);
    console.log(`   Sub Accounts: ${subAccountsCountAfter || 0} ${subAccountsCountAfter === subAccountsCount ? '✅' : '❌'}`);
    console.log(`   Staff: ${staffCountAfter || 0} ${staffCountAfter === staffCount ? '✅' : '❌'}`);
    console.log(`   Bank Guarantees: ${bankGuaranteesCountAfter || 0} ${bankGuaranteesCountAfter === bankGuaranteesCount ? '✅' : '❌'}`);
    console.log(`   Vehicles: ${vehiclesCountAfter || 0} ${vehiclesCountAfter === vehiclesCount ? '✅' : '❌'}`);
    console.log(`   Drivers: ${driversCountAfter || 0} ${driversCountAfter === driversCount ? '✅' : '❌'}`);
    console.log(`   Cash Book Entries: ${cashBookCountAfter || 0} ${cashBookCountAfter === 0 ? '✅' : '❌'}`);

    // Check if all data was preserved correctly
    const dataPreserved = 
      companiesCountAfter === companiesCount &&
      mainAccountsCountAfter === mainAccountsCount &&
      subAccountsCountAfter === subAccountsCount &&
      staffCountAfter === staffCount &&
      bankGuaranteesCountAfter === bankGuaranteesCount &&
      vehiclesCountAfter === vehiclesCount &&
      driversCountAfter === driversCount &&
      cashBookCountAfter === 0;

    if (dataPreserved) {
      console.log('');
      console.log('🎉 SUCCESS! Cash book entries cleared successfully!');
      console.log('✅ All other data has been preserved intact.');
      console.log(`✅ ${cashBookCount || 0} cash book entries were removed.`);
      console.log('✅ The system is ready for fresh cash book entries.');
    } else {
      console.log('');
      console.log('⚠️  WARNING: Some data may have been affected during cleanup.');
      console.log('Please review the counts above and verify your data integrity.');
    }

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    console.error('Please check your database connection and permissions.');
    process.exit(1);
  }
}

// Run the cleanup
clearCashBookEntriesOnly();






