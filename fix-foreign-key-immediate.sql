-- IMMEDIATE FIX: Fix Foreign Key Constraint for user_access table
-- 
-- Problem: Foreign key constraint points to "userss" (wrong) instead of "users" (correct)
-- This causes: "Key is not present in table 'userss'" error
--
-- SOLUTION: Run this SQL in Supabase SQL Editor to fix the constraint

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE user_access 
DROP CONSTRAINT IF EXISTS user_access_user_id_fkey;

-- Step 2: Recreate the foreign key constraint pointing to the correct 'users' table
ALTER TABLE user_access
ADD CONSTRAINT user_access_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Step 3: Verify the fix
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Expected result: referenced_table should show "users" (NOT "userss")

