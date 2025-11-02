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
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
            // Reload user features from database to ensure they're up to date
            if (!parsedUser.is_admin) {
              console.log('🔄 Reloading features for existing session:', {
                userId: parsedUser.id,
                username: parsedUser.username
              });
              
              const { data: accessData, error: accessError } = await supabase
                .from('user_access')
                .select('feature_key')
                .eq('user_id', parsedUser.id);
              
              if (accessError) {
                console.error('❌ Error reloading features for session:', {
                  error: accessError,
                  userId: parsedUser.id
                });
                parsedUser.features = parsedUser.features || []; // Keep existing if reload fails
              } else {
                console.log('📦 Session restore - Raw access data:', {
                  accessData,
                  dataType: Array.isArray(accessData) ? 'array' : typeof accessData,
                  length: Array.isArray(accessData) ? accessData.length : 'N/A'
                });
                
                // Extract feature keys and filter out any null/undefined values
                if (Array.isArray(accessData)) {
                  parsedUser.features = accessData
                    .map(a => a?.feature_key)
                    .filter((key): key is string => key !== null && key !== undefined && typeof key === 'string');
                } else {
                  console.warn('⚠️ Session restore - accessData is not an array:', accessData);
                  parsedUser.features = [];
                }
                
                console.log('🔄 Session restored - features reloaded:', {
                  userId: parsedUser.id,
                  username: parsedUser.username,
                  featuresCount: parsedUser.features.length,
                  features: parsedUser.features
                });
              }
            }
            
            // Always ensure features is an array
            if (!Array.isArray(parsedUser.features)) {
              console.warn('⚠️ Session features is not an array, fixing:', parsedUser.features);
              parsedUser.features = parsedUser.is_admin ? [] : [];
            }
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
      // Use textSearch or fetch all and filter - ilike can cause encoding issues with Supabase REST
      const trimmedUsername = username.trim();
      const { data: allUsers, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          user_types!inner(user_type)
        `);
      
      if (fetchError || !allUsers) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Find user with case-insensitive match
      const dbUser = allUsers.find(u => 
        u.username && u.username.toLowerCase() === trimmedUsername.toLowerCase()
      );
      
      if (!dbUser) {
        return { success: false, error: 'Invalid username or password' };
      }

      // 2. Check password using bcryptjs
      const passwordMatch = await bcrypt.compare(password, dbUser.password_hash);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid username or password' };
      }

      // 3. Check if user is active (default to true if column missing)
      if (dbUser.is_active === false) {
        return { success: false, error: 'Account is deactivated' };
      }

      // 4. Determine if user is admin based on user type
      const isAdmin = dbUser.user_types?.user_type === 'Admin';

      // 5. Load features: Admins get all features, non-admins get from user_access table
      let features: string[] = [];
      
      if (isAdmin) {
        // Admins have access to all features
        features = [
          'dashboard',
          'new_entry',
          'edit_entry',
          'daily_report',
          'detailed_ledger',
          'ledger_summary',
          'approve_records',
          'edited_records',
          'deleted_records',
          'replace_form',
          'balance_sheet',
          'export',
          'csv_upload',
          'vehicles',
          'drivers',
          'bank_guarantees',
          'users',
        ];
        console.log('✅ Admin user - granted all features:', features);
      } else {
        // Load features from user_access table for non-admin users
        console.log('🔍 Loading features for non-admin user:', {
          userId: dbUser.id,
          username: dbUser.username,
          userType: dbUser.user_types?.user_type
        });
        
        const { data: accessData, error: accessError } = await supabase
          .from('user_access')
          .select('feature_key')
          .eq('user_id', dbUser.id);
        
        if (accessError) {
          console.error('❌ Error loading user features:', {
            error: accessError,
            userId: dbUser.id,
            username: dbUser.username
          });
          features = []; // Ensure it's an array even on error
        } else {
          console.log('📦 Raw access data from database:', {
            accessData,
            dataType: Array.isArray(accessData) ? 'array' : typeof accessData,
            length: Array.isArray(accessData) ? accessData.length : 'N/A'
          });
          
          // Extract feature keys and filter out any null/undefined values
          if (Array.isArray(accessData)) {
            features = accessData
              .map(a => a?.feature_key)
              .filter((key): key is string => key !== null && key !== undefined && typeof key === 'string');
          } else {
            console.warn('⚠️ accessData is not an array:', accessData);
            features = [];
          }
          
          console.log('📋 Non-admin user features loaded:', {
            userId: dbUser.id,
            username: dbUser.username,
            featuresCount: features.length,
            features: features,
            rawAccessData: accessData
          });
        }
        
        // Always ensure features is an array
        if (!Array.isArray(features)) {
          console.warn('⚠️ Features is not an array, fixing:', features);
          features = [];
        }
      }

      // Ensure features is always an array before creating userData
      if (!Array.isArray(features)) {
        console.warn('⚠️ Features is not an array before creating userData, fixing:', features);
        features = [];
      }
      
      const userData: User = {
        id: dbUser.id,
        username: dbUser.username,
        is_admin: isAdmin,
        features: features || [], // Double ensure it's an array
      };
      
      console.log('🔐 Login successful - User data:', {
        username: userData.username,
        is_admin: userData.is_admin,
        featuresCount: userData.features.length,
        features: userData.features,
        userId: userData.id
      });
      
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

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      if (!user) {
        return { success: false, error: 'User not logged in' };
      }

      if (!currentPassword.trim() || !newPassword.trim()) {
        return { success: false, error: 'Both passwords are required' };
      }

      if (newPassword.length < 4) {
        return { success: false, error: 'New password must be at least 4 characters' };
      }

      // 1. Fetch user from database
      const { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError || !dbUser) {
        return { success: false, error: 'User not found' };
      }

      // 2. Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        dbUser.password_hash
      );

      if (!passwordMatch) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // 3. Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 4. Update password in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return { success: false, error: 'Failed to update password' };
      }

      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      return { success: false, error: 'Failed to change password. Please try again.' };
    }
  };

  const isAdmin = !!user?.is_admin;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, changePassword, isAdmin, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};
