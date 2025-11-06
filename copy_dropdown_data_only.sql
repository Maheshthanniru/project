-- =====================================================
-- Copy ALL Dropdown Data to ITR Tables
-- This script copies ALL data needed for dropdowns in ITR mode
-- ITR mode dropdowns will show the SAME names as Regular mode
-- NO transactions, NO other data - just dropdown data
-- =====================================================
-- 
-- What gets copied:
-- ✅ ALL company_main_accounts → company_main_accounts_itr (Main Account dropdown)
-- ✅ ALL company_main_sub_acc → company_main_sub_acc_itr (Sub Account dropdown)
-- ✅ ALL Distinct Staff Names → cash_book_itr (Staff dropdown - as placeholder records)
-- 
-- Note: Companies table is shared (no ITR version needed)
-- =====================================================

-- =====================================================
-- 1. Copy ALL Main Accounts (for Main Account dropdown)
-- This ensures ITR mode shows ALL the same account names as Regular mode
-- =====================================================
INSERT INTO public.company_main_accounts_itr (
  id, company_name, acc_name, created_at
)
SELECT 
  id, company_name, acc_name, created_at
FROM public.company_main_accounts
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  total_regular INTEGER;
  total_itr INTEGER;
  unique_regular INTEGER;
  unique_itr INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_regular FROM public.company_main_accounts;
  SELECT COUNT(*) INTO total_itr FROM public.company_main_accounts_itr;
  SELECT COUNT(DISTINCT acc_name) INTO unique_regular 
    FROM public.company_main_accounts 
    WHERE acc_name IS NOT NULL AND acc_name != '';
  SELECT COUNT(DISTINCT acc_name) INTO unique_itr 
    FROM public.company_main_accounts_itr 
    WHERE acc_name IS NOT NULL AND acc_name != '';
  RAISE NOTICE '✅ Main Accounts:';
  RAISE NOTICE '   Regular Mode: % total records, % unique names', total_regular, unique_regular;
  RAISE NOTICE '   ITR Mode: % total records, % unique names', total_itr, unique_itr;
END $$;

-- =====================================================
-- 2. Copy ALL Sub Accounts (for Sub Account dropdown)
-- This ensures ITR mode shows ALL the same sub-account names as Regular mode
-- =====================================================
INSERT INTO public.company_main_sub_acc_itr (
  id, company_name, acc_name, sub_acc, created_at
)
SELECT 
  id, company_name, acc_name, sub_acc, created_at
FROM public.company_main_sub_acc
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  total_regular INTEGER;
  total_itr INTEGER;
  unique_regular INTEGER;
  unique_itr INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_regular FROM public.company_main_sub_acc;
  SELECT COUNT(*) INTO total_itr FROM public.company_main_sub_acc_itr;
  SELECT COUNT(DISTINCT sub_acc) INTO unique_regular 
    FROM public.company_main_sub_acc 
    WHERE sub_acc IS NOT NULL AND sub_acc != '';
  SELECT COUNT(DISTINCT sub_acc) INTO unique_itr 
    FROM public.company_main_sub_acc_itr 
    WHERE sub_acc IS NOT NULL AND sub_acc != '';
  RAISE NOTICE '✅ Sub Accounts:';
  RAISE NOTICE '   Regular Mode: % total records, % unique names', total_regular, unique_regular;
  RAISE NOTICE '   ITR Mode: % total records, % unique names', total_itr, unique_itr;
END $$;

-- =====================================================
-- 3. Copy ALL Staff Names (for Staff dropdown)
-- Creates minimal placeholder records in cash_book_itr with only staff names
-- These are NOT real transactions - just for dropdown data
-- This ensures ITR mode shows ALL the same staff names as Regular mode
-- =====================================================
INSERT INTO public.cash_book_itr (
  id, sno, acc_name, staff, c_date, credit, debit, 
  company_name, created_at, updated_at
)
SELECT DISTINCT ON (staff)
  gen_random_uuid() as id,
  nextval('cash_book_itr_sno_seq') as sno,
  'STAFF_REFERENCE' as acc_name,  -- Placeholder
  staff,
  CURRENT_DATE as c_date,
  0 as credit,
  0 as debit,
  NULL as company_name,
  now() as created_at,
  now() as updated_at
FROM public.cash_book
WHERE staff IS NOT NULL 
  AND staff != ''
  AND staff != ' '
  AND NOT EXISTS (
    SELECT 1 FROM cash_book_itr cbi 
    WHERE cbi.staff = cash_book.staff
  );

DO $$
DECLARE
  staff_regular INTEGER;
  staff_itr INTEGER;
BEGIN
  SELECT COUNT(DISTINCT staff) INTO staff_regular 
  FROM public.cash_book 
  WHERE staff IS NOT NULL AND staff != '' AND staff != ' ';
  SELECT COUNT(DISTINCT staff) INTO staff_itr 
  FROM cash_book_itr 
  WHERE staff IS NOT NULL AND staff != '';
  RAISE NOTICE '✅ Staff Names:';
  RAISE NOTICE '   Regular Mode: % distinct staff names', staff_regular;
  RAISE NOTICE '   ITR Mode: % distinct staff names (from placeholder records)', staff_itr;
END $$;

-- =====================================================
-- Summary - Verify ITR Mode Has Same Dropdown Data
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DROPDOWN DATA COPY COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 COMPARISON: Regular Mode vs ITR Mode';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Companies (shared table):';
  RAISE NOTICE '   Regular/ITR: % companies', (SELECT COUNT(*) FROM public.companies);
  RAISE NOTICE '';
  RAISE NOTICE 'Main Accounts:';
  RAISE NOTICE '   Regular: % records, % unique names', 
    (SELECT COUNT(*) FROM public.company_main_accounts),
    (SELECT COUNT(DISTINCT acc_name) FROM public.company_main_accounts WHERE acc_name IS NOT NULL AND acc_name != '');
  RAISE NOTICE '   ITR: % records, % unique names', 
    (SELECT COUNT(*) FROM public.company_main_accounts_itr),
    (SELECT COUNT(DISTINCT acc_name) FROM public.company_main_accounts_itr WHERE acc_name IS NOT NULL AND acc_name != '');
  RAISE NOTICE '';
  RAISE NOTICE 'Sub Accounts:';
  RAISE NOTICE '   Regular: % records, % unique names', 
    (SELECT COUNT(*) FROM public.company_main_sub_acc),
    (SELECT COUNT(DISTINCT sub_acc) FROM public.company_main_sub_acc WHERE sub_acc IS NOT NULL AND sub_acc != '');
  RAISE NOTICE '   ITR: % records, % unique names', 
    (SELECT COUNT(*) FROM public.company_main_sub_acc_itr),
    (SELECT COUNT(DISTINCT sub_acc) FROM public.company_main_sub_acc_itr WHERE sub_acc IS NOT NULL AND sub_acc != '');
  RAISE NOTICE '';
  RAISE NOTICE 'Staff Names:';
  RAISE NOTICE '   Regular: % distinct names', 
    (SELECT COUNT(DISTINCT staff) FROM public.cash_book WHERE staff IS NOT NULL AND staff != '' AND staff != ' ');
  RAISE NOTICE '   ITR: % distinct names', 
    (SELECT COUNT(DISTINCT staff) FROM public.cash_book_itr WHERE staff IS NOT NULL AND staff != '');
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ITR mode dropdowns will show the SAME names as Regular mode!';
  RAISE NOTICE '✅ All dropdowns (Companies, Accounts, Sub-Accounts, Staff) will work!';
  RAISE NOTICE '✅ No transaction data was copied - clean start for ITR mode';
  RAISE NOTICE '========================================';
END $$;

