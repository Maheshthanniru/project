import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import ReplaceForm from './pages/ReplaceForm';
import BalanceSheet from './pages/BalanceSheet';
import ExportExcel from './pages/ExportExcel';
import Vehicles from './pages/Vehicles';
import BankGuarantees from './pages/BankGuarantees';
import Drivers from './pages/Drivers';
import UserManagement from './pages/UserManagement';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Router>
      <Toaster 
        position="top-right"
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
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="new-entry" element={<NewEntry />} />
          <Route path="edit-entry" element={<EditEntry />} />
          <Route path="daily-report" element={<DailyReport />} />
          <Route path="detailed-ledger" element={<DetailedLedger />} />
          <Route path="ledger-summary" element={<LedgerSummary />} />
          <Route path="approve-records" element={<ApproveRecords />} />
          <Route path="edited-records" element={<EditedRecords />} />
          <Route path="replace-form" element={<ReplaceForm />} />
          <Route path="balance-sheet" element={<BalanceSheet />} />
          <Route path="export-excel" element={<ExportExcel />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="bank-guarantees" element={<BankGuarantees />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="user-management" element={<UserManagement />} />
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;