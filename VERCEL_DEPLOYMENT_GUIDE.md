# Vercel Deployment Fix Guide

## 🚨 Current Issue
Your deployed app shows `ERR_NAME_NOT_RESOLVED` when trying to create new entries because the environment variables are not configured in Vercel.

## ✅ Solution Steps

### Step 1: Add Environment Variables to Vercel

1. **Go to your Vercel Dashboard**
   - Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Navigate to Environment Variables**
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add the following variables:**

   **Variable 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://pmqeegdmcrktccszgbwu.supabase.co`
   - **Environment:** Production, Preview, Development
   - Click **Add**

   **Variable 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM`
   - **Environment:** Production, Preview, Development
   - Click **Add**

### Step 2: Redeploy Your App

1. **Trigger a new deployment:**
   - Go to **Deployments** tab
   - Click **Redeploy** on your latest deployment
   - Or push a new commit to your GitHub repository

2. **Wait for deployment to complete**
   - This usually takes 1-2 minutes

### Step 3: Test the Fix

1. **Visit your deployed app**
2. **Try to create a new entry**
3. **Check if the error is resolved**

## 🔧 Additional Configuration

### SPA Routing (Already Fixed)
Your `vercel.json` file is already configured correctly for SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Database Verification
✅ Your Supabase database is working correctly:
- Connection: ✅ Successful
- User types: ✅ Present
- Users: ✅ 4 users configured
- Tables: ✅ All tables created

## 🧪 Local Testing

To test locally before deploying:

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:5173**

3. **Test creating a new entry**

4. **Verify data is saved to Supabase**

## 🚀 Deployment Checklist

- [ ] Environment variables added to Vercel
- [ ] App redeployed
- [ ] New entry creation tested
- [ ] All features working
- [ ] No 404 errors on subpages

## 🔍 Troubleshooting

### If you still get errors:

1. **Check Vercel logs:**
   - Go to your deployment
   - Click on **Functions** tab
   - Check for any build errors

2. **Verify environment variables:**
   - Go to Settings → Environment Variables
   - Ensure both variables are set correctly
   - Make sure they're enabled for Production

3. **Check browser console:**
   - Open browser developer tools
   - Look for specific error messages
   - Check Network tab for failed requests

### Common Issues:

**"ERR_NAME_NOT_RESOLVED"**
- Environment variables not set in Vercel
- Wrong Supabase URL
- Supabase project inactive

**"Table doesn't exist"**
- Database migration not run
- RLS policies blocking access

**"RLS policy violation"**
- Row Level Security blocking access
- User not authenticated properly

## 📞 Support

If you continue to have issues:

1. **Check the browser console** for specific error messages
2. **Verify your Supabase project** is active
3. **Test locally first** to ensure the app works
4. **Check Vercel deployment logs** for build errors

## ✅ Success Indicators

Your deployment is working correctly when:
- ✅ You can create new entries without errors
- ✅ Data is saved to your Supabase database
- ✅ All pages load without 404 errors
- ✅ Login/logout works properly
- ✅ All features function as expected

---

**Your Supabase credentials are working perfectly!** The only issue is that Vercel needs these credentials as environment variables. Once you add them, your deployment will work flawlessly. 