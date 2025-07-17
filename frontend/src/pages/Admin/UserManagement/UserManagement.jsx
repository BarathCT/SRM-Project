import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Users, UserCog, Mail, Lock, UserPlus, Shield, BookOpen, Filter, X } from 'lucide-react';
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// College options with their specific categories
const collegeOptions = [
  { 
    name: 'SRMIST RAMAPURAM',
    categories: [
      'Engineering and Technology',
      'Science and Humanities',
      'Management',
      'Dental'
    ]
  },
  { 
    name: 'SRM TRICHY',
    categories: [
      'Engineering and Technology',
      'Science and Humanities'
    ]
  },
  { 
    name: 'EASWARI ENGINEERING COLLEGE',
    categories: [
      'Engineering and Technology'
    ]
  },
  { 
    name: 'N/A',
    categories: ['N/A']
  }
];

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin', canCreate: ['super_admin'] },
  { value: 'campus_admin', label: 'Campus Admin', canCreate: ['super_admin'] },
  { value: 'admin', label: 'Admin', canCreate: ['super_admin', 'campus_admin'] },
  { value: 'faculty', label: 'Faculty', canCreate: ['super_admin', 'campus_admin', 'admin'] },
  { value: 'scholar', label: 'Scholar', canCreate: ['super_admin', 'campus_admin', 'admin'] }
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'scholar',
    college: 'N/A',
    category: 'N/A',
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
  }, [users, filters]);

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
    
    setFilteredUsers(result);
  };

  const fetchUsers = async (user) => {
    try {
      setIsLoading(true);
      let url = 'http://localhost:5000/api/admin/users';
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (user.role === 'campus_admin') {
        params.append('college', user.college);
      } else if (user.role === 'admin') {
        params.append('college', user.college);
        params.append('roles', 'faculty,scholar');
      }
      
      url += `?${params.toString()}`;

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
      setFilteredUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error(err.message || 'Failed to fetch users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoriesForCollege = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.categories : ['N/A'];
  };

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      role: 'scholar',
      college: 'N/A',
      category: 'N/A',
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const canCreateRole = (role) => {
    if (!currentUser) return false;
    const roleConfig = roleOptions.find(r => r.value === role);
    return roleConfig?.canCreate.includes(currentUser.role);
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    return roleOptions.filter(role => canCreateRole(role.value));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      if (!form.email) throw new Error('Email is required');
      if (!editMode && !form.password) throw new Error('Password is required');
      
      const payload = {
        email: form.email,
        ...(form.password && { password: form.password }),
        role: form.role,
        college: currentUser.role === 'super_admin' ? form.college : currentUser.college,
        category: ['faculty', 'scholar'].includes(form.role) ? form.category : 'N/A'
      };

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
    setForm(prev => ({
      ...prev,
      college: value,
      category: value === 'N/A' ? 'N/A' : (prev.category || 'N/A')
    }));
  };

  const handleRoleChange = (value) => {
    setForm(prev => ({
      ...prev,
      role: value,
      category: ['faculty', 'scholar'].includes(value) ? (prev.category || 'N/A') : 'N/A'
    }));
  };

  const canModifyUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    if (targetUser._id === currentUser.userId) return false;
    
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'campus_admin') return targetUser.college === currentUser.college;
    if (currentUser.role === 'admin') return targetUser.college === currentUser.college && ['faculty', 'scholar'].includes(targetUser.role);
    
    return false;
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      category: 'all',
      college: 'all'
    });
  };

  const availableRoles = [...new Set(users.map(user => user.role))];
  const availableCategories = [...new Set(
    users
      .filter(user => user.category && user.category !== 'N/A')
      .map(user => user.category)
  )];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <UserCog className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentUser?.role === 'super_admin' 
              ? 'Manage all users across all campuses' 
              : `Managing users for ${currentUser?.college || 'your campus'}`}
          </p>
        </div>
        
        {getAvailableRoles().length > 0 && (
          <Button onClick={() => setOpenDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">System Users</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Overview of all users with access to ScholarSync
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{filteredUsers.length}</span>
              <span className="text-sm text-muted-foreground">Showing {filteredUsers.length} of {users.length} users</span>
            </div>
            {roleOptions.map(role => (
              users.some(u => u.role === role.value) && (
                <div key={role.value} className="flex items-center space-x-2">
                  <span className="text-2xl font-bold" style={{
                    color: role.value === 'super_admin' ? '#7c3aed' :
                          role.value === 'campus_admin' ? '#2563eb' :
                          role.value === 'admin' ? '#1d4ed8' :
                          role.value === 'faculty' ? '#4338ca' :
                          '#3730a3'
                  }}>
                    {users.filter(u => u.role === role.value).length}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {role.label}s
                  </span>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            {(filters.role !== 'all' || filters.category !== 'all' || filters.college !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-4">
            {/* College filter (only for super admin) */}
            {currentUser?.role === 'super_admin' && (
              <div className="space-y-2 w-full sm:w-auto">
                <Label htmlFor="filter-college" className="text-xs">College</Label>
                <Select
                  value={filters.college}
                  onValueChange={(value) => setFilters({...filters, college: value})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All colleges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All colleges</SelectItem>
                    {collegeOptions
                      .filter(college => college.name !== 'N/A')
                      .map(college => (
                        <SelectItem key={college.name} value={college.name}>
                          {college.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Role filter (for all users) */}
            <div className="space-y-2 w-full sm:w-auto">
              <Label htmlFor="filter-role" className="text-xs">Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({...filters, role: value})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {availableRoles
                    .filter(role => role)
                    .map(role => {
                      const roleInfo = roleOptions.find(r => r.value === role);
                      return (
                        <SelectItem key={role} value={role}>
                          {roleInfo?.label || role}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Category filter */}
            {(currentUser?.college === 'SRMIST RAMAPURAM' || 
              (currentUser?.role === 'super_admin' && filters.college === 'SRMIST RAMAPURAM')) && (
              <div className="space-y-2 w-full sm:w-auto">
                <Label htmlFor="filter-category" className="text-xs">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({...filters, category: value})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {availableCategories
                      .filter(category => category)
                      .map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[250px]">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-500" />
                  Role
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  College
                </div>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-12" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user._id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <span className="bg-blue-100 p-1 rounded-full mr-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </span>
                      <span className="truncate max-w-[180px] sm:max-w-none">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        user.role === 'super_admin' ? 'default' :
                        user.role === 'campus_admin' ? 'secondary' :
                        user.role === 'admin' ? 'outline' :
                        'destructive'
                      }
                      className="flex items-center gap-1.5 capitalize"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.college || '-'}
                  </TableCell>
                  <TableCell>
                    {['faculty', 'scholar'].includes(user.role) ? (user.category || '-') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canModifyUser(user) && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(user)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user._id);
                              setDeleteDialogOpen(true);
                            }}
                            className="hover:bg-red-50 hover:text-red-600"
                            disabled={user._id === currentUser?.userId}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Users className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {users.length === 0 ? 'No users found' : 'No users match your filters'}
                    </p>
                    {getAvailableRoles().length > 0 && users.length === 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setOpenDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add your first user
                      </Button>
                    )}
                    {(filters.role !== 'all' || filters.category !== 'all') && users.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={resetFilters}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setOpenDialog(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <Edit className="h-5 w-5 text-blue-600" />
              ) : (
                <UserPlus className="h-5 w-5 text-blue-600" />
              )}
              <DialogTitle>
                {editMode ? 'Edit User' : 'Create New User'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {editMode 
                ? 'Update user details below' 
                : 'Fill in the details to create a new user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                Email
              </Label>
              <Input
                id="email"
                placeholder="user@example.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-gray-500" />
                {editMode ? 'New Password (leave blank to keep current)' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={editMode ? '********' : 'Enter password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editMode}
              />
              {editMode && (
                <p className="text-xs text-muted-foreground">
                  Only enter a password if you want to change it
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                Role
              </Label>
              <Select
                value={form.role}
                onValueChange={handleRoleChange}
                disabled={editMode && currentUserId === currentUser?.userId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {currentUser?.role === 'super_admin' && (
              <div className="space-y-2">
                <Label htmlFor="college" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  College
                </Label>
                <Select
                  value={form.college}
                  onValueChange={handleCollegeChange}
                  disabled={!canCreateRole(form.role) || 
                    (form.role === 'super_admin') || 
                    (currentUser.role !== 'super_admin') ||
                    (currentUserId === currentUser?.userId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {collegeOptions.map((college) => (
                      <SelectItem key={college.name} value={college.name}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {['faculty', 'scholar'].includes(form.role) && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                  disabled={!form.college || form.college === 'N/A' || (currentUserId === currentUser?.userId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoriesForCollege(form.college).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting || !form.email || (!editMode && !form.password)}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editMode ? 'Updating...' : 'Creating...'}
                </>
              ) : editMode ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update User
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-600" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(userToDelete)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}