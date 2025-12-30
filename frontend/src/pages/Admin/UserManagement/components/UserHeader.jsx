import { UserCog, UserPlus, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/Toast';
import BulkUploadInstructions from './BulkUpload/BulkUploadInstructions';

export default function UserHeader({
  currentUser = {},
  getAvailableRoles = () => [],
  setOpenDialog,
  setOpenBulkDialog,
  setShowLogDialog,
  collegeOptions = [],
}) {
  const { toast } = useToast();
  const safeUser = currentUser || {};
  const college = safeUser.college || '';
  const role = safeUser.role || '';
  const institute = safeUser.institute || '';
  const department = safeUser.department || '';

  // Helper to determine SRM colleges
  const srmColleges = ['SRMIST RAMAPURAM', 'SRM RAMAPURAM', 'SRMIST TRICHY', 'SRM TRICHY'];
  const isSRMCollege = srmColleges.some(c => c.toLowerCase() === college.toLowerCase());

  // Determine which fields to show based on user role and college
  const shouldShowInstitute = isSRMCollege && (role === 'campus_admin');
  const shouldShowDepartment = role !== 'super_admin' && college && college !== 'N/A';

  // Get instructions for bulk upload based on user role
  const getBulkUploadInstructions = () => {
    const baseColumns = [
      { name: "fullName", required: true, notes: "User's full name (manual entry)" },
      { 
        name: "facultyId", 
        required: true,
        notes: "Required for all roles (manual entry)"
      },
      { name: "email", required: true, notes: "Must match college domain (manual entry)" },
      { name: "password", required: false, notes: "Auto-generated and emailed to users (not in Excel)" }
    ];

    const baseNotes = [
      "First row must contain column headers",
      "Column names are case-sensitive", 
      "Passwords will be auto-generated and emailed to users",
      "College, Institute, and Department fields have dropdown validation to prevent errors",
      "No sample data provided - start entering from row 2"
    ];

    if (role === 'super_admin') {
      return {
        title: "Super Admin Bulk Upload",
        description: "Upload users for any college with any role",
        campusAdminColumns: [
          ...baseColumns,
          { name: "college", required: true, notes: "Select from dropdown list" },
          { name: "institute", required: true, notes: "Select from dropdown list" }
        ],
        facultyColumns: [
          ...baseColumns,
          { name: "college", required: true, notes: "Select from dropdown list" },
          { name: "institute", required: true, notes: "Select from dropdown list" },
          { name: "department", required: true, notes: "Select from dropdown list" }
        ],
        notes: [
          ...baseNotes,
          "Campus Admin Template: college and institute are required",
          "Faculty Template: college, institute, and department are all required",
          "All dropdowns are pre-populated with valid values"
        ]
      };
    }

    if (role === 'campus_admin') {
      return {
        title: `Campus Admin Bulk Upload - ${college}`,
        description: `Upload users for ${college}`,
        columns: [
          ...baseColumns,
          { name: "department", required: true, notes: "Select from dropdown list" }
        ],
        notes: [
          ...baseNotes,
          `College will be set to ${college}`,
          `Institute will be set to ${institute}`,
          "Department dropdown contains valid options for your college"
        ]
      };
    }

    return {
      title: `Faculty Bulk Upload - ${college}`,
      description: `Upload faculty users for ${college}`,
      columns: [
        ...baseColumns,
        { name: "department", required: true, notes: "Select from dropdown list" }
      ],
      notes: [
        ...baseNotes,
        `College will be set to ${college}`,
        `Institute will be set to ${institute}`,
        "All users will be created as faculty"
      ]
    };
  };

  const instructions = getBulkUploadInstructions();

  // Download template function for BulkUploadInstructions
  const downloadTemplate = async (templateType = null) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      let url = `${API_BASE_URL}/api/admin/download-template`;

      if (role === 'super_admin' && templateType) {
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

  return (
    <div className="mb-6">
      {/* Header with Info Icon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <UserCog className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        </div>
        
        {/* Info Icon Button - Opens Instructions Modal */}
        <BulkUploadInstructions
          currentUser={currentUser}
          instructions={instructions}
          downloadTemplate={downloadTemplate}
          trigger={
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-600 rounded-md"
            >
              <Info className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="outline" className="text-gray-600">
          {role.replace('_', ' ')}
        </Badge>
        {college && college !== 'N/A' && (
          <Badge variant="outline" className="text-gray-600">
            {college}
          </Badge>
        )}
        {shouldShowInstitute && institute && institute !== 'N/A' && (
          <Badge variant="outline" className="text-gray-600">
            {institute}
          </Badge>
        )}
        {shouldShowDepartment && department && department !== 'N/A' && (
          <Badge variant="outline" className="text-gray-600">
            {department}
          </Badge>
        )}
      </div>

      {/* Action Buttons Row - Always Visible */}
      <div className="flex flex-row gap-2 mb-4">
        {getAvailableRoles().length > 0 && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            onClick={() => setOpenDialog(true)}
          >
            <span className="hidden md:inline">
              <UserPlus className="mr-2 h-4 w-4" />
            </span>
            Add User 
          </Button>
        )}

        {(role === 'super_admin' || role === 'campus_admin') && (
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
            onClick={() => setOpenBulkDialog(true)}
          >
            <span className="hidden md:inline">
              <FileText className="mr-2 h-4 w-4" />
            </span>
            Bulk Upload
          </Button>
        )}

        {role === 'super_admin' && (
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
            onClick={() => setShowLogDialog(true)}
          >
            <span className="hidden md:inline">
              <FileText className="mr-2 h-4 w-4" />
            </span>
            Logs
          </Button>
        )}
      </div>
    </div>
  );
}