import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, clearAuthState } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

const SESSION_STORAGE_KEY = 'lastPath';

type AuthContextType = {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Save current path when it changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, location.pathname);
    }
  }, [location.pathname]);

  const handleAuthError = async (error: any) => {
    console.error('Auth error details:', {
      message: error.message,
      error: error.error,
      status: error.status,
      path: location.pathname
    });
    
    const isRefreshTokenError = 
      error.message?.includes('refresh_token_not_found') || 
      error.error?.message?.includes('refresh_token_not_found') ||
      error.message?.includes('Invalid Refresh Token');
    
    if (isRefreshTokenError) {
      console.log('Invalid refresh token detected - starting cleanup process');
      console.log('1. Clearing user state');
      setUser(null);
      setLoading(false);
      
      console.log('2. Clearing auth state');
      await clearAuthState();
      
      console.log('3. Removing session storage');
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      
      console.log('4. Checking current path:', location.pathname);
      if (location.pathname !== '/login' && location.pathname !== '/') {
        console.log('5. Redirecting to login page');
        navigate('/login');
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('Attempting to restore session');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('Error during session restore:', error);
          const handled = await handleAuthError(error);
          if (!handled) {
            throw error;
          }
          return;
        }

        if (session?.user) {
          console.log('Session restored successfully for user:', session.user.id);
          setUser(session.user);
          
          // Restore last path or go to dashboard
          if (location.pathname === '/login' || location.pathname === '/') {
            const lastPath = sessionStorage.getItem(SESSION_STORAGE_KEY) || '/dashboard';
            console.log('Redirecting to last path:', lastPath);
            navigate(lastPath);
          }
        } else {
          console.log('No valid session found - clearing state');
          setUser(null);
          setLoading(false);
          await clearAuthState();
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          if (location.pathname !== '/login' && location.pathname !== '/') {
            navigate('/login');
          }
        }
      } catch (err: any) {
        console.error('Unexpected session restore error:', err);
        const handled = await handleAuthError(err);
        if (!handled) {
          setUser(null);
          setLoading(false);
          await clearAuthState();
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          if (location.pathname !== '/login' && location.pathname !== '/') {
            navigate('/login');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);

        const lastPath = sessionStorage.getItem(SESSION_STORAGE_KEY);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Only navigate if we're on the login or home page
          if (location.pathname === '/login' || location.pathname === '/') {
            //navigate(lastPath || '/dashboard');
            try {
                  navigate(lastPath || '/dashboard');
                } catch (error) {
                  console.error('Navigation error:', error);
                }
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          try {
            console.log('Starting sign out cleanup');
            setUser(null);
            setLoading(false);
            await clearAuthState();
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            console.log('Navigating to login page');
            navigate('/login');
          } catch (err) {
            console.error('Error during sign out cleanup:', err);
            setUser(null);
            setLoading(false);
            await clearAuthState();
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            navigate('/login');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Sign out function with retry mechanism
  const signOut = async () => {
    let retryCount = 0;
    const maxRetries = 3;
    const maxRetryDelay = 8000; // Maximum delay of 8 seconds

    const attemptSignOut = async (attempt: number): Promise<void> => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
        
        // Success - clear state and redirect
        setUser(null);
        setLoading(false);
        await clearAuthState();
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        navigate('/login');
      } catch (err: any) {
        console.error(`Sign out attempt ${attempt + 1} failed:`, err);

        // Check if we should retry
        if (attempt < maxRetries) {
          // Calculate delay with exponential backoff (2^n * 1000ms)
          const delay = Math.min(Math.pow(2, attempt) * 1000, maxRetryDelay);
          console.log(`Retrying sign out in ${delay}ms...`);
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the sign out
          return attemptSignOut(attempt + 1);
        }

        // If we've exhausted retries, force sign out on client side
        console.warn('Sign out failed after max retries, forcing client-side logout');
        setUser(null);
        setLoading(false);
        await clearAuthState();
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        navigate('/login');
      }
    };

    // Start the first attempt
    await attemptSignOut(0);
  };

  // 🌀 Loading spinner while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center" style={{ display: loading ? 'block' : 'none' }}>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Checking session, please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}