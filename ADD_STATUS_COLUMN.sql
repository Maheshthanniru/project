-- =====================================================
-- ADD STATUS COLUMN TO CASH_BOOK TABLE
-- =====================================================
-- Copy and paste this entire SQL into your Supabase Dashboard > SQL Editor
-- Then click "Run" to execute

-- Step 1: Add the status column
ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cash_book_status ON cash_book(status);

-- Step 3: Update all existing records to have 'approved' status
UPDATE cash_book 
SET status = 'approved' 
WHERE status IS NULL;

-- Step 4: Add a comment to document the column
COMMENT ON COLUMN cash_book.status IS 'Record status: approved, deleted-pending, rejected';

-- Step 5: Verify the column was added (this will show the result)
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cash_book' 
AND column_name = 'status';

-- Step 6: Show a sample of records with their status
SELECT id, sno, company_name, status 
FROM cash_book 
LIMIT 5;



