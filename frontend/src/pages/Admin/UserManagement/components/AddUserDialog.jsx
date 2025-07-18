import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { User, Mail, Lock, Shield, BookOpen, BadgeCheck } from 'lucide-react';

// Colleges which require a category
const collegesWithCategories = ['SRMIST RAMAPURAM', 'SRM TRICHY'];

export default function AddUserDialog({
  open,
  onOpenChange,
  form,
  setForm,
  isSubmitting,
  editMode,
  handleSubmit,
  getAvailableRoles,
  currentUser,
  collegeOptions,
  getCategoriesForCollege,
  handleRoleChange,
  handleCollegeChange,
}) {
  // Helper function to check if college has categories
  const collegeHasCategories = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.hasCategories : false;
  };

  // Determine if we should show category field
  const shouldShowCategoryField = () => {
    if (!currentUser) return false;

    // For super admin creating non-super admin users
    if (currentUser.role === 'super_admin') {
      // Don't show for super_admin or colleges with no category
      if (form.role === 'super_admin') return false;
      if (!collegeHasCategories(form.college)) return false;
      // Show for faculty, admin, campus_admin
      return ['faculty', 'campus_admin', 'admin'].includes(form.role);
    }

    // For campus admin creating admin/faculty
    if (
      currentUser.role === 'campus_admin' &&
      ['admin', 'faculty'].includes(form.role) &&
      collegeHasCategories(currentUser.college)
    ) {
      return true;
    }

    return false;
  };

  // Get categories for the current college (super admin: form.college, else: currentUser.college)
  const getCurrentCategories = () => {
    const college = currentUser?.role === 'super_admin' ? form.college : currentUser?.college;
    return getCategoriesForCollege(college);
  };

  // Handle role change with proper category reset
  const handleRoleChangeWithReset = (value) => {
    const selectedCollege = currentUser?.role === 'super_admin' ? form.college : currentUser?.college;
    const categories = getCategoriesForCollege(selectedCollege);

    const hasCat = collegeHasCategories(selectedCollege);

    // If switching to a role that requires a category, set to first available (not N/A)
    let category = form.category;
    if (hasCat && ['faculty', 'campus_admin', 'admin'].includes(value)) {
      // If not editing, set to first available category
      category =
        !editMode && categories.length > 0 && categories[0] !== 'N/A'
          ? categories[0]
          : category;
    } else {
      category = 'N/A';
    }

    setForm({
      ...form,
      role: value,
      category,
      facultyId: value === 'super_admin' ? 'N/A' : form.facultyId,
    });
  };

  // Handle college change with proper category reset
  const handleCollegeChangeWithReset = (value) => {
    const categories = getCategoriesForCollege(value);
    const hasCat = collegeHasCategories(value);

    let category = form.category;
    if (hasCat && ['faculty', 'campus_admin', 'admin'].includes(form.role)) {
      category =
        !editMode && categories.length > 0 && categories[0] !== 'N/A'
          ? categories[0]
          : category;
    } else {
      category = 'N/A';
    }

    setForm({
      ...form,
      college: value,
      category,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {editMode ? (
              <Shield className="h-5 w-5 text-blue-600" />
            ) : (
              <User className="h-5 w-5 text-blue-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>

              {/* Faculty ID (hidden for super admin) */}
              {form.role !== 'super_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="facultyId" className="flex items-center">
                    <BadgeCheck className="h-4 w-4 mr-2 text-gray-500" />
                    Faculty ID
                  </Label>
                  <Input
                    id="facultyId"
                    placeholder="FAC-12345"
                    value={form.facultyId}
                    onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                    required={form.role !== 'super_admin'}
                  />
                </div>
              )}

              {/* Email */}
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
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Password */}
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

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-500" />
                  Role
                </Label>
                <Select
                  value={form.role}
                  onValueChange={handleRoleChangeWithReset}
                  disabled={editMode && currentUser?.role !== 'super_admin'}
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

              {/* College (for super admin creating non-super admin users) */}
              {(currentUser?.role === 'super_admin' && form.role !== 'super_admin') && (
                <div className="space-y-2">
                  <Label htmlFor="college" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                    College
                  </Label>
                  <Select
                    value={form.college}
                    onValueChange={handleCollegeChangeWithReset}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      {collegeOptions
                        .filter(college => college.name !== 'N/A')
                        .map((college) => (
                          <SelectItem key={college.name} value={college.name}>
                            {college.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Category (when applicable) - Full width */}
          {shouldShowCategoryField() && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {getCurrentCategories().map((category) => (
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
            disabled={isSubmitting || !form.fullName || !form.email || (!editMode && !form.password)}
            className="w-full"
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
                <Shield className="h-4 w-4 mr-2" />
                Update User
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}