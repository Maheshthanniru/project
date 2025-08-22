-- Force Clear All Database Data Script
-- Run this in your Supabase SQL Editor to delete all existing data

-- Disable Row Level Security temporarily
ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_guarantees DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- Force delete all data from tables
TRUNCATE TABLE cash_book CASCADE;
TRUNCATE TABLE deleted_cash_book CASCADE;
TRUNCATE TABLE edit_cash_book CASCADE;
TRUNCATE TABLE company_main_sub_acc CASCADE;
TRUNCATE TABLE company_main_accounts CASCADE;
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE bank_guarantees CASCADE;
TRUNCATE TABLE vehicles CASCADE;
TRUNCATE TABLE drivers CASCADE;

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

-- Reset sequences
ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bank_guarantees_sno_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehicles_sno_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS drivers_sno_seq RESTART WITH 1;

-- Show confirmation
SELECT 'Database force cleared successfully! All data deleted.' as message;

