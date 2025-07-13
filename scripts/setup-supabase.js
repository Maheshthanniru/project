#!/usr/bin/env node

/**
 * Supabase Setup Script for Thirumala Business Management System
 * This script helps set up Supabase for the application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Thirumala Business Management System - Supabase Setup');
console.log('=====================================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please edit .env file with your Supabase credentials');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if Supabase migration file exists
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250707174204_snowy_crystal.sql');

if (fs.existsSync(migrationPath)) {
  console.log('✅ Supabase migration file found');
  
  // Read and display migration info
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const tableMatches = migrationContent.match(/CREATE TABLE IF NOT EXISTS (\w+)/g);
  
  if (tableMatches) {
    console.log('\n📊 Tables that will be created:');
    tableMatches.forEach(match => {
      const tableName = match.replace('CREATE TABLE IF NOT EXISTS ', '');
      console.log(`   - ${tableName}`);
    });
  }
} else {
  console.log('❌ Supabase migration file not found');
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Go to https://supabase.com and create a new project');
console.log('2. Copy your Project URL and Anon Key from Settings > API');
console.log('3. Update the .env file with your credentials');
console.log('4. Run the migration in Supabase SQL Editor');
console.log('5. Start the application with: npm run dev');
console.log('\n📖 For detailed instructions, see SUPABASE_SETUP.md');

// Check package.json for Supabase dependency
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.dependencies && packageJson.dependencies['@supabase/supabase-js']) {
    console.log('\n✅ Supabase client library is installed');
  } else {
    console.log('\n⚠️  Supabase client library not found in dependencies');
    console.log('   Run: npm install @supabase/supabase-js');
  }
}

console.log('\n🎉 Setup script completed!'); 