#!/usr/bin/env node

/**
 * Execute Data Cleanup Script for Thirumala Business Management System
 * Actually deletes all data after confirmation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl, supabaseAnonKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});
  
  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
}

// Fallback to hardcoded values if env not found
if (!supabaseUrl) {
  supabaseUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co';
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧹 Execute Data Cleanup Script for Thirumala Business Management System');
console.log('=====================================================================\n');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function executeCleanup() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from your database!');
    console.log('   This action cannot be undone.\n');
    
    // Get current counts
    console.log('📊 Current data counts:');
    
    const { count: cashBookCount, error: cashBookError } = await supabase
      .from('cash_book')
      .select('*', { count: 'exact', head: true });
    
    if (cashBookError) {
      console.error('❌ Error getting cash_book count:', cashBookError.message);
      return;
    }
    
    const { count: companiesCount, error: companiesError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    if (companiesError) {
      console.error('❌ Error getting companies count:', companiesError.message);
      return;
    }
    
    console.log(`   💰 Cash Book: ${cashBookCount} records`);
    console.log(`   🏢 Companies: ${companiesCount} records`);
    
    console.log('\n🔴 To proceed with cleanup, please type "YES" to confirm:');
    const confirmation = await question('Type YES to confirm: ');
    
    if (confirmation !== 'YES') {
      console.log('❌ Cleanup cancelled. No data was deleted.');
      rl.close();
      return;
    }
    
    console.log('\n🧹 Starting cleanup process...');
    
    // Delete cash_book records
    console.log('🗑️  Deleting cash book records...');
    const { error: cashBookDeleteError } = await supabase
      .from('cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (cashBookDeleteError) {
      console.error('❌ Error deleting cash_book:', cashBookDeleteError.message);
    } else {
      console.log('✅ Cash book records deleted successfully');
    }
    
    // Delete companies
    console.log('🗑️  Deleting companies...');
    const { error: companiesDeleteError } = await supabase
      .from('companies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (companiesDeleteError) {
      console.error('❌ Error deleting companies:', companiesDeleteError.message);
    } else {
      console.log('✅ Companies deleted successfully');
    }
    
    // Delete company_main_accounts
    console.log('🗑️  Deleting company main accounts...');
    const { error: mainAccountsDeleteError } = await supabase
      .from('company_main_accounts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (mainAccountsDeleteError) {
      console.error('❌ Error deleting company_main_accounts:', mainAccountsDeleteError.message);
    } else {
      console.log('✅ Company main accounts deleted successfully');
    }
    
    // Delete company_main_sub_acc
    console.log('🗑️  Deleting company sub accounts...');
    const { error: subAccountsDeleteError } = await supabase
      .from('company_main_sub_acc')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (subAccountsDeleteError) {
      console.error('❌ Error deleting company_main_sub_acc:', subAccountsDeleteError.message);
    } else {
      console.log('✅ Company sub accounts deleted successfully');
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the fresh import script:');
    console.log('      node scripts/import-csv-complete.js');
    console.log('   2. This will import your 67,000 records cleanly');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    rl.close();
  }
}

// Run the cleanup
executeCleanup();

