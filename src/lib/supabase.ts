import { createClient } from '@supabase/supabase-js';

// Supabase configuration with environment variables and fallbacks
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://pmqeegdmcrktccszgbwu.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWVlZ2RtY3JrdGNjc3pnYnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDY1OTUsImV4cCI6MjA2NzQ4MjU5NX0.OqaYKbr2CcLd10JTdyy0IRawUPwW3KGCAbsPNThcCFM';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Please check your environment variables.'
  );
}

// Create Supabase client with error handling and CORS configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'thirumala-business-app',
    },
  },
  db: {
    schema: 'public',
  },
});

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          password_hash: string;
          user_type_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password_hash: string;
          user_type_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password_hash?: string;
          user_type_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          company_name: string;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_main_accounts: {
        Row: {
          id: string;
          company_name: string;
          acc_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          acc_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          acc_name?: string;
          created_at?: string;
        };
      };
      company_main_sub_acc: {
        Row: {
          id: string;
          company_name: string;
          acc_name: string;
          sub_acc: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          acc_name: string;
          sub_acc: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          acc_name?: string;
          sub_acc?: string;
          created_at?: string;
        };
      };
      cash_book: {
        Row: {
          id: string;
          sno: number;
          acc_name: string;
          sub_acc_name: string | null;
          particulars: string | null;
          c_date: string;
          credit: number;
          debit: number;
          lock_record: boolean;
          company_name: string;
          address: string | null;
          staff: string | null;
          users: string | null;
          entry_time: string;
          sale_qty: number;
          purchase_qty: number;
          approved: boolean;
          edited: boolean;
          e_count: number;
          cb: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sno?: number;
          acc_name: string;
          sub_acc_name?: string | null;
          particulars?: string | null;
          c_date?: string;
          credit?: number;
          debit?: number;
          lock_record?: boolean;
          company_name: string;
          address?: string | null;
          staff?: string | null;
          users?: string | null;
          entry_time?: string;
          sale_qty?: number;
          purchase_qty?: number;
          approved?: boolean;
          edited?: boolean;
          e_count?: number;
          cb?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sno?: number;
          acc_name?: string;
          sub_acc_name?: string | null;
          particulars?: string | null;
          c_date?: string;
          credit?: number;
          debit?: number;
          lock_record?: boolean;
          company_name?: string;
          address?: string | null;
          staff?: string | null;
          users?: string | null;
          entry_time?: string;
          sale_qty?: number;
          purchase_qty?: number;
          approved?: boolean;
          edited?: boolean;
          e_count?: number;
          cb?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bank_guarantees: {
        Row: {
          id: string;
          sno: number;
          bg_no: string;
          issue_date: string | null;
          exp_date: string | null;
          work_name: string | null;
          credit: number;
          debit: number;
          department: string | null;
          cancelled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sno?: number;
          bg_no: string;
          issue_date?: string | null;
          exp_date?: string | null;
          work_name?: string | null;
          credit?: number;
          debit?: number;
          department?: string | null;
          cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sno?: number;
          bg_no?: string;
          issue_date?: string | null;
          exp_date?: string | null;
          work_name?: string | null;
          credit?: number;
          debit?: number;
          department?: string | null;
          cancelled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          vehicle_no: string;
          vehicle_type: string | null;
          owner_name: string | null;
          contact_no: string | null;
          insurance_expiry: string | null;
          permit_expiry: string | null;
          fitness_expiry: string | null;
          puc_expiry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_no: string;
          vehicle_type?: string | null;
          owner_name?: string | null;
          contact_no?: string | null;
          insurance_expiry?: string | null;
          permit_expiry?: string | null;
          fitness_expiry?: string | null;
          puc_expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_no?: string;
          vehicle_type?: string | null;
          owner_name?: string | null;
          contact_no?: string | null;
          insurance_expiry?: string | null;
          permit_expiry?: string | null;
          fitness_expiry?: string | null;
          puc_expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          driver_name: string;
          license_no: string;
          contact_no: string | null;
          license_expiry: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_name: string;
          license_no: string;
          contact_no?: string | null;
          license_expiry?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_name?: string;
          license_no?: string;
          contact_no?: string | null;
          license_expiry?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper functions for common operations
export const supabaseHelpers = {
  // Get current user
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, error };
    }
  },

  // Sign in
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },
};

export default supabase;
