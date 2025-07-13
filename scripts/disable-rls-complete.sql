-- Complete script to disable RLS and populate database
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS for all tables
ALTER TABLE user_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE edit_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE original_cash_book DISABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_guarantees DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin can access all data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can read accounts" ON company_main_accounts;
DROP POLICY IF EXISTS "Authenticated users can read sub accounts" ON company_main_sub_acc;
DROP POLICY IF EXISTS "Authenticated users can read user types" ON user_types;
DROP POLICY IF EXISTS "Users can read cash book" ON cash_book;
DROP POLICY IF EXISTS "Users can insert cash book" ON cash_book;
DROP POLICY IF EXISTS "Admin can update cash book" ON cash_book;
DROP POLICY IF EXISTS "Users can access operational data" ON bank_guarantees;
DROP POLICY IF EXISTS "Users can access vehicle data" ON vehicles;
DROP POLICY IF EXISTS "Users can access driver data" ON drivers;
DROP POLICY IF EXISTS "Users can access ledger data" ON ledger;
DROP POLICY IF EXISTS "Users can access balance sheet" ON balance_sheet;
DROP POLICY IF EXISTS "Users can access edit history" ON edit_cash_book;
DROP POLICY IF EXISTS "Users can access original cash book" ON original_cash_book;
DROP POLICY IF EXISTS "Users can manage login attempts" ON login_attempts;
DROP POLICY IF EXISTS "Users can read login activities" ON login_activities;
DROP POLICY IF EXISTS "Users can insert login activities" ON login_activities;

-- Step 3: Insert user types
INSERT INTO user_types (user_type) VALUES 
  ('Admin'),
  ('Operator')
ON CONFLICT (user_type) DO NOTHING;

-- Step 4: Insert sample companies
INSERT INTO companies (company_name, address) VALUES 
  ('Thirumala Cotton Mills', 'Main Branch Address'),
  ('Thirumala Exports', 'Export Division Address'),
  ('Thirumala Trading', 'Trading Division Address')
ON CONFLICT (company_name) DO NOTHING;

-- Step 5: Insert sample accounts
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

-- Step 6: Insert sample sub accounts
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

-- Step 7: Create simple policies for basic access (optional)
-- These policies allow all operations for authenticated users
CREATE POLICY "Allow all operations" ON user_types FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON company_main_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON company_main_sub_acc FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cash_book FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON balance_sheet FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ledger FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bank_guarantees FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vehicles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON drivers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON edit_cash_book FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON original_cash_book FOR ALL USING (true);

-- Step 8: Re-enable RLS (optional - you can keep it disabled for development)
-- ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_main_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_main_sub_acc ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cash_book ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE edit_cash_book ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE original_cash_book ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE balance_sheet ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bank_guarantees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE drivers ENABLE ROW LEVEL SECURITY; 