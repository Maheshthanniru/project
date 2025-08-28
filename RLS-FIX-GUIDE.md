# RLS (Row Level Security) Fix Guide

## Problem
Data exists in Supabase but is not showing in the application due to RLS policies blocking access.

## Solution Steps

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com
2. Login to your account
3. Select your project: `pmqeegdmcrktccszgbwu`

### Step 2: Run SQL Commands
1. Go to **SQL Editor** in the left sidebar
2. Create a new query
3. Copy and paste the contents of `disable-rls-function.sql`
4. Click **Run** to execute the commands

### Step 3: Alternative - Direct RLS Disable
If the function doesn't work, run these commands directly:

```sql
-- Disable RLS for all tables
ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_guarantees DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- Check if data is accessible
SELECT COUNT(*) FROM cash_book;
SELECT * FROM cash_book LIMIT 5;
```

### Step 4: Test in Application
1. Open your application at `http://localhost:5173`
2. Go to CSV Upload page
3. Click **"Check/Disable RLS"** button
4. Click **"Test Data Access"** button
5. Check browser console for results

### Step 5: Verify Data Access
After disabling RLS, you should see:
- ✅ "RLS policies disabled successfully"
- ✅ "Data access successful! Found X records"
- ✅ Data should now be visible in all parts of the application

## Troubleshooting

### If RLS disable fails:
1. Check if you have admin privileges in Supabase
2. Try running commands one by one
3. Check the SQL Editor for error messages

### If data still doesn't show:
1. Check browser console for errors
2. Verify the Supabase URL and API key are correct
3. Check if there are any network/CORS issues

### If you need to re-enable RLS later:
```sql
-- Re-enable RLS (only if needed)
ALTER TABLE cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

## Notes
- Disabling RLS removes security restrictions
- This is suitable for development/testing
- For production, consider creating proper RLS policies instead of disabling them

