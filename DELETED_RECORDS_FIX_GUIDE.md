# Fix Guide: Deleted Records Not Showing in Approve Records

## 🚨 Problem Description

Deleted records are not appearing in the Approve Records section, even though they exist in the database. This is preventing users from approving or rejecting deleted records.

## 🔍 Root Cause

The issue is caused by **missing Row Level Security (RLS) policies** for the `deleted_cash_book` table. Without proper RLS policies, users cannot access the deleted records, even though the table exists and contains data.

## 🛠️ Solution

### Step 1: Run the Database Fix Script

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to **SQL Editor**

2. **Run the Fix Script**
   - Copy the entire content of `fix-deleted-records-complete.sql`
   - Paste it in the SQL Editor
   - Click **Run** to execute the script

3. **Verify the Fix**
   - The script will show you the current state
   - It will create the necessary RLS policies
   - It will verify that deleted records are now accessible

### Step 2: Test the Fix

1. **Run the Test Script**
   ```bash
   cd project
   node test-deleted-records-fix.js
   ```

2. **Check the Approve Records Page**
   - Open your application
   - Navigate to the Approve Records page
   - You should now see deleted records in the "Deleted Records" section

## 📋 What the Fix Does

### 1. Creates RLS Policies
- **Read Access**: All authenticated users can read deleted records
- **Insert Access**: All authenticated users can insert deleted records (for deletion process)
- **Update Access**: Only admins can update deleted records (for approval process)
- **Delete Access**: Only admins can permanently delete from deleted_cash_book

### 2. Adds Missing Columns
- Adds `credit_online`, `credit_offline`, `debit_online`, `debit_offline` columns if missing
- Ensures table structure matches the main `cash_book` table

### 3. Verifies Access
- Tests that deleted records are now accessible
- Shows approval status distribution
- Confirms the ApproveRecords component can fetch deleted records

## 🔧 Technical Details

### RLS Policies Created

```sql
-- Allow all authenticated users to read deleted records
CREATE POLICY "Authenticated users can read deleted cash book" ON deleted_cash_book
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert deleted records
CREATE POLICY "Authenticated users can insert deleted cash book" ON deleted_cash_book
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow admins to update deleted records (for approval)
CREATE POLICY "Admins can update deleted cash book" ON deleted_cash_book
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id::text = auth.uid()::text AND ut.user_type = 'Admin'
    )
  );

-- Allow admins to delete from deleted_cash_book
CREATE POLICY "Admins can delete from deleted cash book" ON deleted_cash_book
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id::text = auth.uid()::text AND ut.user_type = 'Admin'
    )
  );
```

### How ApproveRecords Component Works

1. **Fetches Deleted Records**: Uses `supabaseDB.getDeletedCashBook()` to get all deleted records
2. **Applies Filters**: Filters by date, company, and staff
3. **Shows Pending**: Only shows deleted records that haven't been approved yet
4. **Displays in Table**: Shows deleted records in a separate table below the main records

## 🧪 Testing

### Manual Testing Steps

1. **Delete a Record**
   - Go to any page where you can delete records
   - Delete a record
   - Note the record details

2. **Check Approve Records**
   - Navigate to Approve Records page
   - Look for the "Deleted Records" section
   - Verify the deleted record appears

3. **Test Approval Process**
   - Try to approve/reject the deleted record
   - Verify the status changes correctly

### Automated Testing

Run the test script to verify everything works:

```bash
node test-deleted-records-fix.js
```

## 🚨 Troubleshooting

### Issue: "Permission denied" error
**Solution**: Run the fix script to create RLS policies

### Issue: "Table doesn't exist" error
**Solution**: Run the main migration script first (`supabase/migrations/20250707174204_snowy_crystal.sql`)

### Issue: Deleted records still not showing
**Solution**: 
1. Check browser console for errors
2. Verify RLS policies were created successfully
3. Ensure you're logged in as an authenticated user

### Issue: Can't approve deleted records
**Solution**: Ensure you're logged in as an Admin user (not Operator)

## 📊 Expected Results

After applying the fix:

- ✅ Deleted records appear in Approve Records page
- ✅ Users can see pending deleted records
- ✅ Admins can approve/reject deleted records
- ✅ Approval status is properly tracked
- ✅ No permission errors in browser console

## 🔄 Maintenance

### Regular Checks

1. **Monitor RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'deleted_cash_book';
   ```

2. **Check Deleted Records Count**
   ```sql
   SELECT COUNT(*) FROM deleted_cash_book;
   ```

3. **Verify Approval Status Distribution**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(CASE WHEN approved = true THEN 1 END) as approved,
     COUNT(CASE WHEN approved = false OR approved IS NULL THEN 1 END) as pending,
     COUNT(CASE WHEN approved = 'rejected' THEN 1 END) as rejected
   FROM deleted_cash_book;
   ```

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify the fix script ran successfully
3. Test with the provided test script
4. Check Supabase dashboard for any alerts
5. Contact support if the issue persists

---

**Status**: ✅ Fix available - Run `fix-deleted-records-complete.sql` in Supabase SQL Editor

