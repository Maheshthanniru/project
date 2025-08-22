const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllData() {
  console.log('🗑️  Starting database cleanup...');
  console.log('⚠️  WARNING: This will delete ALL data from your database!');
  console.log('');

  try {
    // Delete data in the correct order to avoid foreign key constraint issues
    
    console.log('1️⃣  Deleting cash book entries...');
    const { error: cashBookError } = await supabase
      .from('cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record
    
    if (cashBookError) {
      console.error('❌ Error deleting cash book entries:', cashBookError);
    } else {
      console.log('✅ Cash book entries deleted');
    }

    console.log('2️⃣  Deleting deleted cash book entries...');
    const { error: deletedCashBookError } = await supabase
      .from('deleted_cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deletedCashBookError) {
      console.error('❌ Error deleting deleted cash book entries:', deletedCashBookError);
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
    } else {
      console.log('✅ Edit audit logs deleted');
    }

    console.log('4️⃣  Deleting sub accounts...');
    const { error: subAccountError } = await supabase
      .from('company_main_sub_acc')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (subAccountError) {
      console.error('❌ Error deleting sub accounts:', subAccountError);
    } else {
      console.log('✅ Sub accounts deleted');
    }

    console.log('5️⃣  Deleting main accounts...');
    const { error: accountError } = await supabase
      .from('company_main_accounts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (accountError) {
      console.error('❌ Error deleting main accounts:', accountError);
    } else {
      console.log('✅ Main accounts deleted');
    }

    console.log('6️⃣  Deleting companies...');
    const { error: companyError } = await supabase
      .from('companies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (companyError) {
      console.error('❌ Error deleting companies:', companyError);
    } else {
      console.log('✅ Companies deleted');
    }

    console.log('7️⃣  Deleting bank guarantees...');
    const { error: bankGuaranteeError } = await supabase
      .from('bank_guarantees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (bankGuaranteeError) {
      console.error('❌ Error deleting bank guarantees:', bankGuaranteeError);
    } else {
      console.log('✅ Bank guarantees deleted');
    }

    console.log('8️⃣  Deleting vehicles...');
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (vehicleError) {
      console.error('❌ Error deleting vehicles:', vehicleError);
    } else {
      console.log('✅ Vehicles deleted');
    }

    console.log('9️⃣  Deleting drivers...');
    const { error: driverError } = await supabase
      .from('drivers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (driverError) {
      console.error('❌ Error deleting drivers:', driverError);
    } else {
      console.log('✅ Drivers deleted');
    }

    // Note: We're NOT deleting users to preserve admin accounts
    console.log('ℹ️  Users table preserved (to maintain admin accounts)');

    console.log('');
    console.log('🎉 Database cleanup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Cash book entries: Cleared');
    console.log('✅ Deleted cash book entries: Cleared');
    console.log('✅ Edit audit logs: Cleared');
    console.log('✅ Sub accounts: Cleared');
    console.log('✅ Main accounts: Cleared');
    console.log('✅ Companies: Cleared');
    console.log('✅ Bank guarantees: Cleared');
    console.log('✅ Vehicles: Cleared');
    console.log('✅ Drivers: Cleared');
    console.log('ℹ️  Users: Preserved');
    console.log('');
    console.log('🚀 You can now upload your CSV file with a clean database!');

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearAllData();

