import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';

// Colleges with and without institutes
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
  const [authorIdForm, setAuthorIdForm] = useState({
    scopus: '',
    sci: '',
    webOfScience: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [authorIdEditMode, setAuthorIdEditMode] = useState(false);
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
        // Get basic info from token
        const decoded = jwtDecode(token);

        // Fetch full user data from API
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

        // Set Author ID form data
        setAuthorIdForm({
          scopus: userData.authorId?.scopus || '',
          sci: userData.authorId?.sci || '',
          webOfScience: userData.authorId?.webOfScience || ''
        });

        // Fetch departments for user's college/institute (if needed)
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

  const handleAuthorIdChange = (e) => {
    const { name, value } = e.target;
    setAuthorIdForm(prev => ({ ...prev, [name]: value }));
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

  const validateProfileForm = () => {
    const newErrors = {};
    if (!profileForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAuthorIdForm = () => {
    const newErrors = {};
    
    // Scopus validation (10-11 digits)
    if (authorIdForm.scopus && !/^\d{10,11}$/.test(authorIdForm.scopus)) {
      newErrors.scopus = 'Scopus Author ID must be 10-11 digits';
    }
    
    // SCI validation (format: X-XXXX-XXXX)
    if (authorIdForm.sci && !/^[A-Z]-\d{4}-\d{4}$/.test(authorIdForm.sci)) {
      newErrors.sci = 'SCI Author ID must be in format X-XXXX-XXXX (e.g., A-1234-5678)';
    }
    
    // Web of Science validation (format: X-XXXX-XXXX)
    if (authorIdForm.webOfScience && !/^[A-Z]-\d{4}-\d{4}$/.test(authorIdForm.webOfScience)) {
      newErrors.webOfScience = 'Web of Science ResearcherID must be in format X-XXXX-XXXX (e.g., A-1234-5678)';
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
        { fullName: profileForm.fullName }, // Only send fullName, not email
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setUser(prev => ({
        ...prev,
        fullName: profileForm.fullName
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

  const handleAuthorIdSubmit = async (e) => {
    e.preventDefault();
    if (!validateAuthorIdForm()) return;

    try {
      const token = localStorage.getItem('token');
      
      // Clean empty values to null for database storage
      const cleanAuthorIds = {
        scopus: authorIdForm.scopus.trim() || null,
        sci: authorIdForm.sci.trim() || null,
        webOfScience: authorIdForm.webOfScience.trim() || null
      };

      await axios.put(
        '/api/settings/author-ids',
        { authorId: cleanAuthorIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setUser(prev => ({
        ...prev,
        authorId: cleanAuthorIds
      }));
      
      toast.success('Author IDs updated successfully!');
      setAuthorIdEditMode(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to update Author IDs. Please try again.'
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

  // Only show institute/department for campus_admin/faculty, not super_admin
  const showInstitute = user.role !== 'super_admin' && 
                       user.college && 
                       collegesWithInstitutes.includes(user.college);

  const showDepartment = user.role !== 'super_admin' && 
                        user.college && 
                        user.college !== 'N/A';

  // Only show Author IDs for faculty members
  const showAuthorIds = user.role === 'faculty';

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
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  title="Email cannot be changed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed for security reasons</p>
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

      {/* Author IDs Section - Only for Faculty */}
      {showAuthorIds && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Research Author IDs</h2>
              <p className="text-sm text-gray-600 mt-1">
                At least one Author ID is required to upload research papers
              </p>
            </div>
            {!authorIdEditMode && (
              <button
                onClick={() => setAuthorIdEditMode(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm"
              >
                Edit Author IDs
              </button>
            )}
          </div>

          {authorIdEditMode ? (
            <form onSubmit={handleAuthorIdSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="scopus">
                    Scopus Author ID
                  </label>
                  <input
                    type="text"
                    id="scopus"
                    name="scopus"
                    value={authorIdForm.scopus}
                    onChange={handleAuthorIdChange}
                    placeholder="10-11 digits (e.g., 12345678901)"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.scopus ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                    }`}
                  />
                  {errors.scopus && (
                    <p className="mt-1 text-sm text-red-500">{errors.scopus}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Must be 10-11 digits</p>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="sci">
                    SCI Author ID
                  </label>
                  <input
                    type="text"
                    id="sci"
                    name="sci"
                    value={authorIdForm.sci}
                    onChange={handleAuthorIdChange}
                    placeholder="Format: A-1234-5678"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.sci ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                    }`}
                  />
                  {errors.sci && (
                    <p className="mt-1 text-sm text-red-500">{errors.sci}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Format: X-XXXX-XXXX</p>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="webOfScience">
                    Web of Science ResearcherID
                  </label>
                  <input
                    type="text"
                    id="webOfScience"
                    name="webOfScience"
                    value={authorIdForm.webOfScience}
                    onChange={handleAuthorIdChange}
                    placeholder="Format: A-1234-5678"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.webOfScience ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                    }`}
                  />
                  {errors.webOfScience && (
                    <p className="mt-1 text-sm text-red-500">{errors.webOfScience}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Format: X-XXXX-XXXX</p>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthorIdEditMode(false);
                    // Reset form to original values
                    setAuthorIdForm({
                      scopus: user.authorId?.scopus || '',
                      sci: user.authorId?.sci || '',
                      webOfScience: user.authorId?.webOfScience || ''
                    });
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Save Author IDs
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Scopus Author ID</label>
                <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                  {user.authorId?.scopus || '-'}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">SCI Author ID</label>
                <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                  {user.authorId?.sci || '-'}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Web of Science ResearcherID</label>
                <div className="w-full px-4 py-2 bg-gray-100 rounded-md">
                  {user.authorId?.webOfScience || '-'}
                </div>
              </div>
            </div>
          )}
          
          {/* Warning message if no Author IDs are set */}
          {!user.authorId?.scopus && !user.authorId?.sci && !user.authorId?.webOfScience && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Author IDs Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You need to add at least one Author ID (Scopus, SCI, or Web of Science) before you can upload research papers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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