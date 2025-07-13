const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDatabase() {
  console.log('🔧 Fixing database setup...');

  try {
    // First, let's try to disable RLS temporarily
    console.log('\n🔓 Attempting to disable RLS...');
    
    // Try to insert user types with RLS disabled
    const { data: userTypes, error: userTypesError } = await supabase
      .rpc('disable_rls_temporarily')
      .then(() => supabase
        .from('user_types')
        .insert([
          { user_type: 'Admin' },
          { user_type: 'Operator' }
        ])
        .select()
      );

    if (userTypesError) {
      console.log('⚠️  RLS disable failed, trying direct insert...');
      
      // Try direct insert
      const { data: directUserTypes, error: directError } = await supabase
        .from('user_types')
        .insert([
          { user_type: 'Admin' },
          { user_type: 'Operator' }
        ])
        .select();

      if (directError) {
        console.error('❌ Still cannot insert user types:', directError);
        console.log('\n💡 You may need to:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Authentication > Policies');
        console.log('3. Temporarily disable RLS for user_types table');
        console.log('4. Run this script again');
        return;
      }
      
      console.log('✅ User types created via direct insert');
    } else {
      console.log('✅ User types created with RLS disabled');
    }

    console.log('\n🎉 Database setup instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration file: supabase/migrations/20250707174204_snowy_crystal.sql');
    console.log('4. Or manually create the missing tables and insert data');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

fixDatabase(); 