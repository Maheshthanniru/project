-- Create the edit_cash_book table for audit logging
CREATE TABLE IF NOT EXISTS edit_cash_book (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_book_id UUID REFERENCES cash_book(id) ON DELETE CASCADE,
  old_values JSONB,
  new_values JSONB,
  edited_by TEXT,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_edit_cash_book_cash_book_id ON edit_cash_book(cash_book_id);
CREATE INDEX IF NOT EXISTS idx_edit_cash_book_edited_at ON edit_cash_book(edited_at DESC);
CREATE INDEX IF NOT EXISTS idx_edit_cash_book_edited_by ON edit_cash_book(edited_by);

-- Add RLS policies if needed (optional)
-- ALTER TABLE edit_cash_book ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON edit_cash_book TO authenticated;
GRANT ALL ON edit_cash_book TO anon; 