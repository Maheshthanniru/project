-- =====================================================
-- DIRECT SQL TO ADD payment_mode COLUMN
-- =====================================================
-- Copy this entire file content and paste into Supabase SQL Editor
-- =====================================================

ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS payment_mode TEXT;

COMMENT ON COLUMN cash_book.payment_mode IS 'Payment mode: Cash, Bank Transfer, or Online';

CREATE INDEX IF NOT EXISTS idx_cash_book_payment_mode ON cash_book(payment_mode);

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cash_book' 
  AND column_name = 'payment_mode';

