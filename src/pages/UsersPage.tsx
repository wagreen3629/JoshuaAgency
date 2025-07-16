import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, Edit, Trash, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { supabase } from '../lib/supabase';
import { UserEditForm } from '../components/UserEditForm';
import { useAuth } from '../components/AuthProvider';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  full_name: string | null;
}

export function UsersPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!authUser?.id || authLoading) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        if (error) throw error;
        setIsAdmin(profile?.role === 'admin');
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    if (!authLoading) checkAdminStatus();
  }, [authUser?.id, authLoading]);

  const getUsers = async () => {
    try {
      setLoading(true);
      
      // Get user profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      setUsers(profileData || []);
      setFilteredUsers(profileData || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      getUsers();
    }
  }, [authLoading]);

  useEffect(() => {
    let result = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => {
        const fullName = user.full_name?.toLowerCase() || '';
        const email = user.email.toLowerCase();
        
        return fullName.includes(term) || email.includes(term);
      });
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role.toLowerCase() === roleFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      result = result.filter(user => user.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (!isAdmin) {
      setError('Only administrators can modify user status');
      return;
    }

    if (userId === authUser?.id) {
      setError('You cannot modify your own status');
      return;
    }

    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ));
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (!isAdmin) {
      setError('Only administrators can modify user roles');
      return;
    }

    if (userId === authUser?.id) {
      setError('You cannot modify your own role');
      return;
    }

    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleEdit = (profile: Profile) => {
    if (!isAdmin) {
      setError('Only administrators can edit users');
      return;
    }

    setSelectedUser(profile);
    setShowEditForm(true);
  };

  const handleAddUser = () => {
    if (!isAdmin) {
      setError('Only administrators can add users');
      return;
    }

    setSelectedUser(null);
    setShowEditForm(true);
  };

  const openDeleteDialog = (user: Profile) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setError('Only administrators can delete users');
      return;
    }

    if (!userToDelete || userToDelete.id === authUser?.id) {
      setError('You cannot delete your own account');
      return;
    }

    try {
      // Delete the user's profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);
      
      if (deleteError) throw deleteError;
      
      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setFilteredUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      
      setError(null);
      setShowDeleteDialog(false);
      setUserToDelete(null);
      
      // Show success message
      setSuccessMessage('User deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    setSelectedUser(null);
    setSuccessMessage('User created successfully');
    getUsers();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleFormCancel = () => {
    setShowEditForm(false);
    setSelectedUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (profile: Profile) => {
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return profile.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (profile: Profile) => {
    return profile.full_name || profile.email.split('@')[0];
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleFormCancel}
          >
            Cancel
          </Button>
        </div>

        <UserEditForm
          user={selectedUser || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage system users and their permissions' : 'View system users'}
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={handleAddUser}
            className="flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>
      
      {/* Search and filter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Users table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {getInitials(profile)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{getDisplayName(profile)}</div>
                      <div className="text-sm text-gray-500">{profile.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleRole(profile.id, profile.role)}
                    disabled={!isAdmin || profile.id === authUser?.id}
                    className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                      profile.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    } ${(!isAdmin || profile.id === authUser?.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-75'}`}
                  >
                    {profile.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {profile.role === 'admin' ? 'Admin' : 'User'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(profile.id, profile.status)}
                    disabled={!isAdmin || profile.id === authUser?.id}
                    className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                      profile.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    } ${profile.id === authUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-75'}`}
                  >
                    {profile.status === 'Active' ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {profile.status}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(profile.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    disabled={!isAdmin}
                    onClick={() => handleEdit(profile)}
                    className={`text-blue-600 hover:text-blue-900 mr-3 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    disabled={!isAdmin || profile.id === authUser?.id}
                    onClick={() => openDeleteDialog(profile)}
                    className={`text-red-600 hover:text-red-900 ${(!isAdmin || profile.id === authUser?.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.full_name || userToDelete?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UsersPage;
