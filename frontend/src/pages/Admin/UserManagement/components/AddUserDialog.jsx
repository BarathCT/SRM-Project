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
import { User, Mail, Lock, Shield, BookOpen, BadgeCheck, Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useEffect, useRef, useState } from 'react';
import { getDepartments as getDepartmentsForCollegeAndInstitute } from '@/utils/collegeData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  getDepartmentsForCollegeAndInstitute: getDepartmentsProp // not used, but destructured for compatibility
}) {
  const { toast } = useToast();
  const [availableInstitutes, setAvailableInstitutes] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // For checking email/facultyId existence
  const [emailStatus, setEmailStatus] = useState({ checking: false, exists: false, checkedValue: '' });
  const [facultyIdStatus, setFacultyIdStatus] = useState({ checking: false, exists: false, checkedValue: '' });
  const emailDebounce = useRef();
  const facultyIdDebounce = useRef();

  // College domain mapping
  const collegeDomains = {
    'SRMIST RAMAPURAM': 'srmist.edu.in',
    'SRM TRICHY': 'srmtrichy.edu.in',
    'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
    'TRP ENGINEERING COLLEGE': 'trp.srmtrichy.edu.in',
  };
  const researchAllowedDomains = [
    'srmist.edu.in',
    'srmtrichy.edu.in',
    'eec.srmrmp.edu.in',
    'trp.srmtrichy.edu.in'
  ];

  if (!form) return null;

  const collegeHasInstitutes = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.hasInstitutes : false;
  };

  const isCurrentUserFromSRMResearch = () => {
    return (currentUser?.institute === 'SRM RESEARCH');
  };

  const selectedCollegeHasInstitutes = () => {
    return form.college && collegeHasInstitutes(form.college);
  };

  const getResearchDepartmentForCollege = (college) => {
    if (college === 'SRMIST RAMAPURAM') return 'Ramapuram Research';
    if (college === 'SRM TRICHY') return 'Trichy Research';
    return '';
  };

  // Email domain validation
  const validateEmailDomain = (email, college, institute, currentUser) => {
    if (!email) return true;
    const emailParts = email.split('@');
    if (emailParts.length !== 2) return false;
    const domain = emailParts[1];
    if (institute === 'SRM RESEARCH' || currentUser?.institute === 'SRM RESEARCH') {
      return researchAllowedDomains.includes(domain);
    }
    if (!college || !collegeDomains[college]) return true;
    return domain === collegeDomains[college];
  };

  const getEmailDomainHint = (college, institute, currentUser) => {
    if (institute === 'SRM RESEARCH' || currentUser?.institute === 'SRM RESEARCH') {
      return researchAllowedDomains;
    }
    if (college && collegeDomains[college]) {
      return [collegeDomains[college]];
    }
    return [];
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
      if (form.institute !== '' || form.department !== '') {
        setForm(prev => ({
          ...prev,
          institute: '',
          department: ''
        }));
      }
    } else {
      setAvailableInstitutes([]);
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

    if (
      currentUser?.role === 'campus_admin'
      && currentUser?.institute === 'SRM RESEARCH'
      && (currentUser.college === 'SRMIST RAMAPURAM' || currentUser.college === 'SRM TRICHY')
    ) {
      const dept = getResearchDepartmentForCollege(currentUser.college);
      setAvailableDepartments([dept]);
      if (form.department !== dept) {
        setForm(prev => ({
          ...prev,
          department: dept
        }));
      }
      return;
    }

    if (currentUser?.role === 'campus_admin') {
      let departments = [];
      if (currentUser.institute && currentUser.institute !== 'N/A') {
        departments = getDepartmentsForCollegeAndInstitute(currentUser.college, currentUser.institute);
      } else {
        departments = getDepartmentsForCollegeAndInstitute(currentUser.college, 'N/A');
      }
      setAvailableDepartments(departments);
      if (form.department && !departments.includes(form.department)) {
        setForm(prev => ({ ...prev, department: '' }));
      }
      return;
    }

    if (form.institute && form.institute !== 'N/A' && form.college) {
      const departments = getDepartmentsForCollegeAndInstitute(form.college, form.institute);
      setAvailableDepartments(departments);
      if (form.institute === 'SRM RESEARCH' && departments.length === 1) {
        setForm(prev => ({
          ...prev,
          department: departments[0]
        }));
        toast.info(`Department automatically set to: ${departments[0]}`);
      } else if (form.department !== '') {
        setForm(prev => ({
          ...prev,
          department: ''
        }));
      }
    } else if (form.college && !collegeHasInstitutes(form.college)) {
      const departments = getDepartmentsForCollegeAndInstitute(form.college, 'N/A');
      setAvailableDepartments(departments);
    } else {
      setAvailableDepartments([]);
    }
    // eslint-disable-next-line
  }, [form.institute, form.college, open, currentUser]);

  // ---- LIVE DUPLICATE CHECKS ----

  // Check email existence
  useEffect(() => {
    if (!form.email || !form.email.includes('@') || form.role === 'super_admin') {
      setEmailStatus({ checking: false, exists: false, checkedValue: form.email });
      return;
    }
    if (editMode && form.email === form._originalEmail) {
      setEmailStatus({ checking: false, exists: false, checkedValue: form.email });
      return;
    }
    setEmailStatus({ checking: true, exists: false, checkedValue: form.email });
    if (emailDebounce.current) clearTimeout(emailDebounce.current);
    emailDebounce.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/admin/user-keys`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to check email');
        const data = await res.json();
        const exists = data.emails.includes(form.email.toLowerCase());
        setEmailStatus({ checking: false, exists, checkedValue: form.email });
      } catch {
        setEmailStatus({ checking: false, exists: false, checkedValue: form.email });
      }
    }, 450);
    // eslint-disable-next-line
  }, [form.email, form.role, editMode]);

  // Check facultyId existence
  useEffect(() => {
    if (!form.facultyId || form.role === 'super_admin') {
      setFacultyIdStatus({ checking: false, exists: false, checkedValue: form.facultyId });
      return;
    }
    if (editMode && form.facultyId === form._originalFacultyId) {
      setFacultyIdStatus({ checking: false, exists: false, checkedValue: form.facultyId });
      return;
    }
    setFacultyIdStatus({ checking: true, exists: false, checkedValue: form.facultyId });
    if (facultyIdDebounce.current) clearTimeout(facultyIdDebounce.current);
    facultyIdDebounce.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/admin/user-keys`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to check facultyId');
        const data = await res.json();
        const exists = data.facultyIds.includes(form.facultyId.toLowerCase());
        setFacultyIdStatus({ checking: false, exists, checkedValue: form.facultyId });
      } catch {
        setFacultyIdStatus({ checking: false, exists: false, checkedValue: form.facultyId });
      }
    }, 450);
    // eslint-disable-next-line
  }, [form.facultyId, form.role, editMode]);

  // ----- UI LOGIC/HELPERS -----

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
    if (currentUser.role === 'campus_admin' && form.role === 'faculty') return true;
    if (currentUser.role === 'super_admin' && form.role === 'faculty') return true;
    return false;
  };

  const isResearchCampusAdmin = currentUser?.role === 'campus_admin'
    && currentUser?.institute === 'SRM RESEARCH'
    && (currentUser.college === 'SRMIST RAMAPURAM' || currentUser.college === 'SRM TRICHY');

  const isDepartmentDisabled = () => {
    if (isResearchCampusAdmin) return true;
    return form.institute === 'SRM RESEARCH' || isCurrentUserFromSRMResearch();
  };

  const getFilteredRoles = () => {
    const allRoles = getAvailableRoles();
    if (currentUser?.role === 'campus_admin') {
      return allRoles.filter(role => role.value === 'faculty');
    }
    return allRoles.filter(role => ['super_admin', 'campus_admin', 'faculty'].includes(role.value));
  };

  const handleRoleChange = (value) => {
    const updates = { role: value };
    if (value === 'super_admin') {
      updates.facultyId = 'N/A';
      updates.college = 'N/A';
      updates.institute = 'N/A';
      updates.department = 'N/A';
      toast.info('Super Admin selected - college and institute not required');
    } else if (value === 'campus_admin') {
      if (form.college && !selectedCollegeHasInstitutes()) {
        updates.institute = 'N/A';
        updates.department = 'N/A';
        toast.info('Campus Admin for college without institutes - no institute/department required');
      } else {
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

  const handleCollegeChange = (value) => {
    const updates = { college: value };
    if (value === 'N/A') {
      updates.institute = 'N/A';
      updates.department = 'N/A';
    } else if (!collegeHasInstitutes(value)) {
      updates.institute = 'N/A';
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

  const handleInstituteChange = (value) => {
    setForm({ ...form, institute: value, department: '' });
    if (value === 'SRM RESEARCH') {
      toast.info('SRM RESEARCH selected - department will be auto-assigned');
    }
  };

  const handleDepartmentChange = (value) => {
    setForm({ ...form, department: value });
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleSubmitWithToast = async () => {
    try {
      if (!form.fullName?.trim()) {
        toast.error('Full name is required');
        return;
      }
      if (!form.email?.trim()) {
        toast.error('Email is required');
        return;
      }
      if (emailStatus.exists) {
        toast.error('This email already exists in the system.');
        return;
      }
      if (!validateEmailDomain(form.email, form.college, form.institute, currentUser)) {
        const allowedDomains = getEmailDomainHint(form.college, form.institute, currentUser);
        toast.error(
          `Email domain must be one of: ${allowedDomains.map(d => `@${d}`).join(', ')}`
        );
        return;
      }
      if (form.role !== 'super_admin' && !form.facultyId?.trim()) {
        toast.error('Faculty ID is required');
        return;
      }
      if (!editMode && facultyIdStatus.exists) {
        toast.error('This faculty ID already exists in the system.');
        return;
      }
      if (shouldShowInstituteField() && !form.institute) {
        toast.error('Institute selection is required');
        return;
      }
      if (shouldShowDepartmentField()) {
        if (isCurrentUserFromSRMResearch()) {
          if (!form.department) {
            toast.error('Department should be auto-assigned for SRM RESEARCH');
            return;
          }
        } else {
          if (!form.department || form.department === 'N/A') {
            toast.error('Department selection is required');
            return;
          }
        }
      }
      let payload = { ...form };
      if (currentUser?.role === 'campus_admin') {
        payload.college = currentUser.college;
        payload.institute = currentUser.institute;
        payload.role = 'faculty';
        if (
          currentUser.institute === 'SRM RESEARCH'
          && (currentUser.college === 'SRMIST RAMAPURAM' || currentUser.college === 'SRM TRICHY')
        ) {
          payload.department = getResearchDepartmentForCollege(currentUser.college);
        }
      }
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
      console.error('Submit error:', error);
      toast.error(
        error.message ||
        (editMode ? 'Failed to update user' : 'Failed to create user')
      );
    }
  };

  const isFormValid = () => {
    const basicValid = form.fullName?.trim() && form.email?.trim() && form.role;
    if (!basicValid) return false;
    if (form.role === 'super_admin') {
      return validateEmailDomain(form.email, form.college, form.institute, currentUser);
    }
    if (!form.facultyId?.trim()) return false;
    if (!validateEmailDomain(form.email, form.college, form.institute, currentUser)) return false;
    if (currentUser?.role === 'super_admin' && form.role !== 'super_admin') {
      const collegeValid = form.college && form.college !== 'N/A';
      const instituteValid = !shouldShowInstituteField() || form.institute;
      const departmentValid = !shouldShowDepartmentField() || (form.department && form.department !== 'N/A');
      return collegeValid && instituteValid && departmentValid && !emailStatus.exists && !facultyIdStatus.exists;
    }
    if (form.role === 'faculty' && currentUser?.role === 'campus_admin') {
      if (isResearchCampusAdmin) {
        const dept = getResearchDepartmentForCollege(currentUser.college);
        return form.department === dept && !emailStatus.exists && !facultyIdStatus.exists;
      }
      return form.department && form.department !== 'N/A' && !emailStatus.exists && !facultyIdStatus.exists;
    }
    return (!shouldShowInstituteField() || form.institute) &&
           (!shouldShowDepartmentField() || form.department) &&
           !emailStatus.exists && !facultyIdStatus.exists;
  };

  const emailDomainHints = getEmailDomainHint(form.college, form.institute, currentUser);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
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
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                {form.role !== 'super_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="facultyId" className="flex items-center text-sm font-medium">
                      <BadgeCheck className="h-4 w-4 mr-2 text-gray-500" />
                      Faculty ID
                      {facultyIdStatus.checking && <Loader2 className="ml-2 h-4 w-4 text-blue-400 animate-spin" />}
                      {!facultyIdStatus.checking && form.facultyId && (
                        facultyIdStatus.exists
                          ? <XCircle className="ml-2 h-4 w-4 text-red-600" title="Faculty ID already exists" />
                          : <CheckCircle className="ml-2 h-4 w-4 text-green-600" title="Faculty ID available" />
                      )}
                    </Label>
                    <Input
                      id="facultyId"
                      placeholder="FAC-12345"
                      value={form.facultyId}
                      onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                      className="w-full"
                    />
                    {!facultyIdStatus.checking && facultyIdStatus.exists && form.facultyId && (
                      <p className="text-xs text-red-500 mt-1">This faculty ID is already in use. Please enter a unique ID.</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center text-sm font-medium">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    Email
                    {emailStatus.checking && <Loader2 className="ml-2 h-4 w-4 text-blue-400 animate-spin" />}
                    {!emailStatus.checking && form.email && (
                      emailStatus.exists
                        ? <XCircle className="ml-2 h-4 w-4 text-red-600" title="Email already exists" />
                        : <CheckCircle className="ml-2 h-4 w-4 text-green-600" title="Email available" />
                    )}
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
                  {form.email && !validateEmailDomain(form.email, form.college, form.institute, currentUser) && (
                    <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                      Invalid email domain. Allowed: {emailDomainHints.map(d => `@${d}`).join(', ')}
                    </p>
                  )}
                  {!emailStatus.checking && emailStatus.exists && form.email && (
                    <p className="text-xs text-red-500 mt-1">This email is already in use. Please enter a different email address.</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {editMode ? (
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
                ) : (
                  currentUser?.role !== 'campus_admin' && (
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
                  )
                )}
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
                {isDepartmentDisabled() ? (
                  <Input
                    id="department"
                    value={form.department || availableDepartments[0] || ''}
                    disabled
                    readOnly
                    className="bg-gray-100 cursor-not-allowed text-gray-600 w-full"
                  />
                ) : (
                  <Select
                    value={form.department}
                    onValueChange={handleDepartmentChange}
                    disabled={shouldShowInstituteField() && !form.institute && currentUser?.role !== 'campus_admin'}
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
            <div className="space-y-4">
              {currentUser?.role === 'campus_admin' && form.role !== 'super_admin' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-2">
                    <strong>Note:</strong> User will be created under your college and institute:
                  </p>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li><strong>College:</strong> {currentUser.college}</li>
                    <li><strong>Institute:</strong> {currentUser.institute}</li>
                    {form.role === 'faculty' && (
                      <li>
                        <strong>Department:</strong>{" "}
                        {(!form.department || form.department === 'N/A')
                          ? 'Please select'
                          : form.department}
                      </li>
                    )}
                  </ul>
                </div>
              )}
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
              {(form.institute === 'SRM RESEARCH' || isCurrentUserFromSRMResearch()) && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-2">
                    <strong>SRM RESEARCH Institute:</strong>
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• <strong>Department:</strong> Automatically assigned to {form.department || availableDepartments[0]}</li>
                    <li>• <strong>Email domains:</strong> Can use any of the four allowed domains</li>
                    <li>• <strong>Department selection:</strong> Not needed - auto-assigned based on college</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
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