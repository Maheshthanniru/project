import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseHelpers } from '../lib/supabase';
import { supabaseDB } from '../lib/supabaseDatabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  user_type: string;
  is_active: boolean;
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
        // Check localStorage for saved user session
        const savedUser = localStorage.getItem('thirumala_user');
        const sessionTime = localStorage.getItem('thirumala_session_time');
        
        if (savedUser && sessionTime) {
          const parsedUser = JSON.parse(savedUser);
          const sessionAge = Date.now() - parseInt(sessionTime);
          
          // Check if session is still valid (24 hours)
          const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
          
          if (sessionAge < SESSION_DURATION) {
            setUser(parsedUser);
          } else {
            // Session expired, clear it
            localStorage.removeItem('thirumala_user');
            localStorage.removeItem('thirumala_session_time');
            console.log('Session expired, user logged out');
          }
        }
        
        // Also check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !savedUser) {
          // If Supabase has a session but we don't have user data, try to get user info
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            // This would be used if we implement proper Supabase Auth later
            console.log('Supabase session found:', userData.user);
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
      // Enhanced authentication with validation
      if (!username.trim() || !password.trim()) {
        return { success: false, error: 'Username and password are required' };
      }

      // Rate limiting temporarily disabled until database is set up
      // TODO: Re-enable rate limiting after database setup

      // For now, we'll use hardcoded users until database is properly set up
      // TODO: Replace with proper database user lookup
      const hardcodedUsers = [
        { username: 'admin', email: 'admin@thirumala.com', user_type: 'Admin', is_active: true },
        { username: 'operator', email: 'operator@thirumala.com', user_type: 'Operator', is_active: true },
        { username: 'RAMESH', email: 'ramesh@thirumala.com', user_type: 'Operator', is_active: true },
        { username: 'TC DOUBLE A/C', email: 'tc@thirumala.com', user_type: 'Operator', is_active: true }
      ];
      
      const dbUser = hardcodedUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!dbUser) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (!dbUser.is_active) {
        return { success: false, error: 'Account is inactive. Please contact administrator.' };
      }

      // For now, we'll use a simple password check
      // In production, you should use Supabase Auth with proper password hashing
      const validCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'operator', password: 'op123' },
        { username: 'RAMESH', password: 'ramesh123' },
        { username: 'TC DOUBLE A/C', password: 'tc123' }
      ];
      
      const credential = validCredentials.find(
        cred => cred.username.toLowerCase() === username.toLowerCase() && 
                cred.password === password
      );

      if (!credential) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Login activity logging temporarily disabled until database is set up
      // TODO: Re-enable activity logging after database setup
      
      // Set user state
      const userData = {
        id: dbUser.username, // Use username as ID for now
        username: dbUser.username,
        email: dbUser.email,
        user_type: dbUser.user_type,
        is_active: dbUser.is_active,
      };
      
      setUser(userData);
      
      // Save user session to localStorage for persistence
      localStorage.setItem('thirumala_user', JSON.stringify(userData));
      
      // Also save session timestamp for security
      localStorage.setItem('thirumala_session_time', Date.now().toString());

      toast.success(`Welcome back, ${dbUser.username}!`);
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  // Rate limiting helpers using Supabase
  const getLoginAttempts = async (username: string): Promise<{ count: number; lastAttempt: number }> => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('count, last_attempt')
        .eq('username', username)
        .single();

      if (error || !data) {
        return { count: 0, lastAttempt: 0 };
      }

      // Reset if more than 15 minutes have passed
      if (Date.now() - data.last_attempt > 15 * 60 * 1000) {
        return { count: 0, lastAttempt: 0 };
      }

      return { count: data.count, lastAttempt: data.last_attempt };
    } catch (error) {
      console.error('Error getting login attempts:', error);
      return { count: 0, lastAttempt: 0 };
    }
  };

  const recordLoginAttempt = async (username: string): Promise<void> => {
    try {
      const attempts = await getLoginAttempts(username);
      const newCount = attempts.count + 1;
      const now = Date.now();

      const { error } = await supabase
        .from('login_attempts')
        .upsert({
          username,
          count: newCount,
          last_attempt: now,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording login attempt:', error);
      }
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  };

  const clearLoginAttempts = async (username: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('login_attempts')
        .delete()
        .eq('username', username);

      if (error) {
        console.error('Error clearing login attempts:', error);
      }
    } catch (error) {
      console.error('Error clearing login attempts:', error);
    }
  };

  // Activity logging using Supabase
  const logLoginActivity = async (username: string, status: 'success' | 'failed'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('login_activities')
        .insert({
          username,
          status,
          user_agent: navigator.userAgent,
          ip_address: 'client', // In production, get from server
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging login activity:', error);
      }
    } catch (error) {
      console.error('Error logging login activity:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      
      // Clear session data from localStorage
      localStorage.removeItem('thirumala_user');
      localStorage.removeItem('thirumala_session_time');
      
      // Also clear any Supabase session
      await supabase.auth.signOut();
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  };

  // Session refresh mechanism
  useEffect(() => {
    if (user) {
      // Refresh session timestamp when user is active
      const refreshSession = () => {
        localStorage.setItem('thirumala_session_time', Date.now().toString());
      };

      // Refresh session on user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, refreshSession, true);
      });

      // Periodic session validation (every 5 minutes)
      const sessionCheckInterval = setInterval(() => {
        const sessionTime = localStorage.getItem('thirumala_session_time');
        if (sessionTime) {
          const sessionAge = Date.now() - parseInt(sessionTime);
          const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionAge >= SESSION_DURATION) {
            // Session expired, logout user
            setUser(null);
            localStorage.removeItem('thirumala_user');
            localStorage.removeItem('thirumala_session_time');
            toast.error('Session expired. Please login again.');
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, refreshSession, true);
        });
        clearInterval(sessionCheckInterval);
      };
    }
  }, [user]);

  const isAdmin = user?.user_type === 'Admin';
  const isAuthenticated = !!user;

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};