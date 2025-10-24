#!/usr/bin/env node

/**
 * Script to run the dashboard totals migration
 * This creates a database function for efficient dashboard calculations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Running dashboard totals migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250115000000_dashboard_totals_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - execute SQL directly
      console.log('🔄 Trying alternative approach...');
      const { data: altData, error: altError } = await supabase
        .from('_migrations')
        .insert({ sql: migrationSQL });
        
      if (altError) {
        console.error('❌ Alternative approach also failed:', altError);
        console.log('\n📋 Manual steps required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the following SQL:');
        console.log('\n' + migrationSQL);
        return;
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the function
    console.log('🧪 Testing the new function...');
    const { data: testData, error: testError } = await supabase.rpc('get_dashboard_totals');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function test successful:', testData);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL:');
    
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250115000000_dashboard_totals_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n' + migrationSQL);
  }
}

runMigration();





