/**
 * Script to add payment_mode column to cash_book table
 * Run this with: node add-payment-mode-column.js
 */

// Get Supabase URL and Service Role Key from environment or use defaults
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pmqeegdmcrktccszgbwu.supabase.co';

// NOTE: You need to provide your SERVICE_ROLE_KEY (not anon key) for this to work
// Get it from: Supabase Dashboard > Settings > API > service_role key
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SERVICE_ROLE_KEY is required!');
  console.log('\n📋 To get your Service Role Key:');
  console.log('   1. Go to Supabase Dashboard');
  console.log('   2. Click Settings > API');
  console.log('   3. Copy the "service_role" key (keep it secret!)');
  console.log('   4. Run: SUPABASE_SERVICE_ROLE_KEY=your_key node add-payment-mode-column.js');
  console.log('\n   OR manually run the SQL in Supabase SQL Editor instead.');
  process.exit(1);
}

// Use Node.js fetch or install node-fetch
async function addPaymentModeColumn() {
  try {
    console.log('🔄 Adding payment_mode column to cash_book table...');
    
    const sql = `
      ALTER TABLE cash_book 
      ADD COLUMN IF NOT EXISTS payment_mode TEXT;
      
      COMMENT ON COLUMN cash_book.payment_mode IS 'Payment mode: Cash, Bank Transfer, or Online';
      
      CREATE INDEX IF NOT EXISTS idx_cash_book_payment_mode ON cash_book(payment_mode);
    `;
    
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      console.log('\n⚠️  Note: You may need to run the SQL manually in Supabase SQL Editor.');
      console.log('   SQL to run:');
      console.log(sql);
      return false;
    }
    
    console.log('✅ payment_mode column added successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Hard refresh your browser (Ctrl+F5)');
    console.log('   2. Create a new entry with payment mode');
    console.log('   3. Check Detailed Ledger - it should display!');
    
    return true;
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor instead.');
    return false;
  }
}

// Alternative: Direct PostgreSQL connection (requires pg library)
async function addColumnViaDirectConnection() {
  const { Client } = require('pg');
  
  // You'll need your database connection string
  // Get it from: Supabase Dashboard > Settings > Database > Connection string (URI)
  const connectionString = process.env.DATABASE_URL || '';
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found. Cannot connect directly.');
    return false;
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔄 Connected to database...');
    
    await client.query(`
      ALTER TABLE cash_book 
      ADD COLUMN IF NOT EXISTS payment_mode TEXT;
    `);
    
    await client.query(`
      COMMENT ON COLUMN cash_book.payment_mode IS 'Payment mode: Cash, Bank Transfer, or Online';
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cash_book_payment_mode ON cash_book(payment_mode);
    `);
    
    console.log('✅ payment_mode column added successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  addPaymentModeColumn().then(success => {
    if (!success) {
      console.log('\n📄 Fallback: Please run this SQL in Supabase SQL Editor:');
      console.log('\nALTER TABLE cash_book ADD COLUMN IF NOT EXISTS payment_mode TEXT;');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { addPaymentModeColumn, addColumnViaDirectConnection };

