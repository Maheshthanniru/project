-- Disable RLS temporarily for data population
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

-- Insert user types
INSERT INTO user_types (user_type) VALUES 
  ('Admin'),
  ('Operator')
ON CONFLICT (user_type) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (company_name, address) VALUES 
  ('Thirumala Cotton Mills', 'Main Branch Address'),
  ('Thirumala Exports', 'Export Division Address'),
  ('Thirumala Trading', 'Trading Division Address')
ON CONFLICT (company_name) DO NOTHING;

-- Insert sample accounts
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

-- Insert sample sub accounts
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

-- Re-enable RLS after data population
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

-- Create basic policies for read access
CREATE POLICY "Allow all reads" ON user_types FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON company_main_accounts FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON company_main_sub_acc FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON cash_book FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON balance_sheet FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON ledger FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON bank_guarantees FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON drivers FOR SELECT USING (true);

-- Create policies for insert/update operations
CREATE POLICY "Allow all operations" ON cash_book FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON company_main_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON company_main_sub_acc FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bank_guarantees FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON vehicles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON drivers FOR ALL USING (true); 

-- Deleted Cash Book Table
CREATE TABLE IF NOT EXISTS deleted_cash_book (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sno serial,
  acc_name text NOT NULL,
  sub_acc_name text,
  particulars text,
  c_date date DEFAULT CURRENT_DATE,
  credit decimal(15,2) DEFAULT 0,
  debit decimal(15,2) DEFAULT 0,
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