import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';

import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import AddUserDialog from './components/AddUserDialog.jsx';
import UserTable from './components/UserTable';
import UserFilters from './components/UserFilter';
import UserHeader from './components/UserHeader';
import UserStatsCard from './components/UserStatsCard';
import BulkUploadDialog from './components/BulkUploadDialog';

// College options with their specific institutes and departments
const COLLEGE_OPTIONS = [
  { 
    name: 'SRMIST RAMAPURAM',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A']
      },
      { 
        name: 'Engineering and Technology',
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
      },
      { 
        name: 'Management',
        departments: ['Business Administration', 'Commerce', 'N/A']
      },
      { 
        name: 'Dental',
        departments: ['General Dentistry', 'Orthodontics', 'N/A']
      }
    ]
  },
  { 
    name: 'SRM TRICHY',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: ['Mathematics', 'Physics', 'Chemistry', 'English', 'N/A']
      },
      { 
        name: 'Engineering and Technology',
        departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
      }
    ]
  },
  { 
    name: 'EASWARI ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
  },
  { 
    name: 'TRP ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'N/A']
  },
  { 
    name: 'N/A',
    hasInstitutes: false,
    departments: ['N/A']
  }
];

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'campus_admin', label: 'Campus Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'faculty', label: 'Faculty' }
];

const COLLEGES_WITH_INSTITUTES = ['SRMIST RAMAPURAM', 'SRM TRICHY'];
const API_BASE_URL = 'http://localhost:5000/api/admin';

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
    institute: 'N/A',
    department: 'N/A'
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
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

  // Apply user filters whenever users, filters, or search term changes
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [users, filters, searchTerm]);

  const applyFilters = () => {
    let result = [...users];
    
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
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(term) || 
        (user.facultyId && user.facultyId.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    
    setFilteredUsers(result);
  };

  // Fetch users based on current user role
  const fetchUsers = async (user) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/users`;
      const params = new URLSearchParams();
      
      // Add filters based on user role
      if (user.role === 'campus_admin') {
        params.append('college', user.college);
        if (COLLEGES_WITH_INSTITUTES.includes(user.college)) {
          params.append('institute', user.institute);
        }
      } else if (user.role === 'admin') {
        params.append('college', user.college);
        params.append('institute', user.institute);
        params.append('role', 'faculty');
      }
      
      // Append params to URL if any exist
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
      
      // Handle response
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType?.includes('application/json')) {
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

  // Helper functions
  const getInstitutesForCollege = (collegeName) => {
    const college = COLLEGE_OPTIONS.find(c => c.name === collegeName);
    if (!college || !college.hasInstitutes) return ['N/A'];
    return college.institutes.map(i => i.name);
  };

  const getDepartmentsForCollegeAndInstitute = (collegeName, instituteName = 'N/A') => {
    if (collegeName === 'N/A') return ['N/A'];
    
    const college = COLLEGE_OPTIONS.find(c => c.name === collegeName);
    if (!college) return ['N/A'];
    
    if (!college.hasInstitutes) {
      return college.departments || ['N/A'];
    }
    
    const institute = college.institutes.find(i => i.name === instituteName);
    return institute?.departments || ['N/A'];
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
    return ROLE_OPTIONS.filter(role => canCreateRole(role.value));
  };

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
        if (collegeData.hasInstitutes) {
          const instituteData = collegeData.institutes.find(i => i.name === payload.institute);
          if (instituteData && !instituteData.departments.includes(payload.department)) {
            throw new Error(`Invalid department for selected institute`);
          }
        } else if (!collegeData.departments.includes(payload.department)) {
          throw new Error(`Invalid department for selected college`);
        }
      }

      const url = editMode 
        ? `${API_BASE_URL}/users/${currentUserId}`
        : `${API_BASE_URL}/users`;
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
      if (contentType?.includes('application/json')) {
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
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const contentType = res.headers.get('content-type');
      let result;
      if (contentType?.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server did not return JSON. Response: ${text}`);
      }
      
      if (!res.ok) {
        toast.error(result.error || result.message || 'Failed to delete user');
        return;
      }
      
      // Update local users array
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
      if (currentUser.college !== targetUser.college) return false;
      if (!COLLEGES_WITH_INSTITUTES.includes(currentUser.college)) {
        return true;
      }
      return currentUser.institute === targetUser.institute;
    }
    if (currentUser.role === 'admin') {
      return currentUser.college === targetUser.college && 
             currentUser.institute === targetUser.institute &&
             targetUser.role === 'faculty';
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
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'campus_admin': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-green-100 text-green-800';
      case 'faculty': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get available filter options from current users
  const availableRoles = [...new Set(users.map(user => user.role))];
  const availableInstitutes = [...new Set(
    users
      .filter(user => user.institute && user.institute !== 'N/A')
      .map(user => user.institute)
  )];
  const availableColleges = [...new Set(
    users
      .filter(user => user.college && user.college !== 'N/A')
      .map(user => user.college)
  )];
  const availableDepartments = [...new Set(
    users
      .filter(user => user.department && user.department !== 'N/A')
      .map(user => user.department)
  )];

  // Bulk Upload Function
  const handleBulkUpload = async (formData) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/bulk-upload-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const contentType = res.headers.get('content-type');
      let result;
      if (contentType?.includes('application/json')) {
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header Section */}
      <UserHeader
        currentUser={currentUser}
        getAvailableRoles={getAvailableRoles}
        setOpenDialog={setOpenDialog}
        setOpenBulkDialog={setOpenBulkDialog}
        collegeOptions={COLLEGE_OPTIONS}
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
        filteredUsers={filteredUsers}
        roleOptions={ROLE_OPTIONS}
        loading={isLoading}
        activeUsers={users.filter(u => u.isActive).length}
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