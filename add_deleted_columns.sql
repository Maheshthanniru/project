-- Add deleted_by and deleted_at columns to cash_book table for soft delete functionality
-- Run this script in your Supabase SQL editor to enable soft delete

-- Add deleted_by column
ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Add deleted_at column  
ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on deleted_at
CREATE INDEX IF NOT EXISTS idx_cash_book_deleted_at ON cash_book(deleted_at DESC);

-- Create index for better performance on deleted_by
CREATE INDEX IF NOT EXISTS idx_cash_book_deleted_by ON cash_book(deleted_by);

-- Add comments for documentation
COMMENT ON COLUMN cash_book.deleted_by IS 'Username of the person who deleted the entry (NULL means not deleted)';
COMMENT ON COLUMN cash_book.deleted_at IS 'Timestamp when the entry was deleted (NULL means not deleted)';













