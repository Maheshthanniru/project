const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the hardcoded credentials from the supabase.ts file
const supabaseUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('user_types').select('*').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
    
    console.log('✅ Connection successful!');
    
    // Test 2: Check if user_types table exists and has data
    console.log('2. Checking user_types table...');
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_types')
      .select('*');
    
    if (userTypesError) {
      console.error('❌ user_types table error:', userTypesError);
      return false;
    }
    
    console.log('✅ user_types table found with', userTypes.length, 'records');
    console.log('User types:', userTypes.map(ut => ut.user_type));
    
    // Test 3: Check if users table exists
    console.log('3. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, user_types!inner(user_type)')
      .limit(5);
    
    if (usersError) {
      console.error('❌ users table error:', usersError);
      return false;
    }
    
    console.log('✅ users table found with', users.length, 'users');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.user_types?.user_type})`);
    });
    
    // Test 4: Create a test user if none exist
    if (users.length === 0) {
      console.log('4. Creating test user...');
      
      // Get Admin user type
      const { data: adminType } = await supabase
        .from('user_types')
        .select('id')
        .eq('user_type', 'Admin')
        .single();
      
      if (!adminType) {
        console.error('❌ Admin user type not found');
        return false;
      }
      
      // Create test user
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          email: 'admin@thirumala.com',
          password_hash: passwordHash,
          user_type_id: adminType.id,
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating test user:', createError);
        return false;
      }
      
      console.log('✅ Test user created successfully!');
      console.log('📝 Login credentials:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    }
    
    console.log('\n🎉 All tests passed! Supabase is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n✅ You can now try logging in with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
  } else {
    console.log('\n❌ Please check your Supabase setup and database migration.');
  }
  process.exit(success ? 0 : 1);
});

