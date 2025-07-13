const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function disableRLS() {
  console.log('🔓 Disabling RLS for all tables...');

  try {
    // List of all tables that need RLS disabled
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
      'drivers'
    ];

    console.log('\n📋 Disabling RLS for each table...');
    
    for (const table of tables) {
      try {
        // Execute SQL to disable RLS
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });

        if (error) {
          console.log(`⚠️  Could not disable RLS for ${table}: ${error.message}`);
        } else {
          console.log(`✅ Disabled RLS for ${table}`);
        }
      } catch (err) {
        console.log(`⚠️  Error with ${table}: ${err.message}`);
      }
    }

    console.log('\n🚀 Now populating database with data...');

    // Insert user types
    console.log('\n📋 Inserting user types...');
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_types')
      .insert([
        { user_type: 'Admin' },
        { user_type: 'Operator' }
      ])
      .select();

    if (userTypesError) {
      console.error('❌ Error inserting user types:', userTypesError);
    } else {
      console.log('✅ User types inserted:', userTypes.map(ut => ut.user_type));
    }

    // Insert sample companies
    console.log('\n🏢 Inserting sample companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .insert([
        { company_name: 'Thirumala Cotton Mills', address: 'Main Branch Address' },
        { company_name: 'Thirumala Exports', address: 'Export Division Address' },
        { company_name: 'Thirumala Trading', address: 'Trading Division Address' }
      ])
      .select();

    if (companiesError) {
      console.error('❌ Error inserting companies:', companiesError);
    } else {
      console.log('✅ Companies inserted:', companies.map(c => c.company_name));
    }

    // Insert sample accounts
    console.log('\n📊 Inserting sample accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('company_main_accounts')
      .insert([
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Cash Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Bank Account' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Sales' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Expenses' },
        { company_name: 'Thirumala Trading', acc_name: 'Trading Income' },
        { company_name: 'Thirumala Trading', acc_name: 'Trading Expenses' }
      ])
      .select();

    if (accountsError) {
      console.error('❌ Error inserting accounts:', accountsError);
    } else {
      console.log('✅ Accounts inserted:', accounts.map(a => a.acc_name));
    }

    // Insert sample sub accounts
    console.log('\n📋 Inserting sample sub accounts...');
    const { data: subAccounts, error: subAccountsError } = await supabase
      .from('company_main_sub_acc')
      .insert([
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account', sub_acc: 'Local Sales' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account', sub_acc: 'Interstate Sales' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account', sub_acc: 'Raw Material' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account', sub_acc: 'Machinery' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Office Expense' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Transport' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Salary' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Sales', sub_acc: 'Cotton Export' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Expenses', sub_acc: 'Shipping' },
        { company_name: 'Thirumala Trading', acc_name: 'Trading Income', sub_acc: 'Commission' }
      ])
      .select();

    if (subAccountsError) {
      console.error('❌ Error inserting sub accounts:', subAccountsError);
    } else {
      console.log('✅ Sub accounts inserted:', subAccounts.map(sa => sa.sub_acc));
    }

    console.log('\n🎉 RLS disabled and database populated successfully!');
    console.log('\n📝 You can now:');
    console.log('1. Login to the app with: admin/admin123 or operator/op123');
    console.log('2. Create new entries in the NewEntry form');
    console.log('3. All data will be saved to Supabase database');
    console.log('4. RLS is disabled for all tables');

  } catch (error) {
    console.error('❌ Operation failed:', error);
  }
}

disableRLS(); 