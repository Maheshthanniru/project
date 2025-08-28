// Debug CSV upload issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to the database
    const { data, error } = await supabase.from('cash_book').select('count');
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Test 2: Try to insert a simple test entry
    const testEntry = {
      acc_name: 'Test Account',
      sub_acc_name: null,
      particulars: 'Test transaction',
      c_date: '2024-01-15',
      credit: 100,
      debit: 0,
      credit_online: 0,
      credit_offline: 0,
      debit_online: 0,
      debit_offline: 0,
      company_name: 'Test Company',
      address: null,
      staff: null,
      users: 'admin',
      sale_qty: 0,
      purchase_qty: 0,
      cb: 'CB',
      sno: 1,
      entry_time: new Date().toISOString(),
      approved: false,
      edited: false,
      e_count: 0,
      lock_record: false
    };
    
    console.log('📝 Attempting to insert test entry...');
    const { data: insertData, error: insertError } = await supabase
      .from('cash_book')
      .insert(testEntry)
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insert successful:', insertData.id);
      
      // Clean up - delete the test entry
      await supabase.from('cash_book').delete().eq('id', insertData.id);
      console.log('🧹 Test entry cleaned up');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

testDatabaseConnection();

