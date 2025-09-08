-- Fix the dashboard totals function to work with actual table structure
-- Remove references to non-existent online/offline columns
-- Add total transaction count for better performance

CREATE OR REPLACE FUNCTION get_dashboard_totals()
RETURNS TABLE (
  total_credit NUMERIC,
  total_debit NUMERIC,
  total_transactions BIGINT,
  total_credit_online NUMERIC,
  total_credit_offline NUMERIC,
  total_debit_online NUMERIC,
  total_debit_offline NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(credit), 0) as total_credit,
    COALESCE(SUM(debit), 0) as total_debit,
    COUNT(*) as total_transactions,
    0 as total_credit_online,  -- These columns don't exist in current schema
    0 as total_credit_offline,
    0 as total_debit_online,
    0 as total_debit_offline
  FROM cash_book;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_totals() TO authenticated;
