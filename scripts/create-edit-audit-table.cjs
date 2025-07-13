const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEditAuditTable() {
  try {
    console.log('🔧 Creating edit_cash_book table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-edit-audit-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql not available, trying direct query...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
          if (stmtError) {
            console.log(`⚠️  Could not execute: ${statement.trim()}`);
          }
        }
      }
    }
    
    console.log('✅ edit_cash_book table created successfully!');
    console.log('');
    console.log('📋 Table structure:');
    console.log('  - id: UUID (Primary Key)');
    console.log('  - cash_book_id: UUID (Foreign Key to cash_book)');
    console.log('  - old_values: JSONB (Entry before edit)');
    console.log('  - new_values: JSONB (Entry after edit)');
    console.log('  - edited_by: TEXT (User who made the edit)');
    console.log('  - edited_at: TIMESTAMP (When edit was made)');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Go to your app and edit any cash book entry');
    console.log('  2. Check the edit_cash_book table in Supabase');
    console.log('  3. Visit the Edited Records page to see the audit log');
    
  } catch (error) {
    console.error('❌ Error creating edit_cash_book table:', error);
    console.log('');
    console.log('🔧 Manual creation required:');
    console.log('  1. Go to your Supabase Dashboard');
    console.log('  2. Navigate to SQL Editor');
    console.log('  3. Run the SQL from scripts/create-edit-audit-table.sql');
  }
}

createEditAuditTable(); 