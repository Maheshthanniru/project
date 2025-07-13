const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupUsers() {
  console.log('🚀 Setting up users in Supabase database...');

  try {
    // First, get the user types
    const { data: userTypes, error: userTypesError } = await supabase
      .from('user_types')
      .select('*');

    if (userTypesError) {
      console.error('❌ Error fetching user types:', userTypesError);
      return;
    }

    console.log('📋 Found user types:', userTypes);

    // Find Admin and Operator type IDs
    const adminType = userTypes.find(ut => ut.user_type === 'Admin');
    const operatorType = userTypes.find(ut => ut.user_type === 'Operator');

    if (!adminType || !operatorType) {
      console.error('❌ Admin or Operator user types not found');
      return;
    }

    // Define the users to create
    const usersToCreate = [
      {
        username: 'admin',
        email: 'admin@thirumala.com',
        password_hash: 'admin123', // In production, this should be properly hashed
        user_type_id: adminType.id,
        is_active: true
      },
      {
        username: 'operator',
        email: 'operator@thirumala.com',
        password_hash: 'op123',
        user_type_id: operatorType.id,
        is_active: true
      },
      {
        username: 'RAMESH',
        email: 'ramesh@thirumala.com',
        password_hash: 'ramesh123',
        user_type_id: operatorType.id,
        is_active: true
      },
      {
        username: 'TC DOUBLE A/C',
        email: 'tc@thirumala.com',
        password_hash: 'tc123',
        user_type_id: operatorType.id,
        is_active: true
      }
    ];

    console.log('👥 Creating users...');

    for (const user of usersToCreate) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', user.username)
        .single();

      if (existingUser) {
        console.log(`⚠️  User ${user.username} already exists, skipping...`);
        continue;
      }

      // Create the user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (createError) {
        console.error(`❌ Error creating user ${user.username}:`, createError);
      } else {
        console.log(`✅ Created user: ${newUser.username} (${newUser.email})`);
      }
    }

    // Verify all users were created
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('username, email, is_active');

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
    } else {
      console.log('\n📊 Current users in database:');
      allUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    console.log('\n🎉 User setup completed!');
    console.log('\n📝 Login credentials:');
    console.log('  Admin: username=admin, password=admin123');
    console.log('  Operator: username=operator, password=op123');
    console.log('  Ramesh: username=RAMESH, password=ramesh123');
    console.log('  TC: username=TC DOUBLE A/C, password=tc123');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupUsers(); 