-- Fix deleted_cash_book table by adding missing online/offline columns
-- Run this in your Supabase SQL Editor

-- Add the missing columns to deleted_cash_book table
ALTER TABLE deleted_cash_book 
ADD COLUMN IF NOT EXISTS credit_online decimal(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_offline decimal(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS debit_online decimal(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS debit_offline decimal(15,2) DEFAULT 0;

-- Add RLS policy for deleted_cash_book if it doesn't exist
CREATE POLICY IF NOT EXISTS "Allow all operations on deleted_cash_book" ON deleted_cash_book FOR ALL USING (true); 