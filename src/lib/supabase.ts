import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect to Supabase using the "Connect to Supabase" button.');
}

// Create the Supabase client with custom storage handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

// Helper function to clear auth state if needed
export const clearAuthState = async () => {
  try {
    console.log('Calling Supabase Signout');
    await supabase.auth.signOut();
    console.log('Clearing Local Storage');
    localStorage.clear(); // Clear all storage to ensure no stale auth data remains
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
}
