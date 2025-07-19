import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Users, UserCog, Mail, Lock, UserPlus, Shield, BookOpen, Filter, X, User, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jwtDecode } from 'jwt-decode';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import AddUserDialog from './components/AddUserDialog';
import UserTable from './components/UserTable';
import UserFilters from './components/UserFilter';
import UserHeader from './components/UserHeader';
import UserStatsCard from './components/UserStatsCard';

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
  const [filters, setFilters] = useState({
    role: 'all',
    category: 'all',
    college: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();

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
  }, [navigate]);

  useEffect(() => {
    applyFilters();
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

  // This logic ensures campus admin will see admins and faculty with their college and category
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch users: ${res.status}`);
      }
      const data = await res.json();
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      if (!form.fullName) throw new Error('Full name is required');
      if (!form.email) throw new Error('Email is required');
      if (!editMode && !form.password) throw new Error('Password is required');

      let payload = {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        ...(form.password && { password: form.password })
      };

      // Handle faculty ID
      if (form.role !== 'super_admin') {
        payload.facultyId = form.facultyId || generateFacultyId();
      } else {
        payload.facultyId = 'N/A';
      }

      // Handle college and category based on current user's role and selections
      if (currentUser.role === 'super_admin') {
        payload.college = form.college;

        // For super admin, validate category requirements
        if (form.role !== 'super_admin') {
          const college = collegeOptions.find(c => c.name === form.college);
          if (college && college.hasCategories) {
            // Colleges with categories require proper category selection
            if (form.role === 'faculty' || form.role === 'campus_admin' || form.role === 'admin') {
              if (!form.category || form.category === 'N/A') {
                throw new Error('Category is required for this role in this college');
              }
              payload.category = form.category;
            } else {
              payload.category = 'N/A';
            }
          } else {
            // Colleges without categories
            payload.category = 'N/A';
          }
        } else {
          payload.category = 'N/A';
        }
      } else {
        // For non-super admins, use their own college/category
        payload.college = currentUser.college;
        // For colleges with categories, send user's category, else N/A
        payload.category = collegesWithCategories.includes(currentUser.college) ? currentUser.category : 'N/A';
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message ||
          (editMode ? 'Failed to update user' : 'Failed to create user'));
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

  // Helper function to generate faculty ID
  const generateFacultyId = () => {
    return 'FAC-' + Math.random().toString(36).substr(2, 8).toUpperCase();
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

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      toast.success('User deleted successfully');
      await fetchUsers(currentUser);
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
    if (form.role === 'campus_admin' || form.role === 'admin' || form.role === 'faculty') {
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
      facultyId: value === 'super_admin' ? 'N/A' : (form.facultyId || generateFacultyId())
    };
    const selectedCollege = collegeOptions.find(c => c.name === newForm.college);
    if ((value === 'campus_admin' || value === 'admin' || value === 'faculty') && selectedCollege && !selectedCollege.hasCategories) {
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

  return (
    <div className="p-6 w-9/10 mx-auto space-y-6">

      {/* Header Section */}
      <UserHeader
        currentUser={currentUser}
        getAvailableRoles={getAvailableRoles}
        setOpenDialog={setOpenDialog}
      />

      {/* Stats Card */}
      <UserStatsCard
        users={users}
        filteredUsers={filteredUsers}
        roleOptions={roleOptions}
      />

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4">
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
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
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
      </Card>

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