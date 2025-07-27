import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import AddUserDialog from './components/AddUserDialog';
import UserTable from './components/UserTable';
import UserFilters from './components/UserFilter';
import UserHeader from './components/UserHeader';
import UserStatsCard from './components/UserStatsCard';
import BulkUploadDialog from './components/BulkUploadDialog';

// College options with their specific categories
const collegeOptions = [
  { 
    name: 'SRMIST RAMAPURAM',
    categories: [
      'Science and Humanities',
      'Engineering and Technology',
      'Management',
      'Dental'
    ],
    hasCategories: true
  },
  { 
    name: 'SRM TRICHY',
    categories: [
      'Science and Humanities',
      'Engineering and Technology'
    ],
    hasCategories: true
  },
  { 
    name: 'EASWARI ENGINEERING COLLEGE',
    categories: ['N/A'],
    hasCategories: false
  },
  { 
    name: 'TRP ENGINEERING COLLEGE',
    categories: ['N/A'],
    hasCategories: false
  },
  { 
    name: 'N/A',
    categories: ['N/A'],
    hasCategories: false
  }
];

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'campus_admin', label: 'Campus Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'faculty', label: 'Faculty' }
];

const collegesWithCategories = ['SRMIST RAMAPURAM', 'SRM TRICHY'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    facultyId: '',
    email: '',
    password: '',
    role: 'faculty',
    college: 'N/A',
    category: 'N/A'
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
    category: 'all',
    college: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const navigate = useNavigate();

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

  // Apply user filters
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [users, filters, searchTerm]);

  const applyFilters = () => {
    let result = [...users];
    if (filters.role && filters.role !== 'all') {
      result = result.filter(user => user.role === filters.role);
    }
    if (filters.category && filters.category !== 'all') {
      result = result.filter(user => user.category === filters.category);
    }
    if (filters.college && filters.college !== 'all') {
      result = result.filter(user => user.college === filters.college);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(term) || 
        (user.facultyId && user.facultyId.toLowerCase().includes(term))
      );
    }
    setFilteredUsers(result);
  };

  // Fetch users based on current user role
  const fetchUsers = async (user) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/admin/users';
      const params = new URLSearchParams();
      if (user.role === 'campus_admin') {
        params.append('college', user.college);
        if (collegesWithCategories.includes(user.college)) {
          params.append('category', user.category);
        }
      } else if (user.role === 'admin') {
        params.append('college', user.college);
        params.append('category', user.category);
        params.append('role', 'faculty');
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server did not return JSON. Response: ${text}`);
      }
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: Expected array of users');
      }
      setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoriesForCollege = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.categories : ['N/A'];
  };

  const canCreateRole = (role) => {
    if (!currentUser) return false;
    const creatorRole = currentUser.role;
    if (creatorRole === 'super_admin') return ['campus_admin', 'admin', 'faculty'].includes(role);
    if (creatorRole === 'campus_admin') return ['admin', 'faculty'].includes(role);
    if (creatorRole === 'admin') return role === 'faculty';
    return false;
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    return roleOptions.filter(role => canCreateRole(role.value));
  };

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      if (!payload.fullName) throw new Error('Full name is required');
      if (!payload.email) throw new Error('Email is required');
      if (!editMode && !payload.password) throw new Error('Password is required');

      // College and category logic based on role
      if (currentUser.role === 'super_admin') {
        payload.college = payload.college;
        // For super admin, validate category requirements
        if (payload.role !== 'super_admin') {
          const college = collegeOptions.find(c => c.name === payload.college);
          if (college && college.hasCategories) {
            if (['faculty', 'campus_admin', 'admin'].includes(payload.role)) {
              if (!payload.category || payload.category === 'N/A') {
                throw new Error('Category is required for this role in this college');
              }
              // payload.category is already set
            } else {
              payload.category = 'N/A';
            }
          } else {
            payload.category = 'N/A';
          }
        } else {
          payload.category = 'N/A';
        }
      } else {
        payload.college = currentUser.college;
        payload.category = collegesWithCategories.includes(currentUser.college) ? currentUser.category : 'N/A';
      }

      // Handle faculty ID
      if (payload.role !== 'super_admin') {
        payload.facultyId = payload.facultyId;
      } else {
        payload.facultyId = 'N/A';
      }

      const url = editMode 
        ? `http://localhost:5000/api/admin/users/${currentUserId}`
        : 'http://localhost:5000/api/admin/users';
      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server did not return JSON. Response: ${text}`);
      }

      if (!res.ok) {
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
      college: currentUser?.role === 'super_admin' ? 'N/A' : currentUser?.college || 'N/A',
      category: 'N/A'
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  // --------- MAIN CHANGE HERE: only update users state, do not refetch all users!
  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const contentType = res.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server did not return JSON. Response: ${text}`);
      }
      if (!res.ok) {
        toast.error(result.error || result.message || 'Failed to delete user');
        return;
      }
      // Only update local users array!
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
      category: user.category || 'N/A',
    });
    setEditMode(true);
    setCurrentUserId(user._id);
    setOpenDialog(true);
  };

  const handleCollegeChange = (value) => {
    const newForm = {
      ...form,
      college: value,
      category: value === 'N/A' ? 'N/A' : (form.category || 'N/A')
    };
    const selectedCollege = collegeOptions.find(c => c.name === value);
    if (['campus_admin', 'admin', 'faculty'].includes(form.role)) {
      if (selectedCollege && !selectedCollege.hasCategories) {
        newForm.category = 'N/A';
      }
    }
    setForm(newForm);
  };

  const handleRoleChange = (value) => {
    const newForm = {
      ...form,
      role: value,
      category: value === 'faculty' ? (form.category || 'N/A') : 'N/A',
      facultyId: value === 'super_admin' ? 'N/A' : (form.facultyId)
    };
    const selectedCollege = collegeOptions.find(c => c.name === newForm.college);
    if ((['campus_admin', 'admin', 'faculty'].includes(value)) && selectedCollege && !selectedCollege.hasCategories) {
      newForm.category = 'N/A';
    }
    setForm(newForm);
  };

  const canModifyUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (targetUser._id === currentUser.userId) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'campus_admin') {
      if (currentUser.college !== targetUser.college) return false;
      if (!collegesWithCategories.includes(currentUser.college)) {
        return true;
      }
      return currentUser.category === targetUser.category;
    }
    if (currentUser.role === 'admin') {
      return currentUser.college === targetUser.college && 
             currentUser.category === targetUser.category &&
             targetUser.role === 'faculty';
    }
    return false;
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      category: 'all',
      college: 'all'
    });
    setSearchTerm('');
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'campus_admin': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-green-100 text-green-800';
      case 'faculty': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableRoles = [...new Set(users.map(user => user.role))];
  const availableCategories = [...new Set(
    users
      .filter(user => user.category && user.category !== 'N/A')
      .map(user => user.category)
  )];
  const availableColleges = [...new Set(
    users
      .filter(user => user.college && user.college !== 'N/A')
      .map(user => user.college)
  )];

  // Bulk Upload Function (local, not helper)
  const handleBulkUpload = async (formData) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/admin/bulk-upload-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const contentType = res.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server did not return JSON. Response: ${text}`);
      }
      if (!res.ok) {
        toast.error(result.error || result.message || 'Bulk upload failed');
        return;
      }
      toast.success('Bulk upload successful!');
      await fetchUsers(currentUser);
      return result;
    } catch (err) {
      toast.error(err.message || 'Failed to upload. Please try again.');
      return { error: err.message || 'Failed to upload. Please try again.' };
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header Section */}
      <UserHeader
        currentUser={currentUser}
        getAvailableRoles={getAvailableRoles}
        setOpenDialog={setOpenDialog}
        setOpenBulkDialog={setOpenBulkDialog}
      />

      <BulkUploadDialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        currentUser={currentUser}
        getAvailableRoles={getAvailableRoles}
        onBulkUpload={handleBulkUpload}
      />

      {/* Stats Card */}
      <UserStatsCard
        users={users}
        filteredUsers={filteredUsers}
        roleOptions={roleOptions}
      />

      {/* Filters */}
      <UserFilters
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        availableRoles={availableRoles}
        availableCategories={availableCategories}
        availableColleges={availableColleges}
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
        collegeOptions={collegeOptions}
        getCategoriesForCollege={getCategoriesForCollege}
        handleRoleChange={handleRoleChange}
        handleCollegeChange={handleCollegeChange}
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