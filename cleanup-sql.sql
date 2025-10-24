-- Complete Database Cleanup SQL Script
-- Run this in your Supabase SQL Editor to remove all data

-- First, disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all data from all tables
DELETE FROM cash_book;
DELETE FROM companies;
DELETE FROM company_main_accounts;
DELETE FROM company_main_sub_acc;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset auto-increment sequences
ALTER SEQUENCE cash_book_sno_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'cash_book' as table_name, COUNT(*) as record_count FROM cash_book
UNION ALL
SELECT 'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL
SELECT 'company_main_accounts' as table_name, COUNT(*) as record_count FROM company_main_accounts
UNION ALL
SELECT 'company_main_sub_acc' as table_name, COUNT(*) as record_count FROM company_main_sub_acc;

-- All tables should show 0 records after cleanup


















