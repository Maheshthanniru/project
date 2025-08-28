# NewEntry Component Troubleshooting Guide

## Problem: "New entry is not working, database is not fetching"

This guide helps you fix database connectivity issues in the NewEntry component.

## Quick Fix Steps

### Step 1: Test Database Connection
1. **Open the app** at `http://localhost:5173`
2. **Login** with: `Bukka Ramesh` / `ramesh@1976`
3. **Go to New Entry** page
4. **Click "Test DB"** button in the header
5. **Check browser console** (F12) for results

### Step 2: Refresh Dropdown Data
1. **Click "Refresh Data"** button
2. **Check console** for loading messages
3. **Look for**:
   - ✅ "Companies loaded: X"
   - ✅ "Users loaded: X"
   - ✅ "Dropdown data loaded successfully"

### Step 3: Check for Errors
If you see errors in console:
- **"Failed to fetch"** = Network/RLS issue
- **"Permission denied"** = RLS blocking access
- **"Table not found"** = Database schema issue

## Common Issues and Solutions

### Issue 1: "Failed to fetch" Error
**Cause**: Network connectivity or RLS blocking access

**Solution**:
1. **Disable RLS** in Supabase Dashboard:
   ```sql
   ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
   ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;
   ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
   ```

2. **Check network connectivity**:
   - Try mobile hotspot
   - Disable VPN/proxy
   - Clear browser cache

### Issue 2: Empty Dropdown Lists
**Cause**: No data in database or RLS blocking access

**Solution**:
1. **Check if data exists** in Supabase Dashboard
2. **Add sample data** if tables are empty:
   ```sql
   -- Add sample company
   INSERT INTO companies (company_name, address) 
   VALUES ('Sample Company', '123 Sample St');
   
   -- Add sample account
   INSERT INTO company_main_accounts (company_name, acc_name) 
   VALUES ('Sample Company', 'Cash');
   
   -- Add sample user
   INSERT INTO users (username, email, is_active) 
   VALUES ('admin', 'admin@example.com', true);
   ```

### Issue 3: Form Not Submitting
**Cause**: Validation errors or database connection issues

**Solution**:
1. **Fill required fields**:
   - Company Name
   - Main Account
   - Particulars
   - Credit OR Debit amount

2. **Check console** for validation errors
3. **Test database connection** first

## Debug Information

### Console Messages to Look For:
- ✅ `🔍 Loading dropdown data...`
- ✅ `📊 Companies loaded: X`
- ✅ `👥 Users loaded: X`
- ✅ `✅ Dropdown data loaded successfully`
- ❌ `❌ Error loading dropdown data:`
- ❌ `Database connection failed:`

### Database Tables Required:
- `companies` - Company information
- `company_main_accounts` - Main accounts per company
- `company_main_sub_acc` - Sub accounts per main account
- `users` - User information
- `cash_book` - Cash book entries

## Testing Steps

### 1. Basic Connectivity Test
```javascript
// In browser console (F12)
const { data, error } = await supabase.from('companies').select('count');
console.log('Test result:', { data, error });
```

### 2. Data Loading Test
```javascript
// Test companies
const companies = await supabaseDB.getCompanies();
console.log('Companies:', companies);

// Test users
const users = await supabaseDB.getUsers();
console.log('Users:', users);
```

### 3. Form Submission Test
1. Fill in required fields
2. Submit form
3. Check console for errors
4. Verify data appears in database

## Expected Behavior

### When Working Correctly:
- ✅ **Test DB** button shows "Database connection successful"
- ✅ **Refresh Data** loads companies and users
- ✅ **Company dropdown** shows available companies
- ✅ **Account dropdown** loads when company selected
- ✅ **Form submission** creates new entry
- ✅ **Recent entries** table updates

### When Not Working:
- ❌ **Test DB** shows connection errors
- ❌ **Dropdowns** are empty
- ❌ **Form submission** fails
- ❌ **Console** shows error messages

## Contact Information

If issues persist:
1. **Check Supabase status**: https://status.supabase.com
2. **Verify RLS settings** in Supabase Dashboard
3. **Test with different network** (mobile hotspot)
4. **Check browser console** for detailed error messages

