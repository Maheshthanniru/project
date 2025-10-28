-- Create deleted_cash_book table for soft delete functionality
-- This table stores deleted cash book entries with deletion metadata

CREATE TABLE IF NOT EXISTS deleted_cash_book (
    -- All fields from cash_book table
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
    
    -- Additional fields for deletion tracking
    deleted_by TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_deleted_cash_book_deleted_at ON deleted_cash_book(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deleted_cash_book_deleted_by ON deleted_cash_book(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_cash_book_company ON deleted_cash_book(company_name);
CREATE INDEX IF NOT EXISTS idx_deleted_cash_book_date ON deleted_cash_book(c_date);

-- Add comments for documentation
COMMENT ON TABLE deleted_cash_book IS 'Stores soft-deleted cash book entries with deletion metadata';
COMMENT ON COLUMN deleted_cash_book.deleted_by IS 'Username of the person who deleted the entry';
COMMENT ON COLUMN deleted_cash_book.deleted_at IS 'Timestamp when the entry was deleted';







