# 🚀 Quick Fix: Add Payment Mode Column

## The Fastest Way (30 seconds)

### Option 1: Copy-Paste SQL (EASIEST)

1. **Open this file**: `add-payment-mode-direct.sql`
2. **Copy ALL the SQL code**
3. **Go to Supabase Dashboard** → Your Project → **SQL Editor**
4. **Paste and click "Run"**

**That's it!** The column will be added instantly.

---

### Option 2: Run Node Script (Alternative)

If you have Node.js installed and your service role key:

```bash
cd project
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node add-payment-mode-column.js
```

**Note**: You need the `service_role` key (not anon key) from Supabase Dashboard > Settings > API

---

## What Happens After Adding Column?

✅ **Immediately works:**
- New entries from NewEntry form will save payment_mode
- Payment mode will display in Detailed Ledger table
- Values like "Cash", "Bank Transfer", "Online" will show correctly

⚠️ **Old entries:**
- Entries created BEFORE adding the column will still show "-"
- This is normal - they don't have payment_mode values
- Only NEW entries after adding the column will have payment_mode

---

## Verify It Worked

After running the SQL, check:
1. Go to Supabase Dashboard → Table Editor → `cash_book` table
2. You should see a `payment_mode` column in the columns list
3. Create a test entry with payment mode - it should save!

---

## SQL Command (Copy This)

```sql
ALTER TABLE cash_book 
ADD COLUMN IF NOT EXISTS payment_mode TEXT;
```

Just paste this one line in Supabase SQL Editor and click Run!

