# Manual Test Guide: Delete and Approve Records

## 🧪 Testing the Delete and Approve Functionality

Since we don't have environment variables set up, here's a manual testing guide to verify that deleted records appear in the approve records section.

## 📋 Step-by-Step Testing Process

### Step 1: Fix the Database First

**IMPORTANT**: Before testing, you must run the database fix script:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to **SQL Editor**

2. **Run the Fix Script**
   - Copy the entire content of `fix-deleted-records-complete.sql`
   - Paste it in the SQL Editor
   - Click **Run** to execute

3. **Verify Success**
   - Look for "SUCCESS: Deleted records should now be visible in Approve Records page!" message

### Step 2: Create a Test Record

1. **Open your application**
2. **Navigate to any page where you can create records** (e.g., New Entry page)
3. **Create a test record with these details:**
   - Account Name: `Test Account`
   - Sub Account: `Test Sub Account`
   - Particulars: `Test Delete and Approve Record`
   - Date: Today's date
   - Credit: `1000`
   - Debit: `0`
   - Company: `Thirumala Cotton Mills`
   - Staff: `Test Staff`

4. **Save the record**
5. **Note the record ID or details**

### Step 3: Delete the Test Record

1. **Find the test record you just created**
2. **Delete it** (using the delete button/function)
3. **Confirm the deletion**

### Step 4: Check Deleted Records in Database

1. **Go to Supabase Dashboard**
2. **Navigate to Table Editor**
3. **Select `deleted_cash_book` table**
4. **Look for your test record**
5. **Verify it has:**
   - Same particulars: `Test Delete and Approve Record`
   - `deleted_by` field populated
   - `deleted_at` timestamp
   - `approved` field (should be `false` or `null`)

### Step 5: Check Approve Records Page

1. **Open your application**
2. **Navigate to Approve Records page**
3. **Look for the "Deleted Records" section** (below the main records table)
4. **Verify you can see:**
   - Your test record in the deleted records table
   - Record shows as "Pending" status
   - All record details are visible

### Step 6: Test Approval Process

1. **In the Approve Records page**
2. **Find your test record in the deleted records section**
3. **Try to approve it** (click approve button)
4. **Verify the status changes**
5. **Check the database to confirm the `approved` field is updated**

## 🔍 What to Look For

### ✅ Success Indicators

- **Deleted record appears in `deleted_cash_book` table**
- **Deleted record shows in Approve Records page**
- **Record shows as "Pending" status**
- **You can approve/reject the deleted record**
- **No permission errors in browser console**

### ❌ Failure Indicators

- **"Permission denied" errors**
- **Deleted records table is empty**
- **Deleted records don't appear in Approve Records page**
- **Console shows RLS policy errors**

## 🚨 Troubleshooting

### Issue: Deleted records don't appear in Approve Records page

**Solution**: Run the `fix-deleted-records-complete.sql` script in Supabase SQL Editor

### Issue: "Permission denied" when accessing deleted records

**Solution**: The RLS policies are not properly configured. Run the fix script.

### Issue: Can't approve deleted records

**Solution**: Ensure you're logged in as an Admin user (not Operator)

### Issue: Deleted record doesn't appear in deleted_cash_book table

**Solution**: Check the deletion process in your application code

## 📊 Expected Results

After following this guide:

1. ✅ **Test record is created successfully**
2. ✅ **Test record is deleted successfully**
3. ✅ **Deleted record appears in `deleted_cash_book` table**
4. ✅ **Deleted record appears in Approve Records page**
5. ✅ **You can approve/reject the deleted record**
6. ✅ **Approval status is properly tracked**

## 🔧 Database Verification Queries

Run these queries in Supabase SQL Editor to verify everything is working:

### Check if deleted records exist:
```sql
SELECT COUNT(*) as total_deleted_records FROM deleted_cash_book;
```

### Check approval status distribution:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN approved = true THEN 1 END) as approved,
  COUNT(CASE WHEN approved = false OR approved IS NULL THEN 1 END) as pending,
  COUNT(CASE WHEN approved = 'rejected' THEN 1 END) as rejected
FROM deleted_cash_book;
```

### Check RLS policies:
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'deleted_cash_book';
```

## 📝 Test Checklist

- [ ] Database fix script executed successfully
- [ ] Test record created
- [ ] Test record deleted
- [ ] Deleted record appears in `deleted_cash_book` table
- [ ] Deleted record appears in Approve Records page
- [ ] Can approve/reject deleted record
- [ ] Approval status updates correctly
- [ ] No console errors

## 🎯 Next Steps

Once you've confirmed the manual test works:

1. **Train users** on the new functionality
2. **Document the process** for your team
3. **Set up monitoring** to ensure deleted records are properly tracked
4. **Regular cleanup** of old approved/rejected deleted records

---

**Status**: Ready for manual testing - Follow the steps above to verify the functionality works correctly.

