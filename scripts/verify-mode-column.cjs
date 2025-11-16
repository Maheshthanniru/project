require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyModeColumn() {
  console.log('🔍 Checking if mode column exists in users table...\n');

  try {
    // Try to select the mode column
    const { data, error } = await supabase
      .from('users')
      .select('mode')
      .limit(1);

    if (error) {
      if (error.message?.includes('mode') || error.message?.includes('column') || error.code === '42703') {
        console.log('❌ Mode column does NOT exist in users table\n');
        console.log('📝 Please run this SQL in your Supabase SQL Editor:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ALTER TABLE users ADD COLUMN mode TEXT CHECK (mode IN (\'regular\', \'itr\'));');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📋 Steps:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Paste the SQL command above');
        console.log('3. Click "Run"');
        console.log('4. Refresh your application\n');
        process.exit(1);
      } else {
        console.error('❌ Error checking column:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Mode column EXISTS in users table!');
      console.log('✅ The column is ready to use.\n');
      console.log('If you\'re still seeing the error, try:');
      console.log('1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('2. Clear browser cache');
      console.log('3. Restart your development server\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyModeColumn();

