import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Plus,
  Edit,
  FileText,
  Book,
  BookOpen,
  CheckCircle,
  FileEdit,
  Download,
  PieChart,
  Truck,
  CreditCard,
  Users,
  LogOut,
  Replace,
  Calculator,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Plus, label: 'New Entry', path: '/new-entry' },
    { icon: Edit, label: 'Edit Entry', path: '/edit-entry' },
    { icon: FileText, label: 'Daily Report', path: '/daily-report' },
    { icon: Book, label: 'Detailed Ledger', path: '/detailed-ledger' },
    { icon: BookOpen, label: 'Ledger Summary', path: '/ledger-summary' },
    ...(isAdmin ? [
      { icon: CheckCircle, label: 'Approve Records', path: '/approve-records' },
    ] : []),
    { icon: FileEdit, label: 'Edited Records', path: '/edited-records' },
    ...(isAdmin ? [
      { icon: Replace, label: 'Replace Form', path: '/replace-form' },
    ] : []),
    { icon: Download, label: 'Export Excel', path: '/export-excel' },
    { icon: FileDown, label: 'Export PDF', path: '/export-pdf' },
    { icon: Calculator, label: 'Balance Sheet', path: '/balance-sheet' },
    { icon: Truck, label: 'Vehicles', path: '/vehicles' },
    { icon: CreditCard, label: 'Bank Guarantees', path: '/bank-guarantees' },
    { icon: Users, label: 'Drivers', path: '/drivers' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Logo/Brand Section with Deity Image */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="flex flex-col items-center gap-3">
          {/* Deity Image */}
          <div className="w-16 h-20 bg-gradient-to-b from-orange-400 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
            <div className="w-12 h-16 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-md flex items-center justify-center relative">
              {/* Simplified deity representation */}
              <div className="w-8 h-10 bg-gradient-to-b from-amber-200 to-orange-400 rounded-full relative">
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-red-700 rounded"></div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-t from-red-600 to-orange-500 rounded-b-full"></div>
              </div>
              {/* Crown/ornaments */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-10 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-full"></div>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Thirumala Group</h1>
            <p className="text-sm text-orange-700 font-medium">Business Management</p>
            <p className="text-xs text-gray-600">Blessed by Divine Grace</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.user_type}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;