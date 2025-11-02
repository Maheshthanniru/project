-- STEP-BY-STEP FIX FOR FOREIGN KEY CONSTRAINT
-- 
-- Run each section separately and check results before moving to next step
-- This ensures we fix the issue safely

-- ============================================================
-- STEP 1: Check what table the constraint currently points to
-- ============================================================
SELECT 
    conname AS constraint_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Note the referenced_table value. If it shows "userss" (double s), that's wrong.
-- If it shows "users" (single s), the constraint is correct but we still need to fix orphaned data.

-- ============================================================
-- STEP 2: Find orphaned user_access records
-- ============================================================
-- These are user_access entries pointing to users that don't exist
SELECT 
    ua.user_id,
    COUNT(*) as orphaned_count
FROM user_access ua
LEFT JOIN users u ON ua.user_id = u.id
WHERE u.id IS NULL
GROUP BY ua.user_id;

-- If this returns any rows, you have orphaned data.
-- Check the user_id values - they might be old test data or users that were deleted.

-- ============================================================
-- STEP 3: Clean up orphaned records (IMPORTANT!)
-- ============================================================
-- First, let's see what will be deleted (run this to preview):
SELECT 
    ua.*,
    'This will be deleted' as warning
FROM user_access ua
LEFT JOIN users u ON ua.user_id = u.id
WHERE u.id IS NULL;

-- If the preview looks okay (old/test data), then run this to delete:
DELETE FROM user_access 
WHERE user_id NOT IN (SELECT id FROM users);

-- This removes all user_access records that don't have a matching user.
-- BE CAREFUL: Only run this if you're sure these are orphaned records!

-- ============================================================
-- STEP 4: Drop the constraint (if it exists)
-- ============================================================
ALTER TABLE user_access 
DROP CONSTRAINT IF EXISTS user_access_user_id_fkey;

-- Verify it's dropped (should return no rows):
SELECT conname 
FROM pg_constraint 
WHERE conname = 'user_access_user_id_fkey';

-- ============================================================
-- STEP 5: Recreate the constraint correctly
-- ============================================================
ALTER TABLE user_access
ADD CONSTRAINT user_access_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- This should now work because we've cleaned up orphaned records!

-- ============================================================
-- STEP 6: Verify the fix
-- ============================================================
SELECT 
    conname AS constraint_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Expected result: 
-- - referenced_table: "users" (single 's', NOT "userss")
-- - constraint_definition should include: REFERENCES users(id)

-- ============================================================
-- STEP 7: Test the constraint works (optional)
-- ============================================================
-- Get a valid user ID:
SELECT id, username FROM users LIMIT 1;

-- Use that ID to test (replace 'YOUR-USER-ID-HERE' with actual ID):
-- INSERT INTO user_access (user_id, feature_key) 
-- VALUES ('YOUR-USER-ID-HERE', 'test_feature') 
-- ON CONFLICT (user_id, feature_key) DO NOTHING;

-- Clean up test:
-- DELETE FROM user_access WHERE feature_key = 'test_feature';

-- ============================================================
-- DONE! Your constraint is now fixed.
-- ============================================================

