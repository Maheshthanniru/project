-- Clear Only Cash Book Entries Script
-- This script removes all cash book entries while preserving:
-- - Companies
-- - Main Accounts (company_main_accounts)
-- - Sub Accounts (company_main_sub_acc)
-- - Staff/Users
-- - Bank Guarantees
-- - Vehicles
-- - Drivers

-- Disable Row Level Security temporarily for cash book related tables only
ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book DISABLE ROW LEVEL SECURITY;

-- Delete all cash book entries and related audit data
-- 1. Delete all cash book entries
DELETE FROM cash_book;

-- 2. Delete all deleted cash book entries (audit trail)
DELETE FROM deleted_cash_book;

-- 3. Delete all edit audit logs
DELETE FROM edit_cash_book;

-- Re-enable Row Level Security for the cleared tables
ALTER TABLE cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book ENABLE ROW LEVEL SECURITY;

-- Reset the cash book serial number sequence to start from 1
ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;

-- Show confirmation with counts of preserved data
SELECT 
    'Cash book entries cleared successfully!' as message,
    (SELECT COUNT(*) FROM companies) as companies_preserved,
    (SELECT COUNT(*) FROM company_main_accounts) as main_accounts_preserved,
    (SELECT COUNT(*) FROM company_main_sub_acc) as sub_accounts_preserved,
    (SELECT COUNT(*) FROM users WHERE is_active = true) as staff_preserved,
    (SELECT COUNT(*) FROM bank_guarantees) as bank_guarantees_preserved,
    (SELECT COUNT(*) FROM vehicles) as vehicles_preserved,
    (SELECT COUNT(*) FROM drivers) as drivers_preserved;
