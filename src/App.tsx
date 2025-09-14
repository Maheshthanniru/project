import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import EditEntry from './pages/EditEntry';
import DailyReport from './pages/DailyReport';
import DetailedLedger from './pages/DetailedLedger';
import LedgerSummary from './pages/LedgerSummary';
import ApproveRecords from './pages/ApproveRecords';
import EditedRecords from './pages/EditedRecords';
import DeletedRecords from './pages/DeletedRecords';
import ReplaceForm from './pages/ReplaceForm';
import BalanceSheet from './pages/BalanceSheet';
import ExportExcel from './pages/ExportExcel';
import Vehicles from './pages/Vehicles';
import BankGuarantees from './pages/BankGuarantees';
import Drivers from './pages/Drivers';
import UserManagement from './pages/UserManagement';
import CsvUpload from './pages/CsvUpload';
import DebugInfo from './components/UI/DebugInfo';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='text-red-500 text-6xl mb-4'>⚠️</div>
            <h1 className='text-xl font-bold text-gray-900 mb-2'>
              Something went wrong
            </h1>
            <p className='text-gray-600 mb-4'>
              We're sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors'
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-4 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500'>
                  Error Details
                </summary>
                <pre className='mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto'>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to='/login' replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Router>
      <Toaster
        position='top-right'
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path='/login' element={<Login />} />
        <Route
          path='/*'
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path='new-entry' element={<NewEntry />} />
          <Route path='edit-entry' element={<EditEntry />} />
          <Route path='daily-report' element={<DailyReport />} />
          <Route path='detailed-ledger' element={<DetailedLedger />} />
          <Route path='ledger-summary' element={<LedgerSummary />} />
          <Route path='approve-records' element={<ApproveRecords />} />
          <Route path='edited-records' element={<EditedRecords />} />
          <Route path='deleted-records' element={<DeletedRecords />} />
          <Route path='replace-form' element={<ReplaceForm />} />
          <Route path='balance-sheet' element={<BalanceSheet />} />
          <Route path='export-excel' element={<ExportExcel />} />
          <Route path='vehicles' element={<Vehicles />} />
          <Route path='bank-guarantees' element={<BankGuarantees />} />
          <Route path='drivers' element={<Drivers />} />
          <Route path='user-management' element={<UserManagement />} />
          <Route path='csv-upload' element={<CsvUpload />} />
        </Route>
      </Routes>
    </Router>
  );
};

// Root App Component with Error Boundary
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
          <DebugInfo isVisible={false} />
          {/* React Query DevTools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
