#!/usr/bin/env node

/**
 * Check New Data Script for Thirumala Business Management System
 * Verifies the newly imported data with correct dates
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

console.log('🔍 New Data Check Script for Thirumala Business Management System');
console.log('================================================================\n');

async function checkNewData() {
  try {
    console.log('📊 Checking newly imported data...\n');
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('cash_book')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting total count:', countError.message);
      return;
    }
    
    console.log(`📈 Total records in database: ${totalCount}`);
    
    // Check for entries with historical dates (2016-2019) - these should be the new import
    console.log('\n📅 Checking for entries with historical dates (2016-2019):');
    const { data: historicalEntries, error: historicalError } = await supabase
      .from('cash_book')
      .select('id, sno, acc_name, particulars, c_date, credit, debit, company_name, entry_time')
      .gte('c_date', '2016-01-01')
      .lte('c_date', '2019-12-31')
      .order('c_date', { ascending: false })
      .limit(20);
    
    if (historicalError) {
      console.error('❌ Error getting historical entries:', historicalError.message);
    } else {
      if (historicalEntries && historicalEntries.length > 0) {
        console.table(historicalEntries);
        console.log(`✅ Found ${historicalEntries.length} entries with historical dates (2016-2019)`);
        
        // Check if entry_time matches c_date
        const matchingDates = historicalEntries.filter(entry => {
          const cDate = new Date(entry.c_date);
          const entryTime = new Date(entry.entry_time);
          return cDate.getFullYear() === entryTime.getFullYear() && 
                 cDate.getMonth() === entryTime.getMonth() && 
                 cDate.getDate() === entryTime.getDate();
        });
        
        console.log(`📅 Date matching check: ${matchingDates.length}/${historicalEntries.length} entries have matching dates`);
      } else {
        console.log('❌ No historical entries found');
      }
    }
    
    // Check for entries with recent entry_time (today) - these are the old duplicates
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Checking for entries with today's entry_time (${today}):`);
    const { data: todayEntries, error: todayError } = await supabase
      .from('cash_book')
      .select('id, sno, acc_name, particulars, c_date, credit, debit, company_name, entry_time')
      .gte('entry_time', `${today}T00:00:00`)
      .lte('entry_time', `${today}T23:59:59`)
      .limit(10);
    
    if (todayError) {
      console.error('❌ Error getting today\'s entries:', todayError.message);
    } else {
      if (todayEntries && todayEntries.length > 0) {
        console.table(todayEntries);
        console.log(`⚠️  Found ${todayEntries.length} entries with today's entry_time (these are old duplicates)`);
      } else {
        console.log('✅ No entries with today\'s entry_time found');
      }
    }
    
    // Check specific company data
    console.log('\n🏢 Checking data for specific companies from CSV:');
    const { data: companyEntries, error: companyError } = await supabase
      .from('cash_book')
      .select('id, sno, acc_name, particulars, c_date, credit, debit, company_name, entry_time')
      .in('company_name', ['BR AND BVT', 'BUKKA SAI VIVEK A/C', 'RAMESH BUKKA A/C'])
      .order('c_date', { ascending: false })
      .limit(15);
    
    if (companyError) {
      console.error('❌ Error getting company entries:', companyError.message);
    } else {
      if (companyEntries && companyEntries.length > 0) {
        console.table(companyEntries);
        console.log(`✅ Found ${companyEntries.length} entries for specific companies`);
      } else {
        console.log('❌ No company entries found');
      }
    }
    
    console.log('\n🔍 Data Check Complete!');
    console.log('\n💡 Analysis:');
    console.log('   - If you see entries with dates 2016-2019, the new import worked correctly');
    console.log('   - If entry_time matches c_date, the date fix worked');
    console.log('   - Your app should now show the historical data');
    
  } catch (error) {
    console.error('❌ Error during data check:', error.message);
  }
}

// Run the check
checkNewData();











