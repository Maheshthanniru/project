// Test script to verify CSV date handling fix
const fs = require('fs');
const path = require('path');

// Create a test CSV file with empty date fields
const testCsvContent = `Date,Account,Particulars,Credit,Debit,Company
2024-01-15,Cash,Sales Revenue,10000,0,ABC Company
,Bank,Office Supplies,0,500,XYZ Corp
15/01/2024,Accounts Receivable,Customer Payment,5000,0,ABC Company
,Inventory,Purchase,0,2000,Test Company
2024-12-25,Salary,Employee Payment,0,3000,HR Corp`;

const testFilePath = path.join(__dirname, 'test-csv-date-fix.csv');

// Write test CSV file
fs.writeFileSync(testFilePath, testCsvContent);

console.log('✅ Test CSV file created with empty date fields');
console.log('📁 File location:', testFilePath);
console.log('');
console.log('📋 Test CSV content:');
console.log(testCsvContent);
console.log('');
console.log('🔍 Expected behavior after fix:');
console.log('- Row 1: Should use date "2024-01-15"');
console.log('- Row 2: Should use database default (today\'s date) instead of Jan 1, 1970');
console.log('- Row 3: Should use date "2024-01-15" (parsed from DD/MM/YYYY)');
console.log('- Row 4: Should use database default (today\'s date) instead of Jan 1, 1970');
console.log('- Row 5: Should use date "2024-12-25"');
console.log('');
console.log('🚀 Upload this CSV file to test the date handling fix!');

