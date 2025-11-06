# ITR Tables Setup Guide

## Overview
This guide explains how to set up ITR (Income Tax Return) tables for your application. The ITR mode allows you to work with separate tables for ITR-related data while keeping all the same functionality.

## What are ITR Tables?
ITR tables are duplicate tables with `_itr` suffix that contain separate data for Income Tax Return purposes. When you toggle ITR mode in the application, all database operations automatically switch to use these ITR tables instead of the regular tables.

## Tables Created

The following ITR tables will be created:

### Core Financial Tables
- ✅ `cash_book_itr` - Main transaction ledger for ITR
- ✅ `edit_cash_book_itr` - Audit trail for ITR edits
- ✅ `original_cash_book_itr` - Backup of original ITR entries
- ✅ `deleted_cash_book_itr` - Deleted ITR records

### Account Management Tables
- ✅ `company_main_accounts_itr` - Chart of accounts for ITR
- ✅ `company_main_sub_acc_itr` - Sub-accounts for ITR

### Reporting Tables
- ✅ `balance_sheet_itr` - Balance sheet data for ITR
- ✅ `ledger_itr` - Ledger summary for ITR

### Optional Tables (if needed)
- ✅ `bank_guarantees_itr` - Bank guarantees for ITR
- ✅ `vehicles_itr` - Vehicle records for ITR
- ✅ `drivers_itr` - Driver records for ITR

### Shared Tables (No ITR versions needed)
- ❌ `companies` - Same companies for both modes
- ❌ `users` - Same users for both modes
- ❌ `user_types` - Same user types
- ❌ `features` - Same features
- ❌ `user_access` - Same access control

## Setup Instructions

### Step 1: Run the SQL Script

1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** or the **"+"** button
5. Copy the entire contents of `create_itr_tables.sql`
6. Paste it into the SQL editor
7. Click **"Run"** (or press Ctrl+Enter)
8. Wait for the success message

### Step 2: Verify Tables Created

Run this query to verify all ITR tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_itr'
ORDER BY table_name;
```

You should see all 11 ITR tables listed.

### Step 3: Test the Application

1. Start your application: `npm run dev`
2. Log in to your account
3. Look for the **"ITR Mode"** toggle button in the sidebar (above Logout)
4. Click it to toggle between Regular and ITR mode
5. When ITR mode is ON (orange), all operations use ITR tables
6. When ITR mode is OFF (blue), all operations use regular tables

## How It Works

### Mode Toggle
- The mode is stored in `localStorage` as `table_mode`
- Toggling the button switches between `'regular'` and `'itr'`
- The mode persists across page refreshes

### Automatic Table Switching
When ITR mode is enabled:
- `cash_book` → `cash_book_itr`
- `edit_cash_book` → `edit_cash_book_itr`
- `company_main_accounts` → `company_main_accounts_itr`
- And so on for all ITR tables

### Application Features
All features work the same in both modes:
- ✅ New Entry
- ✅ Edit Entry
- ✅ Daily Report
- ✅ Detailed Ledger
- ✅ Ledger Summary
- ✅ Approve Records
- ✅ Edited Records
- ✅ Deleted Records
- ✅ Balance Sheet
- ✅ CSV Upload
- ✅ Export
- ✅ Vehicles
- ✅ Bank Guarantees
- ✅ Drivers

## Database Structure

All ITR tables have the **exact same structure** as their regular counterparts:
- Same columns
- Same data types
- Same constraints
- Same foreign keys (pointing to shared tables like `companies`)
- Same indexes for performance

## Important Notes

1. **Separate Data**: ITR tables are completely separate from regular tables. Data entered in ITR mode will not appear in regular mode and vice versa.

2. **Shared Resources**: Companies, Users, and other shared tables remain the same for both modes.

3. **Foreign Keys**: ITR tables still reference shared tables (like `companies`) using foreign keys.

4. **RLS Policies**: If you have Row Level Security (RLS) enabled, you may need to create similar policies for ITR tables. The SQL script includes commented sections for enabling RLS.

5. **Backup**: Always backup your database before running migration scripts.

## Troubleshooting

### Tables Not Created
- Check for SQL errors in the Supabase SQL Editor
- Verify you have proper permissions
- Check if tables already exist (use `CREATE TABLE IF NOT EXISTS`)

### Mode Not Switching
- Clear browser localStorage: `localStorage.removeItem('table_mode')`
- Refresh the page
- Check browser console for errors

### Data Not Appearing
- Verify you're in the correct mode (check the sidebar button)
- Check if data exists in the ITR tables:
  ```sql
  SELECT COUNT(*) FROM cash_book_itr;
  ```

### Foreign Key Errors
- Ensure shared tables (like `companies`) exist
- Verify company names match between regular and ITR tables

## Next Steps

After creating the tables:
1. ✅ Test the ITR toggle button
2. ✅ Create some test data in ITR mode
3. ✅ Verify data appears only in ITR mode
4. ✅ Switch back to regular mode and verify regular data is still there
5. ✅ Test all major features in both modes

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs for database errors
3. Verify table structures match
4. Ensure all foreign key relationships are correct

