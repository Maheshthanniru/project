-- COMPLETE FIX: Fix Foreign Key Constraint for user_access table
-- 
-- This script safely fixes the foreign key constraint issue
-- It handles orphaned records and recreates the constraint correctly

-- STEP 1: Check current constraint status
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- STEP 2: Find any orphaned records (user_access entries pointing to non-existent users)
-- This helps identify if there are records causing issues
SELECT 
    ua.user_id,
    COUNT(*) as orphaned_count
FROM user_access ua
LEFT JOIN users u ON ua.user_id = u.id
WHERE u.id IS NULL
GROUP BY ua.user_id;

-- STEP 3: Clean up orphaned records (optional - uncomment if needed)
-- DELETE FROM user_access 
-- WHERE user_id NOT IN (SELECT id FROM users);

-- STEP 4: Drop the incorrect foreign key constraint
ALTER TABLE user_access 
DROP CONSTRAINT IF EXISTS user_access_user_id_fkey;

-- STEP 5: Verify constraint is dropped
SELECT 
    conname AS constraint_name
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';
-- Should return no rows (constraint is dropped)

-- STEP 6: Recreate the foreign key constraint pointing to the correct 'users' table
ALTER TABLE user_access
ADD CONSTRAINT user_access_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- STEP 7: Verify the fix worked
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Expected result: 
-- - constraint_name: user_access_user_id_fkey
-- - referenced_table: users (NOT userss)
-- - constraint_definition should show REFERENCES users(id)

-- STEP 8: Test that the constraint works (this should succeed)
-- Try to insert a test record (will fail if user doesn't exist, which is correct behavior)
-- SELECT u.id FROM users LIMIT 1; -- Get a valid user ID first
-- Then try: INSERT INTO user_access (user_id, feature_key) VALUES ('<valid-user-id>', 'test') ON CONFLICT DO NOTHING;
-- Delete the test: DELETE FROM user_access WHERE feature_key = 'test';

