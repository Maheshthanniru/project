# Data Access Fix Guide

## Problem
Data is not showing in Edit Entry form and other parts of the web application due to RLS (Row Level Security) policies blocking access.

## Quick Fix Steps

### Step 1: Disable RLS in Supabase Dashboard
1. **Go to Supabase Dashboard**: https://supabase.com
2. **Login and select your project**: `pmqeegdmcrktccszgbwu`
3. **Go to SQL Editor** (left sidebar)
4. **Run these commands**:

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

-- Verify data is accessible
SELECT COUNT(*) FROM cash_book;
SELECT * FROM cash_book LIMIT 5;
```

### Step 2: Test in Application
1. **Open your application** at `http://localhost:5173`
2. **Login** with: `Bukka Ramesh` / `ramesh@1976`
3. **Go to Edit Entry** page
4. **Click "Test Data Access"** button
5. **Check browser console** (F12) for results

### Step 3: Verify Data Loading
After disabling RLS, you should see:
- ✅ "Data access test successful! Count: X"
- ✅ "No RLS policies are blocking access"
- ✅ "Loaded X entries successfully"
- ✅ Data should now be visible in Edit Entry form

## Alternative: Use Application Buttons

### In CSV Upload Page:
1. **Go to CSV Upload** page
2. **Click "Check/Disable RLS"** button
3. **Click "Test Data Access"** button

### In Edit Entry Page:
1. **Go to Edit Entry** page
2. **Click "Test Data Access"** button
3. **Click "Refresh"** button

## Troubleshooting

### If RLS disable fails:
1. **Check admin privileges** in Supabase
2. **Run commands one by one** instead of all at once
3. **Check SQL Editor** for error messages

### If data still doesn't show:
1. **Check browser console** (F12) for errors
2. **Verify Supabase URL and API key** are correct
3. **Check network connectivity**

### If you see "Failed to fetch":
1. **Check internet connection**
2. **Disable VPN/proxy** if using one
3. **Try different network** (mobile hotspot)

## Expected Results

After fixing RLS:
- ✅ **Edit Entry form** shows all data
- ✅ **CSV Upload** works properly
- ✅ **All pages** display data correctly
- ✅ **No more "Failed to fetch"** errors

## Notes
- **RLS is a security feature** that blocks unauthorized access
- **Disabling RLS** removes security restrictions
- **Suitable for development/testing**
- **For production**, consider creating proper RLS policies instead of disabling them

