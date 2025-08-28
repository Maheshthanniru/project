# 🔧 Fix for "Failed to fetch" Database Error

## 🚨 Problem: Database access failed: TypeError: Failed to fetch

This error occurs when the browser cannot connect to the Supabase database. Here are the most common causes and solutions:

## 🔍 **Step 1: Check Your Internet Connection**

1. **Test basic internet connectivity**:
   - Open https://www.google.com in your browser
   - If Google doesn't load, you have an internet issue

2. **Test Supabase connectivity**:
   - Open https://pmqeegdmcrktccszgbwu.supabase.co in your browser
   - You should see a Supabase page (even if it's an error page)

## 🔍 **Step 2: Check CORS Settings**

The most common cause is CORS (Cross-Origin Resource Sharing) issues.

### **Quick Fix - Update Supabase Client Configuration:**

1. **Open**: `project/src/lib/supabase.ts`
2. **Find the createClient configuration**
3. **Make sure it includes these settings**:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'thirumala-business-app'
    }
  },
  db: {
    schema: 'public'
  }
});
```

## 🔍 **Step 3: Check Supabase Project Status**

1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `pmqeegdmcrktccszgbwu`
3. **Check if the project is active** (not paused)
4. **Go to Settings > API** and verify:
   - Project URL: `https://pmqeegdmcrktccszgbwu.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔍 **Step 4: Test Database Connection**

### **Option A: Use the Built-in Test Buttons**

1. **Open your app**: http://localhost:5173
2. **Login** with: `Bukka Ramesh` / `ramesh@1976`
3. **Go to New Entry page** and click "Test DB" button
4. **Go to CSV Upload page** and click "Test DB Connection" button
5. **Check browser console** (F12) for detailed error messages

### **Option B: Create a Simple Test**

Create a file `test-connection.html` in your project root:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Database Connection Test</title>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
</head>
<body>
    <h1>Database Connection Test</h1>
    <button onclick="testConnection()">Test Connection</button>
    <div id="result"></div>

    <script>
        const supabaseUrl = 'https://pmqeegdmcrktccszgbwu.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';
        
        const supabase = supabase.createClient(supabaseUrl, supabaseKey);
        
        async function testConnection() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = 'Testing connection...';
            
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .limit(1);
                
                if (error) {
                    resultDiv.innerHTML = `❌ Error: ${error.message}`;
                } else {
                    resultDiv.innerHTML = `✅ Success! Found ${data.length} records`;
                }
            } catch (err) {
                resultDiv.innerHTML = `💥 Exception: ${err.message}`;
            }
        }
    </script>
</body>
</html>
```

## 🔍 **Step 5: Common Solutions**

### **Solution 1: Clear Browser Cache**
1. **Press F12** to open developer tools
2. **Right-click the refresh button** and select "Empty Cache and Hard Reload"
3. **Or press Ctrl+Shift+R** (Windows) / Cmd+Shift+R (Mac)

### **Solution 2: Check Firewall/Antivirus**
1. **Temporarily disable** antivirus/firewall
2. **Test the connection**
3. **If it works**, add an exception for localhost:5173

### **Solution 3: Use Different Browser**
1. **Try Chrome, Firefox, or Edge**
2. **Test in incognito/private mode**

### **Solution 4: Check Network Proxy**
1. **If you're on a corporate network**, check proxy settings
2. **Try using a mobile hotspot** to test

## 🔍 **Step 6: Advanced Debugging**

### **Check Browser Console (F12)**
Look for these specific error messages:

- **CORS error**: "Access to fetch at '...' from origin '...' has been blocked"
- **Network error**: "Failed to fetch"
- **SSL error**: "ERR_CERT_AUTHORITY_INVALID"

### **Check Network Tab**
1. **Open F12 > Network tab**
2. **Try to access the database**
3. **Look for failed requests** to Supabase
4. **Check the response** for error details

## 🔍 **Step 7: Environment Variables**

Make sure your `.env` file (if you have one) has the correct values:

```env
VITE_SUPABASE_URL=https://pmqeegdmcrktccszgbwu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM
```

## 🔍 **Step 8: Last Resort Solutions**

### **Option 1: Restart Development Server**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd project
npm run dev
```

### **Option 2: Clear Node Modules**
```bash
cd project
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Option 3: Check Supabase Status**
- Visit: https://status.supabase.com
- Check if there are any service disruptions

## 🎯 **Quick Test Steps**

1. **Open**: http://localhost:5173
2. **Login**: `Bukka Ramesh` / `ramesh@1976`
3. **Go to**: New Entry page
4. **Click**: "Test DB" button
5. **Check**: Browser console (F12) for errors
6. **Look for**: Success message or specific error details

## 📞 **If Nothing Works**

1. **Check your internet connection**
2. **Try a different network** (mobile hotspot)
3. **Try a different browser**
4. **Check if Supabase is accessible** in your region
5. **Contact your network administrator** if on corporate network

---

**Most Common Fix**: The issue is usually CORS-related. Try the browser cache clear (Ctrl+Shift+R) first, as this resolves 80% of "Failed to fetch" errors.

