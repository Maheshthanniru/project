-- Fix Foreign Key Constraint Issue in user_access table
-- 
-- Problem: The foreign key constraint 'user_access_user_id_fkey' is pointing to table "userss" (double 's')
--          but the actual table is "users" (single 's')
--
-- Solution: Drop the incorrect foreign key and recreate it pointing to the correct table
--
-- Run this in your Supabase SQL Editor

-- Step 1: Check current foreign key constraints
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Step 2: Drop the incorrect foreign key constraint
ALTER TABLE user_access 
DROP CONSTRAINT IF EXISTS user_access_user_id_fkey;

-- Step 3: Recreate the foreign key constraint pointing to the correct 'users' table
ALTER TABLE user_access
ADD CONSTRAINT user_access_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Step 4: Verify the fix
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Expected result: referenced_table should show "users" (not "userss")

