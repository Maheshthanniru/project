-- Check Deleted Records Status
-- Run this in your Supabase SQL Editor to verify the current state

-- 1. Check if deleted_cash_book table exists and has data
SELECT 'Checking deleted_cash_book table...' as status;
SELECT COUNT(*) as total_deleted_records FROM deleted_cash_book;

-- 2. Check RLS policies for deleted_cash_book
SELECT 'Checking RLS policies...' as status;
SELECT 
  policyname, 
  cmd, 
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'deleted_cash_book'
ORDER BY policyname;

-- 3. Check approval status distribution
SELECT 'Checking approval status distribution...' as status;
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN approved = true OR approved = 'true' THEN 1 END) as approved_records,
  COUNT(CASE WHEN approved = false OR approved = 'false' OR approved IS NULL THEN 1 END) as pending_records,
  COUNT(CASE WHEN approved = 'rejected' THEN 1 END) as rejected_records
FROM deleted_cash_book;

-- 4. Show recent deleted records (if any)
SELECT 'Recent deleted records (last 5):' as status;
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

-- 5. Check if table structure is correct
SELECT 'Checking table structure...' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deleted_cash_book' 
ORDER BY ordinal_position;

-- 6. Test access permissions
SELECT 'Testing access permissions...' as status;
-- This should work if RLS policies are correct
SELECT COUNT(*) as accessible_records FROM deleted_cash_book;

-- 7. Summary
SELECT 'SUMMARY:' as status;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'deleted_cash_book') > 0 
    THEN '✅ RLS policies exist'
    ELSE '❌ No RLS policies found - Run fix-deleted-records-complete.sql'
  END as rls_status,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM deleted_cash_book) > 0 
    THEN '✅ Deleted records exist'
    ELSE '⚠️ No deleted records found'
  END as data_status,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'deleted_cash_book') >= 20
    THEN '✅ Table structure looks correct'
    ELSE '⚠️ Table structure might be incomplete'
  END as structure_status;

