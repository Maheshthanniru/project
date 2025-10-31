-- Add payment_mode column to cash_book table
-- Run this migration in your Supabase SQL editor

ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS payment_mode TEXT;

-- Add comment for documentation
COMMENT ON COLUMN cash_book.payment_mode IS 'Payment mode: Cash, Bank Transfer, or other payment methods';

-- Create index for better performance on payment mode filtering
CREATE INDEX IF NOT EXISTS idx_cash_book_payment_mode ON cash_book(payment_mode);

