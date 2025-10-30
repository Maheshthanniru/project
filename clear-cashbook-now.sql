-- IMMEDIATE CASH BOOK CLEARING SCRIPT
-- Run this in your Supabase SQL Editor to clear all cash book entries
-- while preserving companies, accounts, subaccounts, and staff data

-- Step 1: Check current data counts
SELECT 
    'BEFORE CLEARING' as status,
    (SELECT COUNT(*) FROM companies) as companies,
    (SELECT COUNT(*) FROM company_main_accounts) as main_accounts,
    (SELECT COUNT(*) FROM company_main_sub_acc) as sub_accounts,
    (SELECT COUNT(*) FROM users WHERE is_active = true) as staff,
    (SELECT COUNT(*) FROM cash_book) as cash_book_entries,
    (SELECT COUNT(*) FROM deleted_cash_book) as deleted_entries,
    (SELECT COUNT(*) FROM edit_cash_book) as edit_logs;

-- Step 2: Clear cash book data
DELETE FROM cash_book;
DELETE FROM deleted_cash_book;
DELETE FROM edit_cash_book;

-- Step 3: Reset sequence
ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;

-- Step 4: Verify clearing was successful
SELECT 
    'AFTER CLEARING' as status,
    (SELECT COUNT(*) FROM companies) as companies,
    (SELECT COUNT(*) FROM company_main_accounts) as main_accounts,
    (SELECT COUNT(*) FROM company_main_sub_acc) as sub_accounts,
    (SELECT COUNT(*) FROM users WHERE is_active = true) as staff,
    (SELECT COUNT(*) FROM cash_book) as cash_book_entries,
    (SELECT COUNT(*) FROM deleted_cash_book) as deleted_entries,
    (SELECT COUNT(*) FROM edit_cash_book) as edit_logs;

-- Step 5: Show success message
SELECT 'SUCCESS: All cash book entries cleared! Companies, accounts, subaccounts, and staff data preserved.' as result;






