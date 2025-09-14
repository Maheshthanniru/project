-- Complete Fix for Deleted Records Not Showing in Approve Records
-- Run this in your Supabase SQL Editor to fix the issue

-- Step 1: Check current state
SELECT 'Current RLS policies for deleted_cash_book:' as status;
SELECT * FROM pg_policies WHERE tablename = 'deleted_cash_book';

-- Step 2: Check if deleted_cash_book table exists and has data
SELECT 'Checking deleted_cash_book table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deleted_cash_book' 
ORDER BY ordinal_position;

-- Step 3: Count current deleted records
SELECT 'Current deleted records count:' as status;
SELECT COUNT(*) as total_deleted_records FROM deleted_cash_book;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Admin can update deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Admin can insert deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Allow all operations on deleted_cash_book" ON deleted_cash_book;

-- Step 5: Create comprehensive RLS policies for deleted_cash_book
-- Policy 1: Allow all authenticated users to read deleted records
CREATE POLICY "Authenticated users can read deleted cash book" ON deleted_cash_book
  FOR SELECT TO authenticated USING (true);

-- Policy 2: Allow all authenticated users to insert deleted records (for deletion process)
CREATE POLICY "Authenticated users can insert deleted cash book" ON deleted_cash_book
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policy 3: Allow admins to update deleted records (for approval process)
CREATE POLICY "Admins can update deleted cash book" ON deleted_cash_book
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id::text = auth.uid()::text AND ut.user_type = 'Admin'
    )
  );

-- Policy 4: Allow admins to delete from deleted_cash_book (for permanent deletion)
CREATE POLICY "Admins can delete from deleted cash book" ON deleted_cash_book
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id::text = auth.uid()::text AND ut.user_type = 'Admin'
    )
  );

-- Step 6: Verify policies were created
SELECT 'New RLS policies created:' as status;
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'deleted_cash_book';

-- Step 7: Test access to deleted records
SELECT 'Testing access to deleted records:' as status;
SELECT COUNT(*) as accessible_deleted_records FROM deleted_cash_book;

-- Step 8: Show sample deleted records (if any exist)
SELECT 'Sample deleted records:' as status;
SELECT 
  id,
  company_name,
  acc_name,
  particulars,
  c_date,
  deleted_by,
  deleted_at,
  approved
FROM deleted_cash_book 
ORDER BY deleted_at DESC 
LIMIT 5;

-- Step 9: Check for any missing columns in deleted_cash_book
SELECT 'Checking for missing columns:' as status;
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deleted_cash_book' AND column_name = 'credit_online') THEN
    ALTER TABLE deleted_cash_book ADD COLUMN credit_online decimal(15,2) DEFAULT 0;
    RAISE NOTICE 'Added credit_online column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deleted_cash_book' AND column_name = 'credit_offline') THEN
    ALTER TABLE deleted_cash_book ADD COLUMN credit_offline decimal(15,2) DEFAULT 0;
    RAISE NOTICE 'Added credit_offline column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deleted_cash_book' AND column_name = 'debit_online') THEN
    ALTER TABLE deleted_cash_book ADD COLUMN debit_online decimal(15,2) DEFAULT 0;
    RAISE NOTICE 'Added debit_online column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deleted_cash_book' AND column_name = 'debit_offline') THEN
    ALTER TABLE deleted_cash_book ADD COLUMN debit_offline decimal(15,2) DEFAULT 0;
    RAISE NOTICE 'Added debit_offline column';
  END IF;
  
  RAISE NOTICE 'Column check completed';
END $$;

-- Step 10: Final verification
SELECT 'Final verification - All deleted records accessible:' as status;
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN approved = true OR approved = 'true' THEN 1 END) as approved_records,
  COUNT(CASE WHEN approved = false OR approved = 'false' OR approved IS NULL THEN 1 END) as pending_records,
  COUNT(CASE WHEN approved = 'rejected' THEN 1 END) as rejected_records
FROM deleted_cash_book;

-- Success message
SELECT 'SUCCESS: Deleted records should now be visible in Approve Records page!' as status;

