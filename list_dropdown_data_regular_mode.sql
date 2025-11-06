-- =====================================================
-- List All Dropdown Data from Regular Mode Tables
-- This script shows all data that appears in dropdowns in Regular Mode
-- =====================================================

-- =====================================================
-- 1. List All Companies
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 ALL COMPANIES (from companies table)';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  id,
  company_name,
  address,
  created_at
FROM public.companies
ORDER BY company_name;

-- Get count
DO $$
DECLARE
  company_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO company_count FROM public.companies;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total Companies: %', company_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 2. List All Main Accounts (from company_main_accounts)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 ALL MAIN ACCOUNTS (from company_main_accounts table)';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  id,
  company_name,
  acc_name,
  created_at
FROM public.company_main_accounts
ORDER BY company_name, acc_name;

-- Get count and unique count
DO $$
DECLARE
  total_count INTEGER;
  unique_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.company_main_accounts;
  SELECT COUNT(DISTINCT acc_name) INTO unique_count FROM public.company_main_accounts;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total Main Account Records: %', total_count;
  RAISE NOTICE '✅ Unique Main Account Names: %', unique_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 3. List All Distinct Main Account Names (what shows in dropdown)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 DISTINCT MAIN ACCOUNT NAMES (what appears in dropdown)';
  RAISE NOTICE '========================================';
END $$;

SELECT DISTINCT
  acc_name
FROM public.company_main_accounts
WHERE acc_name IS NOT NULL 
  AND acc_name != ''
ORDER BY acc_name;

-- Get count
DO $$
DECLARE
  distinct_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT acc_name) INTO distinct_count 
  FROM public.company_main_accounts
  WHERE acc_name IS NOT NULL AND acc_name != '';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Distinct Main Account Names: %', distinct_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 4. List All Sub Accounts (from company_main_sub_acc)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 ALL SUB ACCOUNTS (from company_main_sub_acc table)';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  id,
  company_name,
  acc_name,
  sub_acc,
  created_at
FROM public.company_main_sub_acc
ORDER BY company_name, acc_name, sub_acc;

-- Get count and unique count
DO $$
DECLARE
  total_count INTEGER;
  unique_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.company_main_sub_acc;
  SELECT COUNT(DISTINCT sub_acc) INTO unique_count 
  FROM public.company_main_sub_acc
  WHERE sub_acc IS NOT NULL AND sub_acc != '';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total Sub Account Records: %', total_count;
  RAISE NOTICE '✅ Unique Sub Account Names: %', unique_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 5. List All Distinct Sub Account Names (what shows in dropdown)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 DISTINCT SUB ACCOUNT NAMES (what appears in dropdown)';
  RAISE NOTICE '========================================';
END $$;

SELECT DISTINCT
  sub_acc
FROM public.company_main_sub_acc
WHERE sub_acc IS NOT NULL 
  AND sub_acc != ''
ORDER BY sub_acc;

-- Get count
DO $$
DECLARE
  distinct_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT sub_acc) INTO distinct_count 
  FROM public.company_main_sub_acc
  WHERE sub_acc IS NOT NULL AND sub_acc != '';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Distinct Sub Account Names: %', distinct_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 6. List All Distinct Staff Names (from cash_book)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 DISTINCT STAFF NAMES (from cash_book table)';
  RAISE NOTICE '========================================';
END $$;

SELECT DISTINCT
  staff
FROM public.cash_book
WHERE staff IS NOT NULL 
  AND staff != ''
  AND staff != ' '
ORDER BY staff;

-- Get count
DO $$
DECLARE
  staff_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT staff) INTO staff_count 
  FROM public.cash_book
  WHERE staff IS NOT NULL AND staff != '' AND staff != ' ';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Distinct Staff Names: %', staff_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 7. Summary Report
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 DROPDOWN DATA SUMMARY (Regular Mode)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Companies: % records', (SELECT COUNT(*) FROM public.companies);
  RAISE NOTICE 'Main Accounts: % total records, % unique names', 
    (SELECT COUNT(*) FROM public.company_main_accounts),
    (SELECT COUNT(DISTINCT acc_name) FROM public.company_main_accounts WHERE acc_name IS NOT NULL AND acc_name != '');
  RAISE NOTICE 'Sub Accounts: % total records, % unique names', 
    (SELECT COUNT(*) FROM public.company_main_sub_acc),
    (SELECT COUNT(DISTINCT sub_acc) FROM public.company_main_sub_acc WHERE sub_acc IS NOT NULL AND sub_acc != '');
  RAISE NOTICE 'Staff Names: % distinct names', 
    (SELECT COUNT(DISTINCT staff) FROM public.cash_book WHERE staff IS NOT NULL AND staff != '' AND staff != ' ');
  RAISE NOTICE '========================================';
END $$;

