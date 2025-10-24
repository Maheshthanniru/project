-- Create a function to get dashboard totals efficiently
-- This function will calculate all totals in the database for better performance

CREATE OR REPLACE FUNCTION get_dashboard_totals()
RETURNS TABLE (
  total_credit NUMERIC,
  total_debit NUMERIC,
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
    COALESCE(SUM(credit_online), 0) as total_credit_online,
    COALESCE(SUM(credit_offline), 0) as total_credit_offline,
    COALESCE(SUM(debit_online), 0) as total_debit_online,
    COALESCE(SUM(debit_offline), 0) as total_debit_offline
  FROM cash_book;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_totals() TO authenticated;





