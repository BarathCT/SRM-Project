import { useState } from 'react';
import { UploadCloud, X, FileText, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

export default function BulkUploadDialog({
  open,
  onClose,
  currentUser,
  getAvailableRoles,
  onBulkUpload,
  collegeOptions,
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const showRoleSelect = currentUser?.role === 'super_admin' || 
                        currentUser?.role === 'campus_admin';

  const showCollegeSelect = currentUser?.role === 'super_admin';

  // Check if college has institutes
  const collegeHasInstitutes = (collegeName) => {
    const college = collegeOptions.find(c => c.name === collegeName);
    return college ? college.hasInstitutes : false;
  };

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

    if (showCollegeSelect && !selectedCollege) {
      setErrorMsg('Please select a college for uploaded users.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (showRoleSelect) formData.append('role', selectedRole);
      if (showCollegeSelect) formData.append('college', selectedCollege);

      const result = await onBulkUpload(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        toast.error(result.error);
      } else {
        setSuccessMsg(`Successfully uploaded ${result?.count || 'multiple'} users!`);
        toast.success(`Bulk upload successful for ${result?.count || 'multiple'} users`);
        resetForm();
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Bulk upload failed';
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSelectedRole('');
    setSelectedCollege('');
  };

  const handleDialogClose = () => {
    resetForm();
    setSuccessMsg('');
    setErrorMsg('');
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
      } else {
        setErrorMsg('Only Excel (.xlsx, .xls) or CSV files are allowed');
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
        setErrorMsg('Only Excel (.xlsx, .xls) or CSV files are allowed');
      }
    }
  };

  const validateFileType = (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    return validTypes.includes(file.type) || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls') || 
           file.name.endsWith('.csv');
  };

  const downloadTemplate = () => {
    // This would typically link to an actual template file
    toast.info('Downloading template file...');
    // In a real implementation, you would serve a template file
    console.log('Template download initiated');
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-lg p-0 overflow-visible">
        <div className="relative bg-white rounded-lg shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Bulk Upload Users
            </DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file to create multiple users at once.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-4 mt-4">
              {showCollegeSelect && (
                <div>
                  <Label htmlFor="college" className="block text-sm font-medium mb-2 text-gray-700">
                    College
                  </Label>
                  <Select
                    value={selectedCollege}
                    onValueChange={setSelectedCollege}
                    required
                    disabled={loading}
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

              {showRoleSelect && (
                <div>
                  <Label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-700">
                    Default Role
                  </Label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((role) => (
                        <SelectItem 
                          key={role.value || role} 
                          value={role.value || role}
                          disabled={role.value === 'super_admin'}
                        >
                          {role.label || (typeof role === 'string'
                            ? role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
                            : '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be the default role if not specified in the file
                  </p>
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-lg transition ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <Label className="block text-sm font-medium mb-2 text-gray-700 px-4 pt-4">
                  Upload File
                </Label>
                <div className="px-4 pb-4">
                  <div className="flex flex-col items-center justify-center py-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-blue-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Excel (.xlsx, .xls) or CSV files (max 5MB)
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    required
                    disabled={loading}
                    className="hidden"
                    id="bulk-upload-file"
                  />
                  <Label
                    htmlFor="bulk-upload-file"
                    className="block w-full py-2 px-3 rounded cursor-pointer text-center border border-gray-300 bg-white hover:bg-blue-50 transition"
                  >
                    Choose File
                  </Label>
                </div>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={downloadTemplate}
                  className="text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                <div className="flex space-x-2">
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
                      (showRoleSelect && !selectedRole) ||
                      (showCollegeSelect && !selectedCollege)
                    }
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
                      'Upload Users'
                    )}
                  </Button>
                </div>
              </div>

              {(errorMsg || successMsg) && (
                <div className={`p-3 rounded-lg ${
                  errorMsg ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                  <div className="flex items-center">
                    {errorMsg ? (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-medium">
                      {errorMsg || successMsg}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  File Requirements
                </h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
                  <li>First row must contain column headers</li>
                  <li>
                    Required columns: <strong>email</strong>, <strong>fullName</strong>,{' '}
                    <strong>facultyId</strong>
                  </li>
                  {showCollegeSelect && (
                    <li>
                      Optional columns: <strong>college</strong>, <strong>institute</strong>,{' '}
                      <strong>department</strong>
                    </li>
                  )}
                  <li>
                    <strong>password</strong> column is optional (will be auto-generated if missing)
                  </li>
                  <li>
                    <strong>role</strong> column is optional (will use selected role if missing)
                  </li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}