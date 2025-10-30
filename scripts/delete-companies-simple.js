import { createClient } from '@supabase/supabase-js';

// Supabase configuration (using the same credentials as in supabase.ts)
const supabaseUrl = 'https://qjqjqjqjqjqjqj.supabase.co';
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

async function deleteCompanies() {
  console.log('🗑️ Deleting empty companies...');
  console.log('📋 Companies to delete:', companiesToDelete);

  try {
    // Delete companies from companies table
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
    if (deletedCompanies && deletedCompanies.length > 0) {
      console.log('📋 Deleted company names:', deletedCompanies.map(c => c.company_name));
    }

    // Show remaining companies count
    const { count: totalCount, error: countError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Total companies remaining in database: ${totalCount}`);
    }

  } catch (error) {
    console.error('❌ Error in deleteCompanies:', error);
  }
}

// Run the deletion
deleteCompanies();
