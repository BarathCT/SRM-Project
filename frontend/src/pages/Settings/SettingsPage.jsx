import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';

// Colleges with institutes
const collegesWithInstitutes = ['SRMIST RAMAPURAM', 'SRM TRICHY'];

const Pill = ({ children, tone = 'default' }) => {
  const classes = {
    default: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${classes} border-current/10`}>
      {children}
    </span>
  );
};

const FieldStatic = ({ label, value, mono = false, span = 1 }) => (
  <div className={`flex flex-col gap-1 col-span-${span}`}>
    <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{label}</span>
    <div
      className={`min-h-[42px] px-3 py-2 rounded-md border border-gray-200/80 bg-white text-sm text-gray-800 shadow-inner ${
        mono ? 'font-mono break-all text-[12px]' : ''
      }`}
    >
      {value ?? '—'}
    </div>
  </div>
);

const SectionCard = ({ title, description, action, children, className = '' }) => (
  <div
    className={`relative group rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${className}`}
  >
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-gray-800">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-blue-100" />
  </div>
);

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
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

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [authorIdEditMode, setAuthorIdEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { toast } = useToast();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Load data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const response = await api.get('/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const apiData = response.data.data || response.data;
        const userData = { ...decoded, ...apiData };

        setUser(userData);
        setProfileForm({
          fullName: userData.fullName || '',
          email: userData.email || ''
        });

        setAuthorIdForm({
          scopus: userData.authorId?.scopus || '',
          sci: userData.authorId?.sci || '',
          webOfScience: userData.authorId?.webOfScience || ''
        });
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            'Failed to load user data. Please refresh the page.'
        );
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

  // Handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthorIdChange = (e) => {
    const { name, value } = e.target;
    setAuthorIdForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validation
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.currentPassword.trim()) newErrors.currentPassword = 'Current password is required';
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
    if (!profileForm.fullName.trim()) newErrors.fullName = 'Full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAuthorIdForm = () => {
    const newErrors = {};
    if (authorIdForm.scopus && !/^\d{10,11}$/.test(authorIdForm.scopus))
      newErrors.scopus = 'Scopus Author ID must be 10-11 digits';
    if (authorIdForm.sci && !/^[A-Z]-\d{4}-\d{4}$/.test(authorIdForm.sci))
      newErrors.sci = 'SCI Author ID format: X-XXXX-XXXX';
    if (authorIdForm.webOfScience && !/^[A-Z]-\d{4}-\d{4}$/.test(authorIdForm.webOfScience))
      newErrors.webOfScience = 'Web of Science ID format: X-XXXX-XXXX';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissions
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/settings/change-password',
        { ...passwordForm },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    try {
      const token = localStorage.getItem('token');
      await api.put(
        '/settings/profile',
        { fullName: profileForm.fullName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUser((prev) => ({ ...prev, fullName: profileForm.fullName }));
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleAuthorIdSubmit = async (e) => {
    e.preventDefault();
    if (!validateAuthorIdForm()) return;
    try {
      const token = localStorage.getItem('token');
      const cleanAuthorIds = {
        scopus: authorIdForm.scopus.trim() || null,
        sci: authorIdForm.sci.trim() || null,
        webOfScience: authorIdForm.webOfScience.trim() || null
      };
      await api.put(
        '/settings/author-ids',
        { authorId: cleanAuthorIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setUser((prev) => ({ ...prev, authorId: cleanAuthorIds }));
      toast.success('Author IDs updated successfully!');
      setAuthorIdEditMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update Author IDs.');
    }
  };

  // Rendering
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gradient-to-br from-white via-blue-50/30 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500 tracking-wide">Loading your settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-10 bg-white rounded-2xl shadow-sm border border-red-200/40">
        <div className="text-center text-red-600 font-medium">
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

  const showAuthorIds = ['faculty', 'campus_admin'].includes(user.role);
  const authorIdsMissing = !user.authorId?.scopus && !user.authorId?.sci && !user.authorId?.webOfScience;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white px-4 py-8 sm:px-6 lg:px-10">
      {/* Hero Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_60%)]" />
          <div className="relative px-6 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-2xl font-semibold shadow-md ring-4 ring-white">
                {(user.fullName || user.email || 'U')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
                  Account Settings
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your profile information & research identifiers
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Pill tone="blue">{user.role?.replace(/_/g, ' ')}</Pill>
                  {user.college && user.college !== 'N/A' && <Pill>{user.college}</Pill>}
                  {showInstitute && <Pill tone="green">{user.institute}</Pill>}
                  {showDepartment && <Pill tone="amber">{user.department}</Pill>}
                  {showAuthorIds && (
                    <Pill tone={authorIdsMissing ? 'rose' : 'green'}>
                      {authorIdsMissing ? 'Author IDs Missing' : 'Author IDs Added'}
                    </Pill>
                  )}
                </div>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-medium bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Profile Section */}
        <SectionCard
          title="Profile Information"
          description="Your core identity details within the platform"
          action={
            editMode && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setProfileForm({
                      fullName: user.fullName || '',
                      email: user.email || ''
                    });
                  }}
                  className="h-10 px-5 rounded-xl border text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSubmit}
                  className="h-10 px-5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  type="button"
                >
                  Save Changes
                </button>
              </div>
            )
          }
        >
          {editMode ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                  className={`h-12 px-4 rounded-xl border text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 transition ${
                    errors.fullName
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                  Email (read-only)
                </label>
                <input
                  value={profileForm.email}
                  disabled
                  className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400">Email changes are restricted for security reasons.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FieldStatic label="Full Name" value={user.fullName} />
              <FieldStatic label="Email" value={user.email} />
              <FieldStatic label="Role" value={user.role?.replace(/_/g, ' ')} />
              <FieldStatic label="College" value={user.college} />
              {showInstitute && <FieldStatic label="Institute" value={user.institute} />}
              {showDepartment && <FieldStatic label="Department" value={user.department} />}
              <FieldStatic label="Faculty ID" value={user.facultyId} mono />
            </div>
          )}
        </SectionCard>

        {/* Author IDs */}
        {showAuthorIds && (
          <SectionCard
            title="Research Author Identifiers"
            description="Add identifiers to link your publications across databases"
            action={
              authorIdEditMode ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAuthorIdEditMode(false);
                      setAuthorIdForm({
                        scopus: user.authorId?.scopus || '',
                        sci: user.authorId?.sci || '',
                        webOfScience: user.authorId?.webOfScience || ''
                      });
                    }}
                    className="h-10 px-5 rounded-xl border text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAuthorIdSubmit}
                    className="h-10 px-5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    type="button"
                  >
                    Save Author IDs
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthorIdEditMode(true)}
                  className="h-10 px-5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  type="button"
                >
                  Edit Author IDs
                </button>
              )
            }
          >
            {authorIdEditMode ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { id: 'scopus', label: 'Scopus Author ID', placeholder: '10–11 digits' },
                  { id: 'sci', label: 'SCI Author ID', placeholder: 'A-1234-5678' },
                  { id: 'webOfScience', label: 'Web of Science ResearcherID', placeholder: 'A-1234-5678' }
                ].map(({ id, label, placeholder }) => (
                  <div key={id} className="flex flex-col gap-2">
                    <label htmlFor={id} className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                      {label}
                    </label>
                    <input
                      id={id}
                      name={id}
                      value={authorIdForm[id]}
                      onChange={handleAuthorIdChange}
                      placeholder={placeholder}
                      className={`h-12 px-4 rounded-xl border text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 transition ${
                        errors[id]
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-emerald-200'
                      }`}
                    />
                    {errors[id] && (
                      <p className="text-xs text-red-500 font-medium">{errors[id]}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FieldStatic label="Scopus Author ID" value={user.authorId?.scopus || '-'} mono />
                <FieldStatic label="SCI Author ID" value={user.authorId?.sci || '-'} mono />
                <FieldStatic label="Web of Science ID" value={user.authorId?.webOfScience || '-'} mono />
              </div>
            )}

            {authorIdsMissing && !authorIdEditMode && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-sm">
                  !
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-800">No Author IDs Added</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Adding at least one identifier (Scopus / SCI / Web of Science) improves discoverability and enables future automated sync features.
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* Password */}
        <SectionCard
          title="Change Password"
          description="Update your password to keep your account secure"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className={`h-12 px-4 rounded-xl border text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 ${
                    errors.currentPassword
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.currentPassword && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className={`h-12 px-4 rounded-xl border text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.newPassword && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.newPassword}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-semibold tracking-wide text-gray-600 uppercase"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className={`h-12 px-4 rounded-xl border text-sm bg-white/80 backdrop-blur focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="h-11 px-8 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-black transition-colors shadow-sm"
              >
                Update Password
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      <footer className="max-w-6xl mx-auto mt-16 pb-6 pt-10 text-center text-[11px] text-gray-400 tracking-wide">
        © {new Date().getFullYear()} ScholarSync • Secure Academic Identity Management
      </footer>
    </div>
  );
};

export default SettingsPage;