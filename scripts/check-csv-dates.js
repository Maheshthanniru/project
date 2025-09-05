#!/usr/bin/env node

/**
 * Check CSV Dates Script
 * Analyzes the date ranges in the CSV file
 */

import fs from 'fs';
import csv from 'csv-parser';

const csvPath = 'C:/Users/aparn/OneDrive/Desktop/updated_sample.csv';

console.log('📅 CSV Date Analysis Script');
console.log('==========================\n');

async function analyzeCSVDates() {
  const dates = [];
  const companies = new Set();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (data.Date && data.Date.trim()) {
          dates.push(data.Date.trim());
        }
        if (data.Company && data.Company.trim()) {
          companies.add(data.Company.trim());
        }
      })
      .on('end', () => {
        console.log(`📊 Total rows processed: ${dates.length}`);
        console.log(`🏢 Unique companies found: ${companies.size}`);
        
        // Analyze dates
        const uniqueDates = [...new Set(dates)].sort();
        console.log(`📅 Unique dates found: ${uniqueDates.length}`);
        
        if (uniqueDates.length > 0) {
          console.log(`\n📅 Date range:`);
          console.log(`   Earliest: ${uniqueDates[0]}`);
          console.log(`   Latest: ${uniqueDates[uniqueDates.length - 1]}`);
          
          // Group by year
          const datesByYear = {};
          uniqueDates.forEach(date => {
            const year = date.split('-')[0];
            if (!datesByYear[year]) datesByYear[year] = [];
            datesByYear[year].push(date);
          });
          
          console.log(`\n📊 Dates by year:`);
          Object.keys(datesByYear).sort().forEach(year => {
            console.log(`   ${year}: ${datesByYear[year].length} dates`);
          });
          
          // Show sample dates from each year
          console.log(`\n📅 Sample dates from each year:`);
          Object.keys(datesByYear).sort().forEach(year => {
            const sampleDates = datesByYear[year].slice(0, 5);
            console.log(`   ${year}: ${sampleDates.join(', ')}`);
          });
        }
        
        console.log(`\n🏢 Companies in CSV:`);
        Array.from(companies).sort().forEach(company => {
          console.log(`   - ${company}`);
        });
        
        resolve();
      })
      .on('error', reject);
  });
}

analyzeCSVDates().catch(console.error);









