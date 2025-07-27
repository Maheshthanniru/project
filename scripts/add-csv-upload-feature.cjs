const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCsvUploadFeature() {
  try {
    console.log('Adding CSV Upload feature...');
    
    // Add the csv_upload feature to the features table
    const { data: featureData, error: featureError } = await supabase
      .from('features')
      .insert([
        { key: 'csv_upload', name: 'CSV Upload', description: 'Upload CSV data to the system' }
      ])
      .select();

    if (featureError) {
      if (featureError.code === '23505') {
        console.log('CSV Upload feature already exists');
      } else {
        console.error('Error adding CSV Upload feature:', featureError);
        return;
      }
    } else {
      console.log('CSV Upload feature added successfully');
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('userss')
      .select('id, is_admin');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.length} users`);

    // Add csv_upload access for all users
    for (const user of users) {
      const { error: accessError } = await supabase
        .from('user_access')
        .insert([
          { user_id: user.id, feature_key: 'csv_upload' }
        ]);

      if (accessError) {
        if (accessError.code === '23505') {
          console.log(`User ${user.id} already has csv_upload access`);
        } else {
          console.error(`Error adding csv_upload access for user ${user.id}:`, accessError);
        }
      } else {
        console.log(`Added csv_upload access for user ${user.id}`);
      }
    }

    console.log('CSV Upload feature setup completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addCsvUploadFeature(); 