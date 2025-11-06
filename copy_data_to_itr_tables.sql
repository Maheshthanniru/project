-- =====================================================
-- Copy Data from Regular Tables to ITR Tables
-- This script copies all existing data from regular tables to ITR tables
-- =====================================================
-- 
-- WARNING: This will copy ALL data. If ITR tables already have data,
-- you may want to clear them first or use INSERT ... ON CONFLICT DO NOTHING
-- =====================================================

-- =====================================================
-- 1. Copy cash_book to cash_book_itr
-- =====================================================
INSERT INTO public.cash_book_itr (
  id, sno, acc_name, sub_acc_name, particulars, c_date, credit, debit,
  lock_record, company_name, address, staff, users, entry_time,
  sale_qty, purchase_qty, approved, edited, e_count, cb,
  created_at, updated_at, credit_mode, debit_mode,
  credit_online, credit_offline, debit_online, debit_offline, payment_mode
)
SELECT 
  id, sno, acc_name, sub_acc_name, particulars, c_date, credit, debit,
  lock_record, company_name, address, staff, users, entry_time,
  sale_qty, purchase_qty, approved, edited, e_count, cb,
  created_at, updated_at, credit_mode, debit_mode,
  credit_online, credit_offline, debit_online, debit_offline, payment_mode
FROM public.cash_book
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM cash_book_itr;
  RAISE NOTICE '✅ Copied % records from cash_book to cash_book_itr', copied_count;
END $$;

-- =====================================================
-- 2. Copy edit_cash_book to edit_cash_book_itr
-- =====================================================
-- Note: cash_book_id references need to be updated to point to cash_book_itr
INSERT INTO public.edit_cash_book_itr (
  id, cash_book_id, old_values, new_values, edited_by, edited_at
)
SELECT 
  e.id,
  -- Map cash_book_id to corresponding ID in cash_book_itr
  (SELECT c_itr.id FROM cash_book_itr c_itr WHERE c_itr.id = e.cash_book_id),
  e.old_values,
  e.new_values,
  e.edited_by,
  e.edited_at
FROM public.edit_cash_book e
WHERE EXISTS (
  SELECT 1 FROM cash_book_itr c_itr WHERE c_itr.id = e.cash_book_id
)
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM edit_cash_book_itr;
  RAISE NOTICE '✅ Copied % records from edit_cash_book to edit_cash_book_itr', copied_count;
END $$;

-- =====================================================
-- 3. Copy original_cash_book to original_cash_book_itr
-- =====================================================
INSERT INTO public.original_cash_book_itr (
  id, original_cb_id, sno, acc_name, sub_acc_name, particulars, c_date,
  credit, debit, company_name, staff, users, backup_time
)
SELECT 
  id, original_cb_id, sno, acc_name, sub_acc_name, particulars, c_date,
  credit, debit, company_name, staff, users, backup_time
FROM public.original_cash_book
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM original_cash_book_itr;
  RAISE NOTICE '✅ Copied % records from original_cash_book to original_cash_book_itr', copied_count;
END $$;

-- =====================================================
-- 4. Copy deleted_cash_book to deleted_cash_book_itr
-- =====================================================
INSERT INTO public.deleted_cash_book_itr (
  id, sno, acc_name, sub_acc_name, particulars, c_date, credit, debit,
  lock_record, company_name, address, staff, users, entry_time,
  sale_qty, purchase_qty, approved, edited, e_count, cb,
  created_at, updated_at, deleted_by, deleted_at, credit_mode, debit_mode
)
SELECT 
  id, sno, acc_name, sub_acc_name, particulars, c_date, credit, debit,
  lock_record, company_name, address, staff, users, entry_time,
  sale_qty, purchase_qty, approved, edited, e_count, cb,
  created_at, updated_at, deleted_by, deleted_at, credit_mode, debit_mode
FROM public.deleted_cash_book
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM deleted_cash_book_itr;
  RAISE NOTICE '✅ Copied % records from deleted_cash_book to deleted_cash_book_itr', copied_count;
END $$;

-- =====================================================
-- 5. Copy company_main_accounts to company_main_accounts_itr
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
-- 6. Copy company_main_sub_acc to company_main_sub_acc_itr
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
-- 7. Copy balance_sheet to balance_sheet_itr
-- =====================================================
INSERT INTO public.balance_sheet_itr (
  id, acc_name, credit, debit, balance, yes_no, both_value, result,
  created_at, updated_at
)
SELECT 
  id, acc_name, credit, debit, balance, yes_no, both_value, result,
  created_at, updated_at
FROM public.balance_sheet
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM balance_sheet_itr;
  RAISE NOTICE '✅ Copied % records from balance_sheet to balance_sheet_itr', copied_count;
END $$;

-- =====================================================
-- 8. Copy ledger to ledger_itr
-- =====================================================
INSERT INTO public.ledger_itr (
  id, acc_name, credit, debit, balance, yes_no, created_at, updated_at
)
SELECT 
  id, acc_name, credit, debit, balance, yes_no, created_at, updated_at
FROM public.ledger
ON CONFLICT (id) DO NOTHING;

-- Get count of copied records
DO $$
DECLARE
  copied_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO copied_count FROM ledger_itr;
  RAISE NOTICE '✅ Copied % records from ledger to ledger_itr', copied_count;
END $$;

-- =====================================================
-- 9. Copy bank_guarantees to bank_guarantees_itr (Optional)
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

-- =====================================================
-- 10. Copy vehicles to vehicles_itr (Optional)
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

-- =====================================================
-- 11. Copy drivers to drivers_itr (Optional)
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

-- =====================================================
-- Update Sequences for ITR Tables
-- =====================================================
-- Set sequences to continue from the highest existing value

-- Update cash_book_itr_sno_seq
DO $$
DECLARE
  max_sno INTEGER;
BEGIN
  SELECT COALESCE(MAX(sno), 0) INTO max_sno FROM cash_book_itr;
  IF max_sno > 0 THEN
    PERFORM setval('cash_book_itr_sno_seq', max_sno);
    RAISE NOTICE '✅ Set cash_book_itr_sno_seq to %', max_sno;
  END IF;
END $$;

-- Update deleted_cash_book_itr_sno_seq
DO $$
DECLARE
  max_sno INTEGER;
BEGIN
  SELECT COALESCE(MAX(sno), 0) INTO max_sno FROM deleted_cash_book_itr;
  IF max_sno > 0 THEN
    PERFORM setval('deleted_cash_book_itr_sno_seq', max_sno);
    RAISE NOTICE '✅ Set deleted_cash_book_itr_sno_seq to %', max_sno;
  END IF;
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
  RAISE NOTICE '📊 DATA COPY SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'cash_book_itr: % records', (SELECT COUNT(*) FROM cash_book_itr);
  RAISE NOTICE 'edit_cash_book_itr: % records', (SELECT COUNT(*) FROM edit_cash_book_itr);
  RAISE NOTICE 'original_cash_book_itr: % records', (SELECT COUNT(*) FROM original_cash_book_itr);
  RAISE NOTICE 'deleted_cash_book_itr: % records', (SELECT COUNT(*) FROM deleted_cash_book_itr);
  RAISE NOTICE 'company_main_accounts_itr: % records', (SELECT COUNT(*) FROM company_main_accounts_itr);
  RAISE NOTICE 'company_main_sub_acc_itr: % records', (SELECT COUNT(*) FROM company_main_sub_acc_itr);
  RAISE NOTICE 'balance_sheet_itr: % records', (SELECT COUNT(*) FROM balance_sheet_itr);
  RAISE NOTICE 'ledger_itr: % records', (SELECT COUNT(*) FROM ledger_itr);
  RAISE NOTICE 'bank_guarantees_itr: % records', (SELECT COUNT(*) FROM bank_guarantees_itr);
  RAISE NOTICE 'vehicles_itr: % records', (SELECT COUNT(*) FROM vehicles_itr);
  RAISE NOTICE 'drivers_itr: % records', (SELECT COUNT(*) FROM drivers_itr);
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Data copy completed successfully!';
  RAISE NOTICE '========================================';
END $$;

