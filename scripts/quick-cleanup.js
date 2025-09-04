#!/usr/bin/env node

/**
 * Quick Data Cleanup Script for Thirumala Business Management System
 * Deletes all data without confirmation for testing
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

console.log('🧹 Quick Data Cleanup Script for Thirumala Business Management System');
console.log('===================================================================\n');

async function quickCleanup() {
  try {
    console.log('🗑️  Starting quick cleanup...');
    
    // Delete all cash_book records
    console.log('🗑️  Deleting cash book records...');
    const { error: cashBookError } = await supabase
      .from('cash_book')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (cashBookError) {
      console.error('❌ Error deleting cash_book:', cashBookError.message);
    } else {
      console.log('✅ Cash book records deleted successfully');
    }
    
    // Delete all companies
    console.log('🗑️  Deleting companies...');
    const { error: companiesError } = await supabase
      .from('companies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (companiesError) {
      console.error('❌ Error deleting companies:', companiesError.message);
    } else {
      console.log('✅ Companies deleted successfully');
    }
    
    console.log('\n🎉 Quick cleanup completed!');
    console.log('🚀 Now you can run the corrected import script:');
    console.log('   node scripts/import-csv-complete.js');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

// Run the cleanup
quickCleanup();

