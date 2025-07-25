import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        setLoading(false);
      } catch (err) {
        console.error('Invalid token:', err);
        setErrorMessage('Session expired. Please log in again.');
        setLoading(false);
      }
    } else {
      setErrorMessage('Not authenticated. Please log in.');
      setLoading(false);
    }
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/admin/change-password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccessMessage('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setErrorMessage(
        error.response?.data?.message || 
        'Failed to change password. Please check your current password.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center p-6 text-red-600">
          {errorMessage || 'User data not available. Please try logging in again.'}
        </div>
      </div>
    );
  }

  // Helper functions from Navbar
  const getDisplayName = () => {
    if (user.fullName) return user.fullName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

{/* Profile Information Section */}
<div className="mb-8">
  <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">
    Profile Information
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
    <div>
      <label className="block text-gray-700 mb-2">Full Name</label>
      <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
        {user.fullName || user.email?.split('@')[0] || 'Not available'}
      </div>
    </div>

    <div>
      <label className="block text-gray-700 mb-2">Email</label>
      <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
        {user.email || 'Not available'}
      </div>
    </div>

    <div>
      <label className="block text-gray-700 mb-2">Institution</label>
      <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
        {user.college || 'Not available'}
      </div>
    </div>

    <div>
      <label className="block text-gray-700 mb-2">Category</label>
      <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
        {user.category || 'Not available'}
      </div>
    </div>

    <div>
      <label className="block text-gray-700 mb-2">Role</label>
      <div className="w-full px-4 py-2 bg-gray-100 rounded-md capitalize">
        {user.role ? user.role.replace(/_/g, ' ') : 'Not available'}
      </div>
    </div>
  </div>
</div>


      {/* Change Password Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="currentPassword">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.currentPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.newPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;