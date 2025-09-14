import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with fallback credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

console.log('🔗 Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple in-memory cache for balance sheet data
const balanceSheetCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes (if any)
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Thirumala Business Management System API',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// Balance Sheet API - Server-side aggregation for performance
app.get('/api/balance-sheet', async (req, res) => {
  // Set a longer timeout for large data requests
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  
  try {
    const { 
      companyName, 
      fromDate, 
      toDate, 
      plYesNo, 
      bothYesNo,
      betweenDates = 'true'
    } = req.query;

    // Create cache key
    const cacheKey = `${companyName || 'all'}-${fromDate || 'all'}-${toDate || 'all'}-${plYesNo || 'all'}-${bothYesNo || 'all'}-${betweenDates}`;
    
    // Check cache first
    const cachedData = balanceSheetCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log('🚀 Serving balance sheet from cache');
      return res.json({
        ...cachedData.data,
        cached: true,
        cacheAge: Date.now() - cachedData.timestamp
      });
    }

    console.log('🔄 Processing balance sheet request:', { companyName, fromDate, toDate, plYesNo, bothYesNo });

    // Build the query with server-side aggregation
    let query = supabase
      .from('cash_book')
      .select('acc_name, credit, debit, c_date, company_name', { count: 'exact' });

    // Apply filters at database level
    if (companyName && companyName !== '') {
      query = query.eq('company_name', companyName);
    }

    if (betweenDates === 'true' && fromDate && toDate) {
      query = query.gte('c_date', fromDate).lte('c_date', toDate);
    }

    // First, get the total count
    const { count, error: countError } = await query;
    if (countError) {
      console.error('❌ Count query error:', countError);
      return res.status(500).json({ error: 'Count query failed' });
    }

    console.log(`📊 Total records to fetch: ${count}`);
    
    if (count > 100000) {
      console.log('⚠️ Large dataset detected, this may take a while...');
    }

    // Fetch all data using pagination
    let allData = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMoreData = true;
    const startTime = Date.now();

    while (hasMoreData && offset < count) {
      try {
        console.log(`🔄 Fetching batch: offset ${offset}, limit ${batchSize}`);
        
        const batchQuery = supabase
          .from('cash_book')
          .select('acc_name, credit, debit, c_date, company_name');

        // Apply filters to batch query
        if (companyName && companyName !== '') {
          batchQuery.eq('company_name', companyName);
        }

        if (betweenDates === 'true' && fromDate && toDate) {
          batchQuery.gte('c_date', fromDate).lte('c_date', toDate);
        }

        const { data: batchData, error: batchError } = await batchQuery
          .range(offset, offset + batchSize - 1);

        if (batchError) {
          console.error(`❌ Batch error at offset ${offset}:`, batchError);
          break;
        }

        if (!batchData || batchData.length === 0) {
          console.log('⚠️ No more data returned, stopping pagination');
          hasMoreData = false;
        } else {
          allData = [...allData, ...batchData];
          offset += batchSize;
          
          console.log(`📊 Batch ${Math.floor(offset/batchSize)}: ${batchData.length} records, Total so far: ${allData.length}/${count}`);
          
          // If we got less than batchSize, we've reached the end
          if (batchData.length < batchSize) {
            console.log('✅ Reached end of data (got less than batch size)');
            hasMoreData = false;
          }
          
          // Safety check to prevent infinite loops
          if (allData.length >= count) {
            console.log('✅ Reached total count, stopping pagination');
            hasMoreData = false;
          }
        }
      } catch (batchError) {
        console.error(`❌ Error in batch at offset ${offset}:`, batchError);
        // Continue with next batch instead of failing completely
        offset += batchSize;
        
        // If we've had too many errors, stop
        if (offset > count) {
          console.error('❌ Too many batch errors, stopping pagination');
          hasMoreData = false;
        }
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`✅ Pagination complete: ${allData.length} records fetched in ${duration.toFixed(2)} seconds`);
    const data = allData;

    if (!data || data.length === 0) {
      return res.json({
        balanceSheetData: [],
        totals: { totalCredit: 0, totalDebit: 0, balanceRs: 0 },
        cached: false,
        timestamp: new Date().toISOString()
      });
    }

    // Server-side aggregation
    const accountMap = new Map();
    let totalCredit = 0;
    let totalDebit = 0;

    data.forEach(entry => {
      const accName = entry.acc_name;
      
      if (!accountMap.has(accName)) {
        accountMap.set(accName, {
          accountName: accName,
          credit: 0,
          debit: 0,
          balance: 0,
          plYesNo: getAccountPLStatus(accName),
          bothYesNo: getAccountBothStatus(accName),
          result: '',
        });
      }

      const account = accountMap.get(accName);
      account.credit += entry.credit || 0;
      account.debit += entry.debit || 0;
      account.balance = account.credit - account.debit;
      account.result = account.balance >= 0 ? 'CREDIT' : 'DEBIT';

      totalCredit += entry.credit || 0;
      totalDebit += entry.debit || 0;
    });

    let balanceSheetAccounts = Array.from(accountMap.values());

    // Apply additional filters
    if (plYesNo && plYesNo !== '') {
      balanceSheetAccounts = balanceSheetAccounts.filter(
        acc => acc.plYesNo === plYesNo
      );
    }

    if (bothYesNo && bothYesNo !== '') {
      balanceSheetAccounts = balanceSheetAccounts.filter(
        acc => acc.bothYesNo === bothYesNo
      );
    }

    // Sort by account name
    balanceSheetAccounts.sort((a, b) => a.accountName.localeCompare(b.accountName));

    const balanceRs = totalCredit - totalDebit;

    console.log(`✅ Balance sheet generated: ${balanceSheetAccounts.length} accounts, ${data.length} transactions`);

    const responseData = {
      balanceSheetData: balanceSheetAccounts,
      totals: { totalCredit, totalDebit, balanceRs },
      cached: false,
      timestamp: new Date().toISOString(),
      recordCount: data.length
    };

    // Cache the result
    balanceSheetCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean up old cache entries (keep only last 100 entries)
    if (balanceSheetCache.size > 100) {
      const entries = Array.from(balanceSheetCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      balanceSheetCache.clear();
      entries.slice(0, 100).forEach(([key, value]) => {
        balanceSheetCache.set(key, value);
      });
    }

    res.json(responseData);

  } catch (error) {
    console.error('❌ Balance sheet API error:', error);
    
    // If pagination fails, try a simpler approach with a larger limit
    try {
      console.log('🔄 Attempting fallback query with larger limit...');
      
      let fallbackQuery = supabase
        .from('cash_book')
        .select('acc_name, credit, debit, c_date, company_name')
        .limit(50000); // Try to get up to 50k records

      // Apply filters to fallback query
      if (companyName && companyName !== '') {
        fallbackQuery = fallbackQuery.eq('company_name', companyName);
      }

      if (betweenDates === 'true' && fromDate && toDate) {
        fallbackQuery = fallbackQuery.gte('c_date', fromDate).lte('c_date', toDate);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        throw fallbackError;
      }

      console.log(`✅ Fallback successful: ${fallbackData?.length || 0} records fetched`);
      
      // Process fallback data
      const accountMap = new Map();
      let totalCredit = 0;
      let totalDebit = 0;

      (fallbackData || []).forEach(entry => {
        const accName = entry.acc_name;
        
        if (!accountMap.has(accName)) {
          accountMap.set(accName, {
            accountName: accName,
            credit: 0,
            debit: 0,
            balance: 0,
            plYesNo: getAccountPLStatus(accName),
            bothYesNo: getAccountBothStatus(accName),
            result: '',
          });
        }

        const account = accountMap.get(accName);
        account.credit += entry.credit || 0;
        account.debit += entry.debit || 0;
        account.balance = account.credit - account.debit;
        account.result = account.balance >= 0 ? 'CREDIT' : 'DEBIT';

        totalCredit += entry.credit || 0;
        totalDebit += entry.debit || 0;
      });

      let balanceSheetAccounts = Array.from(accountMap.values());

      // Apply additional filters
      if (plYesNo && plYesNo !== '') {
        balanceSheetAccounts = balanceSheetAccounts.filter(
          acc => acc.plYesNo === plYesNo
        );
      }

      if (bothYesNo && bothYesNo !== '') {
        balanceSheetAccounts = balanceSheetAccounts.filter(
          acc => acc.bothYesNo === bothYesNo
        );
      }

      balanceSheetAccounts.sort((a, b) => a.accountName.localeCompare(b.accountName));

      const balanceRs = totalCredit - totalDebit;

      console.log(`✅ Fallback balance sheet generated: ${balanceSheetAccounts.length} accounts from ${fallbackData?.length || 0} transactions`);

      res.json({
        balanceSheetData: balanceSheetAccounts,
        totals: { totalCredit, totalDebit, balanceRs },
        cached: false,
        timestamp: new Date().toISOString(),
        recordCount: fallbackData?.length || 0,
        fallback: true
      });

    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Both primary and fallback queries failed',
        details: error.message 
      });
    }
  }
});

// Helper functions for account status (moved from frontend)
function getAccountPLStatus(accountName) {
  const plAccounts = [
    'SALES', 'PURCHASE', 'EXPENSES', 'INCOME', 'REVENUE', 'COST OF GOODS SOLD',
    'OPERATING EXPENSES', 'ADMINISTRATIVE EXPENSES', 'SELLING EXPENSES'
  ];
  
  const upperAccountName = accountName.toUpperCase();
  return plAccounts.some(plAcc => upperAccountName.includes(plAcc)) ? 'YES' : 'NO';
}

function getAccountBothStatus(accountName) {
  const bothAccounts = [
    'BANK', 'CASH', 'ACCOUNTS RECEIVABLE', 'ACCOUNTS PAYABLE', 'INVENTORY',
    'PREPAID EXPENSES', 'ACCRUED EXPENSES', 'LOANS', 'EQUITY'
  ];
  
  const upperAccountName = accountName.toUpperCase();
  return bothAccounts.some(bothAcc => upperAccountName.includes(bothAcc)) ? 'YES' : 'NO';
}

// Cache management endpoints
app.post('/api/balance-sheet/cache/clear', (req, res) => {
  balanceSheetCache.clear();
  console.log('🗑️ Balance sheet cache cleared');
  res.json({ message: 'Cache cleared successfully', timestamp: new Date().toISOString() });
});

app.get('/api/balance-sheet/cache/stats', (req, res) => {
  const cacheStats = {
    size: balanceSheetCache.size,
    entries: Array.from(balanceSheetCache.keys()),
    timestamp: new Date().toISOString()
  };
  res.json(cacheStats);
});

// Serve static files from the React app build directory
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.match(/\.(png|jpg|jpeg|gif|ico|svg|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Thirumala Business Management System`);
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API status: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 