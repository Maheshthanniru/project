-- =====================================================
-- Delete All Data from ITR Tables
-- This script deletes ALL data from ITR tables
-- =====================================================
-- 
-- ⚠️ WARNING: This will permanently delete ALL data from ITR tables!
-- Make sure you want to do this before running.
-- =====================================================

-- =====================================================
-- Delete data from ITR tables (in reverse dependency order)
-- =====================================================

-- 1. Delete from edit_cash_book_itr (references cash_book_itr)
DELETE FROM public.edit_cash_book_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from edit_cash_book_itr', deleted_count;
END $$;

-- 2. Delete from original_cash_book_itr
DELETE FROM public.original_cash_book_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from original_cash_book_itr', deleted_count;
END $$;

-- 3. Delete from deleted_cash_book_itr
DELETE FROM public.deleted_cash_book_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from deleted_cash_book_itr', deleted_count;
END $$;

-- 4. Delete from cash_book_itr (main table)
DELETE FROM public.cash_book_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from cash_book_itr', deleted_count;
END $$;

-- 5. Delete from company_main_sub_acc_itr (references company_main_accounts_itr)
DELETE FROM public.company_main_sub_acc_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from company_main_sub_acc_itr', deleted_count;
END $$;

-- 6. Delete from company_main_accounts_itr
DELETE FROM public.company_main_accounts_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from company_main_accounts_itr', deleted_count;
END $$;

-- 7. Delete from balance_sheet_itr
DELETE FROM public.balance_sheet_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from balance_sheet_itr', deleted_count;
END $$;

-- 8. Delete from ledger_itr
DELETE FROM public.ledger_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from ledger_itr', deleted_count;
END $$;

-- 9. Delete from bank_guarantees_itr
DELETE FROM public.bank_guarantees_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from bank_guarantees_itr', deleted_count;
END $$;

-- 10. Delete from vehicles_itr
DELETE FROM public.vehicles_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from vehicles_itr', deleted_count;
END $$;

-- 11. Delete from drivers_itr
DELETE FROM public.drivers_itr;
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % records from drivers_itr', deleted_count;
END $$;

-- =====================================================
-- Reset Sequences to Start from 1
-- =====================================================

-- Reset cash_book_itr_sno_seq
ALTER SEQUENCE cash_book_itr_sno_seq RESTART WITH 1;
DO $$ BEGIN RAISE NOTICE '✅ Reset cash_book_itr_sno_seq to 1'; END $$;

-- Reset deleted_cash_book_itr_sno_seq
ALTER SEQUENCE deleted_cash_book_itr_sno_seq RESTART WITH 1;
DO $$ BEGIN RAISE NOTICE '✅ Reset deleted_cash_book_itr_sno_seq to 1'; END $$;

-- Reset bank_guarantees_itr_sno_seq
ALTER SEQUENCE bank_guarantees_itr_sno_seq RESTART WITH 1;
DO $$ BEGIN RAISE NOTICE '✅ Reset bank_guarantees_itr_sno_seq to 1'; END $$;

-- Reset vehicles_itr_sno_seq
ALTER SEQUENCE vehicles_itr_sno_seq RESTART WITH 1;
DO $$ BEGIN RAISE NOTICE '✅ Reset vehicles_itr_sno_seq to 1'; END $$;

-- Reset drivers_itr_sno_seq
ALTER SEQUENCE drivers_itr_sno_seq RESTART WITH 1;
DO $$ BEGIN RAISE NOTICE '✅ Reset drivers_itr_sno_seq to 1'; END $$;

-- =====================================================
-- Summary Report
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  DATA DELETION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'cash_book_itr: % records remaining', (SELECT COUNT(*) FROM cash_book_itr);
  RAISE NOTICE 'edit_cash_book_itr: % records remaining', (SELECT COUNT(*) FROM edit_cash_book_itr);
  RAISE NOTICE 'original_cash_book_itr: % records remaining', (SELECT COUNT(*) FROM original_cash_book_itr);
  RAISE NOTICE 'deleted_cash_book_itr: % records remaining', (SELECT COUNT(*) FROM deleted_cash_book_itr);
  RAISE NOTICE 'company_main_accounts_itr: % records remaining', (SELECT COUNT(*) FROM company_main_accounts_itr);
  RAISE NOTICE 'company_main_sub_acc_itr: % records remaining', (SELECT COUNT(*) FROM company_main_sub_acc_itr);
  RAISE NOTICE 'balance_sheet_itr: % records remaining', (SELECT COUNT(*) FROM balance_sheet_itr);
  RAISE NOTICE 'ledger_itr: % records remaining', (SELECT COUNT(*) FROM ledger_itr);
  RAISE NOTICE 'bank_guarantees_itr: % records remaining', (SELECT COUNT(*) FROM bank_guarantees_itr);
  RAISE NOTICE 'vehicles_itr: % records remaining', (SELECT COUNT(*) FROM vehicles_itr);
  RAISE NOTICE 'drivers_itr: % records remaining', (SELECT COUNT(*) FROM drivers_itr);
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ All ITR table data deleted successfully!';
  RAISE NOTICE '✅ Sequences reset to start from 1';
  RAISE NOTICE '========================================';
END $$;

