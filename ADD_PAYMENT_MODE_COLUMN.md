# Add Payment Mode Column - IMPORTANT

## Quick Fix for Payment Mode

Your database doesn't have the `payment_mode` column yet. Follow these steps:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run This SQL Command

Copy and paste this SQL into the editor and click "Run":

```sql
ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS payment_mode TEXT;

COMMENT ON COLUMN cash_book.payment_mode IS 'Payment mode: Cash, Bank Transfer, or other payment methods';

CREATE INDEX IF NOT EXISTS idx_cash_book_payment_mode ON cash_book(payment_mode);
```

### Step 3: Verify It Worked

After running the SQL, refresh your app and try creating a new entry with "Bank Transfer" selected. It should now save and display correctly.

### Note About Existing Entries

- **New entries** created after adding the column will show payment mode correctly
- **Old entries** created before adding the column will still show "-" (they were saved before the column existed)

To update old entries with payment mode, you would need to manually update them in the database or edit them through the Edit Entry form.

