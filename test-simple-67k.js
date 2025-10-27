// Simple test script to verify 67k data fix (no external dependencies)
const http = require('http');

console.log('🧪 Testing 67k Data Fix (Simple Version)...\n');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(300000); // 5 minutes timeout
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🔄 Testing API endpoint...');
    
    // Clear cache first
    try {
      await makeRequest('http://localhost:3000/api/balance-sheet/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Cache cleared');
    } catch (error) {
      console.log('⚠️ Could not clear cache (server might not be running)');
    }
    
    // Test the API
    const startTime = Date.now();
    const response = await makeRequest('http://localhost:3000/api/balance-sheet');
    const endTime = Date.now();
    
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = response.data;
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ API Response received in ${duration.toFixed(2)} seconds`);
    console.log(`📊 Record Count: ${data.recordCount || 'Unknown'}`);
    console.log(`📊 Account Count: ${data.balanceSheetData?.length || 0}`);
    console.log(`📊 Total Credit: ₹${data.totals?.totalCredit?.toLocaleString() || '0'}`);
    console.log(`📊 Total Debit: ₹${data.totals?.totalDebit?.toLocaleString() || '0'}`);
    console.log(`📊 Balance: ₹${data.totals?.balanceRs?.toLocaleString() || '0'}`);
    console.log(`📊 Cached: ${data.cached ? 'Yes' : 'No'}`);
    console.log(`📊 Fallback: ${data.fallback ? 'Yes' : 'No'}`);
    
    // Check if we're getting a reasonable amount of data
    if (data.recordCount && data.recordCount > 50000) {
      console.log('🎉 SUCCESS: Large dataset detected (>50k records)');
    } else if (data.recordCount && data.recordCount > 10000) {
      console.log('✅ GOOD: Medium dataset detected (>10k records)');
    } else if (data.recordCount && data.recordCount > 1000) {
      console.log('⚠️ WARNING: Small dataset detected (<10k records)');
    } else {
      console.log('❌ ERROR: Very small dataset detected (<1k records)');
    }
    
    // Show sample accounts
    if (data.balanceSheetData && data.balanceSheetData.length > 0) {
      console.log('\n📋 Sample accounts:');
      data.balanceSheetData.slice(0, 5).forEach((acc, index) => {
        console.log(`   ${index + 1}. ${acc.accountName}: Credit ₹${acc.credit.toLocaleString()}, Debit ₹${acc.debit.toLocaleString()}, Balance ₹${acc.balance.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Server is not running. Please start the server with: node server.js');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Request timed out. The server might be processing a large dataset.');
    }
  }
}

// Run the test
testAPI().catch(console.error);






