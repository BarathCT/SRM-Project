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

// College to email domain mapping for normal colleges
const collegeDomains = {
  'SRMIST RAMAPURAM': 'srmist.edu.in',
  'SRM TRICHY': 'srmtrichy.edu.in',
  'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
  'TRP ENGINEERING COLLEGE': 'trp.srmtrichy.edu.in',
};

// Allowed domains for SRM RESEARCH institute
const researchAllowedDomains = [
  'srmist.edu.in',
  'srmtrichy.edu.in',
  'eec.srmrmp.edu.in',
  'trp.srmtrichy.edu.in'
];

// College options with updated SRM RESEARCH departments
const collegeOptions = [
  {
    name: 'SRMIST RAMAPURAM',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: [
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'N/A'
        ]
      },
      { 
        name: 'Engineering and Technology',
        departments: [
          'Computer Science',
          'Information Technology',
          'Electronics',
          'Mechanical',
          'Civil',
          'N/A'
        ]
      },
      { 
        name: 'Management',
        departments: [
          'Business Administration',
          'Commerce',
          'N/A'
        ]
      },
      { 
        name: 'Dental',
        departments: [
          'General Dentistry',
          'Orthodontics',
          'N/A'
        ]
      },
      { 
        name: 'SRM RESEARCH',
        departments: [
          'Ramapuram Research'
        ]
      }
    ]
  },
  {
    name: 'SRM TRICHY',
    hasInstitutes: true,
    institutes: [
      { 
        name: 'Science and Humanities',
        departments: [
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'N/A'
        ]
      },
      { 
        name: 'Engineering and Technology',
        departments: [
          'Computer Science',
          'Information Technology',
          'Electronics',
          'Mechanical',
          'Civil',
          'N/A'
        ]
      },
      { 
        name: 'SRM RESEARCH',
        departments: [
          'Trichy Research'
        ]
      }
    ]
  },
  {
    name: 'EASWARI ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: [
      'Computer Science',
      'Information Technology',
      'Electronics',
      'Mechanical',
      'Civil',
      'N/A'
    ]
  },
  {
    name: 'TRP ENGINEERING COLLEGE',
    hasInstitutes: false,
    departments: [
      'Computer Science',
      'Information Technology',
      'Electronics',
      'Mechanical',
      'Civil',
      'N/A'
    ]
  },
  {
    name: 'N/A',
    hasInstitutes: false,
    departments: ['N/A']
  }
];

// Helper functions to get institutes and departments
function getInstitutesForCollege(collegeName) {
  const college = collegeOptions.find(c => c.name === collegeName);
  return college && college.hasInstitutes
    ? college.institutes.map(inst => inst.name)
    : [];
}

function getDepartmentsForCollegeAndInstitute(collegeName, instituteName) {
  const college = collegeOptions.find(c => c.name === collegeName);
  if (!college) return [];
  if (!college.hasInstitutes) return college.departments;
  const institute = college.institutes.find(i => i.name === instituteName);
  return institute ? institute.departments : [];
}

// Enhanced email validation function with SRM RESEARCH logic
const validateEmailDomain = (email, college, institute, currentUser) => {
  if (!email) return true;
  
  const emailParts = email.split('@');
  if (emailParts.length !== 2) return false;
  
  const domain = emailParts[1];
  
  // If SRM RESEARCH is selected as institute OR current user is from SRM RESEARCH, 
  // allow any of the four research domains
  if (institute === 'SRM RESEARCH' || currentUser?.institute === 'SRM RESEARCH') {
    return researchAllowedDomains.includes(domain);
  }
  
  // For normal college selections, enforce specific college domain
  if (!college || !collegeDomains[college]) return true;
  return domain === collegeDomains[college];
};

// Get appropriate email domain hint based on selection
const getEmailDomainHint = (college, institute, currentUser) => {
  // If current user is from SRM RESEARCH or SRM RESEARCH is selected, show all domains
  if (institute === 'SRM RESEARCH' || currentUser?.institute === 'SRM RESEARCH') {
    return researchAllowedDomains;
  }
  
  if (college && collegeDomains[college]) {
    return [collegeDomains[college]];
  }
  
  return [];
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
}) {
  const { toast } = useToast();
  const [availableInstitutes, setAvailableInstitutes] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  if (!form) return null;

  const collegeHasInstitutes = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.hasInstitutes : false;
  };

  // Check if current user is from SRM RESEARCH
  const isCurrentUserFromSRMResearch = () => {
    return currentUser?.institute === 'SRM RESEARCH';
  };

  // Check if the selected college has institutes
  const selectedCollegeHasInstitutes = () => {
    return form.college && collegeHasInstitutes(form.college);
  };

  // Auto-suggest email domain when college changes (but not for SRM RESEARCH)
  useEffect(() => {
    if (
      form.college &&
      collegeDomains[form.college] &&
      form.email &&
      form.institute !== 'SRM RESEARCH' &&
      !isCurrentUserFromSRMResearch()
    ) {
      const emailParts = form.email.split('@');
      const currentUsername = emailParts[0];
      const expectedDomain = collegeDomains[form.college];
      
      if (currentUsername && emailParts[1] !== expectedDomain) {
        const newEmail = `${currentUsername}@${expectedDomain}`;
        if (form.email !== newEmail) {
          setForm({ ...form, email: newEmail });
        }
      }
    }
    // eslint-disable-next-line
  }, [form.college]);

  // Load institutes when college changes
  useEffect(() => {
    if (!open) return;
    
    if (form.college && collegeHasInstitutes(form.college)) {
      const institutes = getInstitutesForCollege(form.college);
      setAvailableInstitutes(institutes);
      
      // Reset institute and department when college changes
      if (form.institute !== '' || form.department !== '') {
        setForm(prev => ({
          ...prev,
          institute: '',
          department: ''
        }));
      }
    } else {
      setAvailableInstitutes([]);
      
      // For colleges without institutes, set institute to N/A
      if (form.institute !== 'N/A' || form.department !== '') {
        setForm(prev => ({
          ...prev,
          institute: 'N/A',
          department: ''
        }));
      }
    }
    // eslint-disable-next-line
  }, [form.college, open]);

  // Load departments when institute changes OR when dialog opens for campus admin
  useEffect(() => {
    if (!open) return;
    
    // For campus admin from SRM RESEARCH, auto-set department when dialog opens
    if (currentUser?.role === 'campus_admin' && isCurrentUserFromSRMResearch() && !form.department) {
      setForm(prev => ({
        ...prev,
        college: currentUser.college,
        institute: currentUser.institute,
        department: currentUser.department
      }));
      return;
    }
    
    if (form.institute && form.institute !== 'N/A' && form.college) {
      const departments = getDepartmentsForCollegeAndInstitute(form.college, form.institute);
      setAvailableDepartments(departments);
      
      // Auto-set department for SRM RESEARCH (only one department available)
      if (form.institute === 'SRM RESEARCH' && departments.length === 1) {
        setForm(prev => ({
          ...prev,
          department: departments[0]
        }));
        toast.info(`Department automatically set to: ${departments[0]}`);
      } else if (form.department !== '') {
        // Reset department for other institutes
        setForm(prev => ({
          ...prev,
          department: ''
        }));
      }
    } else if (form.college && !collegeHasInstitutes(form.college)) {
      // For colleges without institutes, load departments directly
      const departments = getDepartmentsForCollegeAndInstitute(form.college, 'N/A');
      setAvailableDepartments(departments);
    } else {
      setAvailableDepartments([]);
    }
    // eslint-disable-next-line
  }, [form.institute, form.college, open, currentUser]);

  // Visibility helper functions
  const shouldShowCollegeField = () => {
    if (!currentUser) return false;
    if (form.role === 'super_admin') return false;
    return currentUser.role === 'super_admin' && form.role !== 'super_admin';
  };

  const shouldShowInstituteField = () => {
    if (!currentUser) return false;
    if (form.role === 'super_admin') return false;
    if (!form.college || form.college === 'N/A') return false;
    if (currentUser.role !== 'super_admin') return false;
    return collegeHasInstitutes(form.college);
  };

  const shouldShowDepartmentField = () => {
    if (!currentUser) return false;
    if (form.role === 'super_admin') return false;
    if (!form.college || form.college === 'N/A') return false;
    
    // UPDATED LOGIC: Campus admin for colleges WITHOUT institutes don't need department
    if (form.role === 'campus_admin' && !selectedCollegeHasInstitutes()) {
      return false; // Hide department field for campus admin in colleges without institutes
    }
    
    // Campus admin for colleges WITH institutes still don't need department (existing logic)
    if (form.role === 'campus_admin') return false;
    
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'campus_admin' && form.role === 'faculty') return true;
    return false;
  };

  // Check if department field should be disabled
  const isDepartmentDisabled = () => {
    // Disable if SRM RESEARCH is selected OR if current user is from SRM RESEARCH
    return form.institute === 'SRM RESEARCH' || isCurrentUserFromSRMResearch();
  };

  // Get filtered roles
  const getFilteredRoles = () => {
    const allRoles = getAvailableRoles();
    if (currentUser?.role === 'campus_admin') {
      return allRoles.filter(role => role.value === 'faculty');
    }
    return allRoles.filter(role => ['super_admin', 'campus_admin', 'faculty'].includes(role.value));
  };

  // Handle role change
  const handleRoleChange = (value) => {
    const updates = { role: value };
    
    if (value === 'super_admin') {
      updates.facultyId = 'N/A';
      updates.college = 'N/A';
      updates.institute = 'N/A';
      updates.department = 'N/A';
      toast.info('Super Admin selected - college and institute not required');
    } else if (value === 'campus_admin') {
      // UPDATED LOGIC: Set department based on college type
      if (form.college && !selectedCollegeHasInstitutes()) {
        // For colleges without institutes, campus admin gets N/A for both institute and department
        updates.institute = 'N/A';
        updates.department = 'N/A';
        toast.info('Campus Admin for college without institutes - no institute/department required');
      } else {
        // For colleges with institutes, campus admin gets N/A only for department
        updates.department = 'N/A';
      }
      
      if (currentUser?.role !== 'super_admin') {
        updates.college = currentUser.college;
        updates.institute = currentUser.institute;
      }
    } else if (value === 'faculty') {
      if (currentUser?.role === 'campus_admin') {
        updates.college = currentUser.college;
        updates.institute = currentUser.institute;
        // For SRM RESEARCH campus admin, set the department
        if (isCurrentUserFromSRMResearch()) {
          updates.department = currentUser.department;
        } else {
          updates.department = '';
        }
      } else if (currentUser?.role === 'super_admin') {
        updates.department = '';
      }
    }
    
    setForm({ ...form, ...updates });
  };

  // Handle college change
  const handleCollegeChange = (value) => {
    const updates = { college: value };
    
    if (value === 'N/A') {
      updates.institute = 'N/A';
      updates.department = 'N/A';
    } else if (!collegeHasInstitutes(value)) {
      updates.institute = 'N/A';
      // UPDATED LOGIC: For campus admin in colleges without institutes, set department to N/A
      if (form.role === 'campus_admin') {
        updates.department = 'N/A';
        toast.info(`Selected ${value} - Campus Admin manages entire college (no institute/department required)`);
      } else {
        updates.department = '';
        toast.info(`Selected ${value} - no institute required`);
      }
    } else {
      updates.institute = '';
      updates.department = '';
      toast.info(`Selected ${value} - please choose an institute`);
    }
    
    setForm({ ...form, ...updates });
  };

  // Handle institute change
  const handleInstituteChange = (value) => {
    setForm({ ...form, institute: value, department: '' });
    
    if (value === 'SRM RESEARCH') {
      toast.info('SRM RESEARCH selected - department will be auto-assigned');
    }
  };

  // Handle department change
  const handleDepartmentChange = (value) => {
    setForm({ ...form, department: value });
  };

  // Generate random password
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
      if (!form.fullName?.trim()) {
        toast.error('Full name is required');
        return;
      }
      
      if (!form.email?.trim()) {
        toast.error('Email is required');
        return;
      }

      // Email domain validation with currentUser context
      if (!validateEmailDomain(form.email, form.college, form.institute, currentUser)) {
        const allowedDomains = getEmailDomainHint(form.college, form.institute, currentUser);
        toast.error(
          `Email domain must be one of: ${allowedDomains.map(d => `@${d}`).join(', ')}`
        );
        return;
      }

      // Faculty ID validation
      if (form.role !== 'super_admin' && !form.facultyId?.trim()) {
        toast.error('Faculty ID is required');
        return;
      }

      // Institute validation
      if (shouldShowInstituteField() && !form.institute) {
        toast.error('Institute selection is required');
        return;
      }

      // Department validation - UPDATED to handle campus admin in colleges without institutes
      if (shouldShowDepartmentField()) {
        if (isCurrentUserFromSRMResearch()) {
          // For SRM RESEARCH campus admin, department should be auto-filled
          if (!form.department) {
            toast.error('Department should be auto-assigned for SRM RESEARCH');
            return;
          }
        } else {
          // For others, department must be selected and not N/A
          if (!form.department || form.department === 'N/A') {
            toast.error('Department selection is required');
            return;
          }
        }
      }

      // Prepare payload
      let payload = { ...form };
      if (!editMode) {
        payload.password = generatePassword();
      }

      // Submit
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
      console.error('Submit error:', error);
      toast.error(
        error.message ||
        (editMode ? 'Failed to update user' : 'Failed to create user')
      );
    }
  };

  // Form validation - UPDATED to handle campus admin in colleges without institutes
  const isFormValid = () => {
    // Basic validation
    const basicValid = form.fullName?.trim() && form.email?.trim() && form.role;
    
    if (!basicValid) return false;

    // Super admin only needs basic fields
    if (form.role === 'super_admin') {
      return validateEmailDomain(form.email, form.college, form.institute, currentUser);
    }

    // Faculty ID required for non-super admin
    if (!form.facultyId?.trim()) return false;

    // Email domain validation with currentUser context
    if (!validateEmailDomain(form.email, form.college, form.institute, currentUser)) return false;

    // Super admin creating other roles
    if (currentUser?.role === 'super_admin' && form.role !== 'super_admin') {
      const collegeValid = form.college && form.college !== 'N/A';
      const instituteValid = !shouldShowInstituteField() || form.institute;
      const departmentValid = !shouldShowDepartmentField() || (form.department && form.department !== 'N/A');
      return collegeValid && instituteValid && departmentValid;
    }

    // Campus admin creating faculty
    if (form.role === 'faculty' && currentUser?.role === 'campus_admin') {
      // For SRM RESEARCH campus admin, department should be auto-filled
      if (isCurrentUserFromSRMResearch()) {
        return !!form.department; // Just check if department exists
      }
      // For other campus admin, department must be selected and not N/A
      return form.department && form.department !== 'N/A';
    }

    return (!shouldShowInstituteField() || form.institute) &&
           (!shouldShowDepartmentField() || form.department);
  };

  // Get email domain hints with currentUser context
  const emailDomainHints = getEmailDomainHint(form.college, form.institute, currentUser);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {editMode ? (
              <Shield className="h-5 w-5 text-blue-600" />
            ) : (
              <User className="h-5 w-5 text-blue-600" />
            )}
            <DialogTitle className="text-xl font-semibold">
              {editMode ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            {editMode
              ? 'Update user details below'
              : 'Fill in the details to create a new user'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Main Form Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center text-sm font-medium">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* Faculty ID (hidden for super admin) */}
                {form.role !== 'super_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="facultyId" className="flex items-center text-sm font-medium">
                      <BadgeCheck className="h-4 w-4 mr-2 text-gray-500" />
                      Faculty ID
                    </Label>
                    <Input
                      id="facultyId"
                      placeholder="FAC-12345"
                      value={form.facultyId}
                      onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center text-sm font-medium">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    placeholder={
                      emailDomainHints.length > 0
                        ? `example@${emailDomainHints[0]}`
                        : 'user@example.edu'
                    }
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full"
                  />
                  
                  {/* Email domain hints */}
                  {emailDomainHints.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {isCurrentUserFromSRMResearch() || form.institute === 'SRM RESEARCH' ? (
                        <div>
                          <p className="font-medium text-blue-700">SRM RESEARCH - Allowed domains:</p>
                          <p className="text-blue-600">{emailDomainHints.map(d => `@${d}`).join(', ')}</p>
                        </div>
                      ) : (
                        <p>Email must end with <span className="font-medium">@{emailDomainHints[0]}</span></p>
                      )}
                    </div>
                  )}

                  {/* Email validation error */}
                  {form.email && !validateEmailDomain(form.email, form.college, form.institute, currentUser) && (
                    <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                      Invalid email domain. Allowed: {emailDomainHints.map(d => `@${d}`).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Password: show only in edit mode */}
                {editMode && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center text-sm font-medium">
                      <Lock className="h-4 w-4 mr-2 text-gray-500" />
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={form.password || ''}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only enter a password if you want to change it
                    </p>
                  </div>
                )}

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center text-sm font-medium">
                    <Shield className="h-4 w-4 mr-2 text-gray-500" />
                    Role
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={handleRoleChange}
                    disabled={editMode && currentUser?.role !== 'super_admin'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredRoles().map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* College (only for super admin creating non-super admin users) */}
                {shouldShowCollegeField() && (
                  <div className="space-y-2">
                    <Label htmlFor="college" className="flex items-center text-sm font-medium">
                      <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                      College
                    </Label>
                    <Select
                      value={form.college}
                      onValueChange={handleCollegeChange}
                    >
                      <SelectTrigger className="w-full">
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

            {/* Institute (when applicable) - Full Width */}
            {shouldShowInstituteField() && (
              <div className="space-y-2">
                <Label htmlFor="institute" className="flex items-center text-sm font-medium">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  Institute
                </Label>
                <Select
                  value={form.institute}
                  onValueChange={handleInstituteChange}
                  disabled={!form.college}
                >
                  <SelectTrigger className="w-full">
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

            {/* Department (when applicable) - Full Width */}
            {shouldShowDepartmentField() && (
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center text-sm font-medium">
                  <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                  Department
                  {isDepartmentDisabled() && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      (Auto-assigned for SRM RESEARCH)
                    </span>
                  )}
                </Label>
                
                {/* For SRM RESEARCH, show disabled input with auto-assigned value */}
                {isDepartmentDisabled() ? (
                  <Input
                    id="department"
                    value={form.department || currentUser?.department || availableDepartments[0] || ''}
                    disabled
                    readOnly
                    className="bg-gray-100 cursor-not-allowed text-gray-600 w-full"
                  />
                ) : (
                  <Select
                    value={form.department}
                    onValueChange={handleDepartmentChange}
                    disabled={shouldShowInstituteField() && !form.institute}
                  >
                    <SelectTrigger className="w-full">
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
                )}
              </div>
            )}

            {/* Information Cards */}
            <div className="space-y-4">
              {/* Show inherited values when campus admin creates users */}
              {currentUser?.role === 'campus_admin' && form.role !== 'super_admin' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-2">
                    <strong>Note:</strong> User will be created under your college and institute:
                  </p>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li><strong>College:</strong> {currentUser.college}</li>
                    <li><strong>Institute:</strong> {currentUser.institute}</li>
                    {form.role === 'faculty' && (
                      <li><strong>Department:</strong> {form.department || currentUser.department || 'Please select'}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* UPDATED: Campus admin for colleges without institutes notice */}
              {form.role === 'campus_admin' && form.college && !selectedCollegeHasInstitutes() && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium mb-2">
                    <strong>Campus Admin for College without Institutes:</strong>
                  </p>
                  <ul className="text-xs text-orange-600 space-y-1">
                    <li>• <strong>Role:</strong> Manages the entire {form.college}</li>
                    <li>• <strong>Institute:</strong> Not applicable (set to N/A)</li>
                    <li>• <strong>Department:</strong> Not applicable (manages all departments)</li>
                  </ul>
                </div>
              )}

              {/* SRM RESEARCH special notice */}
              {(form.institute === 'SRM RESEARCH' || isCurrentUserFromSRMResearch()) && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    <strong>SRM RESEARCH Institute:</strong>
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• <strong>Department:</strong> Automatically assigned to {form.department || currentUser?.department}</li>
                    <li>• <strong>Email domains:</strong> Can use any of the four allowed domains</li>
                    <li>• <strong>Department selection:</strong> Not needed - auto-assigned based on college</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <Button 
            type="button" 
            onClick={handleSubmitWithToast}
            disabled={isSubmitting || !isFormValid()}
            className="w-full h-11 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editMode ? 'Updating User...' : 'Creating User...'}
              </>
            ) : editMode ? (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Update User
              </>
            ) : (
              <>
                <User className="h-5 w-5 mr-2" />
                Create User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}