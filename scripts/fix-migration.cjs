const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixMigration() {
  console.log('🔧 Fixing migration issues...');

  try {
    // First, let's check what policies exist
    console.log('\n📋 Checking existing policies...');
    
    const tables = [
      'user_types',
      'users', 
      'companies',
      'company_main_accounts',
      'company_main_sub_acc',
      'cash_book',
      'edit_cash_book',
      'original_cash_book',
      'balance_sheet',
      'ledger',
      'bank_guarantees',
      'vehicles',
      'drivers',
      'login_attempts',
      'login_activities'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${data.length} rows`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n💡 Migration Fix Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL to drop existing policies:');
    console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin can access all data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can read accounts" ON company_main_accounts;
DROP POLICY IF EXISTS "Authenticated users can read sub accounts" ON company_main_sub_acc;
DROP POLICY IF EXISTS "Authenticated users can read user types" ON user_types;
DROP POLICY IF EXISTS "Users can read cash book" ON cash_book;
DROP POLICY IF EXISTS "Users can insert cash book" ON cash_book;
DROP POLICY IF EXISTS "Admin can update cash book" ON cash_book;
DROP POLICY IF EXISTS "Users can access operational data" ON bank_guarantees;
DROP POLICY IF EXISTS "Users can access vehicle data" ON vehicles;
DROP POLICY IF EXISTS "Users can access driver data" ON drivers;
DROP POLICY IF EXISTS "Users can access ledger data" ON ledger;
DROP POLICY IF EXISTS "Users can access balance sheet" ON balance_sheet;
DROP POLICY IF EXISTS "Users can access edit history" ON edit_cash_book;
DROP POLICY IF EXISTS "Users can access original cash book" ON original_cash_book;
DROP POLICY IF EXISTS "Users can manage login attempts" ON login_attempts;
DROP POLICY IF EXISTS "Users can read login activities" ON login_activities;
DROP POLICY IF EXISTS "Users can insert login activities" ON login_activities;
    `);
    console.log('4. Then run the full migration file again');
    console.log('5. Or use the simplified setup below:');

    console.log('\n🚀 Simplified Setup (Alternative):');
    console.log('Run this SQL to create basic data without complex policies:');
    console.log(`
-- Insert user types
INSERT INTO user_types (user_type) VALUES ('Admin'), ('Operator') ON CONFLICT DO NOTHING;

-- Insert sample companies
INSERT INTO companies (company_name, address) VALUES 
  ('Thirumala Cotton Mills', 'Main Branch Address'),
  ('Thirumala Exports', 'Export Division Address'),
  ('Thirumala Trading', 'Trading Division Address')
ON CONFLICT DO NOTHING;

-- Insert sample accounts
INSERT INTO company_main_accounts (company_name, acc_name) VALUES 
  ('Thirumala Cotton Mills', 'Sales Account'),
  ('Thirumala Cotton Mills', 'Purchase Account'),
  ('Thirumala Cotton Mills', 'Expense Account'),
  ('Thirumala Cotton Mills', 'Cash Account'),
  ('Thirumala Cotton Mills', 'Bank Account')
ON CONFLICT DO NOTHING;
    `);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixMigration(); 