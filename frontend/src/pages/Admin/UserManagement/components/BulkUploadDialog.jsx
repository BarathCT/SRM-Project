import { useState } from 'react';
import { UploadCloud, X, FileText, AlertCircle, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useToast } from '@/components/Toast';
import * as XLSX from 'xlsx';

export default function BulkUploadDialog({
  open,
  onClose,
  currentUser,
  getAvailableRoles,
  onBulkUpload,
  collegeOptions,
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [preUploadErrors, setPreUploadErrors] = useState([]);
  const [showPreUploadErrorDialog, setShowPreUploadErrorDialog] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const { toast } = useToast();

  const showRoleSelect = currentUser?.role === 'super_admin';

  // Only allow valid roles for super admin
  const getFilteredRoles = () => {
    if (currentUser?.role === 'super_admin') {
      return [
        { value: 'campus_admin', label: 'Campus Admin' },
        { value: 'faculty', label: 'Faculty' }
      ];
    }
    return [];
  };

  // Download template from backend
  const downloadTemplate = async (templateType = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/admin/download-template';

      if (currentUser?.role === 'super_admin' && templateType) {
        url += `?templateType=${templateType}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'template.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Template downloaded! Open in Excel to see dropdown menus.');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  // Fetch existing emails/facultyIds from backend for validation
  const fetchExistingKeys = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/user-keys', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch user keys');
    return await res.json();
  };

  // Validate Excel before upload
  const validateExcelUsers = async (file, selectedRole, currentUser) => {
    const workbook = await file.arrayBuffer().then(buf => XLSX.read(buf, { type: 'array' }));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Fetch all existing keys from server
    let { emails: existingEmails, facultyIds: existingFacultyIds } = await fetchExistingKeys();
    existingEmails = existingEmails.map(e => e.toLowerCase());
    existingFacultyIds = existingFacultyIds.map(f => (f || '').toLowerCase());

    // College email domain logic
    const EMAIL_DOMAINS = {
      'SRMIST RAMAPURAM': 'srmist.edu.in',
      'SRM TRICHY': 'srmtrichy.edu.in',
      'EASWARI ENGINEERING COLLEGE': 'eec.srmrmp.edu.in',
      'TRP ENGINEERING COLLEGE': 'trp.srmtrichy.edu.in'
    };
    const RESEARCH_ALLOWED = [
      'srmist.edu.in',
      'srmtrichy.edu.in',
      'eec.srmrmp.edu.in',
      'trp.srmtrichy.edu.in'
    ];

    // Helper to get domain from email
    const getDomain = (email) =>
      (email && typeof email === 'string' && email.includes('@')) ? email.split('@')[1].toLowerCase() : '';

    // In-file duplicate detection
    const seenEmails = new Set();
    const seenFacultyIds = new Set();

    const errors = [];
    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Excel row number (header is 1)
      const email = (row.email || row.Email || '').toLowerCase().trim();
      const facultyId = (row.facultyId || row.FacultyId || '').toLowerCase().trim();
      const college = row.college || row.College || currentUser?.college || '';
      const institute = row.institute || row.Institute || currentUser?.institute || '';
      let role = row.role || row.Role || selectedRole || '';
      role = typeof role === 'string' ? role.toLowerCase() : '';

      // Required
      if (!email) errors.push({ row: rowNum, field: 'email', message: 'Missing email', rowData: row });
      if (!facultyId) errors.push({ row: rowNum, field: 'facultyId', message: 'Missing facultyId', rowData: row });

      // In-file duplicate email
      if (seenEmails.has(email)) errors.push({ row: rowNum, field: 'email', message: 'Duplicate email in file', rowData: row });
      seenEmails.add(email);

      // In-file duplicate facultyId
      if (facultyId && seenFacultyIds.has(facultyId)) errors.push({ row: rowNum, field: 'facultyId', message: 'Duplicate facultyId in file', rowData: row });
      if (facultyId) seenFacultyIds.add(facultyId);

      // DB duplicate email
      if (existingEmails.includes(email)) errors.push({ row: rowNum, field: 'email', message: 'Email already exists in database', rowData: row });

      // DB duplicate facultyId
      if (facultyId && existingFacultyIds.includes(facultyId)) errors.push({ row: rowNum, field: 'facultyId', message: 'FacultyId already exists in database', rowData: row });

      // Email format check
      if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push({ row: rowNum, field: 'email', message: 'Invalid email format', rowData: row });
      }

      // Email domain logic
      const emailDomain = getDomain(email);
      if (institute === 'SRM RESEARCH') {
        if (!RESEARCH_ALLOWED.includes(emailDomain)) {
          errors.push({ row: rowNum, field: 'email', message: `Invalid domain for SRM RESEARCH (must be one of: ${RESEARCH_ALLOWED.join(', ')})`, rowData: row });
        }
      } else if (EMAIL_DOMAINS[college]) {
        if (emailDomain !== EMAIL_DOMAINS[college]) {
          errors.push({ row: rowNum, field: 'email', message: `Email must end with ${EMAIL_DOMAINS[college]}`, rowData: row });
        }
      }
      // Could add more checks if needed
    });

    return { errors, rows };
  };

  // Main upload handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    if (showRoleSelect && !selectedRole) {
      setErrorMsg('Please select a role for uploaded users.');
      return;
    }

    setLoading(true);
    try {
      // Validate before upload!
      const { errors, rows } = await validateExcelUsers(file, selectedRole, currentUser);
      setParsedRows(rows);
      if (errors.length > 0) {
        setPreUploadErrors(errors);
        setShowPreUploadErrorDialog(true);
        setLoading(false);
        return;
      }
      // If no errors, proceed with upload...
      const formData = new FormData();
      formData.append('file', file);
      if (showRoleSelect) formData.append('role', selectedRole);

      const result = await onBulkUpload(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        toast.error(result.error);
      } else {
        const count = result?.summary?.success || result?.count || 'multiple';
        setSuccessMsg(`Successfully uploaded ${count} users!`);
        toast.success(`Bulk upload successful for ${count} users`);
        resetForm();
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Bulk upload failed';
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSelectedRole('');
  };

  const handleDialogClose = () => {
    resetForm();
    setSuccessMsg('');
    setErrorMsg('');
    setShowPreUploadErrorDialog(false);
    setPreUploadErrors([]);
    setParsedRows([]);
    onClose();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFileType(droppedFile)) {
        setFile(droppedFile);
        setErrorMsg('');
      } else {
        setErrorMsg('Only Excel (.xlsx, .xls) files are allowed');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFileType(selectedFile)) {
        setFile(selectedFile);
        setErrorMsg('');
      } else {
        setErrorMsg('Only Excel (.xlsx, .xls) files are allowed');
      }
    }
  };

  const validateFileType = (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return validTypes.includes(file.type) ||
           file.name.endsWith('.xlsx') ||
           file.name.endsWith('.xls');
  };

  const getTemplateInfo = () => {
    if (currentUser?.role === 'super_admin') {
      return {
        title: "Super Admin Templates",
        description: "Choose the appropriate template based on the role you want to create",
        templates: [
          {
            name: "Campus Admin Template",
            type: "campus_admin",
            columns: "fullName, facultyId, email, college, institute",
            description: "For creating campus administrators"
          },
          {
            name: "Faculty Template",
            type: "faculty",
            columns: "fullName, facultyId, email, college, institute, department",
            description: "For creating faculty members"
          }
        ]
      };
    } else if (currentUser?.role === 'campus_admin') {
      return {
        title: `Campus Admin Template - ${currentUser.college}`,
        description: "Template for creating faculty in your college",
        templates: [
          {
            name: "Faculty Template",
            type: null,
            columns: "fullName, facultyId, email, department",
            description: `College: ${currentUser.college}, Institute: ${currentUser.institute}`
          }
        ]
      };
    }
    return null;
  };

  const templateInfo = getTemplateInfo();

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Bulk Upload Users
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file with dropdown validation to create multiple users at once.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-6">

              {/* Template Download Section */}
              {templateInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {templateInfo.title}
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">{templateInfo.description}</p>

                  <div className="space-y-3">
                    {templateInfo.templates.map((template, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 text-sm">{template.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <strong>Columns:</strong> {template.columns}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadTemplate(template.type)}
                            className="ml-3"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Role Selection for Super Admin */}
              {showRoleSelect && (
                <div>
                  <Label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-700">
                    User Role to Create
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role for bulk upload" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredRoles().map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This must match the template you downloaded above
                  </p>
                </div>
              )}

              {/* File Upload Section */}
              <div
                className={`border-2 border-dashed rounded-lg transition ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <Label className="block text-sm font-medium mb-2 text-gray-700 px-4 pt-4">
                  Upload Excel File
                </Label>
                <div className="px-4 pb-4">
                  <div className="flex flex-col items-center justify-center py-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-blue-500" />
                    <p className="mb-2 text-sm text-gray-600 text-center">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      Excel files (.xlsx, .xls) with dropdown validation (max 5MB)
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    required
                    disabled={loading}
                    className="hidden"
                    id="bulk-upload-file"
                  />
                  <Label
                    htmlFor="bulk-upload-file"
                    className="block w-full py-3 px-4 rounded-lg cursor-pointer text-center border-2 border-blue-300 bg-white hover:bg-blue-50 transition-colors font-medium text-blue-700"
                  >
                    Choose Excel File
                  </Label>
                </div>
              </div>

              {/* Selected File Display */}
              {file && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">{file.name}</p>
                      <p className="text-xs text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Status Messages */}
              {(errorMsg || successMsg) && (
                <div className={`p-4 rounded-lg border ${
                  errorMsg
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  <div className="flex items-start">
                    {errorMsg ? (
                      <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    ) : (
                      <svg className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {errorMsg || successMsg}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Information Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Quick Guide
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-1"> Features</h5>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• Excel dropdown validation</li>
                      <li>• Auto-generated passwords</li>
                      <li>• Email validation</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-1"> Requirements</h5>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• Use downloaded template</li>
                      <li>• Open in Microsoft Excel</li>
                      <li>• Use dropdown selections</li>
                    </ul>
                  </div>
                </div>

                {currentUser?.role === 'super_admin' && (
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <p className="text-xs text-gray-600">
                      <strong>Note:</strong> Select role above that matches your template type.
                    </p>
                  </div>
                )}

                {currentUser?.role === 'campus_admin' && (
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <p className="text-xs text-gray-600">
                      <strong>Note:</strong> Users created under {currentUser.college} - {currentUser.institute}.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex-shrink-0 border-t bg-white p-6">
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                type="button"
                onClick={handleDialogClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !file ||
                  (showRoleSelect && !selectedRole)
                }
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmit}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload Users
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-upload error dialog */}
      {showPreUploadErrorDialog && (
      <Dialog open={showPreUploadErrorDialog} onOpenChange={setShowPreUploadErrorDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Some Issues Detected in Your Excel File</DialogTitle>
            <DialogDescription>
              Please review the following problems. You must fix these in your Excel file and upload again.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full text-xs border mt-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border">Excel Row</th>
                  <th className="p-2 border">Column</th>
                  <th className="p-2 border">What’s Wrong?</th>
                  <th className="p-2 border">How to Fix</th>
                  <th className="p-2 border">Entered Value</th>
                </tr>
              </thead>
              <tbody>
                {preUploadErrors.map((err, idx) => {
                  // User-friendly error mapping
                  let userMsg = '';
                  let suggestion = '';
                  // Email
                  if (err.field === 'email') {
                    if (err.message.includes('Missing')) {
                      userMsg = "Email address is missing.";
                      suggestion = "Enter the user's email in this row.";
                    } else if (err.message.includes('already exists')) {
                      userMsg = "This email is already used by another user.";
                      suggestion = "Check you have not added this user before, or use a different email.";
                    } else if (err.message.includes('Duplicate email in file')) {
                      userMsg = "This email appears more than once in your file.";
                      suggestion = "Each user must have a unique email address.";
                    } else if (err.message.includes('Invalid email format')) {
                      userMsg = "This email isn’t a valid email address.";
                      suggestion = "Check for typos, and make sure it looks like 'name@example.com'.";
                    } else if (err.message.includes('must end with')) {
                      userMsg = "Email domain does not match the selected college.";
                      suggestion = "The email must end with the official college domain as shown in the instructions.";
                    } else if (err.message.includes('Invalid domain for SRM RESEARCH')) {
                      userMsg = "Email domain is not allowed for SRM RESEARCH.";
                      suggestion = "Please use one of the allowed email domains for SRM RESEARCH.";
                    } else {
                      userMsg = err.message;
                      suggestion = "-";
                    }
                  }
                  // Faculty ID
                  else if (err.field === 'facultyId') {
                    if (err.message.includes('Missing')) {
                      userMsg = "Faculty ID is missing.";
                      suggestion = "Type a unique Faculty ID for this user.";
                    } else if (err.message.includes('already exists')) {
                      userMsg = "This Faculty ID is already used by another user.";
                      suggestion = "Every user must have their own unique Faculty ID. Change this Faculty ID.";
                    } else if (err.message.includes('Duplicate facultyId in file')) {
                      userMsg = "This Faculty ID appears more than once in your file.";
                      suggestion = "Each user must have their own Faculty ID.";
                    } else {
                      userMsg = err.message;
                      suggestion = "-";
                    }
                  }
                  // Other fields
                  else {
                    userMsg = err.message;
                    suggestion = "-";
                  }
                  // Get entered value
                  const enteredValue = err.rowData[err.field] || err.rowData[err.field.charAt(0).toUpperCase() + err.field.slice(1)] || '';
                  return (
                    <tr key={idx}>
                      <td className="p-2 border text-center">{err.row}</td>
                      <td className="p-2 border text-center">{err.field}</td>
                      <td className="p-2 border text-red-600">{userMsg}</td>
                      <td className="p-2 border text-gray-800">{suggestion}</td>
                      <td className="p-2 border text-gray-900">{enteredValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowPreUploadErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

    </>
  );
}