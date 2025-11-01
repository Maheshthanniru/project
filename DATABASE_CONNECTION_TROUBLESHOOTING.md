# 🔧 Database Connection Troubleshooting Guide

## 🚨 Error: "Database access failed: TypeError: Failed to fetch"

This error means your browser cannot connect to the Supabase database server. Follow these steps to resolve it:

---

## ✅ Quick Fixes (Try These First)

### 1. **Clear Browser Cache and Hard Refresh**
- **Windows/Linux**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`
- **Or**: Open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

### 2. **Check Your Internet Connection**
1. Open https://www.google.com in your browser
2. If Google doesn't load, you have an internet connectivity issue
3. Try restarting your router/modem

### 3. **Test Supabase Connectivity**
1. Open https://pmqeegdmcrktccszgbwu.supabase.co in your browser
2. You should see a Supabase page (even if it's an error page)
3. If it doesn't load, Supabase may be blocked or down

---

## 🔍 Common Causes & Solutions

### **Cause 1: Firewall/Antivirus Blocking Connection**

**Solution:**
1. Temporarily disable your firewall/antivirus
2. Test the connection
3. If it works, add an exception for:
   - `localhost:5173`
   - `*.supabase.co`
   - `*.supabase.io`

### **Cause 2: Corporate/School Network**

**Solution:**
- Network may be blocking Supabase domains
- **Try**: Connect to a mobile hotspot and test
- **Or**: Contact IT to whitelist Supabase domains

### **Cause 3: VPN/Proxy Issues**

**Solution:**
1. Temporarily disable VPN
2. Test the connection
3. If it works, try a different VPN server location
4. Check proxy settings in your browser

### **Cause 4: Browser Extensions**

**Solution:**
1. Try **Incognito/Private mode** (this disables extensions)
2. If it works, disable ad blockers/extensions one by one
3. Common culprits: uBlock Origin, AdBlock Plus, Privacy Badger

### **Cause 5: Browser Cache/Cookies**

**Solution:**
1. **Chrome**: Settings → Privacy → Clear browsing data → Select "All time" → Clear data
2. **Firefox**: Settings → Privacy → Clear Data → Clear Now
3. **Edge**: Settings → Privacy → Clear browsing data

---

## 🛠️ Advanced Troubleshooting

### **Step 1: Check Browser Console**
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for specific error messages:
   - **CORS error**: "Access to fetch at '...' has been blocked"
   - **Network error**: "Failed to fetch"
   - **SSL error**: "ERR_CERT_AUTHORITY_INVALID"

### **Step 2: Check Network Tab**
1. Open **F12** → **Network** tab
2. Try to access the database (refresh the page)
3. Look for failed requests to `*.supabase.co`
4. Click on the failed request to see details:
   - **Status**: 0 or CORS error
   - **Headers**: Check if request is being sent
   - **Response**: See error message

### **Step 3: Test Connection Directly**

**Option A: Use Built-in Test**
1. Open your app: http://localhost:5173
2. Login with your credentials
3. Go to **Edit Entry** page
4. Look for test/connection buttons (if available)
5. Check browser console for detailed logs

**Option B: Manual Test**
Open browser console (F12) and run:
```javascript
fetch('https://pmqeegdmcrktccszgbwu.supabase.co/rest/v1/', {
  method: 'HEAD',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM'
  }
})
.then(r => console.log('✅ Connection OK:', r.status))
.catch(e => console.error('❌ Connection Failed:', e));
```

### **Step 4: Check Supabase Project Status**
1. Go to: https://supabase.com/dashboard
2. Login and select your project
3. Check if project is **Active** (not paused)
4. Go to **Settings → API** and verify:
   - Project URL: `https://pmqeegdmcrktccszgbwu.supabase.co`
   - Check if Anon Key matches

### **Step 5: Check Environment Variables**
1. Make sure your `.env` file (if exists) has:
```env
VITE_SUPABASE_URL=https://pmqeegdmcrktccszgbwu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Restart your dev server after changing `.env`:
```bash
# Stop server (Ctrl+C)
cd project
npm run dev
```

---

## 🔄 Try Different Approaches

### **Approach 1: Different Browser**
- Try **Chrome**, **Firefox**, **Edge**, or **Safari**
- If one works, it's a browser-specific issue

### **Approach 2: Different Network**
- Connect to **mobile hotspot**
- If it works, your network is blocking Supabase

### **Approach 3: Restart Everything**
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear node_modules and reinstall
cd project
rm -rf node_modules package-lock.json
npm install

# 3. Restart dev server
npm run dev

# 4. Clear browser cache (Ctrl+Shift+R)
# 5. Try again
```

---

## 📋 Checklist

- [ ] Cleared browser cache and hard refreshed
- [ ] Tested internet connection (Google loads)
- [ ] Tested Supabase URL directly in browser
- [ ] Tried different browser
- [ ] Tried incognito/private mode
- [ ] Disabled VPN/proxy
- [ ] Disabled firewall/antivirus temporarily
- [ ] Tried mobile hotspot
- [ ] Checked browser console for errors
- [ ] Checked Network tab for failed requests
- [ ] Verified Supabase project is active
- [ ] Restarted dev server
- [ ] Cleared node_modules and reinstalled

---

## 🆘 If Nothing Works

1. **Check Supabase Status**: https://status.supabase.com
2. **Try Different Device**: Test on another computer/device
3. **Contact Support**: 
   - Supabase Support: https://supabase.com/support
   - Check Supabase Discord/Slack communities

---

## 💡 Most Common Solution

**80% of "Failed to fetch" errors are resolved by:**
1. **Hard refresh** (Ctrl+Shift+R)
2. **Clear browser cache**
3. **Try incognito mode**

If these don't work, the issue is likely network-related (firewall, proxy, or ISP blocking).

