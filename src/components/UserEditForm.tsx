import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from './ui/toast';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[UserEditForm] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[UserEditForm Error] ${message}`, error ? error : '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[UserEditForm Debug] ${message}`, data ? data : '');
  }
};

interface UserEditFormProps {
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    full_name: string | null;
    status: 'Active' | 'Inactive';
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserEditForm({ user, onSuccess, onCancel }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.phone || '',
    role: user?.role || 'user',
    status: user?.status || 'Active',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      email: '', firstName: '', lastName: '', role: 'user',
      status: 'Inactive', password: '', confirmPassword: '' 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    log.info('Starting form submission', { isUpdate: !!user });
    
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.email || (!user && !formData.password)) {
        log.error('Missing required fields');
        throw new Error('Please fill in all required fields');
      }

      // Validate password match if setting password
      if (formData.password && formData.password !== formData.confirmPassword) {
        log.error('Password mismatch');
        throw new Error('Passwords do not match');
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        log.error('No active session found');
        throw new Error('Authentication required');
      }

      // Prepare user data
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        ...(formData.password && { password: formData.password }),
        ...(user?.id && { id: user.id })
      };

      // Call the edge function to manage the user
      log.info('Preparing to call edge function', { action: user ? 'update' : 'create' });
      
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`;
      log.debug('Edge function URL:', edgeFunctionUrl);
      
      const response = await fetch(
        edgeFunctionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: user ? 'update' : 'create',
            userData
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        log.error('Edge function failed', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(errorText || 'Failed to save user');
      }
      const result = await response.json();
      
      if (!user) {
        log.info('New user created successfully, resetting form');
        resetForm();
      }
      
      log.info('Form submission completed successfully');
      onSuccess();
      
    } catch (err: any) {
      log.error('Form submission failed', err);
      setError(err.message || 'Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Log initial form state
  React.useEffect(() => {
    log.debug('Form initialized', {
      isUpdate: !!user,
      initialData: formData
    });
  }, []);

  return (
    <ToastProvider>
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {user ? 'Edit User' : 'Add New User'}
      </h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 required">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!!user} // Disable email editing for existing users
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
              {!user && (
                <span className="ml-1 text-xs text-gray-500">
                  (New users are created as Active by default)
                </span>
              )}
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="(555) 555-5555"
              required
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            {user ? 'Change Password' : 'Set Password'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password {!user && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required={!user}
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password {!user && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required={!user}
                minLength={6}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Saving...' : user ? 'Update User' : 'Add User'}
          </Button>
        </div>
      </form>

      {showSuccess && (
        <Toast>
          <div className="flex items-center">
            <div className="ml-3">
              <ToastTitle>Success</ToastTitle>
              <ToastDescription>{successMessage}</ToastDescription>
            </div>
          </div>
        </Toast>
      )}
      <ToastViewport />
    </div>
    </ToastProvider>
  );
}