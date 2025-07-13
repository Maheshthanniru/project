const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertRemainingData() {
  console.log('🚀 Inserting remaining data...');

  try {
    // Insert additional user types if needed
    console.log('\n📋 Checking user types...');
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_types')
      .select('*');

    if (userTypesError) {
      console.error('❌ Error fetching user types:', userTypesError);
    } else {
      console.log('✅ Current user types:', userTypes.map(ut => ut.user_type));
      
      // Insert Operator if not exists
      if (!userTypes.find(ut => ut.user_type === 'Operator')) {
        const { data: newUserType, error: insertError } = await supabase
          .from('user_types')
          .insert({ user_type: 'Operator' })
          .select();

        if (insertError) {
          console.error('❌ Error inserting Operator:', insertError);
        } else {
          console.log('✅ Added Operator user type');
        }
      }
    }

    // Insert additional companies
    console.log('\n🏢 Inserting additional companies...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError);
    } else {
      console.log('✅ Current companies:', companies.map(c => c.company_name));
      
      const companiesToAdd = [
        { company_name: 'Thirumala Exports', address: 'Export Division Address' },
        { company_name: 'Thirumala Trading', address: 'Trading Division Address' }
      ];

      for (const company of companiesToAdd) {
        if (!companies.find(c => c.company_name === company.company_name)) {
          const { data: newCompany, error: insertError } = await supabase
            .from('companies')
            .insert(company)
            .select();

          if (insertError) {
            console.error(`❌ Error inserting ${company.company_name}:`, insertError);
          } else {
            console.log(`✅ Added company: ${newCompany[0].company_name}`);
          }
        }
      }
    }

    // Insert additional accounts
    console.log('\n📊 Inserting additional accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('company_main_accounts')
      .select('*');

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
    } else {
      console.log('✅ Current accounts:', accounts.map(a => `${a.company_name} - ${a.acc_name}`));
      
      const accountsToAdd = [
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Cash Account' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Bank Account' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Sales' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Expenses' },
        { company_name: 'Thirumala Trading', acc_name: 'Trading Income' },
        { company_name: 'Thirumala Trading', acc_name: 'Trading Expenses' }
      ];

      for (const account of accountsToAdd) {
        const exists = accounts.find(a => 
          a.company_name === account.company_name && a.acc_name === account.acc_name
        );
        
        if (!exists) {
          const { data: newAccount, error: insertError } = await supabase
            .from('company_main_accounts')
            .insert(account)
            .select();

          if (insertError) {
            console.error(`❌ Error inserting ${account.acc_name}:`, insertError);
          } else {
            console.log(`✅ Added account: ${newAccount[0].acc_name}`);
          }
        }
      }
    }

    // Insert additional sub accounts
    console.log('\n📋 Inserting additional sub accounts...');
    const { data: subAccounts, error: subAccountsError } = await supabase
      .from('company_main_sub_acc')
      .select('*');

    if (subAccountsError) {
      console.error('❌ Error fetching sub accounts:', subAccountsError);
    } else {
      console.log('✅ Current sub accounts:', subAccounts.map(sa => `${sa.company_name} - ${sa.acc_name} - ${sa.sub_acc}`));
      
      const subAccountsToAdd = [
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Sales Account', sub_acc: 'Interstate Sales' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account', sub_acc: 'Raw Material' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Purchase Account', sub_acc: 'Machinery' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Office Expense' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Transport' },
        { company_name: 'Thirumala Cotton Mills', acc_name: 'Expense Account', sub_acc: 'Salary' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Sales', sub_acc: 'Cotton Export' },
        { company_name: 'Thirumala Exports', acc_name: 'Export Expenses', sub_acc: 'Shipping' },
        { company_name: 'Thirumala Trading', acc_name: 'Trading Income', sub_acc: 'Commission' }
      ];

      for (const subAccount of subAccountsToAdd) {
        const exists = subAccounts.find(sa => 
          sa.company_name === subAccount.company_name && 
          sa.acc_name === subAccount.acc_name && 
          sa.sub_acc === subAccount.sub_acc
        );
        
        if (!exists) {
          const { data: newSubAccount, error: insertError } = await supabase
            .from('company_main_sub_acc')
            .insert(subAccount)
            .select();

          if (insertError) {
            console.error(`❌ Error inserting ${subAccount.sub_acc}:`, insertError);
          } else {
            console.log(`✅ Added sub account: ${newSubAccount[0].sub_acc}`);
          }
        }
      }
    }

    console.log('\n🎉 Data insertion completed!');
    console.log('\n📝 You can now:');
    console.log('1. Login to the app with: admin/admin123 or operator/op123');
    console.log('2. Create new entries in the NewEntry form');
    console.log('3. All dropdowns will be populated with real data');
    console.log('4. All data will be saved to Supabase database');

  } catch (error) {
    console.error('❌ Operation failed:', error);
  }
}

insertRemainingData(); 