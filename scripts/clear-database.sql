-- Clear All Database Data Script
-- Run this in your Supabase SQL Editor to delete all existing data

-- Disable Row Level Security temporarily for cleanup
ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_guarantees DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- Delete all data from tables (in correct order to avoid foreign key issues)
-- 1. Delete cash book entries
DELETE FROM cash_book;

-- 2. Delete deleted cash book entries
DELETE FROM deleted_cash_book;

-- 3. Delete edit audit logs
DELETE FROM edit_cash_book;

-- 4. Delete sub accounts
DELETE FROM company_main_sub_acc;

-- 5. Delete main accounts
DELETE FROM company_main_accounts;

-- 6. Delete companies
DELETE FROM companies;

-- 7. Delete bank guarantees
DELETE FROM bank_guarantees;

-- 8. Delete vehicles
DELETE FROM vehicles;

-- 9. Delete drivers
DELETE FROM drivers;

-- Note: Users table is NOT cleared to preserve admin accounts

-- Re-enable Row Level Security
ALTER TABLE cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_sub_acc ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Reset sequences if they exist
-- This ensures new entries start from 1
DO $$
BEGIN
    -- Reset cash_book sno sequence
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_book' AND column_name = 'sno') THEN
        ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;
    END IF;
    
    -- Reset bank_guarantees sno sequence
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_guarantees' AND column_name = 'sno') THEN
        ALTER SEQUENCE IF EXISTS bank_guarantees_sno_seq RESTART WITH 1;
    END IF;
    
    -- Reset vehicles sno sequence
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'sno') THEN
        ALTER SEQUENCE IF EXISTS vehicles_sno_seq RESTART WITH 1;
    END IF;
    
    -- Reset drivers sno sequence
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'sno') THEN
        ALTER SEQUENCE IF EXISTS drivers_sno_seq RESTART WITH 1;
    END IF;
END $$;

-- Show confirmation
SELECT 
    'Database cleared successfully!' as status,
    'All data has been deleted. You can now upload your CSV file.' as message;

