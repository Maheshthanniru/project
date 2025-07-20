/*
  # Thirumala Group Database Schema

  1. New Tables
    - `user_types` - Admin/Operator role definitions
    - `users` - User authentication and profiles
    - `companies` - Company master data
    - `company_main_accounts` - Chart of accounts per company
    - `company_main_sub_acc` - Sub-accounts structure
    - `cash_book` - Main transaction ledger
    - `edit_cash_book` - Audit trail for all edits
    - `original_cash_book` - Backup of original entries
    - `balance_sheet` - Balance sheet accounts
    - `ledger` - Ledger summary
    - `bank_guarantees` - BG tracking
    - `vehicles` - Vehicle management
    - `drivers` - Driver information and expiry tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Admin can access everything, Operators have limited access

  3. Features
    - Comprehensive dropdown support
    - Audit trail for all changes
    - Auto-timestamps and user tracking
    - Expiry date alerts
*/

-- User Types
CREATE TABLE IF NOT EXISTS user_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  user_type_id uuid REFERENCES user_types(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL UNIQUE,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company Main Accounts
CREATE TABLE IF NOT EXISTS company_main_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text REFERENCES companies(company_name),
  acc_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_name, acc_name)
);

-- Company Main Sub Accounts
CREATE TABLE IF NOT EXISTS company_main_sub_acc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text REFERENCES companies(company_name),
  acc_name text NOT NULL,
  sub_acc text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_name, acc_name, sub_acc)
);

-- Cash Book (Main Transaction Table)
CREATE TABLE IF NOT EXISTS cash_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sno serial,
  acc_name text NOT NULL,
  sub_acc_name text,
  particulars text,
  c_date date DEFAULT CURRENT_DATE,
  credit decimal(15,2) DEFAULT 0,
  debit decimal(15,2) DEFAULT 0,
  credit_online decimal(15,2) DEFAULT 0,
  credit_offline decimal(15,2) DEFAULT 0,
  debit_online decimal(15,2) DEFAULT 0,
   decimal(15,2) DEFAULT 0,
  lock_record boolean DEFAULT false,
  company_name text REFERENCES companies(company_name),
  address text,
  staff text,
  users text,
  entry_time timestamptz DEFAULT now(),
  sale_qty decimal(10,2) DEFAULT 0,
  purchase_qty decimal(10,2) DEFAULT 0,
  approved boolean DEFAULT false,
  edited boolean DEFAULT false,
  e_count integer DEFAULT 0,
  cb text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Edit Cash Book (Audit Trail)
CREATE TABLE IF NOT EXISTS edit_cash_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid REFERENCES cash_book(id),
  sno integer,
  acc_name text,
  sub_acc_name text,
  particulars text,
  c_date date,
  credit decimal(15,2),
  debit decimal(15,2),
  lock_record boolean,
  company_name text,
  address text,
  staff text,
  users text,
  entry_time timestamptz,
  sale_qty decimal(10,2),
  purchase_qty decimal(10,2),
  approved boolean,
  edited boolean,
  e_count integer,
  cb text,
  -- Original values
  o_credit decimal(15,2),
  o_debit decimal(15,2),
  o_company_name text,
  o_date date,
  o_user text,
  -- Edit tracking
  edited_user text,
  edited_time timestamptz DEFAULT now(),
  deleted_flag boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Original Cash Book (Backup)
CREATE TABLE IF NOT EXISTS original_cash_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_cb_id uuid,
  sno integer,
  acc_name text,
  sub_acc_name text,
  particulars text,
  c_date date,
  credit decimal(15,2),
  debit decimal(15,2),
  company_name text,
  staff text,
  users text,
  backup_time timestamptz DEFAULT now()
);

-- Balance Sheet
CREATE TABLE IF NOT EXISTS balance_sheet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acc_name text NOT NULL UNIQUE,
  credit decimal(15,2) DEFAULT 0,
  debit decimal(15,2) DEFAULT 0,
  balance decimal(15,2) DEFAULT 0,
  yes_no text CHECK (yes_no IN ('YES', 'NO', 'BOTH')),
  both_value text,
  result text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ledger
CREATE TABLE IF NOT EXISTS ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acc_name text NOT NULL,
  credit decimal(15,2) DEFAULT 0,
  debit decimal(15,2) DEFAULT 0,
  balance decimal(15,2) DEFAULT 0,
  yes_no text CHECK (yes_no IN ('YES', 'NO', 'BOTH')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bank Guarantees
CREATE TABLE IF NOT EXISTS bank_guarantees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sno serial,
  bg_no text NOT NULL UNIQUE,
  issue_date date,
  exp_date date,
  work_name text,
  credit decimal(15,2) DEFAULT 0,
  debit decimal(15,2) DEFAULT 0,
  department text,
  cancelled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sno serial,
  v_no text NOT NULL UNIQUE,
  v_type text,
  particulars text,
  tax_exp_date date,
  insurance_exp_date date,
  fitness_exp_date date,
  permit_exp_date date,
  date_added date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sno serial,
  driver_name text NOT NULL,
  license_no text UNIQUE,
  exp_date date,
  particulars text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deleted Cash Book Table (for audit trail)
CREATE TABLE IF NOT EXISTS deleted_cash_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sno serial,
  acc_name text NOT NULL,
  sub_acc_name text,
  particulars text,
  c_date date DEFAULT CURRENT_DATE,
  credit decimal(15,2) DEFAULT 0,
  debit decimal(15,2) DEFAULT 0,
  credit_online decimal(15,2) DEFAULT 0,
  credit_offline decimal(15,2) DEFAULT 0,
  debit_online decimal(15,2) DEFAULT 0,
  debit_offline decimal(15,2) DEFAULT 0,
  lock_record boolean DEFAULT false,
  company_name text,
  address text,
  staff text,
  users text,
  entry_time timestamptz DEFAULT now(),
  sale_qty decimal(10,2) DEFAULT 0,
  purchase_qty decimal(10,2) DEFAULT 0,
  approved boolean DEFAULT false,
  edited boolean DEFAULT false,
  e_count integer DEFAULT 0,
  cb text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_by text,
  deleted_at timestamptz DEFAULT now()
);

-- Login Attempts (for rate limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  count integer DEFAULT 1,
  last_attempt bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(username)
);

-- Login Activities (for audit trail)
CREATE TABLE IF NOT EXISTS login_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_sub_acc ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE original_cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_cash_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admin can access all data" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id::text = auth.uid()::text AND ut.user_type = 'Admin'
    )
  );

-- Public read access for master data
CREATE POLICY "Authenticated users can read companies" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read accounts" ON company_main_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sub accounts" ON company_main_sub_acc
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read user types" ON user_types
  FOR SELECT TO authenticated USING (true);

-- Cash Book policies
CREATE POLICY "Users can read cash book" ON cash_book
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert cash book" ON cash_book
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin can update cash book" ON cash_book
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id::text = auth.uid()::text AND ut.user_type = 'Admin'
    )
  );

-- Policies for other tables
CREATE POLICY "Users can access operational data" ON bank_guarantees
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access vehicle data" ON vehicles
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access driver data" ON drivers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access ledger data" ON ledger
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access balance sheet" ON balance_sheet
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access edit history" ON edit_cash_book
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access original cash book" ON original_cash_book
  FOR ALL TO authenticated USING (true);

-- Login attempts and activities policies
CREATE POLICY "Users can manage login attempts" ON login_attempts
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read login activities" ON login_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert login activities" ON login_activities
  FOR INSERT TO authenticated WITH CHECK (true);

-- Insert initial data
INSERT INTO user_types (user_type) VALUES 
  ('Admin'),
  ('Operator')
ON CONFLICT (user_type) DO NOTHING;

INSERT INTO companies (company_name, address) VALUES 
  ('Thirumala Cotton Mills', 'Main Branch Address'),
  ('Thirumala Exports', 'Export Division Address'),
  ('Thirumala Trading', 'Trading Division Address')
ON CONFLICT (company_name) DO NOTHING;

-- Sample accounts
INSERT INTO company_main_accounts (company_name, acc_name) VALUES 
  ('Thirumala Cotton Mills', 'Sales Account'),
  ('Thirumala Cotton Mills', 'Purchase Account'),
  ('Thirumala Cotton Mills', 'Expense Account'),
  ('Thirumala Cotton Mills', 'Cash Account'),
  ('Thirumala Cotton Mills', 'Bank Account'),
  ('Thirumala Exports', 'Export Sales'),
  ('Thirumala Exports', 'Export Expenses'),
  ('Thirumala Trading', 'Trading Income'),
  ('Thirumala Trading', 'Trading Expenses')
ON CONFLICT (company_name, acc_name) DO NOTHING;

-- Sample sub accounts
INSERT INTO company_main_sub_acc (company_name, acc_name, sub_acc) VALUES 
  ('Thirumala Cotton Mills', 'Sales Account', 'Local Sales'),
  ('Thirumala Cotton Mills', 'Sales Account', 'Interstate Sales'),
  ('Thirumala Cotton Mills', 'Purchase Account', 'Raw Material'),
  ('Thirumala Cotton Mills', 'Purchase Account', 'Machinery'),
  ('Thirumala Cotton Mills', 'Expense Account', 'Office Expense'),
  ('Thirumala Cotton Mills', 'Expense Account', 'Transport'),
  ('Thirumala Cotton Mills', 'Expense Account', 'Salary'),
  ('Thirumala Exports', 'Export Sales', 'Cotton Export'),
  ('Thirumala Exports', 'Export Expenses', 'Shipping'),
  ('Thirumala Trading', 'Trading Income', 'Commission')
ON CONFLICT (company_name, acc_name, sub_acc) DO NOTHING;