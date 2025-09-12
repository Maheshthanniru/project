-- Fix RLS policies for deleted_cash_book table
-- Run this in your Supabase SQL Editor

-- First, check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'deleted_cash_book';

-- Create policies for deleted_cash_book table
CREATE POLICY "Users can read deleted cash book" ON deleted_cash_book
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can update deleted cash book" ON deleted_cash_book
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admin can insert deleted cash book" ON deleted_cash_book
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.user_type = 'admin'
    )
  );

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'deleted_cash_book';

-- Test access (this should return the count of deleted records)
SELECT COUNT(*) FROM deleted_cash_book;

