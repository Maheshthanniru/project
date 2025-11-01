-- =====================================================
-- ADD payment_mode COLUMN TO cash_book TABLE
-- =====================================================
-- IMPORTANT: Copy and paste this entire SQL script into 
-- Supabase SQL Editor and click "Run"
-- =====================================================

-- Step 1: Add the payment_mode column
ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS payment_mode TEXT;

-- Step 2: Add a comment to document the column
COMMENT ON COLUMN cash_book.payment_mode IS 'Payment mode: Cash, Bank Transfer, or Online';

-- Step 3: Create an index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_cash_book_payment_mode ON cash_book(payment_mode);

-- Step 4: Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'cash_book' 
  AND column_name = 'payment_mode';

-- Expected result: You should see 1 row showing:
-- column_name: payment_mode
-- data_type: text
-- is_nullable: YES
-- column_default: NULL

