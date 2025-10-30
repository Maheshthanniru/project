# Clear Cash Book Entries Only

This directory contains scripts to clear only the cash book entries while preserving all other data in your database.

## What Gets Cleared
- ✅ All cash book entries (`cash_book` table)
- ✅ Deleted cash book entries (`deleted_cash_book` table) 
- ✅ Edit audit logs (`edit_cash_book` table)

## What Gets Preserved
- ✅ Companies (`companies` table)
- ✅ Main Accounts (`company_main_accounts` table)
- ✅ Sub Accounts (`company_main_sub_acc` table)
- ✅ Staff/Users (`users` table)
- ✅ Bank Guarantees (`bank_guarantees` table)
- ✅ Vehicles (`vehicles` table)
- ✅ Drivers (`drivers` table)

## Available Scripts

### 1. SQL Script (Recommended for Supabase Dashboard)
**File:** `clear-cashbook-only.sql`

**How to use:**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `clear-cashbook-only.sql`
4. Click "Run" to execute

**Advantages:**
- Direct database execution
- No environment setup required
- Immediate results

### 2. Node.js Script
**File:** `clear-cashbook-only.cjs`

**Prerequisites:**
- Node.js installed
- `.env` file in project root with Supabase credentials

**How to use:**
```bash
cd scripts
node clear-cashbook-only.cjs
```

### 3. Windows Batch File
**File:** `clear-cashbook-only.bat`

**How to use:**
1. Double-click the `.bat` file
2. Follow the prompts

### 4. PowerShell Script
**File:** `clear-cashbook-only.ps1`

**How to use:**
1. Right-click the `.ps1` file
2. Select "Run with PowerShell"
3. Follow the prompts

## Environment Setup

For the Node.js script, ensure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Safety Features

All scripts include:
- ✅ Data count verification before and after cleanup
- ✅ Preservation verification for all non-cashbook data
- ✅ Error handling and rollback capabilities
- ✅ Clear success/failure reporting

## What Happens After Cleanup

1. All cash book entries are permanently removed
2. Serial numbers reset to start from 1
3. All company, account, subaccount, and staff data remains intact
4. You can immediately start creating new cash book entries
5. The system will use the preserved data for dropdowns and selections

## Troubleshooting

### If you get permission errors:
- Use the SQL script directly in Supabase dashboard
- Ensure your database user has DELETE permissions

### If data seems to be missing after cleanup:
- Check the verification output in the script results
- The script shows before/after counts for all tables
- All preserved data should show ✅ marks

### If the script fails:
- Check your internet connection
- Verify your Supabase credentials in `.env`
- Try the SQL script instead

## Recovery

**Important:** This operation is irreversible. Once cash book entries are deleted, they cannot be recovered unless you have a database backup.

If you need to recover:
1. Restore from a database backup
2. Or re-enter the cash book data manually

## Support

If you encounter any issues:
1. Check the console output for error messages
2. Verify your database connection
3. Ensure all prerequisites are met
4. Try the SQL script as an alternative






