import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[ProfileForm] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ProfileForm] Error: ${message}`, error ? error : '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[ProfileForm] Debug: ${message}`, data ? data : '');
  }
};

export function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true);
        log.info('Fetching user and profile data');
        
        // Get authenticated user
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          log.error('No authenticated user found');
          return;
        }
        log.debug('User data retrieved', { userId: userData.user.id });
        
        setUser(userData.user);
        
        // Get user profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        
        log.debug('Profile data retrieved', { 
          hasProfile: !!profileData,
          fullName: profileData?.full_name 
        });
        
        if (profileData) {
          setFullName(profileData.full_name || '');
        }
      } catch (error) {
        log.error('Failed to fetch profile data', error);
      } finally {
        setLoading(false);
        log.info('Profile data fetch completed');
      }
    };

    fetchUserAndProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      log.error('Cannot submit form - no authenticated user');
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      log.info('Updating profile', { userId: user.id, fullName });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        log.error('Failed to update profile in database', error);
        throw error;
      }
      
      log.info('Profile updated successfully');
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
    } catch (error: any) {
      log.error('Error during profile update', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while updating your profile.'
      });
    } finally {
      setLoading(false);
      log.debug('Profile update completed', { success: !error });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Update Profile</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}