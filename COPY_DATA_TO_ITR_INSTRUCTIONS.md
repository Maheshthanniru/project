# Copy Data to ITR Tables - Instructions

## Overview
This script copies all existing data from your regular tables to the ITR tables, so you have the same data available in both modes.

## ⚠️ Important Notes

1. **This is a COPY operation** - Your original data remains untouched
2. **Uses ON CONFLICT DO NOTHING** - Won't duplicate if data already exists
3. **Safe to run multiple times** - Won't create duplicates
4. **Preserves all relationships** - Foreign keys and references are maintained

## 📋 Steps to Run

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Log in to your account
3. Select your project

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** or the **"+"** button

### Step 3: Run the Script
1. Open the file `copy_data_to_itr_tables.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for completion (may take a few minutes if you have a lot of data)

### Step 4: Verify Results
The script will show a summary at the end with counts for each table. You should see:
- ✅ Success messages for each table
- 📊 Record counts for each ITR table
- Summary report at the end

## 📊 What Gets Copied

### Core Financial Tables
- ✅ `cash_book` → `cash_book_itr` (All transaction entries)
- ✅ `edit_cash_book` → `edit_cash_book_itr` (Edit audit trail)
- ✅ `original_cash_book` → `original_cash_book_itr` (Backup entries)
- ✅ `deleted_cash_book` → `deleted_cash_book_itr` (Deleted records)

### Account Management
- ✅ `company_main_accounts` → `company_main_accounts_itr` (Chart of accounts)
- ✅ `company_main_sub_acc` → `company_main_sub_acc_itr` (Sub-accounts)

### Reporting Tables
- ✅ `balance_sheet` → `balance_sheet_itr` (Balance sheet data)
- ✅ `ledger` → `ledger_itr` (Ledger summary)

### Optional Tables
- ✅ `bank_guarantees` → `bank_guarantees_itr`
- ✅ `vehicles` → `vehicles_itr`
- ✅ `drivers` → `drivers_itr`

## 🔄 After Copying

Once the data is copied:

1. **Toggle ITR Mode** in your application
2. **Verify Data** - Check that all entries, accounts, and sub-accounts appear
3. **Test Functionality** - Create new entries in ITR mode to ensure everything works
4. **Dashboard** - Verify counts and balances show correctly in ITR mode

## 🛡️ Safety Features

- **ON CONFLICT DO NOTHING** - Prevents duplicate entries
- **Preserves IDs** - Same IDs in both tables for consistency
- **Maintains Relationships** - Foreign keys are properly mapped
- **Sequence Updates** - Auto-increment sequences are set correctly

## ⚡ Performance

- **Large datasets**: May take several minutes for 67k+ records
- **Progress**: Watch the console for progress messages
- **No downtime**: Your application continues to work during the copy

## 🔍 Troubleshooting

### If you get foreign key errors:
- Make sure you ran `create_itr_tables.sql` first
- Check that all ITR tables exist

### If some records don't copy:
- Check for data type mismatches
- Verify column names match exactly
- Check the error messages in Supabase logs

### If sequences are wrong:
- The script automatically updates sequences
- If needed, you can manually reset them later

## ✅ Success Indicators

After running, you should see:
- All tables show record counts > 0
- No error messages
- Summary report shows all tables copied
- Application works correctly in ITR mode

