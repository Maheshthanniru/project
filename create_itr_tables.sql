-- =====================================================
-- Create ITR (Income Tax Return) Tables
-- This script creates ITR versions of all financial/transaction tables
-- =====================================================

-- Note: Companies, Users, Features, User Types, and User Access are shared
-- and do not need ITR versions as they are the same for both regular and ITR modes

-- =====================================================
-- Create Sequences First
-- =====================================================

-- Sequence for cash_book_itr
CREATE SEQUENCE IF NOT EXISTS cash_book_itr_sno_seq;

-- Sequence for deleted_cash_book_itr
CREATE SEQUENCE IF NOT EXISTS deleted_cash_book_itr_sno_seq;

-- Sequence for bank_guarantees_itr
CREATE SEQUENCE IF NOT EXISTS bank_guarantees_itr_sno_seq;

-- Sequence for vehicles_itr
CREATE SEQUENCE IF NOT EXISTS vehicles_itr_sno_seq;

-- Sequence for drivers_itr
CREATE SEQUENCE IF NOT EXISTS drivers_itr_sno_seq;

-- =====================================================
-- 1. cash_book_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cash_book_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sno integer NOT NULL DEFAULT nextval('cash_book_itr_sno_seq'::regclass),
  acc_name text NOT NULL,
  sub_acc_name text,
  particulars text,
  c_date date DEFAULT CURRENT_DATE,
  credit numeric DEFAULT 0,
  debit numeric DEFAULT 0,
  lock_record boolean DEFAULT false,
  company_name text,
  address text,
  staff text,
  users text,
  entry_time timestamp with time zone DEFAULT now(),
  sale_qty numeric DEFAULT 0,
  purchase_qty numeric DEFAULT 0,
  approved text,
  edited boolean DEFAULT false,
  e_count integer DEFAULT 0,
  cb text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  credit_mode text,
  debit_mode text,
  credit_online double precision,
  credit_offline double precision,
  debit_online double precision,
  debit_offline double precision,
  payment_mode text,
  CONSTRAINT cash_book_itr_pkey PRIMARY KEY (id),
  CONSTRAINT cash_book_itr_company_name_fkey FOREIGN KEY (company_name) REFERENCES public.companies(company_name)
);

-- =====================================================
-- 2. edit_cash_book_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.edit_cash_book_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cash_book_id uuid,
  old_values jsonb,
  new_values jsonb,
  edited_by text,
  edited_at timestamp with time zone DEFAULT now(),
  CONSTRAINT edit_cash_book_itr_pkey PRIMARY KEY (id),
  CONSTRAINT edit_cash_book_itr_cash_book_id_fkey FOREIGN KEY (cash_book_id) REFERENCES public.cash_book_itr(id)
);

-- =====================================================
-- 3. original_cash_book_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.original_cash_book_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_cb_id uuid,
  sno integer,
  acc_name text,
  sub_acc_name text,
  particulars text,
  c_date date,
  credit numeric,
  debit numeric,
  company_name text,
  staff text,
  users text,
  backup_time timestamp with time zone DEFAULT now(),
  CONSTRAINT original_cash_book_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 4. deleted_cash_book_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deleted_cash_book_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sno integer NOT NULL DEFAULT nextval('deleted_cash_book_itr_sno_seq'::regclass),
  acc_name text NOT NULL,
  sub_acc_name text,
  particulars text,
  c_date date DEFAULT CURRENT_DATE,
  credit numeric DEFAULT 0,
  debit numeric DEFAULT 0,
  lock_record boolean DEFAULT false,
  company_name text,
  address text,
  staff text,
  users text,
  entry_time timestamp with time zone DEFAULT now(),
  sale_qty numeric DEFAULT 0,
  purchase_qty numeric DEFAULT 0,
  approved boolean DEFAULT false,
  edited boolean DEFAULT false,
  e_count integer DEFAULT 0,
  cb text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_by text,
  deleted_at timestamp with time zone DEFAULT now(),
  credit_mode text,
  debit_mode text,
  CONSTRAINT deleted_cash_book_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 5. company_main_accounts_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_main_accounts_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name text,
  acc_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_main_accounts_itr_pkey PRIMARY KEY (id),
  CONSTRAINT company_main_accounts_itr_company_name_fkey FOREIGN KEY (company_name) REFERENCES public.companies(company_name)
);

-- =====================================================
-- 6. company_main_sub_acc_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_main_sub_acc_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name text,
  acc_name text NOT NULL,
  sub_acc text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_main_sub_acc_itr_pkey PRIMARY KEY (id),
  CONSTRAINT company_main_sub_acc_itr_company_name_fkey FOREIGN KEY (company_name) REFERENCES public.companies(company_name)
);

-- =====================================================
-- 7. balance_sheet_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.balance_sheet_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  acc_name text NOT NULL UNIQUE,
  credit numeric DEFAULT 0,
  debit numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  yes_no text CHECK (yes_no = ANY (ARRAY['YES'::text, 'NO'::text, 'BOTH'::text])),
  both_value text,
  result text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT balance_sheet_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 8. ledger_itr
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ledger_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  acc_name text NOT NULL,
  credit numeric DEFAULT 0,
  debit numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  yes_no text CHECK (yes_no = ANY (ARRAY['YES'::text, 'NO'::text, 'BOTH'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ledger_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 9. bank_guarantees_itr (Optional - if you want separate ITR BGs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bank_guarantees_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sno integer NOT NULL DEFAULT nextval('bank_guarantees_itr_sno_seq'::regclass),
  bg_no text NOT NULL UNIQUE,
  issue_date date,
  exp_date date,
  work_name text,
  credit numeric DEFAULT 0,
  debit numeric DEFAULT 0,
  department text,
  cancelled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_guarantees_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 10. vehicles_itr (Optional - if you want separate ITR vehicles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicles_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sno integer NOT NULL DEFAULT nextval('vehicles_itr_sno_seq'::regclass),
  v_no text NOT NULL UNIQUE,
  v_type text,
  particulars text,
  tax_exp_date date,
  insurance_exp_date date,
  fitness_exp_date date,
  permit_exp_date date,
  date_added date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rc_front_url text,
  rc_back_url text,
  CONSTRAINT vehicles_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 11. drivers_itr (Optional - if you want separate ITR drivers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.drivers_itr (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sno integer NOT NULL DEFAULT nextval('drivers_itr_sno_seq'::regclass),
  driver_name text NOT NULL,
  license_no text UNIQUE,
  exp_date date,
  particulars text,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  license_front_url text,
  license_back_url text,
  CONSTRAINT drivers_itr_pkey PRIMARY KEY (id)
);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Indexes for cash_book_itr
CREATE INDEX IF NOT EXISTS idx_cash_book_itr_company_name ON public.cash_book_itr(company_name);
CREATE INDEX IF NOT EXISTS idx_cash_book_itr_acc_name ON public.cash_book_itr(acc_name);
CREATE INDEX IF NOT EXISTS idx_cash_book_itr_c_date ON public.cash_book_itr(c_date);
CREATE INDEX IF NOT EXISTS idx_cash_book_itr_created_at ON public.cash_book_itr(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_book_itr_payment_mode ON public.cash_book_itr(payment_mode);

-- Indexes for edit_cash_book_itr
CREATE INDEX IF NOT EXISTS idx_edit_cash_book_itr_cash_book_id ON public.edit_cash_book_itr(cash_book_id);
CREATE INDEX IF NOT EXISTS idx_edit_cash_book_itr_edited_at ON public.edit_cash_book_itr(edited_at);

-- Indexes for company_main_accounts_itr
CREATE INDEX IF NOT EXISTS idx_company_main_accounts_itr_company_name ON public.company_main_accounts_itr(company_name);
CREATE INDEX IF NOT EXISTS idx_company_main_accounts_itr_acc_name ON public.company_main_accounts_itr(acc_name);

-- Indexes for company_main_sub_acc_itr
CREATE INDEX IF NOT EXISTS idx_company_main_sub_acc_itr_company_name ON public.company_main_sub_acc_itr(company_name);
CREATE INDEX IF NOT EXISTS idx_company_main_sub_acc_itr_acc_name ON public.company_main_sub_acc_itr(acc_name);

-- Indexes for balance_sheet_itr
CREATE INDEX IF NOT EXISTS idx_balance_sheet_itr_acc_name ON public.balance_sheet_itr(acc_name);

-- Indexes for ledger_itr
CREATE INDEX IF NOT EXISTS idx_ledger_itr_acc_name ON public.ledger_itr(acc_name);

-- =====================================================
-- Enable Row Level Security (RLS) if needed
-- =====================================================
-- Uncomment these if you want to enable RLS on ITR tables
-- ALTER TABLE public.cash_book_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.edit_cash_book_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.original_cash_book_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.deleted_cash_book_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.company_main_accounts_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.company_main_sub_acc_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.balance_sheet_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ledger_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bank_guarantees_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vehicles_itr ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.drivers_itr ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ ITR tables created successfully!';
  RAISE NOTICE '📋 Created tables:';
  RAISE NOTICE '   - cash_book_itr';
  RAISE NOTICE '   - edit_cash_book_itr';
  RAISE NOTICE '   - original_cash_book_itr';
  RAISE NOTICE '   - deleted_cash_book_itr';
  RAISE NOTICE '   - company_main_accounts_itr';
  RAISE NOTICE '   - company_main_sub_acc_itr';
  RAISE NOTICE '   - balance_sheet_itr';
  RAISE NOTICE '   - ledger_itr';
  RAISE NOTICE '   - bank_guarantees_itr';
  RAISE NOTICE '   - vehicles_itr';
  RAISE NOTICE '   - drivers_itr';
END $$;

