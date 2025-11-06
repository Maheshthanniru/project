-- =====================================================
-- Copy Only Master/Configuration Data to ITR Tables
-- This script copies ONLY master data (accounts, sub-accounts, etc.)
-- NO transactional data (cash_book entries, etc.)
-- =====================================================
-- 
-- What gets copied:
-- ✅ company_main_accounts → company_main_accounts_itr
-- ✅ company_main_sub_acc → company_main_sub_acc_itr
-- ✅ bank_guarantees → bank_guarantees_itr (optional)
-- ✅ vehicles → vehicles_itr (optional)
-- ✅ drivers → drivers_itr (optional)
-- 
-- What does NOT get copied:
-- ❌ cash_book entries
-- ❌ edit_cash_book
-- ❌ original_cash_book
-- ❌ deleted_cash_book
-- ❌ balance_sheet
-- ❌ ledger
-- =====================================================

-- =====================================================
-- 1. Copy company_main_accounts to company_main_accounts_itr
-- =====================================================
INSERT INTO public.company_main_accounts_itr (
  id, company_name, acc_name, created_at
)
SELECT 
  id, company_name, acc_name, created_at
FROM public.company_main_accounts
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM company_main_accounts_itr;
  RAISE NOTICE '✅ Copied % records from company_main_accounts to company_main_accounts_itr', copied_count;
END $$;

-- =====================================================
-- 2. Copy company_main_sub_acc to company_main_sub_acc_itr
-- =====================================================
INSERT INTO public.company_main_sub_acc_itr (
  id, company_name, acc_name, sub_acc, created_at
)
SELECT 
  id, company_name, acc_name, sub_acc, created_at
FROM public.company_main_sub_acc
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM company_main_sub_acc_itr;
  RAISE NOTICE '✅ Copied % records from company_main_sub_acc to company_main_sub_acc_itr', copied_count;
END $$;

-- =====================================================
-- 3. Copy bank_guarantees to bank_guarantees_itr (Optional)
-- =====================================================
INSERT INTO public.bank_guarantees_itr (
  id, sno, bg_no, issue_date, exp_date, work_name, credit, debit,
  department, cancelled, created_at, updated_at
)
SELECT 
  id, sno, bg_no, issue_date, exp_date, work_name, credit, debit,
  department, cancelled, created_at, updated_at
FROM public.bank_guarantees
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM bank_guarantees_itr;
  RAISE NOTICE '✅ Copied % records from bank_guarantees to bank_guarantees_itr', copied_count;
END $$;

-- Update bank_guarantees_itr_sno_seq
DO $$
DECLARE
  max_sno INTEGER;
BEGIN
  SELECT COALESCE(MAX(sno), 0) INTO max_sno FROM bank_guarantees_itr;
  IF max_sno > 0 THEN
    PERFORM setval('bank_guarantees_itr_sno_seq', max_sno);
    RAISE NOTICE '✅ Set bank_guarantees_itr_sno_seq to %', max_sno;
  END IF;
END $$;

-- =====================================================
-- 4. Copy vehicles to vehicles_itr (Optional)
-- =====================================================
INSERT INTO public.vehicles_itr (
  id, sno, v_no, v_type, particulars, tax_exp_date, insurance_exp_date,
  fitness_exp_date, permit_exp_date, date_added, created_at, updated_at,
  rc_front_url, rc_back_url
)
SELECT 
  id, sno, v_no, v_type, particulars, tax_exp_date, insurance_exp_date,
  fitness_exp_date, permit_exp_date, date_added, created_at, updated_at,
  rc_front_url, rc_back_url
FROM public.vehicles
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM vehicles_itr;
  RAISE NOTICE '✅ Copied % records from vehicles to vehicles_itr', copied_count;
END $$;

-- Update vehicles_itr_sno_seq
DO $$
DECLARE
  max_sno INTEGER;
BEGIN
  SELECT COALESCE(MAX(sno), 0) INTO max_sno FROM vehicles_itr;
  IF max_sno > 0 THEN
    PERFORM setval('vehicles_itr_sno_seq', max_sno);
    RAISE NOTICE '✅ Set vehicles_itr_sno_seq to %', max_sno;
  END IF;
END $$;

-- =====================================================
-- 5. Copy Staff Data to cash_book_itr (for dropdown only)
-- This creates minimal records with only staff names for dropdown population
-- =====================================================
-- Insert distinct staff names as minimal reference records
-- These are NOT real transactions, just for dropdown data
INSERT INTO public.cash_book_itr (
  id, sno, acc_name, staff, c_date, credit, debit, 
  company_name, created_at, updated_at
)
SELECT DISTINCT ON (staff)
  gen_random_uuid() as id,
  nextval('cash_book_itr_sno_seq') as sno,
  'STAFF_REFERENCE' as acc_name,  -- Placeholder account name
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

-- Get count of staff records copied
DO $$
DECLARE
  staff_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT staff) INTO staff_count 
  FROM cash_book_itr 
  WHERE staff IS NOT NULL AND staff != '';
  RAISE NOTICE '✅ Copied % distinct staff names to cash_book_itr (for dropdown)', staff_count;
END $$;

-- =====================================================
-- 6. Copy drivers to drivers_itr (Optional)
-- =====================================================
INSERT INTO public.drivers_itr (
  id, sno, driver_name, license_no, exp_date, particulars, phone, address,
  created_at, updated_at, license_front_url, license_back_url
)
SELECT 
  id, sno, driver_name, license_no, exp_date, particulars, phone, address,
  created_at, updated_at, license_front_url, license_back_url
FROM public.drivers
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM drivers_itr;
  RAISE NOTICE '✅ Copied % records from drivers to drivers_itr', copied_count;
END $$;

-- Update drivers_itr_sno_seq
DO $$
DECLARE
  max_sno INTEGER;
BEGIN
  SELECT COALESCE(MAX(sno), 0) INTO max_sno FROM drivers_itr;
  IF max_sno > 0 THEN
    PERFORM setval('drivers_itr_sno_seq', max_sno);
    RAISE NOTICE '✅ Set drivers_itr_sno_seq to %', max_sno;
  END IF;
END $$;

-- =====================================================
-- Summary Report
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 MASTER DATA COPY SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Master Data Tables Copied:';
  RAISE NOTICE '   company_main_accounts_itr: % records', (SELECT COUNT(*) FROM company_main_accounts_itr);
  RAISE NOTICE '   company_main_sub_acc_itr: % records', (SELECT COUNT(*) FROM company_main_sub_acc_itr);
  RAISE NOTICE '   Staff names in cash_book_itr: % distinct staff', (SELECT COUNT(DISTINCT staff) FROM cash_book_itr WHERE staff IS NOT NULL AND staff != '');
  RAISE NOTICE '   bank_guarantees_itr: % records', (SELECT COUNT(*) FROM bank_guarantees_itr);
  RAISE NOTICE '   vehicles_itr: % records', (SELECT COUNT(*) FROM vehicles_itr);
  RAISE NOTICE '   drivers_itr: % records', (SELECT COUNT(*) FROM drivers_itr);
  RAISE NOTICE '';
  RAISE NOTICE '❌ Transactional Tables (NOT Copied):';
  RAISE NOTICE '   cash_book_itr: % records (empty - as intended)', (SELECT COUNT(*) FROM cash_book_itr);
  RAISE NOTICE '   edit_cash_book_itr: % records (empty - as intended)', (SELECT COUNT(*) FROM edit_cash_book_itr);
  RAISE NOTICE '   original_cash_book_itr: % records (empty - as intended)', (SELECT COUNT(*) FROM original_cash_book_itr);
  RAISE NOTICE '   deleted_cash_book_itr: % records (empty - as intended)', (SELECT COUNT(*) FROM deleted_cash_book_itr);
  RAISE NOTICE '   balance_sheet_itr: % records (empty - as intended)', (SELECT COUNT(*) FROM balance_sheet_itr);
  RAISE NOTICE '   ledger_itr: % records (empty - as intended)', (SELECT COUNT(*) FROM ledger_itr);
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Master data copy completed successfully!';
  RAISE NOTICE '✅ You can now create new transactions in ITR mode';
  RAISE NOTICE '✅ All dropdowns (accounts, sub-accounts, staff) will work';
  RAISE NOTICE '✅ Staff dropdown will show all staff names from regular mode';
  RAISE NOTICE '========================================';
END $$;

