# 🔧 Add Payment Mode Column - Step by Step Instructions

## Quick Steps (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to **https://supabase.com/dashboard**
2. Sign in if needed
3. Click on your project

### Step 2: Open SQL Editor
1. Look for **"SQL Editor"** in the left sidebar (icon looks like `</>`)
2. Click on it
3. Click the **"New query"** button at the top

### Step 3: Copy and Paste SQL
1. Open the file: **`RUN_THIS_SQL.sql`** in this project
2. Copy the **entire contents** of that file
3. Paste it into the Supabase SQL Editor

### Step 4: Run the SQL
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for it to complete
3. You should see: **"Success. No rows returned"** or a result table

### Step 5: Verify It Worked
Look at the results - you should see a row showing:
- `column_name`: payment_mode
- `data_type`: text
- `is_nullable`: YES

### Step 6: Test in Your App
1. **Hard refresh** your browser: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Go to **New Entry** page
3. Create a new entry with **"Bank Transfer"** selected in Payment Mode
4. Save it
5. Go to **Detailed Ledger** - the Payment Mode column should now show "Bank Transfer"!

---

## What This Does

- Adds `payment_mode` column to `cash_book` table
- Sets it as TEXT type (can store "Cash", "Bank Transfer", "Online")
- Makes it nullable (entries without payment mode will have NULL)
- Creates an index for faster queries

---

## Troubleshooting

**If you get an error:**
- Make sure you're connected to the correct Supabase project
- Check that the `cash_book` table exists
- If column already exists, the `IF NOT EXISTS` clause will skip it safely

**After adding the column:**
- ✅ **New entries** will save and display payment_mode correctly
- ⚠️ **Old entries** created before adding the column will still show "-" (this is normal)

---

## Need Help?

If you see any errors or need assistance, check:
1. Browser console for detailed error messages
2. Supabase SQL Editor for any SQL errors
3. Make sure you copied the entire SQL from `RUN_THIS_SQL.sql`

