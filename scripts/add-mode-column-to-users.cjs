require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addModeColumn() {
  console.log('🚀 Adding mode column to users table...\n');

  try {
    // Check if column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('mode')
      .limit(1);

    if (!testError) {
      console.log('✅ Mode column already exists in users table!');
      return;
    }

    // If we get here, the column doesn't exist
    // Note: Adding columns via Supabase client requires service_role key or SQL editor
    // We'll provide the SQL command instead
    
    console.log('⚠️  Cannot add column directly via client (requires service_role key)');
    console.log('\n📝 Please run this SQL in your Supabase SQL Editor:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ALTER TABLE users ADD COLUMN mode TEXT CHECK (mode IN (\'regular\', \'itr\'));');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Steps to add the column:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Paste the SQL command above');
    console.log('4. Click "Run" to execute');
    console.log('5. Refresh your application\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run this SQL in your Supabase SQL Editor:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ALTER TABLE users ADD COLUMN mode TEXT CHECK (mode IN (\'regular\', \'itr\'));');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

addModeColumn();


