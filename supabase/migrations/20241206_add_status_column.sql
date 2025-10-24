-- Add status column to cash_book table
-- This column will track the approval status of records

ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';

-- Add an index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_cash_book_status ON cash_book(status);

-- Update existing records to have 'approved' status
UPDATE cash_book 
SET status = 'approved' 
WHERE status IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN cash_book.status IS 'Record status: approved, deleted-pending, rejected';



