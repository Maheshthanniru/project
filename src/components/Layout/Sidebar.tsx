import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Plus, Edit, FileText, Book, BookOpen, CheckCircle, FileEdit, Download, FileDown, Calculator, Truck, CreditCard, Users, LogOut, Replace, Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  key: string;
  adminOnly?: boolean;
  showForAll?: boolean;
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', path: '/', key: 'dashboard' },
    { icon: Plus, label: 'New Entry', path: '/new-entry', key: 'new_entry' },
    { icon: Edit, label: 'Edit Entry', path: '/edit-entry', key: 'edit_entry' },
    { icon: FileText, label: 'Daily Report', path: '/daily-report', key: 'daily_report' },
    { icon: Book, label: 'Detailed Ledger', path: '/detailed-ledger', key: 'detailed_ledger' },
    { icon: BookOpen, label: 'Ledger Summary', path: '/ledger-summary', key: 'ledger_summary' },
    { icon: CheckCircle, label: 'Approve Records', path: '/approve-records', key: 'approve_records' },
    { icon: FileEdit, label: 'Edited Records', path: '/edited-records', key: 'edited_records' },
    { icon: Replace, label: 'Replace Form', path: '/replace-form', key: 'replace_form' },
    { icon: Download, label: 'Export', path: '/export-excel', key: 'export' },
    { icon: Upload, label: 'CSV Upload', path: '/csv-upload', key: 'csv_upload' },
    { icon: Calculator, label: 'Balance Sheet', path: '/balance-sheet', key: 'balance_sheet' },
    { icon: Truck, label: 'Vehicles', path: '/vehicles', key: 'vehicles' },
    { icon: CreditCard, label: 'Bank Guarantees', path: '/bank-guarantees', key: 'bank_guarantees' },
    { icon: Users, label: 'Drivers', path: '/drivers', key: 'drivers' },
    // Admin only
    { icon: Users, label: 'User Management', path: '/user-management', key: 'users', adminOnly: true },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 left-0 z-30 bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-xl rounded-r-2xl flex flex-col border-r border-blue-100">
      {/* Top: Logo/Brand and User Info */}
      <div className="flex flex-col gap-0">
        {/* Logo/Brand */}
        <div className="p-5 border-b border-blue-200 bg-gradient-to-br from-orange-50 to-red-50 shadow-sm flex flex-col items-center">
          <div className="w-14 h-16 bg-gradient-to-b from-orange-400 to-red-600 rounded-lg flex items-center justify-center shadow-lg mb-2">
            <div className="w-10 h-12 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-md flex items-center justify-center relative">
              <div className="w-7 h-9 bg-gradient-to-b from-amber-200 to-orange-400 rounded-full relative">
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-red-700 rounded"></div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-t from-red-600 to-orange-500 rounded-b-full"></div>
              </div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-full"></div>
            </div>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-wide">Thirumala Group</h1>
          <p className="text-xs text-orange-700 font-medium">Business Management</p>
        </div>
        {/* User Info */}
        <div className="p-4 border-b border-blue-100 bg-blue-50 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow">
            <span className="text-base font-bold text-white">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.username}</p>
            <p className="text-xs text-blue-600 font-medium capitalize">{user?.is_admin ? 'Admin' : 'User'}</p>
          </div>
        </div>
      </div>
      {/* Scrollable Menu */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4">
        <ul className="space-y-1">
          {menuItems
            .filter(item => {
              if (item.adminOnly) return user?.is_admin;
              // Temporarily show CSV Upload for all users
              if (item.key === 'csv_upload') return true;
              return user?.features?.includes(item.key);
            })
            .map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 font-bold border-l-4 border-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'}
                    `
                  }
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
      {/* Sticky Logout at Bottom */}
      <div className="p-4 bg-gradient-to-t from-blue-50 to-transparent border-t border-blue-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;