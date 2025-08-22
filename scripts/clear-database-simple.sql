-- Simple Database Clear Script
-- Run this in your Supabase SQL Editor to delete all existing data

-- Clear all data from tables
DELETE FROM cash_book;
DELETE FROM deleted_cash_book;
DELETE FROM edit_cash_book;
DELETE FROM company_main_sub_acc;
DELETE FROM company_main_accounts;
DELETE FROM companies;
DELETE FROM bank_guarantees;
DELETE FROM vehicles;
DELETE FROM drivers;

-- Reset auto-increment sequences
ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bank_guarantees_sno_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehicles_sno_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS drivers_sno_seq RESTART WITH 1;

-- Show confirmation
SELECT 'Database cleared successfully! All data deleted.' as message;

