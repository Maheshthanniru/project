// Script to run the dashboard migration and test the fixed function
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkwNjU5NSwiZXhwIjoyMDY3NDgyNTk1fQ.YourServiceKeyHere';

// Create Supabase client with service role key for migrations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running dashboard migration fix...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250115000001_fix_dashboard_totals_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n');
    
    // Execute the migration
    console.log('🚀 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
    
    console.log('✅ Migration executed successfully!');
    
    // Test the function
    console.log('\n🧪 Testing the fixed function...');
    const { data: testData, error: testError } = await supabase.rpc('get_dashboard_totals');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
      return false;
    }
    
    console.log('📊 Function test results:');
    console.log(`   Total Credit: ₹${Number(testData[0].total_credit).toLocaleString()}`);
    console.log(`   Total Debit: ₹${Number(testData[0].total_debit).toLocaleString()}`);
    console.log(`   Total Transactions: ${Number(testData[0].total_transactions).toLocaleString()}`);
    console.log(`   Net Balance: ₹${(Number(testData[0].total_credit) - Number(testData[0].total_debit)).toLocaleString()}`);
    
    console.log('\n🎉 Dashboard migration and test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    return false;
  }
}

// Run the migration
runMigration();

