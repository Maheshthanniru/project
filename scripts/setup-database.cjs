const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...');

  try {
    // Step 1: Create user types
    console.log('\n📋 Creating user types...');
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_types')
      .insert([
        { user_type: 'Admin' },
        { user_type: 'Operator' }
      ])
      .select();

    if (userTypesError) {
      console.error('❌ Error creating user types:', userTypesError);
      return;
    }

    console.log('✅ User types created:', userTypes);

    // Step 2: Get the user type IDs
    const adminType = userTypes.find(ut => ut.user_type === 'Admin');
    const operatorType = userTypes.find(ut => ut.user_type === 'Operator');

    // Step 3: Create users
    console.log('\n👥 Creating users...');
    const usersToCreate = [
      {
        username: 'admin',
        email: 'admin@thirumala.com',
        password_hash: 'admin123',
        user_type_id: adminType.id,
        is_active: true
      },
      {
        username: 'operator',
        email: 'operator@thirumala.com',
        password_hash: 'op123',
        user_type_id: operatorType.id,
        is_active: true
      },
      {
        username: 'RAMESH',
        email: 'ramesh@thirumala.com',
        password_hash: 'ramesh123',
        user_type_id: operatorType.id,
        is_active: true
      },
      {
        username: 'TC DOUBLE A/C',
        email: 'tc@thirumala.com',
        password_hash: 'tc123',
        user_type_id: operatorType.id,
        is_active: true
      }
    ];

    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .insert(usersToCreate)
      .select();

    if (usersError) {
      console.error('❌ Error creating users:', usersError);
      return;
    }

    console.log('✅ Users created:', createdUsers.map(u => u.username));

    // Step 4: Create sample companies
    console.log('\n🏢 Creating sample companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .insert([
        { company_name: 'Thirumala Cotton Mills', address: 'Main Branch Address' },
        { company_name: 'Thirumala Exports', address: 'Export Division Address' },
        { company_name: 'Thirumala Trading', address: 'Trading Division Address' }
      ])
      .select();

    if (companiesError) {
      console.error('❌ Error creating companies:', companiesError);
    } else {
      console.log('✅ Companies created:', companies.map(c => c.company_name));
    }

    // Step 5: Create sample accounts
    console.log('\n📊 Creating sample accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('company_main_accounts')
      .insert([
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Cash Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Bank Account' }
      ])
      .select();

    if (accountsError) {
      console.error('❌ Error creating accounts:', accountsError);
    } else {
      console.log('✅ Accounts created:', accounts.map(a => a.acc_name));
    }

    // Step 6: Create sample sub accounts
    console.log('\n📋 Creating sample sub accounts...');
    const { data: subAccounts, error: subAccountsError } = await supabase
      .from('company_main_sub_acc')
      .insert([
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account', sub_acc: 'Local Sales' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account', sub_acc: 'Interstate Sales' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account', sub_acc: 'Raw Material' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account', sub_acc: 'Machinery' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Office Expense' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Transport' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Salary' }
      ])
      .select();

    if (subAccountsError) {
      console.error('❌ Error creating sub accounts:', subAccountsError);
    } else {
      console.log('✅ Sub accounts created:', subAccounts.map(sa => sa.sub_acc));
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('  Admin: username=admin, password=admin123');
    console.log('  Operator: username=operator, password=op123');
    console.log('  Ramesh: username=RAMESH, password=ramesh123');
    console.log('  TC: username=TC DOUBLE A/C, password=tc123');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase(); 