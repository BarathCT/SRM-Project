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
import { User, Mail, Lock, Shield, BookOpen, BadgeCheck, Building2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useEffect, useState } from 'react';

// College to email domain mapping
const collegeDomains = {
  'SRMIST RAMAPURAM': 'srmist.edu.in',
  'SRM TRICHY': 'srmtrichy.edu.in',
  'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
  'TRP ENGINEERING COLLEGE': 'trp.srmtrichy.edu.in',
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
  getInstitutesForCollege,
  getDepartmentsForCollegeAndInstitute
}) {
  const { toast } = useToast();
  const [availableInstitutes, setAvailableInstitutes] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Defensive programming: make sure form is always defined
  if (!form) return null;

  // Helper function to check if college has institutes
  const collegeHasInstitutes = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.hasInstitutes : false;
  };

  // Validate email domain based on selected college
  const validateEmailDomain = (email, college) => {
    if (!college || !collegeDomains[college]) return true;
    const domain = collegeDomains[college];
    return email.endsWith(`@${domain}`);
  };

  // Auto-suggest email domain when college changes (if email already entered)
  useEffect(() => {
    if (
      form.college &&
      collegeDomains[form.college] &&
      form.email &&
      !form.email.endsWith(`@${collegeDomains[form.college]}`)
    ) {
      const currentEmail = form.email.split('@')[0];
      if (currentEmail) {
        const newEmail = `${currentEmail}@${collegeDomains[form.college]}`;
        if (form.email !== newEmail) {
          setForm({ ...form, email: newEmail });
        }
      }
    }
    // eslint-disable-next-line
  }, [form.college]);

  // Load institutes when college changes
  useEffect(() => {
    // Don't update if dialog is closed (prevents update loop when resetting form)
    if (!open) return;

    if (form.college && collegeHasInstitutes(form.college)) {
      const institutes = getInstitutesForCollege(form.college);
      setAvailableInstitutes(institutes);

      // Only reset if necessary to avoid infinite loop
      if (form.institute !== '' || form.department !== '') {
        setForm(prev => {
          if (prev.institute === '' && prev.department === '') return prev;
          return {
            ...prev,
            institute: '',
            department: ''
          };
        });
      }
    } else {
      setAvailableInstitutes([]);
      if (form.institute !== 'N/A' || form.department !== '') {
        setForm(prev => {
          if (prev.institute === 'N/A' && prev.department === '') return prev;
          return {
            ...prev,
            institute: 'N/A',
            department: ''
          };
        });
      }
    }
    // eslint-disable-next-line
  }, [form.college, open]);

  // Load departments when institute changes
  useEffect(() => {
    // Don't update if dialog is closed (prevents update loop when resetting form)
    if (!open) return;

    if (form.institute && form.institute !== 'N/A' && form.college) {
      const departments = getDepartmentsForCollegeAndInstitute(form.college, form.institute);
      setAvailableDepartments(departments);
      if (form.department !== '') {
        setForm(prev => {
          if (prev.department === '') return prev;
          return {
            ...prev,
            department: ''
          };
        });
      }
    } else if (form.college && !collegeHasInstitutes(form.college)) {
      const departments = getDepartmentsForCollegeAndInstitute(form.college, 'N/A');
      setAvailableDepartments(departments);
    } else {
      setAvailableDepartments([]);
    }
    // eslint-disable-next-line
  }, [form.institute, form.college, open]);

  // Determine if we should show institute field
  const shouldShowInstituteField = () => {
    if (!currentUser) return false;
    if (form.role === 'super_admin') return false;
    if (!form.college || form.college === 'N/A') return false;
    return collegeHasInstitutes(form.college);
  };

  // Determine if we should show department field
  const shouldShowDepartmentField = () => {
    if (!currentUser) return false;
    if (form.role === 'super_admin') return false;
    if (!form.college || form.college === 'N/A') return false;
    return true;
  };

  // Handle role change with proper validation
  const handleRoleChange = (value) => {
    const updates = { role: value };
    if (value === 'super_admin') {
      updates.facultyId = 'N/A';
      updates.college = 'N/A';
      updates.institute = 'N/A';
      updates.department = 'N/A';
      toast.info('Super Admin selected - college and institute not required');
    }
    setForm({ ...form, ...updates });
  };

  // Handle college change with validation
  const handleCollegeChange = (value) => {
    const updates = { college: value };
    if (value === 'N/A') {
      updates.institute = 'N/A';
      updates.department = 'N/A';
    } else if (!collegeHasInstitutes(value)) {
      updates.institute = 'N/A';
      updates.department = '';
      toast.info(`Selected ${value} - no institute required`);
    } else {
      updates.institute = '';
      updates.department = '';
      toast.info(`Selected ${value} - please choose an institute`);
    }
    setForm({ ...form, ...updates });
  };

  // Handle institute change
  const handleInstituteChange = (value) => {
    setForm({ ...form, institute: value });
  };

  // Handle department change
  const handleDepartmentChange = (value) => {
    setForm({ ...form, department: value });
  };

  // Generate a random password (8-10 chars, alphanumeric+symbols)
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Enhanced submit handler with complete validation
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
      if (form.college && collegeDomains[form.college] && !validateEmailDomain(form.email, form.college)) {
        toast.error(`Email must end with @${collegeDomains[form.college]}`);
        return;
      }
      if (form.role !== 'super_admin' && !form.facultyId) {
        toast.error('Faculty ID is required');
        return;
      }
      if (shouldShowInstituteField() && !form.institute) {
        toast.error('Institute selection is required');
        return;
      }
      if (shouldShowDepartmentField() && !form.department) {
        toast.error('Department selection is required');
        return;
      }

      // For new users, generate a random password
      let payload = { ...form };
      if (!editMode) {
        payload.password = generatePassword();
      }

      const result = await handleSubmit(payload);

      if (result?.error) {
        if (result.error.toLowerCase().includes('user already exists')) {
          toast.error('Email already exists');
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success(
        editMode ? 'User updated successfully' : 'User created successfully'
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error.message ||
        (editMode ? 'Failed to update user' : 'Failed to create user')
      );
    }
  };

  // Helper: Determines if all required fields are filled
  const isFormValid = () => {
    if (form.role === 'super_admin') {
      return !!form.fullName && !!form.email;
    }
    const basicValid = !!form.fullName && !!form.email && !!form.facultyId && !!form.role;
    if (currentUser?.role === 'super_admin') {
      return basicValid && !!form.college &&
        (!shouldShowInstituteField() || !!form.institute) &&
        (!shouldShowDepartmentField() || !!form.department);
    }
    return basicValid &&
      (!shouldShowInstituteField() || !!form.institute) &&
      (!shouldShowDepartmentField() || !!form.department);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
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
              {/* Password: show only in edit mode */}
              {editMode && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-gray-500" />
                    New Password (leave blank to keep current)
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only enter a password if you want to change it
                  </p>
                </div>
              )}

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-500" />
                  Role
                </Label>
                <Select
                  value={form.role}
                  onValueChange={handleRoleChange}
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
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
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

          {/* Institute (when applicable) */}
          {shouldShowInstituteField() && (
            <div className="space-y-2">
              <Label htmlFor="institute" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                Institute
              </Label>
              <Select
                value={form.institute}
                onValueChange={handleInstituteChange}
                disabled={!form.college}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institute" />
                </SelectTrigger>
                <SelectContent>
                  {availableInstitutes.map((institute) => (
                    <SelectItem key={institute} value={institute}>
                      {institute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department (when applicable) */}
          {shouldShowDepartmentField() && (
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                Department
              </Label>
              <Select
                value={form.department}
                onValueChange={handleDepartmentChange}
                disabled={!form.institute && collegeHasInstitutes(form.college)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
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