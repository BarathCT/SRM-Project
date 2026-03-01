import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';

import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import AddUserDialog from './components/AddUserDialog.jsx';
import UserTable from './components/UserTable';
import UserFilters from './components/UserFilter';
import UserHeader from './components/UserHeader';
import UserStatsCard from './components/UserStatsCard';
import BulkUploadDialog from './components/BulkUpload/BulkUploadDialog';
import LogDialog from './components/LogDialog';
import { useDebounce } from '@/hooks/useDebounce';

import {
  collegeOptions as COLLEGE_OPTIONS,
  getInstitutesForCollege,
  getDepartments as getDepartmentsForCollegeAndInstitute,
  collegesWithoutInstitutes,
  ALL_COLLEGE_NAMES,
} from '@/utils/collegeData';

// Only allowed roles (admin removed)
const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'campus_admin', label: 'Campus Admin' },
  { value: 'faculty', label: 'Faculty' }
];

const COLLEGES_WITH_INSTITUTES = ['SRMIST RAMAPURAM', 'SRM TRICHY'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [form, setForm] = useState({
    fullName: '',
    facultyId: '',
    email: '',
    password: '',
    role: 'faculty',
    college: 'SRMIST RAMAPURAM',
    institute: 'N/A',
    department: 'N/A'
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    institute: 'all',
    college: 'all',
    department: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Always set form.college/institute for campus_admin on user/context load
  useEffect(() => {
    if (currentUser && currentUser.role === 'campus_admin' && openDialog) {
      setForm(prev => ({
        ...prev,
        college: currentUser.college,
        institute: currentUser.institute,
        // department stays as is, will be selected
      }));
    }
    // eslint-disable-next-line
  }, [currentUser, openDialog]);

  // Validate token and fetch users on mount
  useEffect(() => {
    const validateTokenAndFetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const decoded = jwtDecode(token);
        setCurrentUser({
          ...decoded,
          userId: decoded._id || decoded.userId
        });
        await fetchUsers(decoded);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      }
    };
    validateTokenAndFetchUsers();
    // eslint-disable-next-line
  }, [navigate]);

  // Apply user filters whenever users, filters, or debounced search term changes
  const applyFilters = useCallback(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    let result = [...safeUsers];

    // Apply role filter
    if (filters.role !== 'all') {
      result = result.filter(user => user.role === filters.role);
    }

    // Apply institute filter
    if (filters.institute !== 'all') {
      result = result.filter(user => user.institute === filters.institute);
    }

    // Apply college filter
    if (filters.college !== 'all') {
      result = result.filter(user => user.college === filters.college);
    }

    // Apply department filter
    if (filters.department !== 'all') {
      result = result.filter(user => user.department === filters.department);
    }

    // Apply search term - use debouncedSearchTerm instead of searchTerm
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(user =>
        user.fullName?.toLowerCase().includes(term) ||
        (user.facultyId && user.facultyId.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(result);
  }, [users, filters, debouncedSearchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fetch users based on current user role - fetch all pages for client-side pagination
  const fetchUsers = async (user, page = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // Fetch ALL pages to get complete data for client-side pagination
      let allUsers = [];
      let currentPage = 1;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        let url = `/admin/users`;
        const params = {};

        // Add pagination params
        params.page = currentPage;
        params.limit = 100; // Fetch 100 per page to reduce API calls

        // Add filters based on user role
        if (user.role === 'campus_admin') {
          params.college = user.college;
        }

        const res = await api.get(url, { params });
        const data = res.data;

        // Handle paginated response
        if (data.pagination) {
          allUsers.push(...(data.data || []));
          totalCount = data.pagination.total || 0;
          const totalPages = data.pagination.totalPages || 1;
          hasMore = currentPage < totalPages;
          currentPage++;
        } else if (Array.isArray(data)) {
          // Legacy response format - assume all data in one response
          allUsers.push(...data);
          totalCount = data.length;
          hasMore = false;
        } else {
          hasMore = false;
        }
      }

      setUsers(allUsers);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
        totalPages: Math.ceil(totalCount / 15), // For display purposes
        hasNextPage: false,
        hasPrevPage: false
      }));
    } catch (err) {
      console.error('Fetch users error:', err);
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions using collegeData.js
  const canCreateRole = (role) => {
    if (!currentUser) return false;
    const creatorRole = currentUser.role;
    if (creatorRole === 'super_admin') return ['campus_admin', 'faculty'].includes(role);
    if (creatorRole === 'campus_admin') return role === 'faculty';
    return false;
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    return ROLE_OPTIONS.filter(role => canCreateRole(role.value));
  };

  // PATCHED handleSubmit to always send correct institute/department for SRM RESEARCH campus admin
  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      if (!payload.fullName) throw new Error('Full name is required');
      if (!payload.email) throw new Error('Email is required');
      if (!editMode && !payload.password) throw new Error('Password is required');

      // Validate department based on college and institute
      const collegeData = COLLEGE_OPTIONS.find(c => c.name === payload.college);
      if (collegeData) {
        // SKIP department validation for campus_admin (now campus_admin can assign any department in their college)
        if (payload.role !== 'campus_admin') {
          if (collegeData.hasInstitutes) {
            const instituteData = collegeData.institutes.find(i => i.name === payload.institute);
            if (instituteData && !instituteData.departments.includes(payload.department)) {
              throw new Error(`Invalid department for selected institute`);
            }
          } else if (!collegeData.departments.includes(payload.department)) {
            throw new Error(`Invalid department for selected college`);
          }
        }
      }

      // For campus admin, always enforce their org context (college/institute/department)
      let realPayload = { ...payload };
      if (currentUser?.role === 'campus_admin') {
        realPayload.college = currentUser.college;
        realPayload.institute = currentUser.institute;
        // If SRM RESEARCH, always fix department
        if (
          currentUser.institute === 'SRM RESEARCH' &&
          (currentUser.college === 'SRMIST RAMAPURAM' || currentUser.college === 'SRM TRICHY')
        ) {
          realPayload.department = currentUser.college === 'SRMIST RAMAPURAM'
            ? 'Ramapuram Research'
            : 'Trichy Research';
        }
      }

      const url = editMode
        ? `/admin/users/${currentUserId}`
        : `/admin/users`;

      const response = editMode
        ? await api.put(url, realPayload)
        : await api.post(url, realPayload);

      const result = response.data;

      if (response.status >= 400) {
        if (result.message?.toLowerCase().includes('user already exists')) {
          toast.error('Email already exists');
        } else {
          toast.error(result.error || result.message || (editMode ? 'Failed to update user' : 'Failed to create user'));
        }
        return;
      }

      toast.success(editMode ? 'User updated successfully' : 'User created successfully');
      await fetchUsers(currentUser);
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setForm({
      fullName: '',
      facultyId: '',
      email: '',
      password: '',
      role: 'faculty',
      college: currentUser?.role === 'super_admin' ? 'SRMIST RAMAPURAM' : currentUser?.college || 'SRMIST RAMAPURAM',
      institute: 'N/A',
      department: 'N/A'
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await api.delete(`/admin/users/${id}`);
      const result = res.data;

      if (res.status >= 400) {
        toast.error(result.error || result.message || 'Failed to delete user');
        return;
      }

      setUsers(prevUsers => prevUsers.filter(user => user._id !== id));
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEdit = (user) => {
    if (user._id === currentUser?.userId) {
      toast.warning('You can only edit your own email and password through profile settings');
      return;
    }
    setForm({
      fullName: user.fullName,
      facultyId: user.facultyId,
      email: user.email,
      password: '',
      role: user.role,
      college: user.college || 'N/A',
      institute: user.institute || 'N/A',
      department: user.department || 'N/A'
    });
    setEditMode(true);
    setCurrentUserId(user._id);
    setOpenDialog(true);
  };

  const canModifyUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (targetUser._id === currentUser.userId) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'campus_admin') {
      // Campus admin can only modify users under their college
      return currentUser.college === targetUser.college;
    }
    return false;
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      institute: 'all',
      college: 'all',
      department: 'all'
    });
    setSearchTerm('');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'campus_admin': return 'bg-blue-100 text-blue-800';
      case 'faculty': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get available filter options from current users - memoized to prevent infinite loops
  const availableRoles = useMemo(() => {
    return [...new Set(users.map(user => user.role))].filter(role => ['super_admin', 'campus_admin', 'faculty'].includes(role));
  }, [users]);

  const availableInstitutes = useMemo(() => {
    return [...new Set(
      users
        .filter(user => user.institute && user.institute !== 'N/A')
        .map(user => user.institute)
    )];
  }, [users]);

  const availableColleges = useMemo(() => {
    if (currentUser?.role === 'super_admin') {
      return ALL_COLLEGE_NAMES;
    }
    return [...new Set(
      users
        .filter(user => user.college && user.college !== 'N/A')
        .map(user => user.college)
    )];
  }, [users, currentUser]);


  const availableDepartments = useMemo(() => {
    return [...new Set(
      users
        .filter(user => user.department && user.department !== 'N/A')
        .map(user => user.department)
    )];
  }, [users]);

  // Bulk Upload Function
  const handleBulkUpload = async (formData) => {
    const token = localStorage.getItem('token');
    try {
      const res = await api.post('/admin/bulk-upload-users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const result = res.data;

      if (res.status >= 400) {
        toast.error(result.error || result.message || 'Bulk upload failed');
        return;
      }

      const count = result?.count || result?.users?.length || 0;
      toast.success(`Bulk upload successful! ${count} user${count !== 1 ? 's' : ''} created`);
      await fetchUsers(currentUser);
      return result;
    } catch (err) {
      toast.error(err.message || 'Failed to upload. Please try again.');
      return { error: err.message || 'Failed to upload. Please try again.' };
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">

      {/* Header Section */}
      <UserHeader
        currentUser={currentUser}
        getAvailableRoles={getAvailableRoles}
        setOpenDialog={setOpenDialog}
        setOpenBulkDialog={setOpenBulkDialog}
        setShowLogDialog={setShowLogDialog}
        collegeOptions={COLLEGE_OPTIONS}
      />

      {/* Log Dialog for Super Admin */}
      <LogDialog
        open={showLogDialog}
        onOpenChange={setShowLogDialog}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        currentUser={currentUser}
        getAvailableRoles={getAvailableRoles}
        onBulkUpload={handleBulkUpload}
        collegeOptions={COLLEGE_OPTIONS}
      />

      {/* Stats Card */}
      <UserStatsCard
        users={users}
        totalUsers={pagination.total}
        filteredUsers={filteredUsers}
        roleOptions={ROLE_OPTIONS}
        loading={isLoading}
        activeUsers={users.filter(u => u.isActive).length}
        currentUser={currentUser} // <-- Pass it!
      />

      {/* Filters */}
      <UserFilters
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        availableRoles={availableRoles}
        availableInstitutes={availableInstitutes}
        availableColleges={availableColleges}
        availableDepartments={availableDepartments}
        currentUser={currentUser}
        resetFilters={resetFilters}
      />

      {/* Users Table */}
      <UserTable
        users={users}
        filteredUsers={filteredUsers}
        isLoading={isLoading}
        currentUser={currentUser}
        getRoleColor={getRoleColor}
        canModifyUser={canModifyUser}
        handleEdit={handleEdit}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setUserToDelete={setUserToDelete}
        getAvailableRoles={getAvailableRoles}
        filters={filters}
        searchTerm={searchTerm}
        resetFilters={resetFilters}
        setOpenDialog={setOpenDialog}
      />


      {/* Add/Edit User Dialog */}
      <AddUserDialog
        open={openDialog}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setOpenDialog(open);
        }}
        form={form}
        setForm={setForm}
        isSubmitting={isSubmitting}
        editMode={editMode}
        handleSubmit={handleSubmit}
        getAvailableRoles={getAvailableRoles}
        currentUser={currentUser}
        collegeOptions={COLLEGE_OPTIONS}
        getInstitutesForCollege={getInstitutesForCollege}
        getDepartmentsForCollegeAndInstitute={getDepartmentsForCollegeAndInstitute}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => handleDelete(userToDelete)}
        isLoading={isLoading}
        title="Confirm User Deletion"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
}