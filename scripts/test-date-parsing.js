#!/usr/bin/env node

/**
 * Test Date Parsing Script
 * Tests how dates from CSV are being parsed
 */

import fs from 'fs';
import csv from 'csv-parser';

const csvPath = 'C:/Users/aparn/OneDrive/Desktop/updated_sample.csv';

console.log('🧪 Testing Date Parsing from CSV');
console.log('================================\n');

// Test the parseDateTime function
function parseDateTime(dateString) {
  try {
    console.log(`📅 Input date string: "${dateString}"`);
    
    if (dateString && dateString.trim()) {
      const date = new Date(dateString);
      console.log(`   Parsed Date object: ${date}`);
      console.log(`   Is valid: ${!isNaN(date.getTime())}`);
      console.log(`   getTime(): ${date.getTime()}`);
      
      if (!isNaN(date.getTime())) {
        const result = date.toISOString();
        console.log(`   ✅ Result: ${result}`);
        return result;
      }
    }
    
    console.log(`   ❌ Using fallback: ${new Date().toISOString()}`);
    return new Date().toISOString();
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   ❌ Using fallback: ${new Date().toISOString()}`);
    return new Date().toISOString();
  }
}

// Test with sample dates
console.log('🧪 Testing parseDateTime function:\n');

const testDates = [
  '2025-07-03 00:00:00',
  '2019-12-31 00:00:00',
  '2016-11-18 00:00:00',
  '2017-07-30 00:00:00'
];

testDates.forEach(dateStr => {
  console.log(`\n--- Testing: ${dateStr} ---`);
  parseDateTime(dateStr);
});

// Test with actual CSV data
console.log('\n\n📁 Testing with actual CSV data:\n');

let rowCount = 0;
fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (data) => {
    if (rowCount < 5) { // Only test first 5 rows
      console.log(`\n--- Row ${rowCount + 1} ---`);
      console.log(`CSV Date: "${data.Date}"`);
      parseDateTime(data.Date);
      rowCount++;
    }
  })
  .on('end', () => {
    console.log('\n✅ Date parsing test completed!');
  });













