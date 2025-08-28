-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cash_book', 'companies', 'company_main_accounts', 'company_main_sub_acc', 'users');

-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('cash_book', 'companies', 'company_main_accounts', 'company_main_sub_acc', 'users');

-- Disable RLS for cash_book table (if needed)
ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;

-- Disable RLS for companies table (if needed)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS for company_main_accounts table (if needed)
ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;

-- Disable RLS for company_main_sub_acc table (if needed)
ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;

-- Check if there are any records in cash_book
SELECT COUNT(*) as total_records FROM cash_book;

-- Show sample records from cash_book
SELECT * FROM cash_book LIMIT 5;

