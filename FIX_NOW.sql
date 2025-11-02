-- ============================================================
-- QUICK FIX: Run these in order, one at a time
-- ============================================================

-- STEP 1: Check for orphaned records (run this first)
SELECT 
    'Orphaned records found:' as info,
    COUNT(*) as count
FROM user_access ua
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ua.user_id);

-- If count > 0, proceed to STEP 2 to clean them up
-- If count = 0, skip to STEP 3

-- STEP 2: Delete orphaned records (only if STEP 1 showed count > 0)
DELETE FROM user_access 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_access.user_id);

-- STEP 3: Drop the constraint
ALTER TABLE user_access 
DROP CONSTRAINT IF EXISTS user_access_user_id_fkey;

-- STEP 4: Recreate the constraint correctly
ALTER TABLE user_access
ADD CONSTRAINT user_access_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- STEP 5: Verify it worked (should show "users" not "userss")
SELECT 
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'user_access_user_id_fkey';

-- Expected: referenced_table should be "users"
-- Done! ✅

