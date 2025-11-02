-- SAFE FIX: Step-by-step fix for foreign key constraint
-- Run each step separately and check the results

-- ============================================
-- STEP 1: Check current constraint (run this first)
-- ============================================
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Note: If this shows "userss" (double s), that's the problem!

-- ============================================
-- STEP 2: Check for orphaned records
-- ============================================
SELECT 
    'Orphaned user_access records:' as info,
    COUNT(*) as count
FROM user_access ua
LEFT JOIN users u ON ua.user_id = u.id
WHERE u.id IS NULL;

-- If count > 0, you have orphaned records
-- Uncomment the next line to clean them up (BE CAREFUL!)
-- DELETE FROM user_access WHERE user_id NOT IN (SELECT id FROM users);

-- ============================================
-- STEP 3: Drop the constraint
-- ============================================
ALTER TABLE user_access 
DROP CONSTRAINT IF EXISTS user_access_user_id_fkey;

-- Verify it's dropped (should return no rows):
SELECT conname 
FROM pg_constraint 
WHERE conname = 'user_access_user_id_fkey';

-- ============================================
-- STEP 4: Recreate the constraint correctly
-- ============================================
ALTER TABLE user_access
ADD CONSTRAINT user_access_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- ============================================
-- STEP 5: Verify the fix
-- ============================================
SELECT 
    conname AS constraint_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Expected: referenced_table should show "users" (single 's')

-- ============================================
-- DONE! The constraint is now fixed.
-- ============================================

