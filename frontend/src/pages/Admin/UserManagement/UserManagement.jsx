import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, ChevronLeft, Users, Shield, BookOpen, UserCog, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const collegeOptions = [
  'SRMIST RAMAPURAM',
  'SRM TRICHY',
  'EASWARI ENGINEERING COLLEGE',
];

const categoryOptions = [
  'Engineering and Technology',
  'Science and Humanities',
  'Management',
  'Dental',
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'user',
    college: undefined,
    category: undefined,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      email: '',
      password: '',
      role: 'user',
      college: undefined,
      category: undefined,
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const url = editMode 
        ? `http://localhost:5000/admin/users/${currentUserId}`
        : 'http://localhost:5000/admin/users';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          college: form.college || null,
          category: form.category || null
        }),
      });
      
      if (!res.ok) throw new Error(editMode ? 'Update failed' : 'User creation failed');
      
      toast.success(editMode ? 'User updated successfully' : 'User added successfully');
      fetchUsers();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const confirmed = await new Promise((resolve) => {
        toast.custom((t) => (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold text-lg mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this user?</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={() => {
                toast.dismiss(t);
                resolve(true);
              }}>
                Delete
              </Button>
            </div>
          </div>
        ));
      });

      if (!confirmed) return;

      await fetch(`http://localhost:5000/admin/users/${id}`, { 
        method: 'DELETE' 
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleEdit = (user) => {
    setForm({
      email: user.email,
      password: '',
      role: user.role,
      college: user.college || undefined,
      category: user.category || undefined,
    });
    setEditMode(true);
    setCurrentUserId(user._id);
    setOpenDialog(true);
  };

  const handleCollegeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      college: value,
      category: value === 'SRMIST RAMAPURAM' ? undefined : undefined,
    }));
  };

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
            Add, edit, or remove users from the system
          </p>
        </div>
        
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
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
              <span className="text-2xl font-bold">{users.length}</span>
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'admin').length}
              </span>
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'user').length}
              </span>
              <span className="text-sm text-muted-foreground">Regular Users</span>
            </div>
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
            ) : users.length > 0 ? (
              users.map((user) => (
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
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="flex items-center gap-1.5"
                    >
                      {user.role === 'admin' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.college || '-'}
                  </TableCell>
                  <TableCell>
                    {user.college === 'SRMIST RAMAPURAM' ? (user.category || '-') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                        onClick={() => handleDelete(user._id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Users className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No users found</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setOpenDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add your first user
                    </Button>
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
                <Plus className="h-5 w-5 text-blue-600" />
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
                placeholder="user@srmist.edu.in"
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
                onValueChange={(value) => setForm({ ...form, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="college" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                College
              </Label>
              <Select
                value={form.college}
                onValueChange={handleCollegeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {collegeOptions.map((college) => (
                    <SelectItem key={college} value={college}>
                      {college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {form.college === 'SRMIST RAMAPURAM' && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
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
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}