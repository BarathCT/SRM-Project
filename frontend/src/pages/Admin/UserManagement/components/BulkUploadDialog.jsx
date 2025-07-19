import { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
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

export default function BulkUploadDialog({
  open,
  onClose,
  currentUser,
  getAvailableRoles,
  onBulkUpload,
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const showRoleSelect =
    currentUser?.role === 'super_admin' || currentUser?.role === 'campus_admin';

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
      const formData = new FormData();
      formData.append('file', file);
      if (showRoleSelect) formData.append('role', selectedRole);

      const result = await onBulkUpload(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg('Bulk upload successful!');
        setFile(null);
        setSelectedRole('');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg('Bulk upload failed.');
    }
    setLoading(false);
  };

  const handleDialogClose = () => {
    setFile(null);
    setSelectedRole('');
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
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md p-0 overflow-visible">
        <div className="relative bg-white rounded-lg shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Bulk Upload Users
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx, .xls, .csv) to create multiple users at once.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} autoComplete="off">
            {showRoleSelect && (
              <div className="mb-4">
                <Label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-700">
                  Role for uploaded users
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role.value || role} value={role.value || role}>
                        {role.label || (typeof role === 'string'
                          ? role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
                          : '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div
              className={`mb-4 border-2 border-dashed rounded-lg transition ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{ cursor: 'pointer' }}
            >
              <Label className="block text-sm font-medium mb-2 text-gray-700 px-4 pt-4">
                Excel file (.xlsx, .xls, .csv)
              </Label>
              <div className="px-4 pb-4 flex items-center">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  disabled={loading}
                  className="hidden"
                  id="bulk-upload-file"
                />
                <Label
                  htmlFor="bulk-upload-file"
                  className={`flex-1 py-2 px-3 rounded cursor-pointer flex items-center border border-gray-300 bg-white hover:bg-blue-50 transition`}
                >
                  <UploadCloud className="w-5 h-5 mr-2 text-blue-500" />
                  <span>
                    {file ? (
                      <span className="font-semibold">{file.name}</span>
                    ) : (
                      'Click or drag file here'
                    )}
                  </span>
                </Label>
                {file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
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
                className={`font-semibold shadow ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={loading || (showRoleSelect && !selectedRole)}
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
                  'Upload'
                )}
              </Button>
            </div>
            {errorMsg && (
              <div className="mt-3 text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-7V7h2v4h-2zm0 4v-2h2v2h-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 text-sm text-green-600 flex items-center">
                <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {successMsg}
              </div>
            )}
            
            <div className="mt-5 text-xs text-gray-400">
              <strong>Instructions:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  File columns must match the selected role and college requirements.
                </li>
                <li>
                  <span className="text-blue-500">Password</span> column is mandatory; if not present, passwords will be auto-generated.
                </li>
                <li>
                  <span className="text-blue-500">Role</span> column is required for super/campus admin uploads.
                </li>
                <li>
                  <span className="text-blue-500">College/category</span> columns auto-filled for campus/admin if missing.
                </li>
                <li>
                  You can upload <span className="text-green-600">.xlsx</span>, <span className="text-green-600">.xls</span>, or <span className="text-green-600">.csv</span> files.
                </li>
              </ul>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}