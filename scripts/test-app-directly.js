#!/usr/bin/env node

/**
 * Test App Directly Script
 * Tests the exact function your app calls to see what's happening
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

console.log('🧪 Test App Directly Script for Thirumala Business Management System');
console.log('==================================================================\n');

// Simulate the exact function your app calls
async function getCashBookEntries() {
  try {
    // First, try to fetch all records in one query with a high limit
    console.log('🔄 Attempting to fetch all records in single query...');
    
    const { data, error } = await supabase
      .from('cash_book')
      .select('*')
      .order('c_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100000); // Try to fetch up to 100k records

    if (error) {
      console.error('Error in single query:', error);
      // Fall back to batch approach
      console.log('🔄 Falling back to batch approach...');
      return await getCashBookEntriesBatched();
    }

          if (data && data.length > 0) {
        console.log(`✅ Single query successful: ${data.length} records fetched`);
        
        // Check if we got all records or if we're still limited
        if (data.length >= 100000) {
          console.log('✅ High limit query returned full dataset');
          return data;
        } else {
          console.log(`⚠️  High limit query returned only ${data.length} records (likely limited), trying batch approach...`);
          return await getCashBookEntriesBatched();
        }
      } else {
        console.log('⚠️  Single query returned no data, trying batch approach...');
        return await getCashBookEntriesBatched();
      }
  } catch (error) {
    console.error('Error in getCashBookEntries:', error);
    return await getCashBookEntriesBatched();
  }
}

async function getCashBookEntriesBatched() {
  // First, get the total count
  const { count: totalCount, error: countError } = await supabase
    .from('cash_book')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting total count:', countError);
    return [];
  }

  console.log(`📊 Total records in database: ${totalCount}`);

  // If we have more than 1000 records, we need to fetch in batches
  if (totalCount && totalCount > 1000) {
    console.log(`🔄 Fetching ${totalCount} records in batches...`);
    
    let allEntries = [];
    const batchSize = 1000;
    
    // For testing, just fetch first 10 batches to see if it works
    const maxBatches = 10;
    let batchCount = 0;
    
    for (let offset = 0; offset < Math.min(totalCount, maxBatches * batchSize); offset += batchSize) {
      batchCount++;
      console.log(`   → Fetching batch ${batchCount} (offset ${offset} to ${offset + batchSize - 1})`);
      
      const { data: batchData, error: batchError } = await supabase
        .from('cash_book')
        .select('*')
        .order('c_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (batchError) {
        console.error(`Error fetching batch ${batchCount}:`, batchError);
        continue;
      }

      if (batchData) {
        allEntries = allEntries.concat(batchData);
        console.log(`   ✅ Batch ${batchCount} successful: ${batchData.length} records`);
      }

      // Add a small delay between batches to avoid overwhelming the database
      if (offset + batchSize < Math.min(totalCount, maxBatches * batchSize)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Successfully fetched ${allEntries.length} records in ${batchCount} batches`);
    return allEntries;
  } else {
    // For smaller datasets, use the original approach
    console.log('✅ Using standard approach for smaller dataset');
    const { data, error } = await supabase
      .from('cash_book')
      .select('*')
      .order('c_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cash book entries:', error);
      return [];
    }

    return data || [];
  }
}

// Test the function
async function testFunction() {
  try {
    console.log('🔍 Testing getCashBookEntries function...\n');
    
    const result = await getCashBookEntries();
    
    console.log('\n🔍 Test Results:');
    console.log(`✅ Total records returned: ${result.length}`);
    
    if (result.length > 0) {
      // Check for 2017 data
      const data2017 = result.filter(entry => 
        entry.c_date && entry.c_date.startsWith('2017')
      );
      console.log(`📅 2017 data found: ${data2017.length} records`);
      
      if (data2017.length > 0) {
        console.log('📋 Sample 2017 records:');
        console.table(data2017.slice(0, 3));
      }
      
      // Check data distribution
      const yearCounts = {};
      result.forEach(entry => {
        if (entry.c_date) {
          const year = entry.c_date.substring(0, 4);
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      });
      
      console.log('\n📅 Data distribution by year:');
      Object.entries(yearCounts)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([year, count]) => {
          console.log(`   ${year}: ${count} records`);
        });
    }
    
    console.log('\n✅ Function test complete!');
    console.log('💡 If this returns 0 records, there\'s a database issue.');
    console.log('💡 If this returns records but your app doesn\'t, there\'s an app issue.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFunction();
