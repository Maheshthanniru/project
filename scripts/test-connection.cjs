const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n📡 Testing connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('user_types')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('📋 User types found:', data);

    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, email, is_active')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError);
    } else {
      console.log('👥 Users in database:', users);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection(); 