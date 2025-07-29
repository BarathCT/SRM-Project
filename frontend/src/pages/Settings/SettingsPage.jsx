import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';

const collegesWithInstitutes = [
  'SRMIST RAMAPURAM',
  'SRM TRICHY'
];

const collegesWithoutInstitutes = [
  'EASWARI ENGINEERING COLLEGE',
  'TRP ENGINEERING COLLEGE'
];

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
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

        const userData = {
          ...decoded,
          ...(response.data.data || response.data)
        };

        setUser(userData);
        setProfileForm({
          fullName: userData.fullName || '',
          email: userData.email || ''
        });

        // Fetch departments based on user's college and institute
        if (userData.college && userData.college !== 'N/A') {
          const deptResponse = await axios.get('/api/settings/departments', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDepartments(deptResponse.data.data || []);
        }
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
  }, [navigate, toast]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
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

  const validateProfileForm = () => {
    const newErrors = {};
    if (!profileForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      newErrors.email = 'Please enter a valid email address';
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
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/settings/profile',
        profileForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update token if email was changed
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      setUser(prev => ({
        ...prev,
        fullName: profileForm.fullName,
        email: profileForm.email
      }));
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to update profile. Please try again.'
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

  const showInstitute = user.role !== 'super_admin' && 
                       user.college && 
                       collegesWithInstitutes.includes(user.college);

  const showDepartment = user.role !== 'super_admin' && 
                        user.college && 
                        user.college !== 'N/A';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>

      {/* Profile Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-semibold text-gray-700">Profile Information</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Institution</label>
                <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                  {user.college || 'Not specified'}
                </div>
              </div>
              {showInstitute && (
                <div>
                  <label className="block text-gray-700 mb-2">Institute</label>
                  <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                    {user.institute || 'Not specified'}
                  </div>
                </div>
              )}
              {showDepartment && (
                <div>
                  <label className="block text-gray-700 mb-2">Department</label>
                  <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                    {user.department || 'Not specified'}
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
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
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
            {showInstitute && (
              <div>
                <label className="block text-gray-700 mb-2">Institute</label>
                <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                  {user.institute || 'Not specified'}
                </div>
              </div>
            )}
            {showDepartment && (
              <div>
                <label className="block text-gray-700 mb-2">Department</label>
                <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                  {user.department || 'Not specified'}
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
        )}
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