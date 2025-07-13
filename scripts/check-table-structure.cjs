const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking cash_book table structure...');
    
    // Try to get a sample record to see the structure
    const { data, error } = await supabase
      .from('cash_book')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing cash_book table:', error);
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('  1. Check if cash_book table exists in your Supabase database');
      console.log('  2. Check if RLS is enabled and blocking access');
      console.log('  3. Check your database permissions');
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ cash_book table exists and is accessible');
      console.log('');
      console.log('📋 Table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`);
      });
      console.log('');
      console.log('🎯 Now you can create the edit_cash_book table with the correct foreign key reference');
    } else {
      console.log('⚠️  cash_book table exists but is empty');
      console.log('');
      console.log('📋 Expected columns based on your schema:');
      console.log('  - id: string (Primary Key)');
      console.log('  - sno: number');
      console.log('  - acc_name: string');
      console.log('  - sub_acc_name: string');
      console.log('  - particulars: string');
      console.log('  - c_date: string');
      console.log('  - credit: number');
      console.log('  - debit: number');
      console.log('  - company_name: string');
      console.log('  - staff: string');
      console.log('  - users: string');
      console.log('  - entry_time: string');
      console.log('  - created_at: string');
      console.log('  - updated_at: string');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

checkTableStructure(); 