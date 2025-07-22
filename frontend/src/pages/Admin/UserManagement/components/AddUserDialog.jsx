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
import { useToast } from '@/components/Toast';
import { useEffect } from 'react';

// College to email domain mapping
const collegeDomains = {
  'SRMIST RAMAPURAM': 'srmist.edu.in',
  'SRM TRICHY': 'srmtrp.edu.in',
  'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
  'TRP ENGINEERING COLLEGE': 'trpeng.edu.in',
  // Add other colleges as needed
};

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
}) {
  const { toast } = useToast();

  // Helper function to check if college has categories
  const collegeHasCategories = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.hasCategories : false;
  };

  // Validate email domain based on selected college
  const validateEmailDomain = (email, college) => {
    if (!college || !collegeDomains[college]) return true;
    const domain = collegeDomains[college];
    return email.endsWith(`@${domain}`);
  };

  // Auto-suggest email domain when college changes
  useEffect(() => {
    if (form.college && collegeDomains[form.college] && form.email) {
      const currentEmail = form.email.split('@')[0];
      if (currentEmail) {
        const newEmail = `${currentEmail}@${collegeDomains[form.college]}`;
        setForm({ ...form, email: newEmail });
      }
    }
  }, [form.college]);

  // Determine if we should show category field
  const shouldShowCategoryField = () => {
    if (!currentUser) return false;

    if (currentUser.role === 'super_admin') {
      if (form.role === 'super_admin') return false;
      if (!collegeHasCategories(form.college)) return false;
      return ['faculty', 'campus_admin', 'admin'].includes(form.role);
    }

    if (
      currentUser.role === 'campus_admin' &&
      ['admin', 'faculty'].includes(form.role) &&
      collegeHasCategories(currentUser.college)
    ) {
      return true;
    }

    return false;
  };

  // Get categories for the current college
  const getCurrentCategories = () => {
    const college = currentUser?.role === 'super_admin' ? form.college : currentUser?.college;
    return getCategoriesForCollege(college);
  };

  // Handle role change with proper validation
  const handleRoleChangeWithReset = (value) => {
    const selectedCollege = currentUser?.role === 'super_admin' ? form.college : currentUser?.college;
    const categories = getCategoriesForCollege(selectedCollege);
    const hasCat = collegeHasCategories(selectedCollege);

    let category = form.category;
    // Empty the category if changing to a role that requires a category
    if (hasCat && ['faculty', 'campus_admin', 'admin'].includes(value)) {
      category = '';
    } else {
      category = 'N/A';
    }

    setForm({
      ...form,
      role: value,
      category,
      facultyId: value === 'super_admin' ? 'N/A' : form.facultyId,
    });

    if (value === 'super_admin') {
      toast.info('Super Admin selected - college and category not required');
    }
  };

  // Handle college change with validation
  const handleCollegeChangeWithReset = (value) => {
    const categories = getCategoriesForCollege(value);
    const hasCat = collegeHasCategories(value);

    let category = form.category;
    if (hasCat && ['faculty', 'campus_admin', 'admin'].includes(form.role)) {
      category = ''; // Set to empty so user has to pick
      toast.info(`Selected ${value} - please choose a category`);
    } else {
      category = 'N/A';
      toast.info(`Selected ${value} - no category required`);
    }

    setForm({
      ...form,
      college: value,
      category,
    });
  };

  // Handle category change with toast
  const handleCategoryChange = (value) => {
    setForm({ ...form, category: value });
    toast.info(`Category set to ${value}`);
  };

  // Enhanced submit handler with complete validation and duplicate email check
  const handleSubmitWithToast = async () => {
    try {
      // Basic validation
      if (!form.fullName) {
        toast.error('Full name is required');
        return;
      }
      if (!form.email) {
        toast.error('Email is required');
        return;
      }
      if (form.college && !validateEmailDomain(form.email, form.college)) {
        toast.error(`Email must end with @${collegeDomains[form.college]}`);
        return;
      }
      if (!editMode && !form.password) {
        toast.error('Password is required for new users');
        return;
      }
      if (form.role !== 'super_admin' && !form.facultyId) {
        toast.error('Faculty ID is required');
        return;
      }

      // College validation for non-super_admin roles
      if (currentUser?.role === 'super_admin' && form.role !== 'super_admin' && !form.college) {
        toast.error('College selection is required');
        return;
      }

      // Category validation when required
      if (shouldShowCategoryField() && (!form.category || form.category === 'N/A')) {
        toast.error('Category selection is required for this college');
        return;
      }

      // Await the handleSubmit function and handle error responses
      const result = await handleSubmit();

      // If handleSubmit returns an error (not throws)
      if (result && typeof result === "object" && result.error) {
        if (result.error.toLowerCase().includes('user already exists')) {
          toast.error('Email already exists');
        } else {
          toast.error(result.error);
        }
        return;
      }
      if (result && typeof result === "string" && result.toLowerCase().includes('user already exists')) {
        toast.error('Email already exists');
        return;
      }

      // If no error, show success toast
      toast.success(
        editMode
          ? 'User updated successfully'
          : 'User created successfully'
      );
      onOpenChange(false);
    } catch (error) {
      // Catch thrown errors
      if (error.message && error.message.toLowerCase().includes('user already exists')) {
        toast.error('Email already exists');
      } else {
        toast.error(
          error.message ||
          (editMode ? 'Failed to update user' : 'Failed to create user')
        );
      }
    }
  };

  // Helper: Determines if all required fields are filled (for button disable logic)
  const isFormValid = () => {
    // For edit mode, password is not required
    const passwordRequired = !editMode;
    // If creating/editing super_admin, college/category not required
    if (form.role === 'super_admin') {
      return (
        !!form.fullName &&
        !!form.email &&
        (!!form.password || !passwordRequired) &&
        !!form.facultyId
      );
    }
    // For super_admin adding other users, must select college and (maybe) category
    if (currentUser?.role === 'super_admin') {
      if (!form.college || form.college === 'N/A') return false;
      if (shouldShowCategoryField() && (!form.category || form.category === 'N/A' || form.category === '')) return false;
    }
    // Common required fields plus email domain validation
    return (
      !!form.fullName &&
      !!form.email &&
      (form.college ? validateEmailDomain(form.email, form.college) : true) &&
      (!!form.password || !passwordRequired) &&
      !!form.facultyId &&
      !!form.role &&
      (currentUser?.role !== 'super_admin' || !!form.college)
    );
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
                  placeholder={
                    form.college && collegeDomains[form.college] 
                      ? `example@${collegeDomains[form.college]}` 
                      : 'user@example.edu'
                  }
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {form.college && collegeDomains[form.college] && (
                  <p className="text-xs text-muted-foreground">
                    Email must end with @{collegeDomains[form.college]}
                  </p>
                )}
                {form.college && form.email && !validateEmailDomain(form.email, form.college) && (
                  <p className="text-xs text-red-500">
                    Email domain must match @{collegeDomains[form.college]}
                  </p>
                )}
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

          {/* Category (when applicable) */}
          {shouldShowCategoryField() && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category || ""}
                onValueChange={handleCategoryChange}
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
            onClick={handleSubmitWithToast}
            disabled={isSubmitting || !isFormValid()}
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