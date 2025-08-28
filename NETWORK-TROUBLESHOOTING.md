# Network Troubleshooting Guide

## Problem: "Database access failed: TypeError: Failed to fetch"

This error indicates that your browser cannot reach the Supabase server. Here are the solutions:

## Immediate Solutions

### 1. Enable Offline Mode ✅
**Your app now has offline mode! This allows you to continue working even when Supabase is unreachable.**

1. **Open the app** at `http://localhost:5173`
2. **Go to CSV Upload** page
3. **Click "Test DB Connection"** - this will automatically enable offline mode if Supabase is unreachable
4. **Upload CSV files** - they will be saved to local storage
5. **View your data** using "View Offline Data" button
6. **When connection is restored** - use "Sync to DB" button

### 2. Check Network Issues 🌐

#### **Corporate/School Network:**
- **Firewall may be blocking** Supabase (*.supabase.co)
- **Ask IT department** to whitelist Supabase domains
- **Try mobile hotspot** as alternative

#### **VPN/Proxy Issues:**
- **Disable VPN** temporarily and test
- **Try different VPN server** location
- **Check proxy settings** in browser

#### **Internet Connection:**
- **Test other websites** to confirm internet works
- **Try different browser** (Chrome, Firefox, Edge)
- **Clear browser cache** and cookies

### 3. Browser Issues 🔧

#### **CORS/Security Settings:**
```javascript
// Open browser console (F12) and check for CORS errors
// If you see CORS errors, try:
```

1. **Disable browser security** (temporary):
   - Chrome: Start with `--disable-web-security --user-data-dir=/tmp/chrome`
   - Firefox: Set `security.tls.insecure_fallback_hosts` in about:config

2. **Clear browser data**:
   - Clear cache, cookies, and site data
   - Reset browser to defaults

#### **Browser Extensions:**
- **Disable ad blockers** (uBlock Origin, AdBlock Plus)
- **Disable security extensions** temporarily
- **Try incognito/private mode**

## Advanced Solutions

### 4. Test Supabase Directly 🧪

#### **Manual URL Test:**
1. **Open browser** and go to: `https://pmqeegdmcrktccszgbwu.supabase.co`
2. **Should show Supabase page** or API response
3. **If it fails** - network/firewall is blocking Supabase

#### **Command Line Test:**
```bash
# Test if Supabase is reachable
curl -I https://pmqeegdmcrktccszgbwu.supabase.co/rest/v1/
ping pmqeegdmcrktccszgbwu.supabase.co
```

### 5. Alternative Solutions 🔄

#### **Use Different Network:**
- **Mobile hotspot** from your phone
- **Different WiFi network**
- **Public WiFi** (coffee shop, library)

#### **Use Different Computer:**
- **Try on another device** to isolate issue
- **Different operating system**

#### **Use Supabase Local Development:**
```bash
# Install Supabase CLI (if needed)
npx supabase init
npx supabase start
```

## Application Features for Offline Mode

### **What Works Offline:** ✅
- **CSV Upload** - saves to local storage
- **Data viewing** - view offline data
- **Data preview** - see uploaded CSV data
- **Export offline data** - download as CSV

### **Offline Mode Buttons:**
- **"Test DB Connection"** - auto-enables offline mode
- **"View Offline Data"** - see all saved data
- **"Clear Offline Data"** - reset offline storage
- **"Sync to DB"** - upload to Supabase when online

### **When Connection Returns:**
1. **Click "Test DB Connection"** again
2. **If successful** - offline mode automatically disabled
3. **Click "Sync to DB"** to upload offline data
4. **All functionality restored**

## Common Error Messages

### **"Failed to fetch"**
- **Network connectivity issue**
- **Enable offline mode** in the app

### **"CORS error"**
- **Browser security blocking request**
- **Try different browser** or incognito mode

### **"Network error"**
- **Internet connection problem**
- **Try mobile hotspot**

### **"Permission denied"**
- **Firewall blocking request**
- **Contact IT department**

## Prevention Tips

1. **Always test connectivity** before important work
2. **Use offline mode** when network is unreliable
3. **Keep offline data synced** regularly
4. **Have backup network** (mobile hotspot) ready
5. **Clear browser cache** regularly

## Contact Information

If none of these solutions work:
- **Check Supabase status**: https://status.supabase.com
- **Try alternative time** (different hours)
- **Report to IT department** if on corporate network

