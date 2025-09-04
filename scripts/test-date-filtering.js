#!/usr/bin/env node

/**
 * Test Date Filtering Script
 * Tests the exact date filtering logic your app now uses
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

console.log('🧪 Date Filtering Test Script for Thirumala Business Management System');
console.log('====================================================================\n');

async function testDateFiltering() {
  try {
    console.log('🔍 Testing date filtering logic...\n');
    
    // First, get all records to test filtering on
    console.log('📊 Fetching all records for testing...');
    const { data: allData, error: fetchError } = await supabase
      .from('cash_book')
      .select('id, sno, acc_name, particulars, c_date, company_name')
      .order('c_date', { ascending: false })
      .limit(10000); // Get more records for better testing

    if (fetchError) {
      console.error('❌ Failed to fetch data:', fetchError.message);
      return;
    }

    console.log(`✅ Fetched ${allData.length} records for testing\n`);
    
    // Test 1: Year filter (2017)
    console.log('📅 Test 1: Year filter (2017)');
    const year2017Filter = allData.filter(entry => 
      entry.c_date && entry.c_date.startsWith('2017')
    );
    console.log(`   → Records found: ${year2017Filter.length}`);
    if (year2017Filter.length > 0) {
      console.log('   → Sample records:');
      year2017Filter.slice(0, 3).forEach(entry => {
        console.log(`     - ${entry.c_date}: ${entry.acc_name} - ${entry.particulars}`);
      });
    }
    
    // Test 2: Specific date filter (2017-01-21)
    console.log('\n📅 Test 2: Specific date filter (2017-01-21)');
    const specificDateFilter = allData.filter(entry => 
      entry.c_date === '2017-01-21'
    );
    console.log(`   → Records found: ${specificDateFilter.length}`);
    if (specificDateFilter.length > 0) {
      console.log('   → Records:');
      specificDateFilter.forEach(entry => {
        console.log(`     - ${entry.c_date}: ${entry.acc_name} - ${entry.particulars}`);
      });
    }
    
    // Test 3: Month filter (2017-01)
    console.log('\n📅 Test 3: Month filter (2017-01)');
    const monthFilter = allData.filter(entry => 
      entry.c_date && entry.c_date.startsWith('2017-01')
    );
    console.log(`   → Records found: ${monthFilter.length}`);
    if (monthFilter.length > 0) {
      console.log('   → Sample records:');
      monthFilter.slice(0, 3).forEach(entry => {
        console.log(`     - ${entry.c_date}: ${entry.acc_name} - ${entry.particulars}`);
      });
    }
    
    // Test 4: Check all available dates in 2017
    console.log('\n📅 Test 4: All available dates in 2017');
    const dates2017 = [...new Set(year2017Filter.map(entry => entry.c_date))].sort();
    console.log(`   → Unique dates found: ${dates2017.length}`);
    console.log('   → Date range:', dates2017[0], 'to', dates2017[dates2017.length - 1]);
    
    // Test 5: Test the exact filtering logic your app uses
    console.log('\n🧪 Test 5: Testing app filtering logic');
    
    function applyDateFilter(entries, filterDate) {
      if (!filterDate) return entries;
      
      console.log(`   → Applying filter: "${filterDate}"`);
      
      if (filterDate.length === 4 && /^\d{4}$/.test(filterDate)) {
        // Year filter
        console.log(`     → Filtering by year: ${filterDate}`);
        return entries.filter(entry => 
          entry.c_date && entry.c_date.startsWith(filterDate)
        );
      } else if (filterDate.includes('-')) {
        // Date filter
        console.log(`     → Filtering by exact date: ${filterDate}`);
        return entries.filter(entry => entry.c_date === filterDate);
      } else {
        // Partial filter
        console.log(`     → Filtering by partial match: ${filterDate}`);
        return entries.filter(entry => 
          entry.c_date && entry.c_date.startsWith(filterDate)
        );
      }
    }
    
    // Test year filter
    const yearFiltered = applyDateFilter(allData, '2017');
    console.log(`   → Year 2017 filter result: ${yearFiltered.length} records`);
    
    // Test specific date filter
    const dateFiltered = applyDateFilter(allData, '2017-01-21');
    console.log(`   → Date 2017-01-21 filter result: ${dateFiltered.length} records`);
    
    // Test month filter
    const monthFiltered = applyDateFilter(allData, '2017-01');
    console.log(`   → Month 2017-01 filter result: ${monthFiltered.length} records`);
    
    console.log('\n✅ Date filtering test complete!');
    console.log('💡 If the filtering works here but not in your app:');
    console.log('   1. Check the browser console for errors');
    console.log('   2. Verify the filterDate state is being set correctly');
    console.log('   3. Make sure the loadEntries function is being called');
    
  } catch (error) {
    console.error('❌ Error during date filtering test:', error.message);
  }
}

// Run the test
testDateFiltering();
