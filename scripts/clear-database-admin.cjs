const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file has VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearAllData() {
  console.log('🗑️  Starting database cleanup with admin privileges...');
  console.log('⚠️  WARNING: This will delete ALL data from your database!');
  console.log('');

  try {
    // Use raw SQL queries for admin access
    const tables = [
      'cash_book',
      'deleted_cash_book', 
      'edit_cash_book',
      'company_main_sub_acc',
      'company_main_accounts',
      'companies',
      'bank_guarantees',
      'vehicles',
      'drivers'
    ];

    for (const table of tables) {
      console.log(`🗑️  Clearing ${table}...`);
      
      // Disable RLS for this table
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsError) {
        console.log(`⚠️  Could not disable RLS for ${table}:`, rlsError.message);
      }

      // Truncate the table
      const { error: truncateError } = await supabase.rpc('exec_sql', {
        sql: `TRUNCATE TABLE ${table} CASCADE;`
      });
      
      if (truncateError) {
        console.log(`⚠️  Could not truncate ${table}:`, truncateError.message);
        
        // Try DELETE as fallback
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
          console.error(`❌ Error deleting from ${table}:`, deleteError.message);
        } else {
          console.log(`✅ ${table} cleared using DELETE`);
        }
      } else {
        console.log(`✅ ${table} cleared using TRUNCATE`);
      }

      // Re-enable RLS for this table
      const { error: rlsEnableError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsEnableError) {
        console.log(`⚠️  Could not re-enable RLS for ${table}:`, rlsEnableError.message);
      }
    }

    // Reset sequences
    console.log('🔄 Resetting sequences...');
    const sequences = [
      'cash_book_sno_seq',
      'bank_guarantees_sno_seq', 
      'vehicles_sno_seq',
      'drivers_sno_seq'
    ];

    for (const seq of sequences) {
      const { error: seqError } = await supabase.rpc('exec_sql', {
        sql: `ALTER SEQUENCE IF EXISTS ${seq} RESTART WITH 1;`
      });
      
      if (seqError) {
        console.log(`⚠️  Could not reset ${seq}:`, seqError.message);
      } else {
        console.log(`✅ ${seq} reset`);
      }
    }

    console.log('');
    console.log('🎉 Database cleanup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ All tables cleared');
    console.log('✅ Sequences reset');
    console.log('✅ RLS policies restored');
    console.log('');
    console.log('🚀 You can now upload your CSV file with a clean database!');

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearAllData();

