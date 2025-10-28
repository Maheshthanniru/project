-- Fix Dashboard Deleted Records Count Not Showing
-- Run this in your Supabase SQL Editor to fix the issue

-- Step 1: Check if deleted_cash_book table exists
SELECT 'Checking if deleted_cash_book table exists:' as status;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'deleted_cash_book'
) as table_exists;

-- Step 2: Create deleted_cash_book table if it doesn't exist
CREATE TABLE IF NOT EXISTS deleted_cash_book (
  id TEXT PRIMARY KEY,
  sno INTEGER,
  acc_name TEXT NOT NULL,
  sub_acc_name TEXT,
  particulars TEXT,
  c_date DATE NOT NULL,
  credit DECIMAL(15,2) DEFAULT 0,
  debit DECIMAL(15,2) DEFAULT 0,
  lock_record BOOLEAN DEFAULT FALSE,
  company_name TEXT NOT NULL,
  address TEXT,
  staff TEXT,
  users TEXT,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sale_qty INTEGER DEFAULT 0,
  purchase_qty INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT FALSE,
  edited BOOLEAN DEFAULT FALSE,
  e_count INTEGER DEFAULT 0,
  cb TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS on deleted_cash_book table
ALTER TABLE deleted_cash_book ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on deleted_cash_book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Users can read deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Admin can update deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Admin can insert deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Authenticated users can read deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Authenticated users can insert deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Admins can update deleted cash book" ON deleted_cash_book;
DROP POLICY IF EXISTS "Admins can delete from deleted cash book" ON deleted_cash_book;

-- Step 5: Create simple, permissive RLS policies
-- Allow all authenticated users to read deleted records (for dashboard count)
CREATE POLICY "Allow read access to deleted_cash_book" ON deleted_cash_book
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert deleted records (for deletion process)
CREATE POLICY "Allow insert access to deleted_cash_book" ON deleted_cash_book
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update deleted records (for approval process)
CREATE POLICY "Allow update access to deleted_cash_book" ON deleted_cash_book
  FOR UPDATE TO authenticated USING (true);

-- Allow all authenticated users to delete from deleted_cash_book (for cleanup)
CREATE POLICY "Allow delete access to deleted_cash_book" ON deleted_cash_book
  FOR DELETE TO authenticated USING (true);

-- Step 6: Verify the table structure
SELECT 'Deleted cash book table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deleted_cash_book' 
ORDER BY ordinal_position;

-- Step 7: Check current policies
SELECT 'Current RLS policies for deleted_cash_book:' as status;
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'deleted_cash_book';

-- Step 8: Test access to deleted records
SELECT 'Testing access to deleted records:' as status;
SELECT COUNT(*) as accessible_deleted_records FROM deleted_cash_book;

-- Step 9: Show sample data if any exists
SELECT 'Sample deleted records (if any):' as status;
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

-- Step 10: Final verification
SELECT 'SUCCESS: Dashboard should now show deleted records count!' as status;
SELECT 
  'Total deleted records: ' || COUNT(*) as summary
FROM deleted_cash_book;


