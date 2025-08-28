-- Create a function to disable RLS for all tables
CREATE OR REPLACE FUNCTION disable_rls_for_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Disable RLS for cash_book table
    ALTER TABLE cash_book DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for companies table
    ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for company_main_accounts table
    ALTER TABLE company_main_accounts DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for company_main_sub_acc table
    ALTER TABLE company_main_sub_acc DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for users table
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for bank_guarantees table
    ALTER TABLE bank_guarantees DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for vehicles table
    ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS for drivers table
    ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
    
    RETURN 'RLS disabled for all tables successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error disabling RLS: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION disable_rls_for_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION disable_rls_for_tables() TO anon;

-- Also create a function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
    table_name text,
    rls_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        t.rowsecurity
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'cash_book', 
        'companies', 
        'company_main_accounts', 
        'company_main_sub_acc', 
        'users',
        'bank_guarantees',
        'vehicles',
        'drivers'
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rls_status() TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_status() TO anon;

