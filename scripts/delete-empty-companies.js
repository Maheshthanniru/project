import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoyMDE1NTc1OTk5fQ.example';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Companies to delete (from the images)
const companiesToDelete = [
  'vijajajj',
  'vijayyy', 
  'Vijayyyy',
  'CompanyName',
  'okok',
  'pranay'
];

async function deleteEmptyCompanies() {
  console.log('🗑️ Starting deletion of empty companies...');
  console.log('📋 Companies to delete:', companiesToDelete);

  try {
    // First, verify these companies have no data in cash_book
    console.log('\n🔍 Checking if companies have data in cash_book...');
    
    for (const companyName of companiesToDelete) {
      const { data: cashBookData, error: cashBookError } = await supabase
        .from('cash_book')
        .select('id')
        .eq('company_name', companyName)
        .limit(1);

      if (cashBookError) {
        console.error(`❌ Error checking cash_book for ${companyName}:`, cashBookError);
        continue;
      }

      if (cashBookData && cashBookData.length > 0) {
        console.log(`⚠️ Warning: ${companyName} has ${cashBookData.length} entries in cash_book. Skipping deletion.`);
        continue;
      }

      console.log(`✅ ${companyName} has no data in cash_book. Safe to delete.`);
    }

    // Delete companies from companies table
    console.log('\n🗑️ Deleting companies from companies table...');
    
    const { data: deletedCompanies, error: deleteError } = await supabase
      .from('companies')
      .delete()
      .in('company_name', companiesToDelete)
      .select();

    if (deleteError) {
      console.error('❌ Error deleting companies:', deleteError);
      return;
    }

    console.log('✅ Successfully deleted companies:', deletedCompanies?.length || 0);
    console.log('📋 Deleted company names:', deletedCompanies?.map(c => c.company_name) || []);

    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const { data: remainingCompanies, error: verifyError } = await supabase
      .from('companies')
      .select('company_name')
      .in('company_name', companiesToDelete);

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
      return;
    }

    if (remainingCompanies && remainingCompanies.length > 0) {
      console.log('⚠️ Some companies still exist:', remainingCompanies.map(c => c.company_name));
    } else {
      console.log('✅ All specified companies have been successfully deleted!');
    }

    // Show remaining companies count
    const { count: totalCount, error: countError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Total companies remaining in database: ${totalCount}`);
    }

  } catch (error) {
    console.error('❌ Error in deleteEmptyCompanies:', error);
  }
}

// Run the deletion
deleteEmptyCompanies();
