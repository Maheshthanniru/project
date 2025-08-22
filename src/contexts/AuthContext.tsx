import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseHelpers } from '../lib/supabase';
import { supabaseDB } from '../lib/supabaseDatabase';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  username: string;
  is_admin: boolean;
  features: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      try {
        const savedUser = localStorage.getItem('thirumala_user');
        const sessionTime = localStorage.getItem('thirumala_session_time');
        if (savedUser && sessionTime) {
          const parsedUser = JSON.parse(savedUser);
          const sessionAge = Date.now() - parseInt(sessionTime);
          const SESSION_DURATION = 24 * 60 * 60 * 1000;
          if (sessionAge < SESSION_DURATION) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('thirumala_user');
            localStorage.removeItem('thirumala_session_time');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      if (!username.trim() || !password.trim()) {
        return { success: false, error: 'Username and password are required' };
      }
      // 1. Fetch user from users table with user type (case-insensitive)
      const { data: dbUser, error } = await supabase
        .from('users')
        .select(`
          *,
          user_types!inner(user_type)
        `)
        .ilike('username', username)
        .single();
      if (error || !dbUser) {
        return { success: false, error: 'Invalid username or password' };
      }
      // 2. Check password using bcryptjs
      const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // 3. Check if user is active
      if (!dbUser.is_active) {
        return { success: false, error: 'Account is deactivated' };
      }
      
      // 4. Determine if user is admin based on user type
      const isAdmin = dbUser.user_types?.user_type === 'Admin';
      
      // 5. For now, give all features to admin users, empty array to others
      let features: string[] = [];
      if (isAdmin) {
        // Admin gets all features - we'll implement feature management later
        features = [
          'dashboard', 
          'new_entry', 
          'edit_entry',
          'daily_report',
          'detailed_ledger', 
          'ledger_summary',
          'approve_records',
          'edited_records',
          'replace_form',
          'balance_sheet', 
          'export',
          'csv_upload', 
          'export_excel',
          'vehicles', 
          'drivers', 
          'bank_guarantees', 
          'users'
        ];
      }
      
      const userData: User = {
        id: dbUser.id,
        username: dbUser.username,
        is_admin: isAdmin,
        features,
      };
      setUser(userData);
      localStorage.setItem('thirumala_user', JSON.stringify(userData));
      localStorage.setItem('thirumala_session_time', Date.now().toString());
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('thirumala_user');
      localStorage.removeItem('thirumala_session_time');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = !!user?.is_admin;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};