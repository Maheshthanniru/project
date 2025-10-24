// Script to verify the status column was added successfully
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyStatusColumn() {
  try {
    console.log('🔍 Checking if status column exists...');
    
    // Try to query the status column
    const { data, error } = await supabase
      .from('cash_book')
      .select('id, status')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('status')) {
        console.log('💡 The status column does not exist yet. Please run the SQL migration first.');
      }
      return;
    }
    
    console.log('✅ Status column exists!');
    console.log('📊 Sample data:', data);
    
    // Check the count of records with different statuses
    const { data: statusCounts, error: countError } = await supabase
      .from('cash_book')
      .select('status')
      .not('status', 'is', null);
    
    if (!countError) {
      const counts = {};
      statusCounts.forEach(record => {
        counts[record.status] = (counts[record.status] || 0) + 1;
      });
      console.log('📈 Status distribution:', counts);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyStatusColumn();



