import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast'; // Adjust this import path as needed

const collegesWithCategories = [
  'SRMIST RAMAPURAM',
  'SRM TRICHY'
];

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // First get basic info from token
        const decoded = jwtDecode(token);

        // Then fetch complete user data from API
        const response = await axios.get('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser({
          ...decoded,
          ...(response.data.data || response.data)
        });
      } catch (error) {
        const errorMsg = error.response?.data?.message ||
          'Failed to load user data. Please refresh the page.';
        toast.error(errorMsg);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword.trim()) {
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
        '/api/settings/change-password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to change password. Please check your current password.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center p-6 text-red-600">
          Authentication required. Please log in.
        </div>
      </div>
    );
  }

  // Decide if we show the category field:
  const showCategory =
    user.role !== 'super_admin' &&
    user.college &&
    collegesWithCategories.includes(user.college);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>

      {/* Profile Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b">
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-gray-700 mb-2">Full Name</label>
            <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
              {user.fullName || 'Not specified'}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
              {user.email || 'Not specified'}
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Institution</label>
            <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
              {user.college || 'Not specified'}
            </div>
          </div>
          {showCategory && (
            <div>
              <label className="block text-gray-700 mb-2">Category</label>
              <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                {user.category || 'Not specified'}
              </div>
            </div>
          )}
          <div>
            <label className="block text-gray-700 mb-2">Role</label>
            <div className="w-full px-4 py-2 bg-gray-100 rounded-md capitalize">
              {user.role ? user.role.replace(/_/g, ' ') : 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
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
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.currentPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                autoComplete="current-password"
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
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.newPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                autoComplete="new-password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                autoComplete="new-password"
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
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;