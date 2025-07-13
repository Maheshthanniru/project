# Supabase Setup Guide for Thirumala Business Management System

## 🚀 Why Supabase is Essential for Business Use

This application is designed for **client business use**, which requires:
- ✅ **Cloud Database** - Data stored safely in the cloud
- ✅ **Multi-device Access** - Access from any computer
- ✅ **Data Backup** - Automatic cloud backup
- ✅ **User Management** - Control who accesses what
- ✅ **Audit Trail** - Complete business compliance logging
- ✅ **Reliability** - No data loss from browser clearing

## 📋 Setup Steps

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `thirumala-business-system`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

### Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xyz.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### Step 3: Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and replace with your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire content of `supabase/migrations/20250707174204_snowy_crystal.sql`
3. Paste it in the SQL Editor
4. Click "Run" to execute the migration
5. This creates all the necessary tables

### Step 5: Set Up Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your site URL (for production, use your actual domain)
3. For development, you can use: `http://localhost:5173`

### Step 6: Configure Row Level Security (RLS)

The migration includes RLS policies, but you may need to enable them:

1. Go to **Authentication** → **Policies**
2. Enable RLS on all tables if not already enabled
3. The migration should have created the necessary policies

### Step 7: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Try creating a new entry to test the database connection

## 🔧 Troubleshooting

### Common Issues:

**1. "Invalid API key" error**
- Check that your `.env` file has the correct values
- Ensure the file is named `.env` (not `.env.txt`)
- Restart the development server after changing `.env`

**2. "Table doesn't exist" error**
- Make sure you ran the migration in Step 4
- Check that all tables were created in the Supabase dashboard

**3. "RLS policy violation" error**
- Go to **Authentication** → **Policies** in Supabase
- Ensure RLS is enabled and policies are created

**4. "Connection failed" error**
- Check your internet connection
- Verify the Supabase URL is correct
- Ensure your Supabase project is active

## 📊 Database Schema Overview

The migration creates these main tables:

- **`users`** - User authentication and profiles
- **`companies`** - Company master data
- **`company_main_accounts`** - Chart of accounts
- **`company_main_sub_acc`** - Sub-accounts
- **`cash_book`** - Main transaction ledger
- **`edit_cash_book`** - Audit trail
- **`bank_guarantees`** - BG tracking
- **`vehicles`** - Vehicle management
- **`drivers`** - Driver information

## 🔒 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Audit Trail** - All changes are logged
- **User Authentication** - Secure login system
- **Data Validation** - Input validation and sanitization

## 🚀 Production Deployment

For production deployment:

1. **Update Site URL** in Supabase Authentication settings
2. **Set up custom domain** (optional)
3. **Configure email templates** for authentication
4. **Set up monitoring** and alerts
5. **Regular backups** (automatic with Supabase)

## 💰 Cost Considerations

Supabase offers a generous free tier:
- **Free Tier**: 500MB database, 2GB bandwidth, 50MB file storage
- **Pro Tier**: $25/month for larger businesses
- **Enterprise**: Custom pricing for large organizations

For most small to medium businesses, the free tier is sufficient.

## 📞 Support

If you encounter issues:
1. Check the Supabase documentation
2. Review the error messages in browser console
3. Check Supabase dashboard for any alerts
4. Contact support if needed

---

**Next Steps**: After setup, test all features and train your client on using the system! 